import { Note, QueuedMutation } from './types'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Toggle this to simulate being offline
export let isOffline = false
export const setOffline = (v: boolean) => { isOffline = v }

// Failure rate for individual mutations (to test retry logic)
export let failureRate = 0.2
export const setFailureRate = (v: number) => { failureRate = v }

let serverNotes: Note[] = [
  {
    id: 'note-001',
    title: 'Meeting Notes',
    content: 'Discuss Q2 roadmap and hiring plan.',
    updatedAt: new Date(Date.now() - 3600_000).toISOString(),
    serverUpdatedAt: new Date(Date.now() - 3600_000).toISOString(),
    version: 1,
    syncStatus: 'synced',
    retryCount: 0,
  },
]

export async function fetchNotes(): Promise<Note[]> {
  if (isOffline) throw new Error('Network unavailable')
  await delay(700)
  return JSON.parse(JSON.stringify(serverNotes))
}

export async function createNote(
  mutation: QueuedMutation,
): Promise<Note> {
  if (isOffline) throw new Error('Network unavailable')
  await delay(500)
  if (Math.random() < failureRate) throw new Error('Server error')

  const note = { ...mutation.payload, syncStatus: 'synced' as const } as Note
  serverNotes.push(note)
  return note
}

export async function updateNote(
  mutation: QueuedMutation,
): Promise<Note> {
  if (isOffline) throw new Error('Network unavailable')
  await delay(500)
  if (Math.random() < failureRate) throw new Error('Server error')

  const idx = serverNotes.findIndex(n => n.id === mutation.noteId)
  if (idx === -1) throw new Error('Note not found')

  // Simulate a conflict: if the server version is ahead of what the client sent,
  // it means someone else edited the note since the client last synced
  const serverNote = serverNotes[idx]
  const clientVersion = (mutation.payload.version ?? 0) - 1
  if (serverNote.version > clientVersion) {
    const conflictError = new Error('Conflict') as Error & { isConflict: boolean; serverNote: Note }
    conflictError.isConflict = true
    conflictError.serverNote = serverNote
    throw conflictError
  }

  serverNotes[idx] = { ...serverNote, ...mutation.payload, syncStatus: 'synced' }
  return serverNotes[idx]
}

export async function deleteNote(mutation: QueuedMutation): Promise<void> {
  if (isOffline) throw new Error('Network unavailable')
  await delay(400)
  if (Math.random() < failureRate) throw new Error('Server error')
  serverNotes = serverNotes.filter(n => n.id !== mutation.noteId)
}
