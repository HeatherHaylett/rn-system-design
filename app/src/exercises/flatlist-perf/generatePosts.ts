export type Post = {
  id: string
  author: string
  content: string
  likeCount: number
  createdAt: string
}

export function generatePosts(count: number): Post[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `post-${i}`,
    author: `User ${(i % 20) + 1}`,
    content: `Post ${i + 1}: ${['Just had the best coffee.', 'Working on something exciting.', 'Great weather today!', 'Finished reading a great book.', 'Long day but productive.'][i % 5]}`,
    likeCount: Math.floor(Math.random() * 200),
    createdAt: new Date(Date.now() - i * 120_000).toISOString(),
  }))
}

export const ITEM_HEIGHT = 120
