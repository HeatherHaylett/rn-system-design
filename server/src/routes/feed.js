/**
 * Feed routes — intentionally messy response shape.
 *
 * Notice: snake_case keys, prices in cents, null fields, extra fields
 * your client doesn't need. This is what real APIs look like.
 * Your data modeling and mapper code has to handle it.
 */

import { Router } from 'express'

export const feedRouter = Router()

const POSTS = Array.from({ length: 200 }, (_, i) => ({
  post_id: `post-${String(i).padStart(4, '0')}`,
  post_content: [
    'Just shipped a new feature 🚀',
    'Great standup today, team is crushing it',
    'Anyone else finding SwiftUI easier than expected?',
    'Hot take: TypeScript generics are actually readable once you get used to them',
    'Reminder: code review is a gift, not a criticism',
  ][i % 5],
  author_info: {
    user_id: `user-${(i % 10).toString().padStart(3, '0')}`,
    display_name: `User ${(i % 10) + 1}`,
    avatar_url: `https://i.pravatar.cc/150?u=${i % 10}`,
    is_verified: i % 7 === 0,
  },
  engagement: {
    like_count: Math.floor(Math.random() * 500),
    comment_count: Math.floor(Math.random() * 50),
    share_count: Math.floor(Math.random() * 20),
  },
  // Sometimes null — your mapper must handle this
  media_url: i % 4 === 0 ? `https://picsum.photos/seed/${i}/800/400` : null,
  created_at_unix: Math.floor(Date.now() / 1000) - i * 300,
  // Extra fields your UI doesn't need — don't let them leak into your domain model
  internal_score: Math.random(),
  ab_variant: i % 2 === 0 ? 'A' : 'B',
  moderation_status: 'approved',
}))

feedRouter.get('/', (req, res) => {
  const cursor = req.query.cursor ? parseInt(req.query.cursor) : 0
  const limit = Math.min(parseInt(req.query.limit ?? '20'), 50)

  const page = POSTS.slice(cursor, cursor + limit)
  const nextCursor = cursor + limit < POSTS.length ? cursor + limit : null

  res.json({
    data: page,
    pagination: {
      next_cursor: nextCursor !== null ? String(nextCursor) : null,
      has_more: nextCursor !== null,
    },
  })
})

feedRouter.post('/:postId/like', (req, res) => {
  const post = POSTS.find(p => p.post_id === req.params.postId)
  if (!post) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Post not found' } })

  post.engagement.like_count++
  res.json({ data: { like_count: post.engagement.like_count } })
})
