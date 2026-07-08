# Data Modeling

## What It Is

Data modeling is deciding what data your app needs, what shape it takes, and where it lives. In a system design interview, the Data Model phase (the D in RADIO) is where you answer: "What are the entities? What fields do they have? What's the difference between what the server gives you and what the UI actually needs?"

Getting this wrong creates cascading problems: components that reach deep into raw API responses, business logic scattered across the UI, and bugs that appear when the API changes.

## Server State vs Client State

The most important distinction in mobile data modeling:

**Server state** — data that originates from the server and needs to stay in sync with it. User profiles, posts, product inventory, order history. Your app is a cache of this data. It can go stale. It needs to be re-fetched.

**Client state** — data that only exists on the device and doesn't need server sync. UI state (is this modal open?), form draft state, navigation history, user preferences that are only relevant locally.

The common mistake is treating client state like server state (re-fetching things that never change on the server) or treating server state like client state (storing things locally that should stay synced).

```typescript
// Server state — lives on the server, your app is a cache
type Post = {
  id: string
  authorId: string
  content: string
  likeCount: number
  createdAt: string
}

// Client state — only exists in the app, never synced
type PostUIState = {
  isExpanded: boolean
  isDraftBeingEdited: boolean
}
```

## Shaping Data for the UI

Raw API responses are optimized for the server, not the UI. A common pattern is defining a **domain model** (what the UI actually needs) and a **mapping function** that transforms the API response into it.

```typescript
// Raw API response — this is what the server sends
type ApiProduct = {
  product_id: string        // snake_case, server convention
  product_name: string
  unit_price: number        // in cents
  inventory_count: number
  is_active: boolean
}

// Domain model — shaped for the UI
type Product = {
  id: string
  name: string
  price: number             // in dollars, formatted
  inStock: boolean
  stockCount: number
}

// Mapping function lives in the Data layer
function toProduct(api: ApiProduct): Product {
  return {
    id: api.product_id,
    name: api.product_name,
    price: api.unit_price / 100,
    inStock: api.is_active && api.inventory_count > 0,
    stockCount: api.inventory_count,
  }
}
```

This mapping function does two things: it adapts naming conventions, and it encodes a business rule (`inStock` is `true` only when both `is_active` and `inventory_count > 0`). That rule now lives in one place — not scattered across every component that renders a product.

## The UI Extension Pattern

For optimistic updates and loading states, you often need to extend your domain model with client-only fields:

```typescript
type PostUI = Post & {
  isLikedOptimistically: boolean
  isSubmitting: boolean
  error: string | null
}
```

These fields never go to the server and never get persisted. They're purely for rendering the right UI state. Keep them separate from the domain model so it's clear what's client-only.

## Pagination Models

Lists are the most common data shape in mobile apps and they need special handling.

**Offset pagination** — "give me 20 items starting at position 40"
```typescript
type OffsetPage<T> = {
  items: T[]
  total: number
  offset: number
  limit: number
}
```
Simple but breaks under mutations: if an item is inserted before your offset, you get a duplicate on the next page.

**Cursor pagination** — "give me 20 items after this cursor"
```typescript
type CursorPage<T> = {
  items: T[]
  nextCursor: string | null  // null means no more pages
  hasMore: boolean
}
```
Stable under mutations. This is what most social feeds use. Your cursor is typically an encoded timestamp or ID, opaque to the client.

In your data model, a paginated list looks like:

```typescript
type FeedState = {
  items: Post[]
  nextCursor: string | null
  isLoadingMore: boolean
  hasMore: boolean
}
```

## Normalized vs Denormalized Data

**Denormalized**: each item in a list has all its data embedded, including nested objects.
```typescript
// Denormalized: author data is embedded in every post
type Post = {
  id: string
  content: string
  author: { id: string; name: string; avatar: string }
}
```
Simple to work with. But if the author's name changes, every post in your cache is now stale.

**Normalized**: entities are stored once, referenced by ID elsewhere.
```typescript
// Normalized: posts reference author by ID
type Post = { id: string; content: string; authorId: string }
type User = { id: string; name: string; avatar: string }

type AppState = {
  posts: Record<string, Post>
  users: Record<string, User>
}
```
Updates to a user propagate everywhere automatically. More complex to set up — libraries like Redux Toolkit's `createEntityAdapter` or `react-query`'s cache handle this.

**Interview guidance**: For most mobile apps, denormalized is fine. Reach for normalized when you have high update frequency on shared entities (e.g., a user's name appears in thousands of posts) or when you need to avoid redundant re-fetches.

## Key Questions to Answer in an Interview

When the interviewer asks about your data model, cover:
1. What are the core entities?
2. What fields does each entity have? (Don't list every field — hit the important ones)
3. What's the difference between the API response shape and what the UI needs?
4. Which data is server state vs client state?
5. How do you handle lists — offset or cursor pagination?

## What's Next

Now that you know how to model data, the next concept covers how that data moves between client and server: networking protocols.
