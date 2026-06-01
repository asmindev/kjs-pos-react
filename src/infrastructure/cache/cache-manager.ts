import { db } from "@/features/pos/db"

export const cacheManager = {
  async set<T>(key: string, value: T, ttlMs?: number) {
    await db.keyValueCache.put({
      key,
      value,
      expiresAt: ttlMs ? Date.now() + ttlMs : null,
    })
  },
  
  async get<T>(key: string): Promise<T | null> {
    const entry = await db.keyValueCache.get(key)

    if (!entry) {
      return null
    }

    if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
      await db.keyValueCache.delete(key)
      return null
    }

    return entry.value as T
  },
  
  async clear() {
    await db.keyValueCache.clear()
  },
}
