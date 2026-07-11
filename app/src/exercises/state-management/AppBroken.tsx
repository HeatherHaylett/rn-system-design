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

import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import * as mockApi from './mockApi'
import { Notification, Post, User } from './types'
import { useQuery, useQueryClient, QueryClientProvider, QueryClient } from '@tanstack/react-query'

// ─── Tab Bar ─────────────────────────────────────────────────────────────────
function TabBar({
  activeTab,
  onTabChange,
  notificationCount,
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
function FeedScreen() {
  const queryClient = useQueryClient()
  const { isPending, isError, data, error } = useQuery({
    queryKey: ['posts'],
    queryFn: mockApi.fetchFeed,
  })

  const [query, setQuery] = useState('')
  const filteredPosts = data?.filter(p => p.content.toLowerCase().includes(query.toLowerCase()));

  const [isModalOpen, setIsModalOpen] = useState(false)
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
  if (isError) return <Text style={styles.error}>Error: {error.message}</Text>

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
  const [notificationCount, setNotificationCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [queryClient] = useState(() => new QueryClient())

  useEffect(() => {
    mockApi.fetchNotifications().then(n => {
      setNotifications(n);
      setNotificationCount(n.filter(n => !n.read).length);
    })
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <View style={styles.flex}>
        <TabBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          notificationCount={notificationCount}
        />
        {activeTab === 'Feed' ? (
          <FeedScreen />
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
