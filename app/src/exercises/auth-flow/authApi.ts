import { AuthTokens, User } from './types'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Tracks whether the current access token is "expired" for simulation purposes
let tokenExpired = false
let refreshCount = 0

export function simulateTokenExpiry() {
  tokenExpired = true
}

export function getRefreshCount() {
  return refreshCount
}

export async function login(
  email: string,
  password: string,
): Promise<{ tokens: AuthTokens; user: User }> {
  await delay(800)
  if (email !== 'test@test.com' || password !== 'password') {
    throw new Error('Invalid credentials')
  }
  tokenExpired = false
  return {
    tokens: {
      accessToken: 'access-token-abc123',
      refreshToken: 'refresh-token-xyz789',
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
    },
    user: { id: 'u-001', name: 'Heather', email },
  }
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<AuthTokens> {
  await delay(400)
  refreshCount++
  if (refreshToken !== 'refresh-token-xyz789') {
    throw new Error('Invalid refresh token')
  }
  tokenExpired = false
  return {
    accessToken: `access-token-refreshed-${refreshCount}`,
    refreshToken: 'refresh-token-xyz789',
    expiresAt: Date.now() + 15 * 60 * 1000,
  }
}

export async function logout(refreshToken: string): Promise<void> {
  await delay(300)
  // Server invalidates the refresh token
}

// A protected endpoint that returns 401 when the token is expired
export async function fetchProtectedData(
  accessToken: string,
): Promise<{ data: string }> {
  await delay(500)
  if (tokenExpired || !accessToken.startsWith('access-token')) {
    const error = new Error('Unauthorized') as Error & { status: number }
    error.status = 401
    throw error
  }
  return { data: `Secret data fetched at ${new Date().toLocaleTimeString()}` }
}
