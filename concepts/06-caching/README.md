# Caching Strategies

## What It Is

Caching means storing data locally so you don't have to fetch it again every time you need it. On mobile, caching is one of the highest-impact things you can design well — it determines whether your app feels instant or sluggish, and whether it works at all without a network connection.

Every caching decision involves the same tradeoff: **freshness vs performance**. The more aggressively you cache, the faster the app feels — but the more likely users are to see stale data.

## The Core Strategies

### 1. Cache-First (Offline-First)

Return cached data immediately, don't go to the network unless the cache is empty or explicitly stale.

```
Cache hit? → return cache → (optionally) refresh in background
Cache miss? → fetch from network → store in cache → return
```

**Best for:** data that changes infrequently and where showing slightly stale data is acceptable. User profile, app settings, reference data.

**Downside:** user may see outdated content without knowing it.

### 2. Network-First

Always try the network. Fall back to cache only if the network fails.

```
Fetch from network → success? → store in cache → return
                   → fail?    → return cache (or error if no cache)
```

**Best for:** data where freshness matters most. Current inventory, account balance, live scores.

**Downside:** always pays the network cost, even if the cached data is still valid.

### 3. Stale-While-Revalidate (SWR)

Return cached data immediately (even if stale), then fetch a fresh version in the background and update the UI when it arrives.

```
Cache hit? → return cache immediately
           → fetch fresh data in background
           → update UI when fresh data arrives
Cache miss? → show loading state → fetch → store → return
```

**Best for:** most social app content. Feeds, profiles, product listings. The user sees something instantly (the cached version) and the UI silently updates when fresh data arrives.

**This is what React Query, SWR, and similar libraries implement by default.**

### 4. Cache-Then-Network

Return cached data immediately AND fire a network request simultaneously. Show the cached data first, replace with fresh data when it arrives.

Similar to SWR but the network request fires unconditionally rather than being triggered by staleness. Slightly more aggressive.

## Cache Invalidation

The hardest part of caching is knowing when to throw data away.

**Time-based (TTL — Time To Live):** Cache entries expire after a fixed duration. Simple, predictable. Right for data that updates on a regular schedule.

```typescript
type CacheEntry<T> = {
  data: T
  cachedAt: number  // unix timestamp
  ttl: number       // milliseconds
}

function isStale<T>(entry: CacheEntry<T>): boolean {
  return Date.now() - entry.cachedAt > entry.ttl
}
```

**Event-based invalidation:** When something happens that makes cached data invalid, explicitly purge it. A user updates their profile → invalidate the profile cache. A purchase completes → invalidate the cart cache.

This is more precise than TTL but requires you to know what events affect what cache entries — which gets complex at scale.

**On mutation:** Any time the user successfully writes data, invalidate the relevant cache entries so the next read gets fresh data.

## What to Cache on Mobile

| Data type | Strategy | TTL |
|-----------|----------|-----|
| User profile | SWR | 5 minutes |
| Social feed | SWR | 1–2 minutes |
| Product listing | SWR | 5 minutes |
| Product inventory/stock | Network-first | Don't cache |
| Account balance | Network-first | Don't cache |
| App config / feature flags | Cache-first | 1 hour |
| Images | Cache-first | Long (days/weeks) |
| Search results | Short TTL or none | 30 seconds |

## Where to Store Cache Data on Mobile

**In-memory (React state / Zustand / Redux):** Fastest, but gone when the app is killed. Fine for session-level caching.

**AsyncStorage:** Simple key-value store, persists across app restarts. Slow for large datasets (it's serializing JSON). Fine for small amounts of data.

**MMKV:** Significantly faster than AsyncStorage for reads/writes. Drop-in replacement for most AsyncStorage use cases. Good for caches that need to be fast.

**SQLite / WatermelonDB:** Full relational database on device. Right for large datasets with complex queries (hundreds of messages, thousands of contacts). More setup, more power.

**Image caching:** Don't reinvent this. Use `expo-image` or `react-native-fast-image` — they handle disk-based image caching, memory management, and eviction automatically.

## Cache Size Limits and Eviction

Mobile devices have limited storage. You need an eviction policy:

**LRU (Least Recently Used):** Evict the item that hasn't been accessed in the longest time. The most common policy. Keeps popular items in cache.

**FIFO (First In, First Out):** Evict the oldest item. Simpler but evicts popular items that were cached early.

**Size-based:** Cap the cache at X megabytes. When it fills, evict until under the limit.

In practice: set a max item count or max byte size, evict LRU when exceeded.

## A Real Interview Scenario

**Question:** Design the feed for a social app.

Strong answer on caching:
> "On first launch, I'll fetch the first page of feed items and cache them in MMKV with a 2-minute TTL. When the user opens the app, I'll return the cached feed immediately so there's no blank loading state, and revalidate in the background — SWR. When fresh data arrives, I'll diff it against the cached feed and insert new items at the top rather than replacing the entire list, to avoid the list jumping. I'll cap the feed cache at 200 items and evict older items to stay within memory bounds. Images are separately cached by expo-image at the HTTP layer."

That answer covers: strategy, storage choice, TTL, UX behavior on revalidation, size limits, and image caching.

## What's Next

Caching keeps your app fast when you have a connection. The next concept covers what happens when you have no connection at all: offline-first design.
