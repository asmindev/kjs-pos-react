type CacheEntry<T> = {
  value: T
  expiresAt: number | null
}

const cacheStore = new Map<string, CacheEntry<unknown>>()

export const cacheManager = {
  set<T>(key: string, value: T, ttlMs?: number) {
    cacheStore.set(key, {
      value,
      expiresAt: ttlMs ? Date.now() + ttlMs : null,
    })
  },
  get<T>(key: string) {
    const entry = cacheStore.get(key)

    if (!entry) {
      return null
    }

    if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
      cacheStore.delete(key)
      return null
    }

    return entry.value as T
  },
  clear() {
    cacheStore.clear()
  },
}
