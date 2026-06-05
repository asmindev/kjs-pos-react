import { db } from "@/infrastructure/database/dexie.config"
import { logger } from "@/infrastructure/logging/logger"

/**
 * TTL-aware key-value cache backed by Dexie's `keyValueCache` table.
 *
 *   set("products", [...], 5 * 60_000)  — 5 minute cache
 *   await get<Product[]>("products")    — returns null on miss/expired
 *
 * Used by the Odoo adapter to short-circuit network calls when a fresh
 * local copy is available.
 */
export const cacheManager = {
    async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
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
            logger.debug("cache:expired", { key })
            return null
        }

        return entry.value as T
    },

    async delete(key: string): Promise<void> {
        await db.keyValueCache.delete(key)
    },

    async clear(): Promise<void> {
        await db.keyValueCache.clear()
        logger.info("cache:cleared")
    },
}
