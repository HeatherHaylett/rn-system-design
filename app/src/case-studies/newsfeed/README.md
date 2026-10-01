# Case Study: Newsfeed

**Tier:** 5 — Real server required (`cd server && npm run dev`)
**Difficulty:** Advanced
**Time:** 90–120 min

## The Problem

Design and build a social newsfeed for a mobile app. Users scroll through posts from people they follow. New posts appear at the top. The feed must feel fast even on slow connections and must not show a blank screen on return visits.

## Constraints (establish these before designing)

- Feed must appear in under 500ms on return visits
- App must show something on first load even on a 3G connection
- Infinite scroll — load more posts as the user approaches the bottom
- Like a post — optimistic update, visible immediately

## Design First

Work through SCADET before writing a line of code. Write your answers below.

**S — System Requirements**

```
Functional:
- view a feed of posts from followed users
- newest first
- infinite scroll
- like a post

Non-functional (latency, offline, battery, security):
- performance
  - optimistic likes
- network resilience
  - works on slow connections: show skeleton, load text, then load images as they download
  - show feed under 500ms on return visits
- reliability
  - gracefully handle server errors
- no network
  - First load, show 'no connection' banner, return visits display cache with 'no connection' banner, when connection is present refresh (manual or automatic to be decided)
- battery
  - No polling, real time updates not needed
  - Requests for fresh data are dependent on state of cache
- security
  - Store refresh token with secure store 
```

**C — Design Considerations**

```
Caching strategy (which pattern, what TTL):

- Stale-While-Revalidate with a 30 second stale time and a max age of one day.
- I'll store the first page or two as cache in MMKV
- Stale time will check if the cache is fresh enough to skip network and max age will check if it should be shown at all

Pagination strategy (cursor or offset, and why):

- Use cursor to determine the last requested post and get next "limit" after
- With offset, an insert above causes duplicates and a delete above causes skipped posts."
- Cursor is  (created_at, id)
- Sort by time, break ties by id
- Server sends next_cursor; client echoes it back as cursor on the next request; a null next_cursor (or has_more: false) means stop.

Protocol (REST, WebSocket, SSE — and why REST wins here):

- Make http requests to the server when cache is stale
- Check cache when user opens app, app is foregrounded, or service changes. A timer adding new posts to top of feed will disrupt scrolling and real time updates via websockets or SSE are unnecessary because a user can wait up to a minute for new posts. Or they can mannually pull to refresh. The tradeoff with checking stale cache is that data is not fresh 100% of the time.

```

**A — Architecture**

```
Draw your layer diagram:
  Presentation:
  - Skeleton on first load
  - Error/loading state
  - AppState listener with callback to refresh feed data if app foreground and cache is stale
  - NetInfo listener with callback to refresh feed data if connection found and cache is stale
  - FlatList with onRefresh with callback to refresh feed data regardless of cache being stale
  - FlatList with onEndReached to call feed data with next cursor
  - Formatting logic for date and time
  - Renders isLiked and likeCount
  Domain:
  - Post like state logic
  - Refresh feed data logic
  - Update like state, flip and rollback on failure
  - CursorPage entity with newsfeed, nextCursor
  - Fetch new feed data with cursor
  Data:
  - Reading cached newsfeed from MMKV
  - Refetch newsfeed if cache stale
  - HTTP call to fetch newsfeed
  - HTTP call to update Post data (like)
  - Passes cache or fresh feed with lastUpdatedAt
  - Mapping raw API responses into domain models
```

**D — API Contract**

```

// GET NEWS FEED

Request shape:

`/feed?cursor={cursor}&limit={limit}`

Response shape (note: the real server returns snake_case — design your domain model):

{
  "data": [{
    post_id: number,
    author: {
      friend_id: number,
      friend_name: string,
    },
    post_content: {
      post_text: string,
      post_image: string | null,
    },
    post_like_count: number,
    post_liked_by_user: boolean,
    created_at: number
  }],
  "pagination": {
    "next_cursor": string | null,
    "has_more": boolean,
  }
}

How will you map the server response to your domain model?

// Mapping function lives in the Data layer

type Post = {
    id: number,
    author: { id: number; name: string;},
    text: string,
    image: string | null,
    postLikeCount: number,
    postLikedByUser: boolean,
    createdAtMs: number,
}

type FeedState = {
  items: Post[]
  nextCursor: string | null
  hasMore: boolean
}

type ApiPost = {
    post_id: number,
    author: {
        friend_id: number,
        friend_name: string
    },
    post_content: {
        post_text: string,
        post_image: string | null,
    },
    post_like_count: number,
    post_liked_by_user: boolean,
    created_at: number
}

function toPost(api: ApiPost): Post {
  return {
    id: api.post_id,
    author: {
      id: api.author.friend_id,
      name: api.author.friend_name,
    },
    text: api.post_content.post_text,
    image: api.post_content.post_image,
    postLikeCount: api.post_like_count,
    postLikedByUser: api.post_liked_by_user,
    createdAtMs: api.created_at
  }
}

type ApiResponse = {
    data: ApiPost[],
    pagination: {
        next_cursor: string | null,
        has_more: boolean,
    }
}

function toFeed(response: ApiResponse): FeedState {
    return {
        items: response.data.map((post) => toPost(post)),
        nextCursor: response.pagination.next_cursor,
        hasMore: response.pagination.has_more
    }
}

// LIKE/UNLIKE A POST

request shape:

`/posts/{postId}/like`

fetch('https://example.com/posts/{postId}/like', {
  method: 'PUT',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN_HERE'
  },
})

fetch('https://example.com/posts/{postId}/like', {
  method: 'DELETE',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN_HERE'
  },
})

Response shape

{
  "data": {
    post_id: number,
    post_like_count: number,
    post_liked_by_user: boolean,
  }
}


```

**E — Evaluate NFRs**

```
How does your design achieve <500ms on return visits?

On cold start, cached newsfeed is loaded synchronously from device storage. Only 1 - 2 pages are in cache to limit load time. The first frame displays text instantly and images if they were downloaded previously and stored on the image library's disk cache, otherwise a placeholder image. If server succeeds, update data otherwise display banner indicating old data with reasoning (server error, no connection).

What happens on a 503 from the chaos middleware?

A 503 is temporary, so every request is retried automatically (up to 3 attempts, exponential backoff with jitter) before the user is told anything. This is safe because GET is a read and PUT/DELETE like are idempotent.

When GET /feed still fails after retries:

- (a) on first load, with no cache
  - Skeleton stays up during retries, then "There was a problem with the server, try again": manual retry with button
- (b) on a background refresh, with cached posts already on screen
  - Keep showing cached posts with "last updated X ago" from lastUpdatedAt. No error message, the user did not ask for this refresh. Pull to refresh tries again
- (c) when loading page 3 at the bottom of the list
  - Footer spinner during retries, then footer "Couldn't load more, try again": manual retry with button. Posts already loaded stay on screen and scrollable

When PUT /posts/7/like still fails after retries:
- Heart stays optimistic during retries, then roll back isLiked and likeCount and display "like not saved"

What happens when the access token expires mid-scroll?

- Every request carries the access token in the Authorization header. An expired token gets a 401
- The HTTP client in the Data layer catches the 401, uses the refresh token to get a new access token, then replays the original request. The page loads and the user never sees an error
- Only one refresh runs at a time: if several requests get a 401 together (next page + a like), they all wait on the same refresh and then replay. Otherwise a single-use refresh token would be spent by the first call and the second would fail
- Domain and Presentation never see a 401, there is no token code in FeedScreen or the like logic
- If the refresh itself fails: clear the tokens and this user's cached feed, send the user to login

```

**T — Tradeoffs**

```
I chose MMKV over Async Storage because MMKV is synchronous and will return the cache immediately. The upfront cost is rebuilding whenever native dependcies change.
I chose a 30s stale time over always refetching because it saves battery and data. The cost is that the feed can be up to 30 seconds behind, mitigated by pull-to-refresh.
I chose cursor over offset because the list changes while the user scrolls; the cost is no random page access, which a feed doesn't need.
I chose REST over web sockets/SSE because the app doesn't need real time data. The tradeoff with checking stale cache is that data is not fresh 100% of the time.
I chose PUT/DELETE over POST with an idempotency key because repeating the request will see the like exists and respond with current count. The cost is that this only works for operations that set a state; ones that create something new, like adding a comment, would still need a key.
I chose a flat domain model with a mapper over using the server's shape directly, because the mapper is the only code that knows the server's field names. If the API changes, I update ApiPost and toPost in the Data layer, and the domain model and UI stay the same. The cost is extra types and mapping code to write and keep in sync.
```

## Build It

No starter file. Create `FeedScreen.tsx` in this directory.

Requirements:

- [ ] Feed loads from real server — no mock data
- [ ] Cached data shown immediately on return visit, background re-fetch fires
- [ ] Infinite scroll — next page loads when user is within 5 items of the bottom
- [ ] Like is optimistic — count updates immediately, rolls back on 503
- [ ] Silent token refresh — user never sees a 401 error
- [ ] Loading state per section: initial load vs loading more vs background refresh

## Observe and Break

- Set `CHAOS_LEVEL=high` and scroll fast — do you see blank cells? janky frames?
- Kill the server and restart it — what does the client show during the gap?
- Wait 2 minutes, trigger a like — does the 401 → refresh → retry happen silently?
- Open the React DevTools Profiler — how many components re-render on each new page load?

## Record Your Observations

```
Initial load time at CHAOS_LEVEL=medium (measure with console.time):


Return visit — did the feed appear before the network responded? How?


On CHAOS_LEVEL=high, what was the worst scroll experience you saw?
What would you change to improve it?


Token expiry — paste the console sequence you saw:


Profiler — how many PostCard components re-rendered when page 2 loaded?
What caused any unexpected re-renders?


One thing the real server revealed that the mock didn't:
```
