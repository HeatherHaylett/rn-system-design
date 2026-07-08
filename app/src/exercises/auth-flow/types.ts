export type AuthTokens = {
  accessToken: string
  refreshToken: string
  expiresAt: number  // unix timestamp in ms
}

export type User = {
  id: string
  name: string
  email: string
}
