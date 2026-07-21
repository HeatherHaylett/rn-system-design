/**
 * Mock WebSocket that simulates:
 * - Incoming messages every 4–8 seconds from "other user"
 * - Random connection drops every ~30 seconds
 * - Missed messages available via fetchMissedMessages()
 *
 * Usage:
 *   const ws = createMockWebSocket({
 *     onMessage: (msg) => { ... },
 *     onOpen: () => { ... },
 *     onClose: () => { ... },
 *   })
 *   ws.send('Hello')
 *   ws.close()
 */

import { Message } from './types'

type MockWSOptions = {
  onMessage: (message: Message) => void
  onOpen: () => void
  onClose: (wasClean: boolean) => void
}

type MockWebSocket = {
  send: (content: string) => boolean  // returns false if not connected
  close: () => void
  simulateDrop: () => void             // call this to test reconnection
}

let messageIdCounter = 100

function makeIncomingMessage(content: string): Message {
  return {
    id: `msg-${++messageIdCounter}`,
    senderId: 'other-user',
    content,
    sentAt: new Date().toISOString(),
    status: 'sent',
  }
}

const INCOMING_MESSAGES = [
  'Hey, how are you?',
  'Did you see the game last night?',
  'Just sent you that file',
  'Are you free tomorrow?',
  'lol ok',
  'That makes sense',
  'Let me know what you think',
]

export function createMockWebSocket(options: MockWSOptions): MockWebSocket {
  let isConnected = false
  let incomingTimer: ReturnType<typeof setInterval> | null = null
  let dropTimer: ReturnType<typeof setTimeout> | null = null
  let isClosed = false

  function connect() {
    if (isClosed) return
    console.log("[ws] connecting...")
    setTimeout(() => {
      if (isClosed) return
      isConnected = true
      options.onOpen()
      console.log("[ws] connected")

      // Send an incoming message every 4–8 seconds
      incomingTimer = setInterval(() => {
        if (!isConnected || isClosed) return
        const content = INCOMING_MESSAGES[Math.floor(Math.random() * INCOMING_MESSAGES.length)]
        console.log(`[ws] message received: ${content}`)
        options.onMessage(makeIncomingMessage(content))
      }, 4000 + Math.random() * 4000)

      // Randomly drop the connection after 25–40 seconds to test reconnection
      dropTimer = setTimeout(() => {
        if (!isClosed) simulateDrop()
      }, 25000 + Math.random() * 15000)

    }, 300 + Math.random() * 200) // simulate connection time
  }

  function simulateDrop() {
    if (!isConnected) return
    isConnected = false
    if (incomingTimer) clearInterval(incomingTimer)
    if (dropTimer) clearTimeout(dropTimer)
    options.onClose(false) // unclean close
    console.log("[ws] disconnected (unclean)")
  }

  connect()

  return {
    send(content: string): boolean {
      if (!isConnected) return false
      // Simulate the echo back as a confirmation (real WS would not echo, but useful for demo)
      return true
    },
    close() {
      isClosed = true
      isConnected = false
      if (incomingTimer) clearInterval(incomingTimer)
      if (dropTimer) clearTimeout(dropTimer)
      options.onClose(true) // clean close
    },
    simulateDrop,
  }
}

// REST endpoint to fetch messages missed while disconnected
export async function fetchMissedMessages(since: string): Promise<Message[]> {
  await new Promise(resolve => setTimeout(resolve, 500))
  // Return 0-2 messages that "arrived" while the client was offline
  const count = Math.floor(Math.random() * 3)
  return Array.from({ length: count }, (_, i) => ({
    id: `msg-missed-${Date.now()}-${i}`,
    senderId: 'other-user',
    content: `(missed) ${INCOMING_MESSAGES[Math.floor(Math.random() * INCOMING_MESSAGES.length)]}`,
    sentAt: new Date(Date.now() - (count - i) * 5000).toISOString(),
    status: 'sent' as const,
  }))
}
