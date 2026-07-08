import { User } from './types'

// 1-second delay — long enough to feel the difference between cached and uncached
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

let fetchCount = 0

export async function fetchUser(userId: string): Promise<User> {
  await delay(1000)
  fetchCount++
  console.log(`[mockApi] fetchUser called ${fetchCount} time(s) for ${userId}`)
  return {
    id: userId,
    name: 'Heather Haylett',
    bio: 'Mobile engineer. Building things.',
    followerCount: 1240,
    followingCount: 180,
    postCount: 47,
  }
}

export function getFetchCount() {
  return fetchCount
}
