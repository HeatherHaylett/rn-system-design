/**
 * Chaos middleware — the thing mocks never give you.
 *
 * CHAOS_LEVEL=low    → 50–200ms latency, 2% error rate
 * CHAOS_LEVEL=medium → 100–800ms latency, 8% error rate  (default)
 * CHAOS_LEVEL=high   → 200–3000ms latency, 20% error rate
 * CHAOS_LEVEL=off    → no latency, no errors (for debugging your own code)
 *
 * The latency is gaussian-ish, not uniform — you'll get occasional spikes.
 * This is what you actually need to handle in production.
 */

const PROFILES = {
  off:    { minMs: 0,   maxMs: 0,    errorRate: 0 },
  low:    { minMs: 50,  maxMs: 200,  errorRate: 0.02 },
  medium: { minMs: 100, maxMs: 800,  errorRate: 0.08 },
  high:   { minMs: 200, maxMs: 3000, errorRate: 0.20 },
}

function jitteredDelay(min, max) {
  // Weighted toward the lower end with occasional spikes — more realistic than uniform
  const base = min + Math.random() * (max - min)
  const spike = Math.random() < 0.1 ? base * 2 : 0
  return Math.round(base + spike)
}

export async function chaosMiddleware(req, res, next) {
  const level = process.env.CHAOS_LEVEL ?? 'medium'
  const profile = PROFILES[level] ?? PROFILES.medium

  // Skip chaos for health check
  if (req.path === '/health') return next()

  const delay = jitteredDelay(profile.minMs, profile.maxMs)
  await new Promise(resolve => setTimeout(resolve, delay))

  if (Math.random() < profile.errorRate) {
    return res.status(503).json({
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Server temporarily unavailable — retry with backoff',
      },
    })
  }

  next()
}
