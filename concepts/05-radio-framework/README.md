# The RADIO Framework

## What It Is

RADIO is a framework for structuring your answer in a system design interview. It gives you a repeatable sequence to follow so you don't skip steps, forget to ask clarifying questions, or spend 40 minutes on architecture and run out of time for optimizations.

```
R — Requirements Exploration
A — Architecture / High-Level Design
D — Data Model
I — Interface Definition (API)
O — Optimizations and Deep Dive
```

## Why It Exists

System design interviews are open-ended by design. The interviewer wants to see how you think, not just what you know. Without a framework, it's easy to jump straight to implementation details, miss key constraints, or give an answer that's technically correct but doesn't address the actual problem.

RADIO keeps you anchored to the problem before you start solving it.

## Time Allocation (45-minute interview)

| Phase | Time | Focus |
|-------|------|-------|
| R — Requirements | ~5 min (10%) | Clarify scope, surface NFRs |
| A — Architecture | ~9 min (20%) | High-level diagram, key components |
| D — Data Model | ~5 min (10%) | Entities, fields, server vs client state |
| I — Interface | ~9 min (20%) | API contracts, component APIs |
| O — Optimizations | ~18 min (40%) | Deep dive into the interesting parts |

The 40% on optimizations is the most important number. Interviewers at senior levels want to see depth, not just breadth. The optimizations phase is where you demonstrate that understanding.

## Each Phase in Detail

### R — Requirements Exploration

Ask clarifying questions before designing anything. You're trying to understand:
- **Scope**: Which features are in scope? What's explicitly out of scope?
- **Users**: Who uses this? How many? What devices?
- **Constraints**: Are there latency targets? Offline requirements? Security concerns?
- **Priorities**: If you had to ship one thing first, what would it be?

Example questions for a cart feature:
- "Are we designing the full checkout flow or just the cart screen?"
- "Do we need to support guest checkout or authenticated users only?"
- "Does the cart need to persist across app sessions?"
- "Should the cart work offline?"

Don't skip this phase. Getting alignment on requirements is what separates a thoughtful engineer from one who just starts building.

### A — Architecture / High-Level Design

Draw (or describe) the major components and how they connect. On mobile this typically means:

- **Server** (treat as a black box — it exposes APIs, you design the client)
- **Presentation layer** — screens, components, navigation
- **Domain layer** — business logic, use cases
- **Data layer** — API client, local storage, cache

Describe the data flow: "When the user taps 'Add to Cart', the CartScreen calls CartService.addItem(), which calls CartRepository.addItem(). CartRepository optimistically updates local state and sends the request to the server. If the server returns an error, CartRepository rolls back."

### D — Data Model

Define the key data entities. Distinguish:
- **Server-originated data**: What does the API return? What are the fields?
- **Client-only data**: What state exists only on the client? (UI state, optimistic updates, draft state)

For a cart:
```typescript
// Server model (from API)
type CartItem = {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  inStock: boolean
}

// Client model (extended for UI)
type CartItemUI = CartItem & {
  isOptimistic: boolean   // added locally, not yet confirmed by server
  error: string | null    // rollback error message
}
```

### I — Interface Definition (API)

Define how components communicate:
- **Server-Client**: REST endpoints, WebSocket events, SSE streams
- **Between layers**: What does CartRepository expose? What does CartService expose to the screen?

For a cart endpoint:
```
GET  /cart              — fetch current cart
POST /cart/items        — add item { productId, quantity }
PUT  /cart/items/:id    — update quantity
DELETE /cart/items/:id  — remove item
POST /cart/checkout     — submit order
```

### O — Optimizations and Deep Dive

This is the meat of the interview. Pick 2-3 areas relevant to the specific problem and go deep:

- **Offline support**: "If the user adds an item offline, I'd queue the mutation locally and sync when connectivity returns. If the server responds with a conflict (item now out of stock), I'd show a specific error on that item rather than failing the whole cart."
- **Performance**: "FlatList with large carts needs keyExtractor and getItemLayout for fixed-height items. I'd also memoize renderItem with useCallback."
- **Security**: "Cart data in AsyncStorage is fine since it's not sensitive, but payment method details should never be stored locally."
- **Stale data**: "When the user navigates to checkout, I'd re-fetch the cart to catch any stock changes before presenting the order summary."

## What Interviewers Are Evaluating

- Do you clarify before designing? (R)
- Can you identify the right components without over-engineering? (A)
- Do you distinguish server state from client state? (D)
- Do you think about contracts and interfaces, not just implementations? (I)
- Can you go deep on the hard parts — not just list best practices? (O)

## RADIO vs SCADET

RADIO is your interview performance tool — it structures how you communicate. SCADET (used in the Tier 5 case studies) is your knowledge framework — it covers what you need to know deeply about mobile systems. Use RADIO in the interview, use SCADET to study.

## What's Next

You now have the full Tier 1 foundation: NFRs (what constraints matter on mobile), Layered Architecture (how to organize code to meet them), State Management (where data lives), Data Flow (how it moves), and RADIO (how to communicate your design in an interview).

Tier 2 goes deeper on the building blocks: how to model data, choose the right networking protocol, design an API, and build a caching strategy.
