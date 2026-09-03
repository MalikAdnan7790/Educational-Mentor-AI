const DEFAULT_MAX = 50;
const DEFAULT_TTL_MS = 5 * 60 * 1000;

interface Entry<T> {
  value: T;
  expiresAt: number;
}

export class SimpleCache {
  private map = new Map<string, Entry<unknown>>();
  private max: number;
  private ttlMs: number;

  constructor(opts?: { max?: number; ttlMs?: number }) {
    this.max = opts?.max ?? DEFAULT_MAX;
    this.ttlMs = opts?.ttlMs ?? DEFAULT_TTL_MS;
  }

  get<T>(key: string): T | undefined {
    const entry = this.map.get(key) as Entry<T> | undefined;
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set<T>(key: string, value: T): void {
    if (this.map.size >= this.max) {
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) this.map.delete(oldest);
    }
    this.map.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  invalidate(keyPrefix: string): void {
    for (const key of this.map.keys()) {
      if (key.startsWith(keyPrefix)) this.map.delete(key);
    }
  }
}

export const subjectCache = new SimpleCache({ max: 20, ttlMs: 10 * 60 * 1000 });
export const teacherProfileCache = new SimpleCache({ max: 30, ttlMs: 5 * 60 * 1000 });
