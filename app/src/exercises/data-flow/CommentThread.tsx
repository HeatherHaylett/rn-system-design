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

import React, { useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Comment } from './types'

const INITIAL_COMMENTS: Comment[] = [
  { id: 'c-1', author: { firstName: 'Alice', lastName: 'Chen' }, content: 'Great post!', likeCount: 4, createdAt: new Date().toISOString() },
  { id: 'c-2', author: { firstName: 'Bob', lastName: 'Smith' }, content: 'I disagree with point 3.', likeCount: 1, createdAt: new Date().toISOString() },
  { id: 'c-3', author: { firstName: 'Carol', lastName: 'Jones' }, content: 'Can you elaborate on the second section?', likeCount: 7, createdAt: new Date().toISOString() },
]

// ─── CommentCard ─────────────────────────────────────────────────────────────

type CommentCardProps = { comment: Comment }

function CommentCard({ comment }: CommentCardProps) {
  // VIOLATION 3: Derived state stored in useState.
  // displayName is always firstName + ' ' + lastName. There is no scenario
  // where it could be different from that. Storing it in state creates a
  // second source of truth (what if comment.author changes? this won't update).
  // Fix: compute it inline as a const.
  const [displayName] = useState(
    `${comment.author.firstName} ${comment.author.lastName}`
  )

  function handleLike() {
    // VIOLATION 1: Child mutating parent's data directly.
    // comment is a prop — it belongs to the parent. Mutating it here bypasses
    // React's update cycle: the change won't trigger a re-render and the
    // parent's state is silently corrupted.
    // Fix: receive an onLike callback as a prop and call that instead.
    comment.likeCount++
  }

  return (
    <View style={styles.commentCard}>
      <Text style={styles.commentAuthor}>{displayName}</Text>
      <Text style={styles.commentContent}>{comment.content}</Text>
      <Pressable onPress={handleLike}>
        <Text style={styles.likeButton}>♥ {comment.likeCount}</Text>
      </Pressable>
    </View>
  )
}

// ─── CommentList ─────────────────────────────────────────────────────────────

type CommentListHandle = { addComment: (comment: Comment) => void }
type CommentListProps = { comments: Comment[] }

// VIOLATION 2 (part A): CommentList exposes an imperative handle via forwardRef
// so that its sibling ReplyBox can call addComment() on it directly.
// Siblings should never communicate this way — it's imperative, not reactive,
// and it bypasses the parent entirely.
// Fix: remove forwardRef, lift comments state to the parent, receive comments
// as a prop and an onAdd callback.
const CommentList = React.forwardRef<CommentListHandle, CommentListProps>(
  ({ comments: initialComments }, ref) => {
    // VIOLATION 4: Local copy of a prop.
    // This useState is seeded from the prop, but if the parent updates the
    // comments prop, this local copy won't reflect it — they diverge.
    // Fix: render directly from the prop.
    const [comments, setComments] = useState<Comment[]>(initialComments)

    // Imperative method exposed to sibling — part of Violation 2
    React.useImperativeHandle(ref, () => ({
      addComment: (comment: Comment) => {
        setComments(current => [...current, comment])
      },
    }))

    return (
      <View>
        {comments.map(comment => (
          <CommentCard key={comment.id} comment={comment} />
        ))}
      </View>
    )
  }
)

// ─── ReplyBox ────────────────────────────────────────────────────────────────

type ReplyBoxProps = { commentListRef: React.RefObject<CommentListHandle | null> }

function ReplyBox({ commentListRef }: ReplyBoxProps) {
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

    // VIOLATION 2 (part B): Sibling directly calling a method on CommentList.
    // ReplyBox and CommentList are siblings — neither should know the other exists.
    // Fix: receive an onSubmit callback from the parent, call that instead.
    commentListRef.current?.addComment(newComment)
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
  // The ref wiring that exists solely because of Violation 2
  const commentListRef = useRef<CommentListHandle>(null)

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Comments</Text>
      <ScrollView style={styles.flex}>
        <CommentList ref={commentListRef} comments={INITIAL_COMMENTS} />
      </ScrollView>
      <ReplyBox commentListRef={commentListRef} />
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
