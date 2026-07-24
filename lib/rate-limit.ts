const requests = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(key: string, maxRequests: number, windowMs: number): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now()
  const record = requests.get(key)

  if (!record || now > record.resetAt) {
    requests.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterMs: 0 }
  }

  if (record.count >= maxRequests) {
    return { allowed: false, retryAfterMs: record.resetAt - now }
  }

  record.count++
  return { allowed: true, retryAfterMs: 0 }
}

export function formatRetryTime(ms: number): string {
  const totalMinutes = Math.ceil(ms / 60000)
  if (totalMinutes < 60) return `${totalMinutes} minute${totalMinutes === 1 ? '' : 's'}`
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (minutes === 0) return `${hours} hour${hours === 1 ? '' : 's'}`
  return `${hours} hour${hours === 1 ? '' : 's'} and ${minutes} minute${minutes === 1 ? '' : 's'}`
}
