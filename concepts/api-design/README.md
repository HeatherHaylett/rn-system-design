# API Design

## What It Is

API design is defining the contract between your mobile client and the server. In a system design interview this is the **I (Interface)** phase of RADIO — you specify the endpoints, the shape of requests and responses, how lists are paginated, and how the system handles duplicate requests safely.

A well-designed API is predictable, consistent, and handles failure gracefully. A poorly designed one leaks server implementation details into the client, requires multiple round trips for simple operations, and breaks in subtle ways under retries.

## Defining Endpoints

Each endpoint should map to a single resource and action. Follow REST conventions unless there's a specific reason not to.

**Naming rules:**
- Use nouns, not verbs: `/orders` not `/getOrders`
- Use plural for collections: `/orders` not `/order`
- Nest for ownership relationships: `/users/:id/orders` for a user's orders
- Use query params for filtering/sorting: `/feed?sort=recent&limit=20`

**Standard CRUD pattern:**

| Method | Path | Action |
|--------|------|--------|
| `GET` | `/posts` | List posts |
| `POST` | `/posts` | Create post |
| `GET` | `/posts/:id` | Get single post |
| `PUT` | `/posts/:id` | Replace post |
| `PATCH` | `/posts/:id` | Partially update post |
| `DELETE` | `/posts/:id` | Delete post |

**Nested resources:**
```
GET  /users/:userId/cart          — get user's cart
POST /users/:userId/cart/items    — add item to cart
DELETE /users/:userId/cart/items/:itemId  — remove item
```

**Actions that don't fit CRUD:** some operations don't map cleanly to CRUD. Use a verb-based sub-resource:
```
POST /orders/:id/cancel     — cancel an order
POST /posts/:id/like        — like a post
POST /auth/refresh          — refresh access token
```

## Request and Response Structure

Consistency matters more than any specific convention. Pick a shape and stick to it across every endpoint.

### Request shape

```typescript
// Query params for reads
GET /feed?cursor=abc123&limit=20&filter=following

// Body for writes — always JSON
POST /posts
Content-Type: application/json
Authorization: Bearer <token>

{
  "content": "Hello world",
  "mediaIds": ["m-001", "m-002"],
  "idempotencyKey": "client-generated-uuid"
}
```

### Response shape — success

Wrap all responses in a consistent envelope:

```typescript
// Single resource
{
  "data": {
    "id": "post-001",
    "content": "Hello world",
    "createdAt": "2025-03-15T10:30:00Z",
    "author": { "id": "u-001", "name": "Heather" }
  }
}

// Collection with pagination
{
  "data": [...],
  "pagination": {
    "nextCursor": "eyJpZCI6InBvc3QtMDUwIn0=",
    "hasMore": true,
    "total": 847    // optional — expensive to compute, omit if not needed
  }
}
```

### Response shape — error

Errors should be machine-readable (a `code` the client can switch on) and human-readable (a `message` for logging):

```typescript
// 4xx client error
{
  "error": {
    "code": "ITEM_OUT_OF_STOCK",
    "message": "Item 'Wireless Headphones' is no longer available",
    "details": {
      "productId": "p-001",
      "requestedQuantity": 3,
      "availableQuantity": 0
    }
  }
}

// 422 validation error
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "fields": {
      "quantity": "Must be between 1 and 99",
      "productId": "Required"
    }
  }
}
```

The `code` field is what your client switches on — never parse the `message` string in code. Messages change; codes are stable.

### HTTP Status Codes to Know

| Code | Meaning | When to use |
|------|---------|-------------|
| `200` | OK | Successful GET, PATCH, DELETE |
| `201` | Created | Successful POST that created a resource |
| `204` | No Content | Successful DELETE with no body |
| `400` | Bad Request | Malformed request, missing required fields |
| `401` | Unauthorized | Not authenticated (trigger token refresh) |
| `403` | Forbidden | Authenticated but not allowed |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | State conflict (duplicate, out of stock, optimistic lock failure) |
| `422` | Unprocessable | Validation error (well-formed but semantically wrong) |
| `429` | Too Many Requests | Rate limited |
| `500` | Server Error | Something went wrong on the server |

On mobile: `401` should silently trigger token refresh and retry. `429` should respect the `Retry-After` header. `5xx` should retry with exponential backoff.

## Pagination

Covered in detail in [Data Modeling](../04-data-modeling/README.md), but summarized here for completeness.

**Cursor-based (prefer this):**
```
GET /feed?cursor=eyJpZCI6InBvc3QtMDUwIn0=&limit=20

Response:
{
  "data": [...20 items...],
  "pagination": {
    "nextCursor": "eyJpZCI6InBvc3QtMDMwIn0=",
    "hasMore": true
  }
}
```
The cursor is opaque to the client — treat it as a string you pass back, not something you parse. On the server it's typically a base64-encoded timestamp or ID.

**Offset-based (simpler, but has edge cases):**
```
GET /posts?offset=40&limit=20
```
Breaks if items are inserted or deleted while paginating. Use cursor unless the interviewer specifically asks for offset or the dataset is static.

## IDs — Client-Generated vs Server-Generated

This is a topic that often comes up when designing offline-first features or optimistic updates. The question is: who creates the ID for a new resource?

### Server-Generated IDs

The server assigns an ID when the resource is created and returns it in the response.

```
Client             Server
  |  POST /posts     |
  |  { content }     |
  |────────────►    |
  |  201 { id: "post-xyz" }
  |◄────────────    |
```

**Problem for optimistic updates:** you don't have an ID until the server responds. You can use a temporary client-side ID for the optimistic state, then swap it for the real ID on success — but this requires tracking the mapping and updating all references.

### Client-Generated IDs (UUIDs)

The client generates a UUID before sending the request and includes it in the body. The server uses it as the ID.

```typescript
import { randomUUID } from 'expo-crypto'

const postId = randomUUID() // 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

// Optimistic update uses the real ID immediately
setFeed(current => [{ id: postId, content, isOptimistic: true }, ...current])

// Server stores and returns the same ID
POST /posts { id: postId, content }
→ 201 { id: postId, ... }
```

**Advantages:** no ID swap needed on success. The optimistic state and the real state share the same ID. Natural fit for offline-first — you can create the resource offline and sync later, and the ID is stable throughout.

**Disadvantages:** the server must validate that the UUID isn't already in use (rare with UUID v4 but must be handled). The server gives up control over ID format and generation.

### ID Formats to Know

**UUID v4:** random, 128-bit, universally unique. `f47ac10b-58cc-4372-a567-0e02b2c3d479`. No ordering — you can't sort by UUID to get creation order.

**Snowflake ID (Twitter):** 64-bit integer encoding timestamp + machine ID + sequence number. Globally unique AND sortable by creation time. Used by Twitter, Discord, Instagram. The first 41 bits are a millisecond timestamp, so `ORDER BY id` gives you chronological order.

**ULID:** Universally Unique Lexicographically Sortable Identifier. Like UUID but encodes a timestamp prefix so it sorts chronologically. Good of both worlds — random enough to be unique, sortable by creation time.

**In an interview:** mention that if you need to sort by creation time without storing a separate `createdAt` field, Snowflake IDs or ULIDs give you that for free. UUID v4 is fine for resources where creation order doesn't matter.

## Timestamps

### Always Use ISO 8601 in UTC

```typescript
// ✅ Correct
"createdAt": "2025-03-15T10:30:00Z"      // Z = UTC
"updatedAt": "2025-03-15T14:22:33.456Z"  // millisecond precision

// ❌ Wrong
"createdAt": "March 15, 2025"            // not parseable universally
"createdAt": 1710498600                  // epoch seconds — ambiguous precision
"createdAt": "2025-03-15T10:30:00-07:00" // timezone-offset — server should normalize to UTC
```

ISO 8601 with UTC is the universal contract. The client converts to local time for display.

### Client Timestamps vs Server Timestamps

**Server-generated timestamps:** the server sets `createdAt` when it processes the request. Authoritative and consistent across all clients. The downside: when a resource is created offline and synced later, the `createdAt` reflects when the server received it, not when the user created it.

**Client-generated timestamps:** the client sends `clientCreatedAt` with the request. The server stores both. Use `clientCreatedAt` for display ("Posted 2 hours ago" feels accurate to the user) and `serverCreatedAt` for ordering and conflict resolution.

```typescript
POST /posts
{
  "content": "Hello from offline",
  "clientCreatedAt": "2025-03-15T10:30:00Z"  // when user wrote it
}

// Server stores both
{
  "id": "post-xyz",
  "content": "Hello from offline",
  "clientCreatedAt": "2025-03-15T10:30:00Z",
  "serverCreatedAt": "2025-03-15T10:45:00Z"  // when server received the sync
}
```

**Ordering pitfall:** never order a feed by `clientCreatedAt` alone — users can have wrong device clocks. Use `serverCreatedAt` (or a Snowflake ID) for canonical ordering.

## Idempotency

An operation is **idempotent** if performing it multiple times produces the same result as performing it once.

- `GET` is naturally idempotent — fetching the same resource twice gives you the same data
- `DELETE` is idempotent — deleting something twice leaves it deleted (second call may return 404, but the state is the same)
- `POST` is **not** idempotent by default — posting twice creates two resources

This matters on mobile because **requests get retried**. The user submits a form, the network drops before the response arrives, your retry logic fires again. Did the first request go through? If the operation isn't idempotent, the user ends up with a duplicate order, a double charge, or a duplicate message.

### Idempotency Keys

The solution: the client generates a unique key for each logical operation and sends it with every request. The server uses it to deduplicate.

```typescript
POST /orders
{
  "items": [...],
  "idempotencyKey": "f47ac10b-58cc-4372-a567-0e02b2c3d479"  // client-generated UUID
}
```

The server stores the idempotency key with the result. If the same key arrives again (a retry), the server returns the stored result without re-executing the operation.

```
First request:
  POST /orders { idempotencyKey: "abc" } → 201 { orderId: "o-123" }
  Server stores: { key: "abc", result: { orderId: "o-123" } }

Retry (network dropped before client got the response):
  POST /orders { idempotencyKey: "abc" } → 200 { orderId: "o-123" }
  Server: key "abc" already seen, return stored result
```

**Critical for:** payments, order submission, any mutation that's expensive to undo.

**Idempotency key lifetime:** keys are typically stored for 24 hours. After that, the same key could be reused for a different request (though in practice UUIDs make collision vanishingly unlikely).

### The Offline Mutation Queue Connection

This is where idempotency and the mutation queue connect. When you queue a mutation offline and retry it on reconnect, you need the retry to be idempotent. Generate the idempotency key when you enqueue the mutation, not when you send it:

```typescript
type QueuedMutation = {
  id: string              // this is also the idempotency key
  type: 'CREATE_POST'
  payload: { content: string }
  idempotencyKey: string  // generated at queue time, same on all retries
}
```

If the mutation fires, the network drops, and it retries three times — the server processes it once and returns the same result for all three retries.

## A Complete API Design Example

**Feature:** add a post to a social feed.

**Endpoint:**
```
POST /posts
Authorization: Bearer <token>
```

**Request:**
```typescript
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",  // client-generated UUID
  "content": "My first post",
  "mediaIds": ["m-001"],
  "clientCreatedAt": "2025-03-15T10:30:00Z",
  "idempotencyKey": "f47ac10b-58cc-4372-a567-0e02b2c3d479"  // same as id here
}
```

**Success response (201):**
```typescript
{
  "data": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "content": "My first post",
    "author": { "id": "u-001", "name": "Heather", "avatar": "https://..." },
    "likeCount": 0,
    "clientCreatedAt": "2025-03-15T10:30:00Z",
    "serverCreatedAt": "2025-03-15T10:30:01Z"
  }
}
```

**Error response (422):**
```typescript
{
  "error": {
    "code": "CONTENT_TOO_LONG",
    "message": "Post content exceeds 280 characters",
    "details": { "maxLength": 280, "actualLength": 310 }
  }
}
```

## What's Next

You now have the full API design toolkit. The next concept covers how to avoid re-fetching data you already have: caching strategies.
