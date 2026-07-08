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

## How to Observe with Tools

**Console — connection event log**

Add a `console.log` at every connection lifecycle event:
```
[ws] connecting...
[ws] connected
[ws] message received: "Hey, how are you?"
[ws] disconnected (unclean)
[ws] reconnect attempt 1 — delay 1000ms
[ws] reconnect attempt 2 — delay 2000ms
[ws] connected
[ws] fetching missed messages since 2025-03-15T10:30:00Z
[ws] 2 missed messages inserted
```

Then call `wsRef.current?.simulateDrop()` via a debug button and watch the full reconnection sequence play out in the console. Verify the delay doubles each attempt and caps at 30 seconds.

**Console — concurrent reconnect guard**

Rapidly tap "Simulate Drop" twice in quick succession. Check the console — you should see only one reconnect sequence, not two racing. If you see two sequences interleaved, your single-in-flight guard isn't working.

**React DevTools — connection status state**

Open the Components tab, select `ChatScreen`, and watch the `connectionStatus` state field while you:
1. App opens: `reconnecting` → `connected`
2. Simulate drop: `connected` → `reconnecting`
3. Each backoff attempt: stays `reconnecting` (update the label to show attempt number)
4. Reconnected: `reconnecting` → `connected`

The status badge in the UI should mirror exactly what's in the state panel.

**Message queue inspection**

Add a debug panel that renders the contents of your offline message queue (messages queued while disconnected). Trigger a drop, send 3 messages, then reconnect — watch the queue drain in order and verify each message's status updates from `'sending'` → `'sent'`.

## Record Your Observations

```
Connection lifecycle — paste the console output for a full drop + reconnect cycle:


Reconnect delays — what were the actual delays between each attempt?
  Attempt 1:
  Attempt 2:
  Attempt 3:
  At what attempt did it hit the 30s cap?


Concurrent reconnect test:
- What happened when you triggered simulateDrop() twice rapidly?
- How did you prevent two reconnect sequences from running simultaneously?


Missed messages:
- How many missed messages were returned after reconnecting?
- How did you determine the correct insertion point in the message list?


One thing that surprised me:
```
