# Exercise: FlatList Performance

**Concept:** [10 — Performance](../../../../concepts/10-performance/README.md)
**Difficulty:** Intermediate
**Time:** 35–45 minutes

## The Scenario

A feed screen renders 500 posts. On a mid-range Android, scrolling stutters and there's a noticeable lag when navigating to the screen. The React DevTools profiler shows the list re-rendering entirely on every parent update — even when the posts haven't changed.

Your job: apply targeted optimizations until the list scrolls smoothly.

## What's Already Here

- `FeedScreenSlow.tsx` — a working but unoptimized feed with 500 items. It has exactly the problems described above, each marked with a comment.
- `generatePosts.ts` — generates mock post data

## The Problems to Fix (in order)

### Fix 1: `renderItem` recreated on every render
`renderItem` is defined inline in the component body. Every parent re-render creates a new function reference, which FlatList treats as a change and re-renders all visible items.

Fix: wrap with `useCallback`.

### Fix 2: Post component re-renders unnecessarily
`PostCard` is a regular component. Even though its props haven't changed, it re-renders whenever `renderItem` gets a new reference.

Fix: wrap with `React.memo`.

### Fix 3: Missing `keyExtractor`
The list is using default key behavior (index-based). If posts reorder or new ones are prepended, React reconciles them incorrectly.

Fix: add a stable `keyExtractor` using the post ID.

### Fix 4: Missing `getItemLayout`
All posts in this exercise have a fixed height of 120. Without `getItemLayout`, FlatList measures each item as it scrolls into view, causing jank.

Fix: add `getItemLayout` using the fixed height.

### Fix 5: Like handler causes full re-render
The `onLike` callback is defined in the parent and passed to every `PostCard`. When a user likes a post, the parent updates state, all `onLike` references change, and all visible `PostCard`s re-render — even the ones that weren't liked.

Fix: stabilize `onLike` with `useCallback` so `React.memo` on `PostCard` can do its job.

## Acceptance Criteria

- [ ] Scrolling is visibly smoother after fixes (compare before/after)
- [ ] React DevTools profiler shows only the liked post re-rendering on a like action, not all visible posts
- [ ] `renderItem` is stable across parent re-renders
- [ ] `keyExtractor` uses post ID, not index
- [ ] `getItemLayout` is provided for fixed-height items

## How to Measure

Open React DevTools Profiler:
1. Record a scroll through the list on `FeedScreenSlow`
2. Note which components render and how many times
3. Apply your fixes in `FeedScreenFast.tsx`
4. Record again and compare

The goal: on a like action, only one `PostCard` should re-render.

## The Question This Prepares You For

> "The feed is slow on lower-end devices. How do you diagnose and fix it?"

After this exercise you should be able to name each optimization, explain why it works, and describe what profiling tool you'd use to confirm the improvement.
