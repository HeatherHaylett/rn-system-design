# Exercise: WebSocket Chat

**Concept:** [05 — Networking Protocols](../../../../concepts/05-networking/README.md)
**Difficulty:** Advanced
**Time:** 50–60 minutes

## The Scenario

You're building a real-time 1:1 chat screen. Messages arrive from the server at any time. The user can send messages while new ones are arriving. The connection drops when the user backgrounds the app and must reconnect when they return.

This is the canonical WebSocket use case — bidirectional, real-time, both sides initiate.

## What's Already Here

- `mockWebSocket.ts` — a mock WebSocket that simulates an incoming message every few seconds, handles send, and can simulate a connection drop
- `types.ts` — Message and ConnectionStatus types
- `ChatScreen.tsx` — the UI shell: message list, input box, connection status indicator. The WebSocket logic is yours to add.

## What You Need to Build

### 1. Connect and receive messages
On mount, open the WebSocket connection. When messages arrive, append them to the message list. When the component unmounts, close the connection cleanly.

### 2. Send messages
When the user submits a message:
- Add it to the local list immediately (optimistic)
- Send it via the WebSocket
- If the send fails (connection is down), mark it with an error indicator

### 3. Reconnect with exponential backoff
When the connection drops:
- Show a "Reconnecting..." status in the UI
- Retry connection with exponential backoff: 1s, 2s, 4s, 8s, up to 30s max
- When reconnected, flush any messages that were queued while offline

### 4. Re-validate on foreground
When the app comes back from the background:
- Re-establish the WebSocket connection
- Fetch missed messages via a REST call (the mock provides `fetchMissedMessages()`)
- Insert them into the message list in the correct chronological order

## Acceptance Criteria

- [ ] Messages from the server appear in real time without polling
- [ ] Sent messages appear immediately (optimistic) with a "sending..." indicator that resolves or errors
- [ ] Connection status badge shows "Connected" / "Reconnecting..." / "Offline"
- [ ] On disconnect: exponential backoff retry, status updates with each attempt
- [ ] On foreground: connection re-established, missed messages fetched and inserted
- [ ] No memory leaks — connection closes cleanly on unmount

## Edge Cases to Handle

- User sends a message while disconnected — queue it, send when reconnected
- Two messages arrive in the same millisecond — preserve order
- Reconnect fires while a previous reconnect attempt is still pending — only one attempt in flight

## The Question This Prepares You For

> "Design a real-time chat feature for a mobile app. Walk me through the protocol choice and what happens when the connection drops."

After this exercise you should be able to describe the full WebSocket lifecycle on mobile: connect, receive, send, disconnect, reconnect, foreground re-entry, and missed message recovery.
