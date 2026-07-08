/**
 * Tier 5 development server.
 *
 * Intentionally imperfect — this is production friction in miniature:
 *   - Variable latency (not the fixed 600ms of mocks)
 *   - Occasional random failures (not controlled CONFLICT_RATE)
 *   - Messy response shapes (extra fields, nulls, snake_case)
 *   - Real WebSocket with actual connection lifecycle
 *   - Auth tokens that actually expire
 *
 * Run: npm run dev
 * Default port: 3001
 */

import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { feedRouter } from './routes/feed.js'
import { chatRouter, attachChatWebSocket } from './routes/chat.js'
import { authRouter } from './routes/auth.js'
import { notesRouter } from './routes/notes.js'
import { rideRouter } from './routes/ride.js'
import { chaosMiddleware } from './middleware/chaos.js'
import { authMiddleware } from './middleware/auth.js'

const app = express()
const httpServer = createServer(app)

app.use(cors())
app.use(express.json())

// Chaos middleware — variable latency and random errors
// Toggle via CHAOS_LEVEL env var: 'low' | 'medium' | 'high'
app.use(chaosMiddleware)

// Public routes
app.use('/auth', authRouter)

// Protected routes
app.use('/feed', authMiddleware, feedRouter)
app.use('/chat', authMiddleware, chatRouter)
app.use('/notes', authMiddleware, notesRouter)
app.use('/ride', authMiddleware, rideRouter)

// Health check — no auth, no chaos
app.get('/health', (_, res) => res.json({ ok: true, time: new Date().toISOString() }))

// Real WebSocket server
const wss = new WebSocketServer({ server: httpServer })
attachChatWebSocket(wss)

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`\n🚀 Tier 5 server running on http://localhost:${PORT}`)
  console.log(`   Chaos level: ${process.env.CHAOS_LEVEL ?? 'medium'}`)
  console.log(`   WebSocket:   ws://localhost:${PORT}/chat\n`)
})
