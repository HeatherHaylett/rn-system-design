# Exercise: Caching Strategies

**Concept:** [07 — Caching](../../../../concepts/06-caching/README.md)
**Difficulty:** Intermediate
**Time:** 40–50 minutes

## The Scenario

A user profile screen fetches data on every mount. Navigation between the feed and profile triggers a full reload every time — a loading spinner on every visit, even if the data hasn't changed.

You'll implement caching in two stages: first manually (to understand what's happening), then with React Query (to see why it's the right tool).

## What's Already Here

- `ProfileScreenNaive.tsx` — a profile screen that fetches on every mount with no caching
- `mockApi.ts` — simulates a 1-second network delay so you can feel the difference
- `types.ts` — User and UserStats types

## Part A: Manual SWR Cache (build this first)

Implement a simple in-memory cache module `cache.ts` that:
- Stores results keyed by a string (e.g. `'user-u-001'`)
- Associates each entry with a timestamp and a TTL
- Exposes `get<T>(key): T | null` — returns null if missing or stale
- Exposes `set<T>(key, value, ttlMs): void`

Then create `ProfileScreenCached.tsx` that:
- On mount: immediately returns cached data if fresh (stale time: 60 seconds)
- Always fires a background fetch after returning cached data (SWR pattern)
- Updates the cache and UI when the fresh data arrives
- Shows a subtle "Updated just now" indicator when the background fetch completes

This is the SWR pattern by hand. You'll feel exactly what React Query automates.

## Part B: React Query (replace Part A)

Create `ProfileScreenRQ.tsx` that does the same thing using `useQuery`:

```typescript
const { data, isLoading, isFetching } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
  staleTime: 60_000,
})
```

Compare the two implementations. What did React Query replace? What edge cases does it handle that your manual cache doesn't?

## Acceptance Criteria

**Part A:**
- [ ] First visit: loading spinner, then profile renders
- [ ] Second visit (within 60 seconds): profile renders immediately from cache, background fetch fires
- [ ] Second visit (after 60 seconds): loading spinner again (cache is stale)
- [ ] "Updated just now" shows briefly after a background refresh

**Part B:**
- [ ] Same behaviour as Part A with a fraction of the code
- [ ] `isFetching` (not `isLoading`) is used to show the background refresh indicator — understand the difference

## The Question This Prepares You For

> "How would you prevent the profile screen from showing a loading spinner on every visit?"

After this exercise you should be able to describe the SWR pattern, implement it manually if asked, and explain why React Query is the production choice.
