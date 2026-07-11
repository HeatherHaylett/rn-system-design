/**
 * STARTING POINT — this app works but state is in all the wrong places.
 *
 * Read through the file and find the four problems described in README.md.
 * Each one is marked with a comment that starts with PROBLEM N:
 *
 * Your refactored version goes in AppFixed.tsx (create it yourself).
 * Run both side by side to confirm the behaviour is identical.
 *
 * Dependencies you'll need:
 *   npx expo install @tanstack/react-query zustand
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import * as mockApi from './mockApi'
import { Notification, Post, User } from './types'
import { useQuery, useQueryClient, QueryClientProvider, QueryClient } from '@tanstack/react-query'

// ─── PROBLEM 3: Over-globalized UI state ─────────────────────────────────────
// This modal state is only ever used by FeedScreen. Nothing else in the app
// cares whether the new-post modal is open. It doesn't belong in a global store.
// (Simulating a Zustand store inline here for simplicity)
let _isNewPostModalOpen = false
const _listeners = new Set<() => void>()

const globalModalStore = {
  get: () => _isNewPostModalOpen,
  set: (value: boolean) => {
    _isNewPostModalOpen = value
    _listeners.forEach(l => l())
  },
  subscribe: (listener: () => void) => {
    _listeners.add(listener)
    return () => _listeners.delete(listener)
  },
}

function useGlobalModal() {
  const [, rerender] = useState(0)
  useEffect(() => globalModalStore.subscribe(() => rerender(n => n + 1)), [])
  return [globalModalStore.get(), globalModalStore.set] as const
}

// ─── PROBLEM 2: Notification count in the wrong place ────────────────────────
// The count is fetched inside FeedScreen but TabBar needs it too.
// Currently it's threaded up through a ref callback — ugly and fragile.
// It should live somewhere both components can access naturally.

// ─── Tab Bar ─────────────────────────────────────────────────────────────────
function TabBar({
  activeTab,
  onTabChange,
  notificationCount, // ← being drilled from FeedScreen up to App then back down
}: {
  activeTab: string
  onTabChange: (tab: string) => void
  notificationCount: number
}) {
  return (
    <View style={styles.tabBar}>
      {['Feed', 'Profile'].map(tab => (
        <Pressable key={tab} style={styles.tab} onPress={() => onTabChange(tab)}>
          <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
            {tab}
            {tab === 'Feed' && notificationCount > 0 && (
              <Text style={styles.badge}> ({notificationCount})</Text>
            )}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}

const PostItem = React.memo(function PostItem({ post, onLike }: { post: Post, onLike: (postId: string) => void }) {
  console.log('PostItem render:', post.id)
  return (
    <View style={styles.postCard}>
      <Text style={styles.postAuthor}>{post.author.name}</Text>
      <Text>{post.content}</Text>
      <Pressable onPress={() => onLike(post.id)}>
        <Text style={styles.postMeta}>{post.likeCount} likes</Text>
      </Pressable>
    </View>
  )
})

// ─── Feed Screen ─────────────────────────────────────────────────────────────
function FeedScreen({ onNotificationCountChange }: { onNotificationCountChange: (n: number) => void }) {
  // PROBLEM 1: Manual server state management
  // This is the pattern React Query is designed to replace.
  // Three useState calls just to fetch one resource.
  const queryClient = useQueryClient()
  const { isPending, isError, data, error } = useQuery({
    queryKey: ['posts'],
    queryFn: mockApi.fetchFeed,
  })

  // PROBLEM 2: Notification count fetched here, needed in TabBar
  // This forces a prop callback workaround to get the count up to the parent.
  const [notifications, setNotifications] = useState<Notification[]>([])
  useEffect(() => {
    mockApi.fetchNotifications().then(n => {
      setNotifications(n)
      onNotificationCountChange(n.filter(n => !n.read).length)
    })
  }, [onNotificationCountChange])

  // PROBLEM 4: Derived state stored in useState
  // filteredPosts can always be computed from posts + query.
  // Storing it separately creates two sources of truth.
  const [query, setQuery] = useState('')
  const filteredPosts = data?.filter(p => p.content.toLowerCase().includes(query.toLowerCase()));

  // PROBLEM 3: Reading from the global modal store
  const [isModalOpen, setIsModalOpen] = useGlobalModal()
  const [newPostContent, setNewPostContent] = useState('')

  async function handleCreatePost() {
    if (!newPostContent.trim()) return
    const newPost = await mockApi.createPost(newPostContent)
    queryClient.setQueryData<Post[]>(['posts'], current => [newPost, ...(current ?? [])])
    setNewPostContent('')
    setIsModalOpen(false)
  }

  // Updates the whole `posts` array for a single like
  const handleLikePost = useCallback(async (postId: string) => {
    await mockApi.likePost(postId)
    queryClient.setQueryData<Post[]>(['posts'], current => current?.map(p => (p.id === postId ? { ...p, likeCount: p.likeCount + 1 } : p)))
  }, [])

  const renderPostItem = useCallback(
    ({ item }: { item: Post }) => <PostItem post={item} onLike={handleLikePost} />,
    [handleLikePost]
  )

  if (isPending) return <ActivityIndicator style={styles.center} />
  if (isError) return <Text style={styles.error}>Error: {error}</Text>

  return (
    <View style={styles.flex}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search posts..."
        value={query}
        onChangeText={setQuery}
      />
      <FlatList
        data={filteredPosts}
        renderItem={renderPostItem}
        keyExtractor={(post: Post) => post.id}
      />
      <Pressable style={styles.fab} onPress={() => setIsModalOpen(true)}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
      <Modal visible={isModalOpen} animationType="slide">
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>New Post</Text>
          <TextInput
            style={styles.modalInput}
            multiline
            placeholder="What's on your mind?"
            value={newPostContent}
            onChangeText={setNewPostContent}
          />
          <Pressable style={styles.submitButton} onPress={handleCreatePost}>
            <Text style={styles.submitButtonText}>Post</Text>
          </Pressable>
          <Pressable onPress={() => setIsModalOpen(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  )
}

// ─── Profile Screen ───────────────────────────────────────────────────────────
function ProfileScreen() {
  // PROBLEM 1 (again): Same manual fetch pattern as FeedScreen.
  // The current user data could be shared — if FeedScreen also shows the
  // user's avatar, both screens would independently re-fetch the same data.
  const { isPending: loading, data: user } = useQuery({
    queryKey: ['user'],
    queryFn: mockApi.fetchCurrentUser,
  })

  if (loading) return <ActivityIndicator style={styles.center} />
  if (!user) return null

  return (
    <View style={styles.profileContainer}>
      <Text style={styles.profileName}>{user.name}</Text>
      <Text style={styles.profileBio}>{user.bio}</Text>
    </View>
  )
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function AppBroken() {
  const [activeTab, setActiveTab] = useState('Feed')
  // PROBLEM 2: Notification count stored here just to pass to TabBar
  // because it's fetched inside FeedScreen. Awkward.
  const [notificationCount, setNotificationCount] = useState(0)
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <View style={styles.flex}>
        <TabBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          notificationCount={notificationCount}
        />
        {activeTab === 'Feed' ? (
          <FeedScreen onNotificationCountChange={setNotificationCount} />
        ) : (
          <ProfileScreen />
        )}
      </View>
    </QueryClientProvider>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { color: '#dc2626', padding: 16 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingTop: 48 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabText: { fontSize: 15, color: '#6b7280' },
  tabTextActive: { color: '#2563eb', fontWeight: '700' },
  badge: { color: '#dc2626' },
  searchInput: { margin: 12, padding: 10, backgroundColor: '#f3f4f6', borderRadius: 8 },
  postCard: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 4 },
  postAuthor: { fontWeight: '600' },
  postMeta: { color: '#6b7280', fontSize: 13 },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center',
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
  modalContent: { flex: 1, padding: 24, gap: 16, paddingTop: 60 },
  modalTitle: { fontSize: 22, fontWeight: '700' },
  modalInput: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, minHeight: 100 },
  submitButton: { backgroundColor: '#2563eb', padding: 14, borderRadius: 10, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontWeight: '600' },
  cancelText: { textAlign: 'center', color: '#6b7280', marginTop: 8 },
  profileContainer: { padding: 24, gap: 8 },
  profileName: { fontSize: 24, fontWeight: '700' },
  profileBio: { color: '#6b7280', fontSize: 16 },
})
