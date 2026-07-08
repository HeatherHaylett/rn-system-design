# Exercise: Offline-First Notes

**Concept:** [07 — Offline-First](../../../../concepts/07-offline-first/README.md)
**Difficulty:** Advanced
**Time:** 60–75 minutes

## The Scenario

You're building a notes app. Notes must be fully available offline — the user writes notes on the subway and expects them to be there when they arrive. When connectivity returns, notes sync to the server automatically.

## What's Already Here

- `mockApi.ts` — server API (create, update, delete, fetch notes). Can be put in "offline mode"
- `mockStorage.ts` — local storage layer using an in-memory store (simulates AsyncStorage)
- `types.ts` — Note and QueuedMutation types
- `NotesScreen.tsx` — UI shell: list of notes, create/edit/delete actions

## What You Need to Build

### 1. Local-first reads
On mount, load notes from local storage immediately (no loading spinner after first launch). Kick off a background sync in parallel. When sync completes, merge results with local state.

### 2. Local-first writes
When the user creates, updates, or deletes a note:
- Write to local storage immediately
- Update the UI immediately
- Enqueue a mutation in the sync queue
- Show a small "Syncing..." / "Synced" / "Pending sync" indicator per note

### 3. Sync queue
Implement a `SyncQueue` that:
- Persists queued mutations to local storage (survives app restart)
- Flushes on connectivity restored (listen to `NetInfo`)
- Processes mutations in order
- On server error: marks the mutation as failed, keeps it in the queue for retry
- After 3 failed retries: marks the note with a permanent error, removes from queue

### 4. Conflict detection
After syncing, if the server returns a version of a note that differs from the local version (someone edited on another device), surface a conflict indicator on that note. Don't auto-resolve — let the user decide.

## Acceptance Criteria

- [ ] App loads notes instantly from local storage on second launch
- [ ] Creating a note offline: appears immediately, shows "Pending sync"
- [ ] Restoring connectivity: pending mutations flush automatically
- [ ] After sync: note status updates to "Synced" with server timestamp
- [ ] Server error on sync: note marked "Sync failed", retried up to 3 times
- [ ] Conflict detected: note shows "Conflict" indicator with a resolve option

## The Question This Prepares You For

> "Design a note-taking app that works fully offline."

After this exercise you should be able to describe the full offline-first architecture: local-first reads, mutation queue, connectivity-triggered sync, conflict detection, and retry strategy.
