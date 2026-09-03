const store = new Map<string, { count: number; resetAt: number }>();

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const LIMITS: Record<string, RateLimitConfig> = {
  chat: { maxRequests: 30, windowMs: 60_000 },
  tts: { maxRequests: 20, windowMs: 60_000 },
  quiz: { maxRequests: 10, windowMs: 60_000 },
  auth: { maxRequests: 5, windowMs: 60_000 },
  default: { maxRequests: 60, windowMs: 60_000 },
};

export function checkRateLimit(key: string, bucket: keyof typeof LIMITS = "default"): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const config = LIMITS[bucket] ?? LIMITS.default;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, retryAfterMs: 0 };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, retryAfterMs: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, retryAfterMs: 0 };
}

// Periodic cleanup to prevent memory leaks from stale entries
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now >= entry.resetAt) store.delete(key);
  }
}, 60_000);
