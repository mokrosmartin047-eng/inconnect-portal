const attempts = new Map<string, { count: number; resetAt: number }>()

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const entry = attempts.get(ip)

  // Clean expired entries
  if (entry && now > entry.resetAt) {
    attempts.delete(ip)
  }

  const current = attempts.get(ip)

  if (!current) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: MAX_ATTEMPTS - 1, resetIn: WINDOW_MS }
  }

  if (current.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0, resetIn: current.resetAt - now }
  }

  current.count++
  return { allowed: true, remaining: MAX_ATTEMPTS - current.count, resetIn: current.resetAt - now }
}

export function resetRateLimit(ip: string) {
  attempts.delete(ip)
}
