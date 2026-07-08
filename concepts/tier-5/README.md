# Tier 5 — Full System Design Practice

## What's Different Here

Tiers 1–4 used mock APIs with fixed delays and controlled failures. That was intentional — you needed to learn each concept in isolation without production noise getting in the way.

Tier 5 uses a real local server. The difference matters:

| | Tiers 1–4 | Tier 5 |
|--|-----------|--------|
| Latency | Fixed 400–800ms | Variable 100–3000ms with spikes |
| Failures | Controlled rate you set | Random, server can restart |
| Data shape | Clean, designed by you | Messy, snake_case, nullable fields |
| WebSocket | `setInterval` in disguise | Real connection with lifecycle events |
| Auth | Tokens never expire mid-exercise | Access tokens expire in 2 minutes |
| Race conditions | Easy to avoid with fixed timing | Will surface naturally |

The production friction is the point. If your code only works when the network is predictable, it's not production-ready.

## Starting the Server

```bash
cd server
npm install      # first time only
npm run dev
```

The server runs on `http://localhost:3001`. Verify it's up:
```bash
curl http://localhost:3001/health
```

**Chaos levels** — set via environment variable before starting:
```bash
CHAOS_LEVEL=low npm run dev     # 50–200ms, 2% errors   — for debugging your own code
CHAOS_LEVEL=medium npm run dev  # 100–800ms, 8% errors  — default
CHAOS_LEVEL=high npm run dev    # 200–3000ms, 20% errors — stress test
CHAOS_LEVEL=off npm run dev     # no latency, no errors  — if you need a clean baseline
```

Start at `medium`. Only drop to `low` if you're trying to isolate a bug in your code rather than a network-handling issue.

## The Case Studies

Each case study is a full design + implementation problem. There is no starter file — you design the architecture first, then build it.

| Case Study | Real API Feature | Key Challenge |
|------------|-----------------|---------------|
| [Newsfeed](../../app/src/case-studies/newsfeed/README.md) | REST + cursor pagination | Messy response shape, variable latency, infinite scroll |
| [Chat](../../app/src/case-studies/chat/README.md) | Real WebSocket | Token auth on WS, reconnection under real conditions |
| [Offline Sync](../../app/src/case-studies/offline-sync/README.md) | Notes CRUD + conflict | Idempotency keys, real 409 conflicts, retry under chaos |
| [Ride Hailing](../../app/src/case-studies/ride-hailing/README.md) | SSE location stream | EventSource on mobile, stream lifecycle, driver state machine |

## How to Approach Each Case Study

**Step 1 — Design first (20–30 min)**

Before writing any code, work through SCADET in writing:
- **S** — what are the NFRs? latency target, offline requirement, auth model
- **C** — what architecture pattern? what caching strategy? what protocol?
- **A** — draw the layer diagram: what goes in Presentation / Domain / Data?
- **D** — design the API contract: endpoints, request/response shapes, pagination
- **E** — how does your design handle the chaos? variable latency, 503s, expired tokens?
- **T** — what did you trade off? write one tradeoff sentence per major decision

**Step 2 — Implement (60–90 min)**

Build against the real server. Your implementation should handle everything the chaos middleware throws at it.

**Step 3 — Observe and break things**

- Crank `CHAOS_LEVEL=high` and use the app — does it hold up?
- Kill the server mid-session and restart — does the client recover?
- Wait 2 minutes for the access token to expire — does silent refresh fire?
- Open the React DevTools profiler and record a scroll — any unexpected re-renders?

**Step 4 — Record your tradeoffs**

Fill in the observation template in the case study README. Include at least three "I chose ___ over ___ because ___" sentences. These become your interview answers.

## API Reference

Full server API available at each route:

```
POST /auth/login              { email, password } → { data: { user, access_token, refresh_token } }
POST /auth/refresh            { refresh_token } → { data: { access_token, refresh_token } }
POST /auth/logout             { refresh_token } → 204

GET  /feed?cursor=&limit=     → { data: [...posts], pagination: { next_cursor, has_more } }
POST /feed/:postId/like       → { data: { like_count } }

GET  /chat/history?since=     → { data: [...messages] }
WS   ws://localhost:3001      ?token=<access_token> — real-time messages

GET  /notes                   → { data: [...notes] }
POST /notes                   { note_id, title, content } → { data: note }
PUT  /notes/:noteId           { title, content, client_version } → { data: note } | 409 conflict
DELETE /notes/:noteId         → 204

POST /ride/request            { pickup_lat, pickup_lng } → { data: { ride_id } }
GET  /ride/:rideId/location   → SSE stream of driver location updates
POST /ride/:rideId/cancel     → 204
```

**Auth header for all protected routes:**
```
Authorization: Bearer <access_token>
```
