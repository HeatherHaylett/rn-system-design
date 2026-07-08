import { Router } from 'express'
import { ACTIVE_TOKENS } from '../middleware/auth.js'

export const authRouter = Router()

const USERS = {
  'user-001': { id: 'user-001', name: 'Heather', email: 'test@test.com', password: 'password' },
}

const REFRESH_TOKENS = new Map() // refreshToken → { userId, expiresAt }

function generateToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function issueTokens(userId) {
  const accessToken = `at_${generateToken()}`
  const refreshToken = `rt_${generateToken()}`

  // Access token expires in 2 minutes (short so you can test refresh during a session)
  ACTIVE_TOKENS.set(accessToken, { userId, expiresAt: Date.now() + 2 * 60 * 1000 })
  // Refresh token expires in 30 minutes
  REFRESH_TOKENS.set(refreshToken, { userId, expiresAt: Date.now() + 30 * 60 * 1000 })

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: 120, // seconds
  }
}

authRouter.post('/login', (req, res) => {
  const { email, password } = req.body ?? {}
  const user = Object.values(USERS).find(u => u.email === email)

  if (!user || user.password !== password) {
    return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } })
  }

  const tokens = issueTokens(user.id)
  res.json({
    data: {
      user: { id: user.id, name: user.name, email: user.email },
      ...tokens,
    },
  })
})

authRouter.post('/refresh', (req, res) => {
  const { refresh_token } = req.body ?? {}
  const session = REFRESH_TOKENS.get(refresh_token)

  if (!session) {
    return res.status(401).json({ error: { code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token invalid or expired' } })
  }

  if (Date.now() > session.expiresAt) {
    REFRESH_TOKENS.delete(refresh_token)
    return res.status(401).json({ error: { code: 'REFRESH_TOKEN_EXPIRED', message: 'Please log in again' } })
  }

  REFRESH_TOKENS.delete(refresh_token)
  const tokens = issueTokens(session.userId)
  res.json({ data: tokens })
})

authRouter.post('/logout', (req, res) => {
  const { refresh_token } = req.body ?? {}
  REFRESH_TOKENS.delete(refresh_token)
  res.status(204).send()
})
