# Networking Protocols

## What They Are

The networking protocol is how your mobile client communicates with the server. The choice of protocol shapes your architecture, your data model, and the user experience. Picking the wrong one is a common design mistake interviewers watch for.

The three protocols you need to know for mobile system design:

1. **REST (HTTP request/response)**
2. **WebSocket (persistent bidirectional connection)**
3. **Server-Sent Events / SSE (persistent one-way stream)**

## REST — HTTP Request/Response

The default choice for most mobile operations. The client makes a request, the server responds, the connection closes.

```
Client                    Server
  |  GET /feed              |
  |─────────────────────►  |
  |  200 OK { items: [...] }|
  |◄─────────────────────  |
  |                         |
  |  POST /posts            |
  |─────────────────────►  |
  |  201 Created { id: ... }|
  |◄─────────────────────  |
```

**Use REST when:**
- The client initiates all interactions (fetch data, submit forms, CRUD operations)
- Data doesn't need to update in real time
- You want the simplest possible architecture

**Downsides on mobile:**
- Each request has overhead (TCP handshake, TLS, headers)
- Can't push updates to the client — the client must poll to check for new data
- Polling drains battery

**Polling** is when you repeatedly call a REST endpoint on a timer to simulate real-time updates. Acceptable for low-frequency updates (check for new messages every 30 seconds) but wrong for high-frequency updates (stock prices, live chat). Always mention the battery cost of polling in an interview.

## WebSocket — Persistent Bidirectional Connection

A WebSocket opens a single persistent connection between client and server. Either side can send messages at any time. The connection stays open until explicitly closed.

```
Client                    Server
  |  WS Handshake           |
  |◄────────────────────►  |  (connection open)
  |                         |
  |  { type: 'message', ... }
  |◄─────────────────────  |  (server pushes)
  |                         |
  |  { type: 'typing', ... }
  |─────────────────────►  |  (client sends)
  |                         |
  |  { type: 'message', ... }
  |◄─────────────────────  |  (server pushes again)
```

**Use WebSocket when:**
- You need real-time bidirectional communication
- Both client and server need to initiate messages
- High message frequency (multiple messages per second)

**Classic use cases:** chat apps, multiplayer games, live collaboration (Google Docs-style), real-time dashboards.

**Downsides on mobile:**
- Persistent connections consume battery even when idle
- Must handle reconnection on network changes (WiFi → LTE transitions break the connection)
- More complex to implement and scale than REST

**Reconnection strategy** is critical on mobile. When the WebSocket drops (tunnel, subway, switching networks), you need exponential backoff:
```typescript
const BASE_DELAY = 1000
const MAX_DELAY = 30_000
let attempt = 0

function reconnect() {
  const delay = Math.min(BASE_DELAY * 2 ** attempt, MAX_DELAY)
  setTimeout(() => {
    connect()
    attempt++
  }, delay)
}
```

Also queue messages sent while disconnected and flush them on reconnect.

## Server-Sent Events (SSE) — One-Way Server Push

SSE is a persistent HTTP connection where the server can push updates to the client, but the client cannot send back. It's a one-way stream.

```
Client                    Server
  |  GET /feed/live         |
  |─────────────────────►  |
  |                         |  (connection stays open)
  |  data: { newPost: ... } |
  |◄─────────────────────  |
  |  data: { newPost: ... } |
  |◄─────────────────────  |
```

**Use SSE when:**
- The server needs to push updates to the client
- The client does NOT need to send back (read-only stream)
- You want the simplicity of HTTP (SSE works over regular HTTP/2, handles reconnection automatically)

**Classic use cases:** live news feeds, notification streams, order status updates, live sports scores.

**Advantage over WebSocket for push-only:** SSE reconnects automatically, works over HTTP/2 multiplexing, and is simpler to implement and scale.

## How to Choose in an Interview

The decision tree:

```
Does the server need to push updates to the client?
├── No  → REST
└── Yes → Does the CLIENT also need to send messages in real time?
          ├── Yes → WebSocket (chat, games, live collaboration)
          └── No  → SSE (feeds, notifications, status updates)
```

Walk through this out loud in an interview. Saying "I'll use WebSocket for the notification feed" without justification is a flag — SSE is simpler and more appropriate for read-only push.

## Mobile-Specific Concerns

**Background behavior:** WebSocket and SSE connections don't survive when the app is backgrounded on iOS (15+ minute background limit). Design for this: use push notifications (APNs/FCM) to wake the app, then re-establish the connection when it foregrounds.

**Network transitions:** When a user moves from WiFi to LTE, the IP address changes and existing connections drop. Your reconnection logic must handle this. Listen to `NetInfo` for network state changes and reconnect proactively.

**Battery:** WebSocket and SSE connections have keepalive pings to prevent idle timeouts — these wake the radio and drain battery. For feeds that update infrequently, consider polling over WebSocket to avoid this overhead.

## GraphQL Subscriptions

Worth knowing: GraphQL has a subscription operation type that delivers real-time updates. Under the hood it typically uses WebSocket. If your app already uses GraphQL for queries/mutations, subscriptions are a natural fit for real-time features without adding a separate WebSocket protocol.

## What's Next

You know how data moves between client and server. The next concept covers how to avoid making unnecessary round trips: caching.
