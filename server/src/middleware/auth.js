/**
 * Auth middleware — tokens actually expire here.
 *
 * Access tokens expire after 2 minutes (not 15 min like production,
 * so you can actually trigger expiry during an exercise session).
 * Refresh tokens expire after 30 minutes.
 */

export const ACTIVE_TOKENS = new Map() // token → { userId, expiresAt }

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing token' } })
  }

  const token = header.slice(7)
  const session = ACTIVE_TOKENS.get(token)

  if (!session) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } })
  }

  if (Date.now() > session.expiresAt) {
    ACTIVE_TOKENS.delete(token)
    return res.status(401).json({ error: { code: 'TOKEN_EXPIRED', message: 'Access token expired' } })
  }

  req.userId = session.userId
  next()
}
