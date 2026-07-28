/**
 * Exercise: Offline-First Notes
 *
 * This is the UI shell. The API and types are already wired up.
 * Your job is to implement the offline-first logic described in README.md.
 *
 * What's here:
 * - Full UI: note list, create/edit/delete, sync status badges
 * - Debug panel: toggle offline mode, set failure rate, trigger conflict
 * - All TODO markers for the logic you need to build
 *
 * What's NOT here (you build it):
 * - Local storage layer
 * - Sync queue
 * - Connectivity detection
 * - Conflict resolution
 */

import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Switch,
  Alert,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Note, SyncStatus } from './types'
import {
  fetchNotes,
  createNote,
  updateNote,
  deleteNote,
  isOffline,
  setOffline,
  setFailureRate,
} from './mockApi'

// ---------------------------------------------------------------------------
// TODO 1: Replace this in-memory store with a real local storage layer.
// The local store should persist across JS reloads (simulate app restart
// by shaking your device or reloading the bundle).
//
// Using AsyncStorage here because it works in Expo Go without a native build.
// In production you'd swap this for MMKV — same API shape, ~10x faster reads.
// ---------------------------------------------------------------------------
let localStore: Note[] = []

export const saveNotes = async (notes: Note[]) =>
  AsyncStorage.setItem('notes', JSON.stringify(notes))

export const loadNotesFromStorage = async (): Promise<Note[]> => {
  const raw = await AsyncStorage.getItem('notes')
  return raw ? JSON.parse(raw) : []
}

// ---------------------------------------------------------------------------
// TODO 2: Implement a sync queue.
// The queue should:
//   - Persist to local storage (not just memory)
//   - Flush when connectivity is restored
//   - Process mutations in FIFO order
//   - Retry failed mutations up to 3 times, then mark as permanently failed
// ---------------------------------------------------------------------------

export default function NotesScreen() {
  const [notes, setNotes] = useState<Note[]>([])
  const [offlineMode, setOfflineMode] = useState(false)
  const [failRate, setFailRate] = useState(0.2)
  const [showDebug, setShowDebug] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [editorTitle, setEditorTitle] = useState('')
  const [editorContent, setEditorContent] = useState('')

  // ---------------------------------------------------------------------------
  // TODO 3: On mount, load notes from local storage immediately (no spinner).
  // Then kick off a background sync — merge server results with local state.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    loadNotes()
  }, [])

  async function loadNotes() {
    // TODO: Load from local storage first, then fetch from server
    // For now, just fetch from server
    try {
      const serverNotes = await fetchNotes()
      setNotes(serverNotes)
      localStore = serverNotes
    } catch {
      // TODO: If offline, show local notes instead of an error
      console.log('[notes] fetch failed — showing local state')
    }
  }

  // ---------------------------------------------------------------------------
  // TODO 4: Implement local-first create.
  // - Generate a local ID and write to local storage immediately
  // - Update UI immediately (optimistic)
  // - Enqueue a CREATE mutation — it will sync when connectivity is available
  // ---------------------------------------------------------------------------
  function handleCreate() {
    setEditingNote(null)
    setEditorTitle('')
    setEditorContent('')
    setShowEditor(true)
  }

  function handleEdit(note: Note) {
    setEditingNote(note)
    setEditorTitle(note.title)
    setEditorContent(note.content)
    setShowEditor(true)
  }

  async function handleSave() {
    setShowEditor(false)

    if (editingNote) {
      // TODO 5: Local-first update
      // - Update the note in local storage immediately
      // - Update UI immediately with syncStatus: 'pending'
      // - Enqueue an UPDATE mutation
      const updated: Note = {
        ...editingNote,
        title: editorTitle,
        content: editorContent,
        updatedAt: new Date().toISOString(),
        version: editingNote.version + 1,
        syncStatus: 'pending',
      }
      setNotes(prev => prev.map(n => n.id === updated.id ? updated : n))
    } else {
      // TODO 6: Local-first create
      // - Create a note with a generated ID and write to local storage
      // - Update UI immediately with syncStatus: 'pending'
      // - Enqueue a CREATE mutation
      const newNote: Note = {
        id: `note-${Date.now()}`,
        title: editorTitle,
        content: editorContent,
        updatedAt: new Date().toISOString(),
        version: 1,
        syncStatus: 'pending',
        retryCount: 0,
      }
      setNotes(prev => [newNote, ...prev])
    }
  }

  // ---------------------------------------------------------------------------
  // TODO 7: Implement local-first delete.
  // - Remove from local storage and UI immediately
  // - Enqueue a DELETE mutation
  // ---------------------------------------------------------------------------
  function handleDelete(note: Note) {
    Alert.alert('Delete note?', note.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          // TODO: Remove from local storage, enqueue DELETE mutation
          setNotes(prev => prev.filter(n => n.id !== note.id))
        },
      },
    ])
  }

  // ---------------------------------------------------------------------------
  // TODO 8: Listen to NetInfo for connectivity changes.
  // When the device goes online, flush the sync queue.
  // ---------------------------------------------------------------------------
  function handleToggleOffline(value: boolean) {
    setOfflineMode(value)
    setOffline(value)
    if (!value) {
      // TODO: Trigger sync queue flush here
      console.log('[notes] back online — flush sync queue')
    }
  }

  // ---------------------------------------------------------------------------
  // TODO 9: Conflict resolution.
  // When a conflict is detected, show both versions and let the user choose.
  // ---------------------------------------------------------------------------
  function handleResolveConflict(note: Note, keepLocal: boolean) {
    // TODO: Implement conflict resolution
    // keepLocal=true → re-submit with the local version
    // keepLocal=false → replace local state with server version
    console.log('[notes] resolving conflict for', note.id, { keepLocal })
  }

  const syncBadgeStyle = (status: SyncStatus) => {
    switch (status) {
      case 'synced': return styles.badgeSynced
      case 'pending': return styles.badgePending
      case 'syncing': return styles.badgeSyncing
      case 'failed': return styles.badgeFailed
      case 'conflict': return styles.badgeConflict
    }
  }

  const syncBadgeLabel = (status: SyncStatus) => {
    switch (status) {
      case 'synced': return 'Synced'
      case 'pending': return 'Pending sync'
      case 'syncing': return 'Syncing...'
      case 'failed': return 'Sync failed'
      case 'conflict': return 'Conflict'
    }
  }

  const renderNote = useCallback(({ item }: { item: Note }) => (
    <View style={styles.noteCard}>
      <TouchableOpacity style={styles.noteBody} onPress={() => handleEdit(item)}>
        <Text style={styles.noteTitle}>{item.title}</Text>
        <Text style={styles.noteContent} numberOfLines={2}>{item.content}</Text>
        <Text style={styles.noteDate}>
          {new Date(item.updatedAt).toLocaleTimeString()}
        </Text>
      </TouchableOpacity>

      <View style={styles.noteFooter}>
        <View style={[styles.badge, syncBadgeStyle(item.syncStatus)]}>
          <Text style={styles.badgeText}>{syncBadgeLabel(item.syncStatus)}</Text>
        </View>
        {item.syncStatus === 'conflict' && (
          <View style={styles.conflictActions}>
            <TouchableOpacity onPress={() => handleResolveConflict(item, true)}>
              <Text style={styles.conflictBtn}>Keep mine</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleResolveConflict(item, false)}>
              <Text style={styles.conflictBtn}>Use server</Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [])

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notes</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setShowDebug(!showDebug)} style={styles.debugToggle}>
            <Text style={styles.debugToggleText}>Debug</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCreate} style={styles.createBtn}>
            <Text style={styles.createBtnText}>+ New</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Offline banner */}
      {offlineMode && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>Offline — changes will sync when you reconnect</Text>
        </View>
      )}

      {/* Debug panel */}
      {showDebug && (
        <View style={styles.debugPanel}>
          <Text style={styles.debugTitle}>Debug Controls</Text>
          <View style={styles.debugRow}>
            <Text style={styles.debugLabel}>Offline mode</Text>
            <Switch value={offlineMode} onValueChange={handleToggleOffline} />
          </View>
          <View style={styles.debugRow}>
            <Text style={styles.debugLabel}>Failure rate: {Math.round(failRate * 100)}%</Text>
            <View style={styles.debugBtns}>
              <TouchableOpacity
                style={styles.debugBtn}
                onPress={() => { const v = Math.max(0, failRate - 0.2); setFailRate(v); setFailureRate(v) }}
              >
                <Text style={styles.debugBtnText}>−</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.debugBtn}
                onPress={() => { const v = Math.min(1, failRate + 0.2); setFailRate(v); setFailureRate(v) }}
              >
                <Text style={styles.debugBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            style={styles.debugActionBtn}
            onPress={() => {
              // Simulate a conflict by bumping the server version on the first note
              // TODO: wire this up when you implement the sync queue
              console.log('[debug] simulating server-side edit for conflict test')
              Alert.alert('Conflict simulation', 'Edit a note to trigger a conflict on next sync.')
            }}
          >
            <Text style={styles.debugActionBtnText}>Simulate server edit (conflict)</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Note list */}
      <FlatList
        data={notes}
        keyExtractor={item => item.id}
        renderItem={renderNote}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No notes yet. Tap "+ New" to create one.</Text>
        }
      />

      {/* Editor modal */}
      <Modal visible={showEditor} animationType="slide">
        <View style={styles.editor}>
          <View style={styles.editorHeader}>
            <TouchableOpacity onPress={() => setShowEditor(false)}>
              <Text style={styles.editorCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.editorTitle}>{editingNote ? 'Edit Note' : 'New Note'}</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.editorSave}>Save</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.editorTitleInput}
            placeholder="Title"
            value={editorTitle}
            onChangeText={setEditorTitle}
            autoFocus
          />
          <TextInput
            style={styles.editorContentInput}
            placeholder="Write something..."
            value={editorContent}
            onChangeText={setEditorContent}
            multiline
            textAlignVertical="top"
          />
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  headerRight: { flexDirection: 'row', gap: 12 },
  debugToggle: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: '#e5e5e5' },
  debugToggleText: { fontSize: 13, color: '#555' },
  createBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#007AFF' },
  createBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  offlineBanner: { backgroundColor: '#FF9500', padding: 8, alignItems: 'center' },
  offlineBannerText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  debugPanel: {
    backgroundColor: '#1c1c1e',
    padding: 16,
    gap: 12,
  },
  debugTitle: { color: '#fff', fontSize: 13, fontWeight: '600', marginBottom: 4 },
  debugRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  debugLabel: { color: '#aaa', fontSize: 13 },
  debugBtns: { flexDirection: 'row', gap: 8 },
  debugBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#3a3a3c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  debugBtnText: { color: '#fff', fontSize: 18 },
  debugActionBtn: {
    backgroundColor: '#FF3B30',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  debugActionBtnText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  list: { padding: 16, gap: 12 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 60, fontSize: 15 },
  noteCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  noteBody: { marginBottom: 10 },
  noteTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  noteContent: { fontSize: 14, color: '#555', lineHeight: 20 },
  noteDate: { fontSize: 11, color: '#999', marginTop: 6 },
  noteFooter: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '500', color: '#fff' },
  badgeSynced: { backgroundColor: '#34C759' },
  badgePending: { backgroundColor: '#FF9500' },
  badgeSyncing: { backgroundColor: '#007AFF' },
  badgeFailed: { backgroundColor: '#FF3B30' },
  badgeConflict: { backgroundColor: '#AF52DE' },
  conflictActions: { flexDirection: 'row', gap: 8 },
  conflictBtn: { fontSize: 12, color: '#AF52DE', fontWeight: '600' },
  deleteBtn: { marginLeft: 'auto' },
  deleteBtnText: { fontSize: 12, color: '#FF3B30' },
  editor: { flex: 1, backgroundColor: '#fff' },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  editorCancel: { fontSize: 16, color: '#007AFF' },
  editorTitle: { fontSize: 16, fontWeight: '600' },
  editorSave: { fontSize: 16, color: '#007AFF', fontWeight: '600' },
  editorTitleInput: {
    fontSize: 20,
    fontWeight: '600',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  editorContentInput: {
    flex: 1,
    fontSize: 16,
    padding: 16,
    lineHeight: 24,
  },
})
