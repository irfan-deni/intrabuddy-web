const requestCounts = new Map<string, { count: number; resetAt: number }>()

const WINDOW_MS = 60_000
const MAX_REQUESTS = 100

let cleanupIndex = 0

function cleanupExpired(): void {
  const now = Date.now()
  const entries = [...requestCounts.entries()]
  const start = cleanupIndex % Math.max(entries.length, 1)
  const toCheck = Math.min(entries.length, 20)
  for (let i = 0; i < toCheck; i++) {
    const idx = (start + i) % entries.length
    const item = entries[idx]
    if (item) {
      const [key, entry] = item
      if (entry.resetAt < now) {
        requestCounts.delete(key)
      }
    }
  }
  cleanupIndex = (cleanupIndex + toCheck) % Math.max(entries.length, 1)
}

export default defineEventHandler((event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const now = Date.now()
  const entry = requestCounts.get(ip)

  if (!entry || entry.resetAt < now) {
    requestCounts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    cleanupExpired()
    return
  }

  entry.count++

  if (entry.count > MAX_REQUESTS) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many requests. Please try again later.'
    })
  }
})
