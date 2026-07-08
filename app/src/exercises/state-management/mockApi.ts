import { Notification, Post, User } from './types'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function fetchFeed(): Promise<Post[]> {
  await delay(800)
  return Array.from({ length: 20 }, (_, i) => ({
    id: `post-${i}`,
    content: `Post number ${i + 1} — something interesting happened today.`,
    author: { id: 'u-001', name: 'Heather' },
    likeCount: Math.floor(Math.random() * 100),
    createdAt: new Date(Date.now() - i * 60_000).toISOString(),
  }))
}

export async function fetchCurrentUser(): Promise<User> {
  await delay(400)
  return {
    id: 'u-001',
    name: 'Heather',
    avatar: 'https://i.pravatar.cc/150?u=heather',
    bio: 'Mobile engineer. Building things.',
  }
}

export async function fetchNotifications(): Promise<Notification[]> {
  await delay(300)
  return [
    { id: 'n-1', message: 'Heather liked your post', read: false, createdAt: new Date().toISOString() },
    { id: 'n-2', message: 'New follower: Alex', read: false, createdAt: new Date().toISOString() },
    { id: 'n-3', message: 'Your post got 10 likes', read: true, createdAt: new Date().toISOString() },
  ]
}

export async function createPost(content: string): Promise<Post> {
  await delay(600)
  return {
    id: `post-${Date.now()}`,
    content,
    author: { id: 'u-001', name: 'Heather' },
    likeCount: 0,
    createdAt: new Date().toISOString(),
  }
}
