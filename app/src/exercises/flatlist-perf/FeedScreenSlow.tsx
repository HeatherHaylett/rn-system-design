/**
 * STARTING POINT — 5 performance problems, each marked with a comment.
 *
 * Read each PROBLEM comment, understand WHY it causes unnecessary work,
 * then apply the fix in FeedScreenFast.tsx (create it yourself).
 *
 * Use React DevTools Profiler to compare before and after:
 * a like action should cause exactly ONE PostCard to re-render, not all of them.
 */

import React, { useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { ITEM_HEIGHT, Post, generatePosts } from './generatePosts'

const POSTS = generatePosts(500)

// PROBLEM 2: Not wrapped in React.memo.
// Even with stable props, this component re-renders whenever the parent does,
// because React has no signal that the props are unchanged.
function PostCard({
  post,
  onLike,
}: {
  post: Post
  onLike: (id: string) => void
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.author}>{post.author}</Text>
      <Text style={styles.content}>{post.content}</Text>
      <Pressable onPress={() => onLike(post.id)}>
        <Text style={styles.likeButton}>♥ {post.likeCount}</Text>
      </Pressable>
    </View>
  )
}

export default function FeedScreenSlow() {
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({})

  // PROBLEM 5: onLike is recreated on every render.
  // Every render of FeedScreenSlow creates a new function reference for onLike.
  // React.memo on PostCard compares props by reference — a new function reference
  // means "props changed", so every visible PostCard re-renders on every like.
  function onLike(id: string) {
    setLikeCounts(prev => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }))
  }

  return (
    <FlatList
      data={POSTS}
      // PROBLEM 3: No keyExtractor — falls back to index-based keys.
      // If posts are prepended or reordered, React misidentifies which item is which.

      // PROBLEM 4: No getItemLayout.
      // All items are ITEM_HEIGHT tall. Without this, FlatList measures each
      // item as it scrolls into view, causing layout jank on fast scrolls.

      // PROBLEM 1: renderItem defined inline — new reference on every render.
      // FlatList sees a new renderItem prop and re-renders all visible items
      // even when the data hasn't changed.
      renderItem={({ item }) => {
        const post = {
          ...item,
          likeCount: item.likeCount + (likeCounts[item.id] ?? 0),
        }
        return <PostCard post={post} onLike={onLike} />
      }}
    />
  )
}

const styles = StyleSheet.create({
  card: {
    height: ITEM_HEIGHT,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    justifyContent: 'space-between',
  },
  author: { fontWeight: '600', fontSize: 14 },
  content: { fontSize: 15, color: '#374151', flex: 1, marginVertical: 4 },
  likeButton: { color: '#6b7280', fontSize: 13 },
})
