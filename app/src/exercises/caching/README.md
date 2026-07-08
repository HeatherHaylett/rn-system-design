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

## How to Observe with Tools

**Console — fetch count**

`mockApi.ts` logs every fetch call and exposes `getFetchCount()`. Watch the console as you navigate between screens:

- `ProfileScreenNaive`: you'll see a log on every visit
- `ProfileScreenCached` (Part A): first visit logs, subsequent visits within 60s don't — but a background fetch fires and logs silently
- `ProfileScreenRQ` (Part B): same behaviour, but observe `isFetching` vs `isLoading` separately

**React DevTools — Components tab**

1. Select your `ProfileScreenRQ` component
2. Look at the state/hooks panel — you'll see the React Query hook's internal state including `status`, `isFetching`, `dataUpdatedAt`
3. Navigate away and back within 60 seconds — watch `isFetching` flip to `true` briefly while `isLoading` stays `false`
4. Wait for the stale time to expire, navigate back — now `isLoading` is `true` (no cached data to show)

This is the clearest way to see the difference between the two flags without reading code.

**React DevTools — Profiler tab**

Record a session across two screen visits:
- Visit 1: profile renders after a loading state — one render cycle with data
- Visit 2 (cached): profile renders immediately from cache, then re-renders once more when the background fetch completes

Count the render cycles. Visit 2 should have one extra render (the background update) but no loading spinner.

## Record Your Observations

```
Console — fetch count:
- How many times did fetchUser fire on 5 visits to ProfileScreenNaive?

- How many times did fetchUser fire on 5 visits to ProfileScreenCached (within stale time)?

- Same question for ProfileScreenRQ:


React DevTools — isFetching vs isLoading:
- What was isLoading on the second visit (within stale time)?

- What was isFetching on the second visit?

- When does isLoading become true again?


Part A vs Part B — lines of code:
- How many lines is your manual cache.ts + ProfileScreenCached.tsx combined?

- How many lines is ProfileScreenRQ.tsx?

- What edge cases did React Query handle that your manual cache didn't?


One thing that surprised me:
```
