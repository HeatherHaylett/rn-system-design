# Exercise: Optimistic Cart

**Concept:** [08 — Optimistic Updates & Conflict Resolution](../../../../concepts/11-optimistic-updates/README.md)
**Difficulty:** Intermediate
**Time:** 40–50 minutes

## The Scenario

You're building a cart screen for an e-commerce app. Items in the cart can go out of stock between when the user loaded the page and when they try to checkout.

The mock API in this exercise is designed to simulate that: some operations will succeed, some will fail with a conflict. Your job is to handle both gracefully.

## What's Already Here

- `CartScreen.tsx` — starter file with the UI shell and mock API already wired up
- `mockApi.ts` — a mock that simulates network delay and random stock conflicts
- `types.ts` — CartItem and CartItemUI types

## What You Need to Build

### 1. Optimistic add-to-cart
When the user taps "Add to Cart":
- Add the item to local state immediately (don't wait for the API)
- Send the API request in the background
- On success: do nothing (the optimistic state is correct)
- On failure: roll back the local state and show an error on the affected item

### 2. Optimistic quantity update
When the user increases or decreases an item's quantity:
- Update the quantity in local state immediately
- Send the API request in the background
- On conflict (e.g., requested 5 but only 2 remain): roll back and show inline error

### 3. Re-validate on checkout attempt
Before navigating to the checkout screen:
- Re-fetch the cart from the server
- If any items have conflicts (out of stock, quantity reduced), show them inline
- Only allow proceeding to checkout when all items are valid

### 4. Re-validate on foreground
When the app comes back from the background after more than 60 seconds:
- Re-fetch the cart
- Show a subtle "Cart updated" banner if anything changed

## Acceptance Criteria

- [ ] Adding an item updates the UI immediately, no loading spinner
- [ ] If add-to-cart fails, the item is removed from the cart and an error toast appears
- [ ] Quantity changes are reflected immediately in the UI
- [ ] If a quantity update conflicts, the quantity snaps back with an inline error message on that item
- [ ] "Proceed to Checkout" re-fetches the cart and blocks if any items have errors
- [ ] App-to-foreground transition re-fetches cart if last fetch was >60 seconds ago

## Edge Cases to Handle

- Network timeout (not a conflict, just a slow connection) — should still roll back
- Two quick taps on "Add to Cart" — don't add the item twice
- User changes quantity while a previous quantity update is still in-flight

## The Interview Question This Prepares You For

> "A user adds an item to their cart, but by the time they reach checkout the item is sold out. How does your system handle this?"

After this exercise, you should be able to answer with:
- Where the conflict is detected (API layer, on checkout re-fetch)
- How the UI communicates the conflict to the user (inline error on the item)
- What state you roll back and how
- Why you re-fetch on checkout rather than trusting local state
- When you'd choose pessimistic over optimistic (payments)
