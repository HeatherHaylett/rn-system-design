# RN System Design Prep

A learn-then-practice repo for React Native mobile system design interviews.

Each concept has a short read that explains what it is, why it matters on mobile, and where it shows up in interviews — followed by a scoped exercise that makes it concrete in code.

## How to Use This Repo

For each concept:

1. **Read the concept doc** — understand the pattern, see a real-world scenario, learn the tradeoffs
2. **Do the exercise** — scaffolded RN screen with marked problems or TODOs; you bring the design decisions
3. **Use the tools** — each exercise has a "How to observe" section with specific DevTools and console instructions; follow them, don't skip them
4. **Record your observations** — fill in the observation template while it's fresh; vague notes don't help later
5. **Write the tradeoffs** — for each major decision you made, complete the sentence: "I chose ___ over ___ because ___. The cost is ___." This is the sentence you'll say in interviews

Steps 4 and 5 are where most of the learning happens. Don't skip them to move faster.

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
| | Concept | What You'll Learn |
|--|---------|-------------------|
| 01 | [Mobile NFRs](concepts/01-mobile-nfrs/README.md) | Latency, battery, offline, security — what NFRs mean on mobile and how to surface them |
| 02 | [Layered Architecture](concepts/02-layered-architecture/README.md) | Presentation → Domain → Data layers, the dependency rule, why the split matters |
| 03 | [State Management](concepts/03-state-management/README.md) | useState vs useReducer vs Context vs Zustand vs React Query — what goes where and why |
| 04 | [Data Flow](concepts/03-data-flow/README.md) | Unidirectional data flow, reactive programming, props down / callbacks up |
| 05 | [RADIO Framework](concepts/03-radio-framework/README.md) | How to structure a 45-minute system design answer with time allocation per phase |

### Tier 2 — Data & Networking
| | Concept | What You'll Learn |
|--|---------|-------------------|
| 06 | [Data Modeling](concepts/04-data-modeling/README.md) | Server vs client state, domain models, mapping functions, cursor pagination |
| 07 | [Networking Protocols](concepts/05-networking/README.md) | REST, short/long polling, WebSocket, SSE, GraphQL, gRPC, MQTT — decision tree |
| 08 | [API Design](concepts/api-design/README.md) | Endpoints, request/response structure, IDs, timestamps, idempotency |
| 09 | [Caching](concepts/06-caching/README.md) | SWR, cache-first, network-first, TTL, eviction, storage options |

### Tier 3 — Mobile-Specific Concerns
| | Concept | What You'll Learn |
|--|---------|-------------------|
| 10 | [Offline-First](concepts/07-offline-first/README.md) | Local persistence, mutation queue, conflict resolution, connectivity detection |
| 11 | [Optimistic Updates](concepts/08-optimistic-updates/README.md) | Immediate UI, rollback on failure, stale data, when not to use it |
| 12 | [Auth Flows](concepts/09-auth/README.md) | SecureStore vs AsyncStorage, silent refresh, race conditions, deep link re-entry |

### Tier 4 — Performance
| | Concept | What You'll Learn |
|--|---------|-------------------|
| 13 | [Performance](concepts/10-performance/README.md) | FlatList at scale, image caching, JS/UI thread, startup time, memoization |

### Tier 5 — Full System Design Practice
Full case studies using the SCADET framework — design a complete system from scratch, then implement the critical parts. Added once Tiers 1–4 are complete.

Planned cases: Newsfeed, Chat, Maps, Ride-hailing.

## Exercises

| Exercise | Concept | Difficulty | Time | Tools Used |
|----------|---------|------------|------|------------|
| [Layered Architecture](app/src/exercises/layered-architecture/README.md) | Layered Architecture | Beginner | 30–40 min | — |
| [Data Flow](app/src/exercises/data-flow/README.md) | Data Flow | Beginner | 30–40 min | DevTools Components + Profiler |
| [State Management](app/src/exercises/state-management/README.md) | State Management | Intermediate | 40–50 min | DevTools Components |
| [Data Modeling](app/src/exercises/data-modeling/README.md) | Data Modeling | Intermediate | 35–45 min | — |
| [Caching](app/src/exercises/caching/README.md) | Caching | Intermediate | 40–50 min | DevTools Components + Console |
| [Optimistic Cart](app/src/exercises/optimistic-cart/README.md) | Optimistic Updates | Intermediate | 40–50 min | — |
| [WebSocket Chat](app/src/exercises/websocket-chat/README.md) | Networking Protocols | Advanced | 50–60 min | Console event log |
| [Offline Notes](app/src/exercises/offline-notes/README.md) | Offline-First | Advanced | 60–75 min | Console + DevTools Components |
| [Auth Flow](app/src/exercises/auth-flow/README.md) | Auth | Advanced | 50–60 min | Console + SecureStore |
| [FlatList Performance](app/src/exercises/flatlist-perf/README.md) | Performance | Intermediate | 35–45 min | DevTools Profiler |

## Interview Frameworks

Two frameworks show up constantly in mobile system design interviews. They complement each other.

**RADIO** — use this in the interview room to structure your answer:
- **R**equirements — clarify scope and NFRs (~10% of time)
- **A**rchitecture — high-level components and data flow (~20%)
- **D**ata Model — entities, server vs client state (~10%)
- **I**nterface — API contracts and component APIs (~20%)
- **O**ptimizations — go deep on the interesting parts (~40%)

**SCADET** — use this while studying to make sure you know the material deeply:
- **S**ystem Requirements → **C**onsiderations → **A**rchitecture → **D**esign (API) → **E**valuate NFRs → **T**radeoffs

See [concepts/03-radio-framework](concepts/03-radio-framework/README.md) for how to use RADIO in an interview. Tier 5 case studies use SCADET as the design template.
