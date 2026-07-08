import { Router } from 'express'

export const notesRouter = Router()

// Per-user notes store: userId → Note[]
const userNotes = new Map()

function getUserNotes(userId) {
  if (!userNotes.has(userId)) {
    userNotes.set(userId, [
      {
        note_id: 'note-seed-001',
        title: 'First note',
        content: 'This note was here when you arrived.',
        updated_at: new Date(Date.now() - 3600_000).toISOString(),
        server_version: 1,
      },
    ])
  }
  return userNotes.get(userId)
}

notesRouter.get('/', (req, res) => {
  res.json({ data: getUserNotes(req.userId) })
})

notesRouter.post('/', (req, res) => {
  const { note_id, title, content, idempotency_key } = req.body ?? {}
  const notes = getUserNotes(req.userId)

  // Idempotency: if we've seen this key before, return the stored result
  const existing = notes.find(n => n.note_id === note_id)
  if (existing) return res.status(200).json({ data: existing })

  const note = {
    note_id: note_id ?? `note-${Date.now()}`,
    title: title ?? '',
    content: content ?? '',
    updated_at: new Date().toISOString(),
    server_version: 1,
  }
  notes.push(note)
  res.status(201).json({ data: note })
})

notesRouter.put('/:noteId', (req, res) => {
  const notes = getUserNotes(req.userId)
  const idx = notes.findIndex(n => n.note_id === req.params.noteId)
  if (idx === -1) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Note not found' } })

  const { title, content, client_version } = req.body ?? {}
  const existing = notes[idx]

  // Conflict detection: client must send the version it last saw
  if (client_version !== undefined && existing.server_version > client_version) {
    return res.status(409).json({
      error: {
        code: 'CONFLICT',
        message: 'Note was modified by another device',
        server_note: existing,
      },
    })
  }

  notes[idx] = {
    ...existing,
    title: title ?? existing.title,
    content: content ?? existing.content,
    updated_at: new Date().toISOString(),
    server_version: existing.server_version + 1,
  }
  res.json({ data: notes[idx] })
})

notesRouter.delete('/:noteId', (req, res) => {
  const notes = getUserNotes(req.userId)
  const idx = notes.findIndex(n => n.note_id === req.params.noteId)
  if (idx === -1) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Note not found' } })
  notes.splice(idx, 1)
  res.status(204).send()
})
