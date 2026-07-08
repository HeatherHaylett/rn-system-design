# Exercise: Layered Architecture

**Concept:** [02 — Layered Architecture](../../../../concepts/02-layered-architecture/README.md)
**Difficulty:** Beginner
**Time:** 30–40 minutes

## The Scenario

You're building a product detail screen for an e-commerce app. The screen shows a product's name, price, description, and stock status, and lets the user add it to their cart.

Right now everything is in one file. Your job is to refactor it into proper layers — Presentation, Domain, and Data — so that each layer has a single responsibility.

## What's Already Here

- `ProductScreen.tsx` — a working but unlayered implementation. Everything is in one component: fetching, business logic, display.
- `types.ts` — shared types

## What You Need to Build

### Data Layer (`data/`)
- `ProductRepository.ts` — responsible for fetching product data from the API (mocked) and caching the result
- `CartRepository.ts` — responsible for reading/writing cart state to local storage (mocked)

### Domain Layer (`domain/`)
- `ProductService.ts` — `getProduct(id)` use case; transforms raw API data into a UI-ready shape
- `CartService.ts` — `addToCart(product, quantity)` use case; enforces the rule that quantity must be between 1 and 99

### Presentation Layer (`presentation/`)
- `ProductScreen.tsx` — refactored to only handle display and user interaction; calls Domain, never Data directly

## Acceptance Criteria

- [ ] `ProductScreen` imports from `domain/` only — no direct calls to `fetch`, `AsyncStorage`, or the repositories
- [ ] `CartService.addToCart()` rejects quantities outside 1–99 with a descriptive error
- [ ] `ProductRepository` and `CartRepository` can be swapped for different implementations without touching Domain or Presentation
- [ ] The screen still works end-to-end: loads product, shows stock status, adds to cart

## Edge Cases to Handle

- Product is out of stock — the "Add to Cart" button should be disabled
- Network error fetching product — show an error state, not a crash
- Adding to cart fails — show an error without losing the product data

## Interview Connection

After completing this, you should be able to answer:
- "Walk me through how you'd structure the code for a product detail screen."
- "If we needed to add offline support later, what would change?"
- "How would you test the cart business logic without rendering any UI?"
