# Case Study: Offline Sync

**Tier:** 5 — Real server required (`cd server && npm run dev`)
**Difficulty:** Advanced
**Time:** 90–120 min

## The Problem

Design and build a notes app that works fully offline and syncs to the real server when connected. The server has real idempotency support, real version-based conflict detection, and returns real 409 responses.

The key difference from the Tier 3 exercise: the chaos middleware means your sync queue will encounter genuine 503s mid-flush, not a controlled `failureRate` you set yourself.

## Constraints

- Notes available instantly on launch — no loading spinner after first use
- Create, edit, delete must work offline
- Sync queue must survive app restart (persist to storage, not just memory)
- Real idempotency: if the same mutation fires twice (retry after 503), the server handles it — your client must send the idempotency key correctly
- Real conflicts: the server increments `server_version` on every update. If your `client_version` is behind, you get a 409

## Design First

**S — System Requirements**
```
Functional:


Non-functional:
```

**C — Design Considerations**
```
Storage choice for local notes (AsyncStorage, MMKV, SQLite — and why):

Sync queue persistence strategy:

Conflict resolution strategy (client-wins, server-wins, surface to user):
```

**A — Architecture**
```
Presentation:

Domain:

Data (two stores: local notes + sync queue):
```

**D — API Contract**
```
POST /notes
  Body: { note_id, title, content }
  Idempotency: send note_id as the idempotency key — server deduplicates on it
  Response: { data: { note_id, title, content, updated_at, server_version } }

PUT /notes/:noteId
  Body: { title, content, client_version }
  client_version must match server_version — otherwise 409
  409 response: { error: { code: 'CONFLICT', server_note: { ... } } }

DELETE /notes/:noteId → 204

What fields does the server return that you need to store locally?
(Hint: server_version is critical — you need it for the next update)
```

**E — Evaluate NFRs**
```
What happens when a sync flush encounters a 503 partway through?

What happens when a note is edited locally while a sync for that note is in flight?

How many retries before you mark a mutation as permanently failed?
```

**T — Tradeoffs**
```
I chose ___ over ___ because ___. The cost is ___.

I chose ___ over ___ because ___. The cost is ___.

I chose ___ over ___ because ___. The cost is ___.
```

## Build It

Create `NotesScreen.tsx` in this directory.

Requirements:
- [ ] Notes load from local storage on launch — no spinner after first use
- [ ] Create/edit/delete works offline, queued mutations visible in UI
- [ ] Sync queue persists across app restart
- [ ] Each mutation sent with correct idempotency key — retry is safe
- [ ] `client_version` sent on every PUT — handles 409 conflicts
- [ ] On 409: mark note as conflicted, show both versions, let user resolve
- [ ] On 503: retry with exponential backoff up to 3 times, then mark failed
- [ ] On sync success: update local `server_version` from response

## Observe and Break

- Set `CHAOS_LEVEL=high`, create 5 notes rapidly — watch the queue drain with failures and retries
- Kill the server during a flush — restart it, verify the queue picks up where it left off
- Manually trigger a conflict: create a note, sync it, then PUT to the server directly via curl to increment `server_version`, then edit in the app and sync
  ```bash
  curl -X PUT http://localhost:3001/notes/<noteId> \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"title":"Edited on server","client_version":1}'
  ```
- Verify idempotency: find a way to fire the same POST twice (intercept and duplicate) — the server should create the note once, not twice

## Record Your Observations

```
Sync queue under CHAOS_LEVEL=high:
- What was the longest a mutation stayed in the queue before succeeding?
- How many retries did you see before a permanent failure?


App restart with pending queue:
- Did the queue survive? How did you verify?
- What was the first thing the app did on relaunch?


Conflict test:
- What did the UI show when you received a 409?
- How did you let the user resolve it?
- After resolution, what client_version did you send on the next PUT?


Idempotency verification:
- How did you confirm the server only created the note once on a duplicate POST?


One thing the real server revealed that the mock didn't:
```
