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


Non-functional (latency, offline, battery, security):
```

**C — Design Considerations**
```
Caching strategy (which pattern, what TTL):

Pagination strategy (cursor or offset, and why):

Protocol (REST, WebSocket, SSE — and why REST wins here):
```

**A — Architecture**
```
Draw your layer diagram:
  Presentation:

  Domain:

  Data:
```

**D — API Contract**
```
Endpoints you'll use:
  GET /feed?cursor=&limit=

Request shape:

Response shape (note: the real server returns snake_case — design your domain model):

How will you map the server response to your domain model?
```

**E — Evaluate NFRs**
```
How does your design achieve <500ms on return visits?

What happens on a 503 from the chaos middleware?

What happens when the access token expires mid-scroll?
```

**T — Tradeoffs**
```
I chose ___ over ___ because ___. The cost is ___.

I chose ___ over ___ because ___. The cost is ___.

I chose ___ over ___ because ___. The cost is ___.
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
