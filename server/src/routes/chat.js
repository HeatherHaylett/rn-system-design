/**
 * Chat routes + real WebSocket.
 *
 * The WebSocket here is an actual ws connection — not a setInterval.
 * You'll experience:
 *   - Real connection lifecycle (open, close, error events)
 *   - Ping/pong keepalive
 *   - What happens when the server restarts mid-conversation
 *   - Messages that arrive out of order under load
 */

import { Router } from 'express'
import { ACTIVE_TOKENS } from '../middleware/auth.js'

export const chatRouter = Router()

const MESSAGE_HISTORY = []
let messageCounter = 0

chatRouter.get('/history', (req, res) => {
  const since = req.query.since
  const messages = since
    ? MESSAGE_HISTORY.filter(m => m.sent_at > since)
    : MESSAGE_HISTORY.slice(-50)

  res.json({ data: messages })
})

// WebSocket clients: Map<ws, { userId, lastPing }>
const clients = new Map()

export function attachChatWebSocket(wss) {
  wss.on('connection', (ws, req) => {
    // Authenticate via token in query param: ws://localhost:3001/chat?token=at_xxx
    const url = new URL(req.url, 'http://localhost')
    const token = url.searchParams.get('token')
    const session = token ? ACTIVE_TOKENS.get(token) : null

    if (!session || Date.now() > session.expiresAt) {
      ws.close(4001, 'Unauthorized')
      return
    }

    const userId = session.userId
    clients.set(ws, { userId, lastPing: Date.now() })
    console.log(`[ws] client connected: ${userId} (${clients.size} total)`)

    ws.send(JSON.stringify({
      type: 'connected',
      payload: { userId, connectedAt: new Date().toISOString() },
    }))

    ws.on('message', data => {
      let msg
      try { msg = JSON.parse(data) } catch { return }

      if (msg.type === 'ping') {
        clients.get(ws).lastPing = Date.now()
        ws.send(JSON.stringify({ type: 'pong' }))
        return
      }

      if (msg.type === 'message') {
        const stored = {
          message_id: `msg-${++messageCounter}`,
          sender_id: userId,
          content: msg.payload.content,
          // Intentionally realistic: server timestamp may differ from client's
          sent_at: new Date().toISOString(),
          // Idempotency: echo back the client's key so they can reconcile
          client_message_id: msg.payload.client_message_id ?? null,
        }
        MESSAGE_HISTORY.push(stored)
        if (MESSAGE_HISTORY.length > 500) MESSAGE_HISTORY.shift()

        // Broadcast to all connected clients
        const frame = JSON.stringify({ type: 'message', payload: stored })
        for (const [client] of clients) {
          if (client.readyState === 1) client.send(frame)
        }
      }
    })

    ws.on('close', () => {
      clients.delete(ws)
      console.log(`[ws] client disconnected: ${userId} (${clients.size} remaining)`)
    })

    ws.on('error', err => {
      console.error(`[ws] error for ${userId}:`, err.message)
      clients.delete(ws)
    })
  })

  // Terminate stale connections (no ping in 60s)
  setInterval(() => {
    const now = Date.now()
    for (const [ws, meta] of clients) {
      if (now - meta.lastPing > 60_000) {
        console.log(`[ws] terminating stale connection: ${meta.userId}`)
        ws.terminate()
        clients.delete(ws)
      }
    }
  }, 30_000)
}
