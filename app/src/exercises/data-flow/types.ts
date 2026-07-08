export type Comment = {
  id: string
  author: { firstName: string; lastName: string }
  content: string
  likeCount: number
  createdAt: string
}
