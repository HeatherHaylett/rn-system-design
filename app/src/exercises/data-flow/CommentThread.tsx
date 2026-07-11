/**
 * STARTING POINT — data flow violations are marked inline.
 *
 * Read each VIOLATION comment, understand WHY it's wrong, then fix it.
 * The acceptance criteria in README.md tells you what correct looks like.
 *
 * Tip: before touching code, draw the component tree on paper and
 * mark which direction each piece of data is currently flowing.
 * Then redraw what it should look like.
 */

import React, { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Comment } from './types'

const INITIAL_COMMENTS: Comment[] = [
  { id: 'c-1', author: { firstName: 'Alice', lastName: 'Chen' }, content: 'Great post!', likeCount: 4, createdAt: new Date().toISOString() },
  { id: 'c-2', author: { firstName: 'Bob', lastName: 'Smith' }, content: 'I disagree with point 3.', likeCount: 1, createdAt: new Date().toISOString() },
  { id: 'c-3', author: { firstName: 'Carol', lastName: 'Jones' }, content: 'Can you elaborate on the second section?', likeCount: 7, createdAt: new Date().toISOString() },
]

// ─── CommentCard ─────────────────────────────────────────────────────────────
const CommentCard = ({ comment, onLike }: { comment: Comment, onLike: (id: string) => void }) => {
  const displayName = `${comment.author.firstName} ${comment.author.lastName}`

  return (
    <View style={styles.commentCard}>
      <Text style={styles.commentAuthor}>{displayName}</Text>
      <Text style={styles.commentContent}>{comment.content}</Text>
      <Pressable onPress={() => onLike(comment.id)}>
        <Text style={styles.likeButton}>♥ {comment.likeCount}</Text>
      </Pressable>
    </View>
  )
}

// ─── CommentList ─────────────────────────────────────────────────────────────
const CommentList = ({ comments, onLike }: { comments: Comment[], onLike: (id: string) => void }) => {
  return (
    <View>
      {comments.map(comment => (
        <CommentCard key={comment.id} comment={comment} onLike={onLike} />
      ))}
    </View>
  )
}

// ─── ReplyBox ────────────────────────────────────────────────────────────────
function ReplyBox({ addComment }: { addComment: (comment: Comment) => void }) {
  const [text, setText] = useState('')

  function handleSubmit() {
    if (!text.trim()) return

    const newComment: Comment = {
      id: `c-${Date.now()}`,
      author: { firstName: 'You', lastName: '' },
      content: text,
      likeCount: 0,
      createdAt: new Date().toISOString(),
    }
    addComment(newComment)
    setText('')
  }

  return (
    <View style={styles.replyBox}>
      <TextInput
        style={styles.replyInput}
        placeholder="Write a comment..."
        value={text}
        onChangeText={setText}
        multiline
      />
      <Pressable style={styles.replyButton} onPress={handleSubmit}>
        <Text style={styles.replyButtonText}>Post</Text>
      </Pressable>
    </View>
  )
}

// ─── CommentThread (root) ─────────────────────────────────────────────────────

export default function CommentThread() {
  const [comments, setComments] = useState<Comment[]>(INITIAL_COMMENTS)

  function addComment(comment: Comment) {
    setComments(current => [...current, comment])
  }

  function addLike(id: string) {
    const updatedComments = comments.map((c) => {
      if (c.id === id) {
        return {...c, likeCount: c.likeCount + 1}
      } else {
        return c
      }
    })
    setComments(updatedComments)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Comments</Text>
      <ScrollView style={styles.flex}>
        <CommentList comments={comments} onLike={addLike} />
      </ScrollView>
      <ReplyBox addComment={addComment} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  flex: { flex: 1 },
  heading: { fontSize: 20, fontWeight: '700', padding: 16 },
  commentCard: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 4 },
  commentAuthor: { fontWeight: '600', fontSize: 14 },
  commentContent: { fontSize: 15 },
  likeButton: { color: '#6b7280', fontSize: 13, marginTop: 4 },
  replyBox: { padding: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb', gap: 8 },
  replyInput: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8,
    padding: 10, minHeight: 60,
  },
  replyButton: {
    backgroundColor: '#2563eb', padding: 12,
    borderRadius: 8, alignItems: 'center',
  },
  replyButtonText: { color: '#fff', fontWeight: '600' },
})
