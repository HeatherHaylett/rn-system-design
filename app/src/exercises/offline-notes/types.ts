export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'failed' | 'conflict'

export type Note = {
  id: string
  title: string
  content: string
  updatedAt: string      // ISO 8601 — client time
  serverUpdatedAt?: string  // set after successful sync
  version: number        // incremented on each edit, used for conflict detection
  syncStatus: SyncStatus
  retryCount: number
}

export type MutationType = 'CREATE' | 'UPDATE' | 'DELETE'

export type QueuedMutation = {
  id: string             // unique mutation ID — also the idempotency key
  type: MutationType
  noteId: string
  payload: Partial<Note>
  enqueuedAt: string
  retryCount: number
}
