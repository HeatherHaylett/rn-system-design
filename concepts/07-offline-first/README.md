# Offline-First Design

## What It Is

An offline-first app is designed to work without a network connection as its baseline, then syncs when connectivity is available. The alternative — online-first — assumes a connection and degrades when one isn't available.

Most mobile apps are implicitly online-first: they show a loading spinner, hit the network, and render results. They have no behavior when offline other than an error screen.

Offline-first is harder to build but results in a dramatically better experience on mobile, where intermittent connectivity is the norm.

## The Spectrum

Not everything needs to be fully offline-first. Think in terms of which features to support at which level:

| Level | Behavior | Example |
|-------|----------|---------|
| **Full offline** | Works identically with no connection | Notes app, drafts |
| **Read offline** | Can view cached content, can't mutate | Reading saved articles |
| **Graceful degradation** | Shows cached state with staleness indicator | Social feed shows yesterday's posts |
| **Online required** | Shows clear error, no cached fallback | Payment, real-time inventory |

In an interview, explicitly state which level each feature supports. "The feed supports read offline, but checkout requires a connection" is a clear design decision. A blank screen on checkout with no explanation is a bug.

## The Three Problems of Offline-First

### 1. Local Persistence

Data the user needs offline must be stored on device. This means writing to local storage on every fetch, not just when the user explicitly saves something.

```typescript
// Online-first (data only in memory)
async function fetchFeed(): Promise<Post[]> {
  const posts = await api.getFeed()
  return posts
}

// Offline-first (data persisted on device)
async function fetchFeed(): Promise<Post[]> {
  const posts = await api.getFeed()
  await localDB.savePosts(posts)  // persist immediately
  return posts
}

async function getCachedFeed(): Promise<Post[]> {
  return localDB.getPosts()  // available even offline
}
```

### 2. Mutation Queue (Sync Queue)

When the user takes an action offline (writes a note, likes a post, adds a cart item), you can't send the request immediately. Instead, you queue the mutation locally and execute it when connectivity returns.

```typescript
type QueuedMutation = {
  id: string
  type: 'ADD_CART_ITEM' | 'LIKE_POST' | 'SEND_MESSAGE'
  payload: unknown
  createdAt: number
  retryCount: number
}
```

When the network comes back, process the queue in order. For each mutation:
- Send the request
- On success: remove from queue
- On failure: retry with backoff, up to a max retry count
- On permanent failure (4xx): remove from queue, notify the user

```typescript
import NetInfo from '@react-native-community/netinfo'

NetInfo.addEventListener(state => {
  if (state.isConnected) {
    syncQueue.flush()
  }
})
```

### 3. Conflict Resolution

The hard part. The user made changes offline. While they were offline, the server state changed too. Now you need to reconcile them.

**Strategies:**

**Last-write-wins:** The most recent change wins. Simple, but can silently discard changes.
> User edits a note offline. Someone else edits the same note online. When the user reconnects, their changes overwrite the online version.

**Server-wins:** The server's version always takes precedence. Safe for shared data, frustrating for the user who loses their offline work.

**Client-wins:** The client's offline changes always take precedence. Safe for user-owned data (a personal note), wrong for shared data (a collaborative doc).

**Merge:** Try to merge both versions. Git does this with text. Works for additive changes (both users added different items to a list). Fails for conflicting changes (both users changed the same field).

**Conflict surface to user:** When a conflict can't be resolved automatically, show it to the user and let them decide. Heavy UX burden — use only when the data is high-value and the conflict is unavoidable.

**Interview guidance:** most apps don't need full conflict resolution. User-owned data (drafts, personal settings, local notes) should be client-wins. Shared data (cart items, collaborative docs) needs server validation on sync and surfacing conflicts to the user.

## Detecting Connectivity

```typescript
import NetInfo from '@react-native-community/netinfo'

// One-time check
const state = await NetInfo.fetch()
console.log(state.isConnected, state.type) // 'wifi' | 'cellular' | 'none'

// Subscribe to changes
const unsubscribe = NetInfo.addEventListener(state => {
  if (state.isConnected) {
    syncQueue.flush()
  } else {
    // switch to offline mode
  }
})
```

Don't rely solely on `isConnected` — a device can be connected to WiFi but the internet is down (captive portal, router with no upstream). Use `isInternetReachable` for true connectivity checks.

## Showing Offline State to Users

Never leave users confused about why nothing is loading. Signal offline state clearly:

- A persistent banner when offline: "You're offline — showing saved content"
- Disable actions that require connectivity (greyed out with a tooltip: "Connect to the internet to checkout")
- Don't show loading spinners for requests that can't happen
- When connectivity returns, refresh automatically and remove the banner

## A Real Interview Scenario

**Question:** Design a note-taking app for mobile.

Strong offline answer:
> "Notes should work fully offline — that's the core value prop. Every note is written to local SQLite on save (not just on network success). When the user is offline, they write to local DB only and I queue a sync mutation. When connectivity returns, I flush the queue: push new notes to the server, update modified notes. For conflicts — if the same note was edited on another device while offline — I'll surface a conflict UI showing both versions and let the user choose. I'll use NetInfo to detect connectivity changes and trigger sync automatically."

## What's Next

Offline-first is about what happens without a network. The next concept covers a related concern: what happens when the user's session expires or their auth token is invalid: auth flows.
