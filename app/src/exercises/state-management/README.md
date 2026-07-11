# Exercise: State Management Decisions

**Concept:** [03 — State Management](../../../../concepts/03-state-management/README.md)
**Difficulty:** Intermediate
**Time:** 40–50 minutes

## The Scenario

You're building a social app with a feed screen, a profile screen, and a bottom tab bar that shows an unread notification count badge.

The starter file has everything working, but state is placed incorrectly throughout. Some things that should be local are global. Some things that should be global are duplicated. Server data is managed with raw `useState` + `useEffect` instead of the right tool.

Your job: identify what's wrong and refactor each piece of state to the right home.

## What's Already Here

- `AppBroken.tsx` — a working but incorrectly structured app. Read the comments to understand what each piece of state is doing and why its placement is wrong.
- `types.ts` — shared types
- `mockApi.ts` — mock API functions

## What You Need to Fix

### Problem 1: Duplicated server state
The feed posts are fetched in `FeedScreen` with `useState` + `useEffect`. The profile screen also fetches the current user with its own `useState` + `useEffect`. Both have manual loading/error state. Replace both with React Query.

### Problem 2: Notification count in the wrong place
The unread notification count is stored in `FeedScreen`'s local state. The `TabBar` component needs it to render the badge but has no access — so it's being passed up through props via a workaround. Move it to the right place so both `TabBar` and any other subscriber can access it without prop drilling.

### Problem 3: Over-globalized UI state
The modal open/closed state for a "New Post" modal is currently in a global Zustand store. Nothing outside the feed screen needs to know if this modal is open. Move it to where it belongs.

### Problem 4: Derived state stored redundantly
The `filteredPosts` (posts filtered by the search query) is being stored in its own `useState`. This means there are two `useEffect` calls keeping it in sync with the posts and the query. Replace with a direct derivation.

## Acceptance Criteria

- [x] Feed posts fetched with `useQuery` — no manual `useState`/`useEffect` for server data
- [x] Current user fetched with `useQuery` — same
- [x] Notification count accessible to `TabBar` and `FeedScreen` without prop drilling, but not in a heavier store than necessary
- [x] New post modal state is local to `FeedScreen`
- [x] `filteredPosts` is computed directly from `posts` and `query`, not stored in state
- [x] App still works end-to-end after refactor

## The Question This Prepares You For

> "Walk me through how you'd manage state in a social feed app."

After this exercise you should be able to answer with specific tool choices, the reason for each, and the failure mode it avoids.

## How to Observe with Tools

**React DevTools — Components tab**

1. Open React DevTools and select the Components tab
2. Click on `FeedScreen` in the tree — look at its state and props panel on the right
3. Like a post and watch which components highlight (re-render flash)

Before your fix: every visible component in the tree re-renders on a like.
After your fix: only the component that owns the like count should re-render.

**What to check per problem:**
- Problem 1: Select `FeedScreen` → state panel should show no raw posts array after your fix, just a React Query result
- Problem 2: Select `TabBar` → it should read notification count without receiving it as a prop from App
- Problem 3: Select `FeedScreen` → modal open state should appear in local state, not in a global store
- Problem 4: Trigger a search → the Components tab should show no `filteredPosts` state entry anywhere

## Record Your Observations

Fill this in as you work — you'll use it when you explain your decisions in an interview.

```
Before fix — what I observed in React DevTools:
- Which component owned notification count, and why that was wrong:
    

- What re-rendered when I liked a post (list every component):
    TextInput, everything in ScrollView, the modal button

- Where filteredPosts lived and why that caused a bug:


After fix — what changed:
- Which component now owns notification count, and why:
    AppBroken because both Tab and Feed can access the count from parent

- What re-renders on a like action now:


- How many useState calls did you remove by switching to useQuery:


One thing that surprised me:
```
