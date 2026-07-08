# Case Study: Chat

**Tier:** 5 — Real server required (`cd server && npm run dev`)
**Difficulty:** Advanced
**Time:** 90–120 min

## The Problem

Design and build a real-time 1:1 chat screen. This is the same problem as the Tier 3 WebSocket exercise — but now against a real WebSocket server with auth, real connection lifecycle events, and chaos middleware between you and it.

If you built the Tier 3 exercise, your code will mostly transfer. What won't transfer: anything that relied on the mock's predictable timing.

## Constraints

- Messages must appear in under 100ms of being sent (optimistic)
- Connection must survive network transitions (WiFi → LTE)
- Access token expires every 2 minutes — WebSocket must handle this
- Missed messages during a disconnect must be recovered on reconnect

## Design First

**S — System Requirements**
```
Functional:


Non-functional:
```

**C — Design Considerations**
```
Protocol choice and why WebSocket over SSE here:

How will you authenticate the WebSocket connection?
(Hint: the server expects ?token=<access_token> in the WS URL)

What happens when the access token expires while the WebSocket is open?
```

**A — Architecture**
```
Presentation:

Domain:

Data (how do you persist messages locally for offline viewing?):
```

**D — API Contract**
```
WebSocket URL:
  ws://localhost:3001?token=<access_token>

Message types the server sends:
  { type: 'connected', payload: { userId, connectedAt } }
  { type: 'message', payload: { message_id, sender_id, content, sent_at, client_message_id } }
  { type: 'pong' }

Message types you send:
  { type: 'ping' }
  { type: 'message', payload: { content, client_message_id } }

What is client_message_id for? How will you use it?

REST endpoint for missed messages:
  GET /chat/history?since=<ISO timestamp>
```

**E — Evaluate NFRs**
```
How do you handle the token expiring while the WebSocket is open?

What's your reconnection strategy when the server restarts?

How do you prevent duplicate messages if a send fires twice?
```

**T — Tradeoffs**
```
I chose ___ over ___ because ___. The cost is ___.

I chose ___ over ___ because ___. The cost is ___.

I chose ___ over ___ because ___. The cost is ___.
```

## Build It

Create `ChatScreen.tsx` in this directory.

Requirements:
- [ ] Connects to real WebSocket with token auth
- [ ] Incoming messages appear in real time
- [ ] Sent messages optimistic — appear immediately with `sending` status
- [ ] `client_message_id` used to reconcile optimistic messages with server confirmation
- [ ] Reconnects with exponential backoff when connection drops
- [ ] On reconnect: fetches missed messages via `GET /chat/history?since=`
- [ ] Sends a ping every 30 seconds to keep the connection alive
- [ ] Cleans up cleanly on unmount

## Observe and Break

- Kill the server while chatting — watch the reconnection sequence in the console
- Restart the server — does the client reconnect and fetch missed messages?
- Wait 2 minutes — the access token expires. Try sending a message. What happens?
  (The server will reject the WS reconnect with a 4001 close code — handle this)
- Open two simulators side by side — send from one, verify it appears on the other in real time

## Record Your Observations

```
WebSocket lifecycle — paste your full console log for a drop + reconnect:


Token expiry on WebSocket:
- What close code did the server send?
- How did your client detect this vs a regular disconnect?
- What did the user see?


client_message_id reconciliation:
- How did you match the server's response to your optimistic message?
- What happened if the server never confirmed a message?


Two-client test:
- How long did a message take to appear on the second client (approximate)?


One thing the real server revealed that the mock didn't:
```
