# Exercise: Unidirectional Data Flow

**Concept:** [04 — Data Flow](../../../../concepts/04-data-flow/README.md)
**Difficulty:** Beginner
**Time:** 30–40 minutes

## The Scenario

You're building a comment thread — a list of comments with a reply box at the bottom. The starter file has the same bug pattern you'll encounter constantly in real codebases: child components holding their own copies of state, sibling components trying to communicate directly, and derived state stored redundantly.

Your job is to refactor it so data flows strictly top-down and actions flow bottom-up.

## What's Already Here

- `CommentThread.tsx` — a working comment thread with data flow violations. Each violation is marked with a comment explaining what's wrong and why.
- `types.ts` — Comment and Reply types

## The Violations to Fix

### Violation 1: Child mutates parent's data directly
`CommentCard` receives the comment object as a prop and calls `comment.likeCount++` directly when the user likes it. This mutates the parent's data from a child — a direct violation of unidirectional flow. The fix: pass a callback down, let the parent own the update.

### Violation 2: Sibling-to-sibling communication via a ref
`ReplyBox` and `CommentList` are siblings. When a reply is submitted, `ReplyBox` reaches into a ref on `CommentList` to call `commentList.current.addComment()`. Siblings should never communicate directly. The fix: lift the comments state to the common parent and pass props/callbacks down.

### Violation 3: Derived state stored in useState
`CommentCard` stores a `displayName` in its own `useState` — computed from `comment.author.firstName + ' ' + comment.author.lastName`. This re-derives every render and is stored unnecessarily. Compute it inline.

### Violation 4: Redundant local copy of a prop
`CommentList` receives `comments` as a prop but immediately copies it into local state with `useState(comments)`. When the parent updates the `comments` prop, the local copy doesn't update. Fix: use the prop directly.

## Acceptance Criteria

- [ ] No child component mutates a prop or parent's data directly
- [ ] `ReplyBox` and `CommentList` communicate only via the parent — no refs between siblings
- [ ] `displayName` is computed inline, not stored in state
- [ ] `CommentList` renders directly from its `comments` prop — no local copy
- [ ] Liking a comment updates the count correctly and the change is visible immediately
- [ ] Submitting a reply adds it to the list and clears the input

## The Question This Prepares You For

> "Can you walk me through how data flows in your component tree?"

After this exercise you should be able to draw the data flow diagram for any component tree and immediately spot where flow is going the wrong direction.

## How to Observe with Tools

**React DevTools — Components tab**

1. Open the Components tab and expand the full tree: `CommentThread` → `CommentList` → `CommentCard`
2. Click each component and look at its props and state panels on the right

Before your fix:
- `CommentList` will show a `comments` state entry that is a copy of the prop — two sources of truth visible side-by-side
- `CommentCard` will show a `displayName` state entry that could just be a const
- Click `CommentCard` and trigger a like — watch the parent's data mutate silently without a React re-render (the count changes in the DOM but React DevTools doesn't show a state update because you bypassed React)

After your fix:
- `CommentList` should have no local state — only props
- `CommentCard` should have no state at all
- A like should show a state update on `CommentThread` (the owner of like counts), and the re-render should propagate down correctly

**React DevTools — Profiler tab**

Record a session, submit a reply, then stop recording. Look at the flame graph:
- Before fix: `CommentList` re-renders because it maintains its own state, and all `CommentCard`s re-render too
- After fix: only `CommentThread` and the specific `CommentCard` for the new reply should re-render

## Record Your Observations

```
Components tab — before fix:
- What state did CommentList have that it shouldn't?


- What state did CommentCard have that it shouldn't?


- What happened in the UI when you liked a comment (before fix)?
  Did React DevTools show a state update? Why or why not?


Components tab — after fix:
- What does CommentList's state panel show now?


- Draw the data flow for submitting a reply (use arrows):
  ReplyBox →


Profiler — what re-rendered on a reply submit before vs after:
  Before:

  After:


One thing that surprised me:
```
