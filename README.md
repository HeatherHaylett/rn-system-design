# RN System Design Prep

A learn-then-practice repo for React Native mobile system design interviews.

Each concept has a short read that explains what it is, why it matters, and where it shows up in interviews — followed by a scoped exercise that makes it concrete in code.

## How to Use This Repo

1. **Read the concept doc** in `concepts/` — understand what the pattern is, see a real-world scenario, learn the tradeoffs.
2. **Open the exercise** in `app/src/exercises/` — a scaffolded RN screen with comments pointing to the concept you just read.
3. **Implement it** — the exercise tells you what to build, not how. You bring the design decisions.
4. **Check the acceptance criteria** in the exercise README — did your implementation handle the edge cases?

## Quick Start

```bash
nvm use 20
cd app
npm install
npx expo start
```

## Learning Path

Work through concepts in order — each one builds on the previous.

### Tier 1 — Requirements & Architecture
| # | Concept | What You'll Learn |
|---|---------|-------------------|
| 01 | [Mobile NFRs](concepts/01-mobile-nfrs/README.md) | What non-functional requirements mean on mobile: latency, battery, offline, security |
| 02 | [Layered Architecture](concepts/02-layered-architecture/README.md) | Presentation → Domain → Data layers and why the split matters |
| 03 | [State Management](concepts/03-state-management/README.md) | useState vs useReducer vs Context vs Zustand vs React Query — what goes where |
| 04 | [RADIO Framework](concepts/03-radio-framework/README.md) | How to structure a 45-minute system design answer |

### Tier 2 — Data & Networking
| # | Concept | What You'll Learn |
|---|---------|-------------------|
| 04 | [Data Modeling](concepts/04-data-modeling/README.md) | Server state vs client/UI state, entity design, pagination |
| 05 | [Networking Protocols](concepts/05-networking/README.md) | REST, short/long polling, WebSocket, SSE, GraphQL, gRPC, MQTT |
| 06 | [API Design](concepts/api-design/README.md) | Endpoints, request/response structure, IDs, timestamps, idempotency |
| 07 | [Caching Strategies](concepts/06-caching/README.md) | Stale-while-revalidate, TTL, cache eviction on mobile |

### Tier 3 — Mobile-Specific Concerns
| # | Concept | What You'll Learn |
|---|---------|-------------------|
| 07 | [Offline-First](concepts/07-offline-first/README.md) | Local persistence, sync queues, conflict resolution |
| 08 | [Optimistic Updates](concepts/08-optimistic-updates/README.md) | Show the action immediately, roll back on failure, handle stale data |
| 09 | [Auth Flows](concepts/09-auth/README.md) | Token storage, refresh logic, session expiry on mobile |

### Tier 4 — Performance
| # | Concept | What You'll Learn |
|---|---------|-------------------|
| 10 | [Performance](concepts/10-performance/README.md) | FlatList at scale, image caching, startup time |

### Tier 5 — Full System Design Practice
Full case studies (Newsfeed, Chat, Maps, Ride-hailing) using the SCADET framework. Added once Tiers 1–4 are complete.

## Exercises

| Exercise | Concept | Difficulty |
|----------|---------|------------|
| [Layered Architecture](app/src/exercises/layered-architecture/README.md) | 02 | Beginner |
| [Optimistic Cart](app/src/exercises/optimistic-cart/README.md) | 08 | Intermediate |

## Interview Frameworks

Two frameworks show up constantly in mobile system design interviews:

- **RADIO** — structures your answer in an interview setting (Requirements → Architecture → Data Model → Interface → Optimizations)
- **SCADET** — structures what you need to know deeply (System Requirements → Design Considerations → Architecture → API → Evaluate NFRs → Trade-offs)

See `concepts/03-radio-framework/` for how to use RADIO in an interview. SCADET is the lens the Tier 5 case studies use.
