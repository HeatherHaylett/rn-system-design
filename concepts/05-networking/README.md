# Networking Protocols

## What They Are

The networking protocol is how your mobile client communicates with the server. The choice of protocol shapes your architecture, your data model, and the user experience. Picking the wrong one is a common design mistake interviewers watch for.

The protocols you need to know for mobile system design:

1. **REST (HTTP request/response)**
2. **Short Polling**
3. **Long Polling**
4. **WebSocket (persistent bidirectional connection)**
5. **Server-Sent Events / SSE (persistent one-way stream)**
6. **GraphQL**
7. **gRPC**
8. **MQTT**

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

## Short Polling

The simplest form of simulated real-time: the client calls a REST endpoint on a fixed timer.

```
Client                    Server
  |  GET /notifications     |   ← every 5 seconds
  |─────────────────────►  |
  |  200 OK { items: [] }   |   ← usually empty
  |◄─────────────────────  |
```

**Use short polling when:** update frequency is low (once per minute or less), you need the simplest possible implementation, and battery cost is acceptable.

**Downside:** most responses are empty. You pay the full network cost every interval whether or not anything changed. At 5-second intervals that's ~720 requests per hour, each waking the radio. Always mention the battery and bandwidth cost in an interview.

## Long Polling

An improvement on short polling. The client makes a request and the server holds it open until there's something to return (or a timeout fires). The moment the server responds, the client immediately fires another request.

```
Client                    Server
  |  GET /notifications     |
  |─────────────────────►  |  ← server holds the connection
  |                         |  (28 seconds later, new data arrives)
  |  200 OK { items: [...] }|
  |◄─────────────────────  |
  |  GET /notifications     |  ← client immediately reconnects
  |─────────────────────►  |
```

**Use long polling when:** you need lower latency than short polling without the complexity of WebSocket or SSE, and your infrastructure doesn't support persistent connections well.

**Downsides:** higher server resource usage (holding connections open), more complex timeout handling, still HTTP overhead on each cycle. WebSocket or SSE is usually the better answer for anything requiring true real-time.

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

## GraphQL

GraphQL is a query language and runtime for APIs. Instead of fixed endpoints that return fixed shapes, the client describes exactly what data it needs in a query and the server returns only that.

```graphql
query GetFeed($cursor: String) {
  feed(after: $cursor, limit: 20) {
    items {
      id
      content
      author { name avatar }
      likeCount
    }
    nextCursor
  }
}
```

**Three operation types:**
- **Query** — read data (equivalent to GET)
- **Mutation** — write data (equivalent to POST/PUT/DELETE)
- **Subscription** — real-time updates over WebSocket

**Use GraphQL when:**
- You have multiple clients (mobile, web, tablet) that need different data shapes from the same API — GraphQL lets each client fetch exactly what it needs, eliminating over-fetching
- Your data has complex nested relationships that REST would require multiple round trips to fetch
- You already have a GraphQL API and want subscriptions for real-time features

**Downsides on mobile:**
- Query complexity — poorly written queries can be expensive on the server
- Caching is harder than REST (queries aren't cacheable by URL)
- Requires a GraphQL client library (Apollo Client, urql) which adds bundle size

**In an interview:** reach for GraphQL when the interviewer mentions multiple client platforms or when the data model is highly relational. Otherwise REST is simpler and equally valid.

## gRPC

gRPC is a high-performance RPC (Remote Procedure Call) framework that uses Protocol Buffers (binary serialization) instead of JSON. It generates typed client and server code from a `.proto` schema file.

```protobuf
service FeedService {
  rpc GetFeed (FeedRequest) returns (FeedResponse);
  rpc StreamFeed (FeedRequest) returns (stream Post);  // server-side streaming
}
```

**Use gRPC when:**
- Performance is critical and JSON overhead is measurable (high-frequency, high-volume data)
- You have strong typing requirements across service boundaries
- You're building internal microservice communication (not a public-facing mobile API)
- You need server-side streaming with strong type guarantees

**On mobile specifically:** gRPC-Web works in browsers, and gRPC works in React Native via libraries. But for a typical consumer mobile app, the complexity cost rarely justifies the performance gain over REST or GraphQL. You're most likely to encounter gRPC as the protocol between your mobile app's BFF (Backend for Frontend) and internal microservices — the BFF translates gRPC to REST/GraphQL for the client.

**In an interview:** mention gRPC when discussing internal service architecture or when latency and throughput are a stated constraint. Don't reach for it as the client-facing protocol without justification.

## MQTT

MQTT (Message Queuing Telemetry Transport) is a lightweight publish-subscribe protocol designed for constrained devices and unreliable networks. It runs over TCP with minimal packet overhead.

```
Client (subscriber)          Broker          Client (publisher)
  |  SUBSCRIBE /sensors/temp   |               |
  |───────────────────────►   |               |
  |                            |               |
  |                            |  PUBLISH      |
  |                            |◄─────────────|
  |  MESSAGE /sensors/temp     |               |
  |◄───────────────────────   |               |
```

**Use MQTT when:**
- Devices have very limited bandwidth or power (IoT sensors, wearables)
- You need reliable delivery guarantees over unreliable connections (QoS levels 0/1/2)
- You're building pub/sub fan-out to many subscribers
- The network is constrained (low-bandwidth cellular, satellite)

**Classic use cases:** IoT device telemetry, smart home apps, fitness tracker data sync, fleet tracking.

**For most consumer mobile apps:** MQTT is not the right choice. WebSocket or SSE handles real-time push more simply. Consider MQTT when you're explicitly in an IoT or constrained-network context.

## The Full Decision Tree

```
What kind of communication do you need?
│
├── Client initiates, server responds, no real-time needed
│   └── REST
│
├── Client needs real-time updates from server
│   ├── Server pushes only (client doesn't send in real time)
│   │   ├── Updates are infrequent → Short polling (simple) or Long polling
│   │   └── Updates are frequent or latency matters → SSE
│   │
│   └── Both client and server send in real time
│       └── WebSocket
│
├── Multiple client platforms with different data needs
│   └── GraphQL (queries + subscriptions for real-time)
│
├── High-throughput internal service communication
│   └── gRPC
│
└── IoT / constrained devices / pub-sub fan-out
    └── MQTT
```

## Mobile-Specific Concerns

**Background behavior:** WebSocket, SSE, and persistent connections don't survive when the app is backgrounded on iOS (15+ minute background limit). Design for this: use push notifications (APNs/FCM) to wake the app, then re-establish the connection when it foregrounds.

**Network transitions:** When a user moves from WiFi to LTE, the IP address changes and existing connections drop. Your reconnection logic must handle this. Listen to `NetInfo` for network state changes and reconnect proactively.

**Battery:** Persistent connections have keepalive pings to prevent idle timeouts — these wake the radio and drain battery. For feeds that update infrequently, polling is sometimes lower battery than maintaining an idle WebSocket.

## What's Next

You know how to choose a protocol. The next concept covers how to design the API itself: endpoints, request/response shapes, IDs, timestamps, and idempotency.
