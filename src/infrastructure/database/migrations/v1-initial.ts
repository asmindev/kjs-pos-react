import type { TableSchema } from "dexie"

/**
 * v1 — initial POS database.
 *
 * The application has since migrated through v2 (added `cachedProducts`,
 * `cachedCustomers`, `cachedCategories`) and v3 (added `keyValueCache` and
 * extra indexes for query perf). This file is kept as a historical
 * reference and as the seed used by fresh installs when no existing
 * IndexedDB is present.
 */
export const initialMigration = {
    version: 1,
    name: "initial",
    tables: ["products", "transactions", "syncQueue"] as const,
    stores: {
        products: "++id, barcode, categoryId, name, [name+barcode]",
        transactions: "id, state, createdAt, [state+createdAt]",
        syncQueue: "id, priority, retryCount, [retryCount+priority]",
    } satisfies Record<string, string>,
} as const

export type InitialStoreSpecs = {
    products: TableSchema
    transactions: TableSchema
    syncQueue: TableSchema
}
