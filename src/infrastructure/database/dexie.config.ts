import Dexie, { type EntityTable } from "dexie"

// Re-export the canonical types so callers (repos, hooks) can keep their
// existing `import { ... } from "@/infrastructure/database/dexie.config"`.
export type { CachedProduct } from "./schemas/product-schema"
export type {
    LocalTransaction,
    SyncStatus,
} from "./schemas/transaction-schema"
export type { SyncQueueJob } from "./schemas/sync-queue-schema"

import type { CachedProduct } from "./schemas/product-schema"
import type { LocalTransaction } from "./schemas/transaction-schema"
import type { SyncQueueJob } from "./schemas/sync-queue-schema"
import type { Customer } from "@/features/pos/domain/models/customer.model"
import type { Category } from "@/features/pos/domain/models/category.model"

interface CacheEntry {
    key: string
    value: any
    expiresAt: number | null
}

/**
 * POS offline-first IndexedDB.
 *
 * Schema versions:
 *   v1 — initial (products, transactions, syncQueue) — see migrations/v1-initial.ts
 *   v2 — added cachedProducts / cachedCustomers / cachedCategories
 *   v3 — added `category` and `cachedAt` indexes on products, plus keyValueCache
 *
 * Index strings are duplicated inline because Dexie requires the spec at
 * construction time, not from an imported object. The types above are the
 * single source of truth for *shape*; the index spec is the schema contract.
 */
export class POSDatabase extends Dexie {
    transactions!: EntityTable<LocalTransaction, "id">
    syncQueue!: EntityTable<SyncQueueJob, "id">
    cachedProducts!: EntityTable<CachedProduct, "id">
    cachedCustomers!: EntityTable<Customer, "id">
    cachedCategories!: EntityTable<Category, "id">
    keyValueCache!: EntityTable<CacheEntry, "key">

    constructor() {
        super("pos-offline-db")

        this.version(2).stores({
            transactions: "++id, reference, syncStatus, createdAt, customerId",
            syncQueue: "id, priority, retryCount, [retryCount+priority]",
            cachedProducts: "id, barcode, name",
            cachedCustomers: "id, name",
            cachedCategories: "id, name",
        })

        this.version(3).stores({
            transactions: "++id, reference, syncStatus, createdAt, customerId",
            syncQueue: "id, priority, retryCount, [retryCount+priority]",
            cachedProducts: "id, barcode, name, category, cachedAt",
            cachedCustomers: "id, name, email, phone, barcode",
            cachedCategories: "id, name",
            keyValueCache: "key",
        })
    }
}

const db = new POSDatabase()

export { db }
