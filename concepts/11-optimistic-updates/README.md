# Optimistic Updates & Conflict Resolution

## What They Are

An optimistic update means you update the UI immediately when the user takes an action — before the server has confirmed it. You're being "optimistic" that the action will succeed. If the server later says it failed, you roll back.

The alternative is a **pessimistic update**: show a loading spinner, wait for the server response, then update the UI. This is safer but feels slow and unresponsive on mobile.

## Why It Matters on Mobile

Network round trips on mobile are slow and unreliable. If every user action blocks on a server response, the app feels laggy. Optimistic updates make the app feel instant.

But they introduce a category of bugs that don't exist with pessimistic updates: **what happens when the server says no?**

## The Cart Scenario

You're building a shopping cart. The user taps "Buy Now" on a product that shows as available. You optimistically show them a success state. Then the server responds: "Sorry, that item just sold out."

This is a real problem at high traffic volumes. The item was in stock when the user loaded the product page, but by the time they tapped "Buy Now," someone else purchased the last unit.

Now you have three problems:
1. **Rollback**: undo the optimistic UI update and get back to a consistent state
2. **Error messaging**: tell the user clearly what happened, not just "something went wrong"
3. **Stale data**: the product page is now showing incorrect stock information

### How to handle rollback

Keep a snapshot of the previous state before applying the optimistic update. On failure, restore it.

```typescript
// Before the action
const previousCart = [...cartItems]

// Apply optimistically
setCartItems(current => [...current, newItem])

try {
  await CartRepository.addItem(newItem)
} catch (error) {
  // Rollback
  setCartItems(previousCart)
  showError('Item is no longer available')
}
```

### How to handle stale data

The cart scenario has a subtlety: the user might have been on the product page for 10 minutes before tapping "Buy Now." The stock status they're seeing is stale.

Two strategies:

**Re-validate before the critical action**: Before navigating to checkout, re-fetch the cart from the server to check current stock. This adds latency but prevents the user from getting to the payment screen before discovering an item is unavailable.

**Re-validate on foreground**: When the app comes back from the background, re-fetch any data that's time-sensitive. The user could have backgrounded the app for an hour — your cart state is probably stale.

```typescript
// Re-validate on app foreground
useEffect(() => {
  const subscription = AppState.addEventListener('change', nextAppState => {
    if (nextAppState === 'active') {
      CartService.revalidate()
    }
  })
  return () => subscription.remove()
}, [])
```

### How to handle per-item errors

Don't fail the whole cart because one item is out of stock. Flag the specific item:

```typescript
type CartItemUI = CartItem & {
  error: string | null  // 'Out of stock' | 'Price changed' | null
}
```

Show the error inline on the affected item so the user can decide to remove it or keep shopping.

## When NOT to Use Optimistic Updates

Optimistic updates are appropriate when:
- The action usually succeeds
- The action is reversible or the rollback is cheap
- The perceived performance improvement is meaningful

**Don't use optimistic updates for payments.** If you optimistically show "Payment successful" and then the server says it failed, you've created a trust crisis with the user. For financial operations, pessimistic updates are the right call. The user expects to wait for payment confirmation.

**Don't use them when conflicts are frequent.** If items go out of stock constantly (flash sales, limited inventory), the rollback rate will be high and the experience will feel worse than just waiting.

## The Full Failure Path

Strong interview answers walk through the full failure path, not just the happy path:

1. User taps "Add to Cart"
2. Optimistic update applied — item appears in cart immediately
3. API request sent in background
4. API returns 409 Conflict: "Only 1 unit remaining, you requested 3"
5. Roll back the optimistic update
6. Show inline error on the cart item: "Only 1 left — adjust quantity"
7. Re-fetch cart to ensure local state matches server

Notice step 7 — after a conflict, you re-fetch rather than trusting your rollback. The server is the source of truth.

## Key Tradeoffs

| | Optimistic | Pessimistic |
|---|---|---|
| Perceived speed | Fast | Slower |
| Complexity | Higher | Lower |
| Consistency risk | Yes — rollback needed | No |
| Right for | Likes, follows, low-stakes CRUD | Payments, irreversible actions |

## What's Next

The next concept covers the last mobile-specific concern in Tier 3: auth flows — how tokens are stored, refreshed, and what happens when they expire.
