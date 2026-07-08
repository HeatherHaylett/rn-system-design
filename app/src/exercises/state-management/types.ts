export type Post = {
  id: string
  content: string
  author: { id: string; name: string }
  likeCount: number
  createdAt: string
}

export type User = {
  id: string
  name: string
  avatar: string
  bio: string
}

export type Notification = {
  id: string
  message: string
  read: boolean
  createdAt: string
}
