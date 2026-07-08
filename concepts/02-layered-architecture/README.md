# Layered Architecture

## What It Is

Layered architecture organizes your code into distinct layers, each with a single responsibility. The most common pattern in mobile apps has three layers:

```
┌─────────────────────────┐
│    Presentation Layer   │  React Native components, screens, navigation
├─────────────────────────┤
│      Domain Layer       │  Business logic, use cases, validation rules
├─────────────────────────┤
│       Data Layer        │  API calls, local storage, caching
└─────────────────────────┘
```

Each layer only talks to the layer directly below it. Presentation calls Domain. Domain calls Data. Data never calls up into Domain or Presentation.

## Why It Matters

Without this separation, you end up with components that do everything — fetch data, apply business rules, format for display, handle errors. This works for small apps but breaks down fast:

- A bug in the API response format breaks your UI
- You can't reuse business logic across screens
- Testing requires rendering the whole component tree
- Adding offline support means touching every component

With layers, each concern is isolated. Changing the API response format means updating the Data layer only. The Domain and Presentation layers don't care.

## What Goes Where

### Presentation Layer
- React Native screens and components
- Navigation logic
- UI state (is this dropdown open? is this loading?)
- Formatting data for display (dates, currency, truncating long strings)
- **Does not** contain business rules or API calls

### Domain Layer
- Business logic: "A user can only apply one discount code per order"
- Validation: "A cart item quantity must be between 1 and 99"
- Use cases: `addItemToCart()`, `checkout()`, `applyDiscount()`
- Transforming raw API data into shapes the UI can use
- **Does not** know about React Native, AsyncStorage, or fetch

### Data Layer
- All network requests (REST, WebSocket, GraphQL)
- Local storage (AsyncStorage, SQLite, MMKV)
- Caching
- Mapping raw API responses into domain models
- **Does not** contain business logic or UI concerns

## A Real Interview Scenario

**Question:** Design the cart feature for an e-commerce mobile app.

Without layers, you might describe: "A CartScreen component that fetches the cart from the API, checks if items are in stock, calculates the total with discounts, and renders the items."

With layers:
- **Data**: `CartRepository` — fetches cart from API, reads/writes local cart state, caches the last-known cart
- **Domain**: `CartService` — `addItem()`, `removeItem()`, `applyDiscount()`, `validateStock()`, calculates totals
- **Presentation**: `CartScreen` — calls `CartService`, renders the result, handles loading/error states

When the interviewer asks "what happens if the user is offline?" — your answer is clean: the `CartRepository` returns the cached cart, the `CartService` and `CartScreen` don't change at all. The offline concern is isolated to the Data layer.

## The Dependency Rule

The key rule: **dependencies only point downward**.

```
Presentation → Domain → Data
```

Domain never imports from Presentation. Data never imports from Domain. This is what makes the layers independently testable and swappable.

In practice, this means your domain layer is plain TypeScript — no React imports, no `fetch`, no `AsyncStorage`. Just functions and classes that take inputs and return outputs.

## Common Patterns Per Layer

**Presentation:** hooks that call domain services (`useCart()`), context providers for shared UI state, error boundaries.

**Domain:** service classes or plain functions, custom hooks that encapsulate domain logic (different from UI-only hooks), Zod/validation schemas.

**Data:** repository pattern (`CartRepository`, `UserRepository`), a single API client instance, cache managers.

## Key Tradeoffs

- **More structure vs more boilerplate**: Three layers means more files and indirection. For a small feature it can feel over-engineered. The payoff comes when the feature grows or you need to add offline support.
- **Where to put hooks**: Custom hooks that only manage UI state belong in Presentation. Custom hooks that call APIs or enforce business rules belong in Domain. The line can be blurry — when in doubt, ask "does this logic need to be testable without React?" If yes, it belongs in Domain.

## What's Next

With a sense of how code is organized into layers, the next concept covers how to structure your *answer* in a 45-minute interview using the RADIO framework.
