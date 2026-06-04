import type { Table } from "dexie"

/**
 * CachedProduct — representation of a product mirrored from Odoo,
 * stored locally for offline-first product browsing.
 */
export type CachedProduct = {
    id: string
    barcode: string
    name: string
    price: number
    stock: number
    category: string
    cachedAt: number
}

/**
 * Dexie v3 store spec for `cachedProducts`.
 * Single source of truth — imported by `dexie.config.ts` so the schema
 * lives next to the type definition.
 */
export const productStoreSpec = {
    tableName: "cachedProducts",
    primaryKey: "id",
    indexes: ["barcode", "name", "category", "cachedAt"],
} as const

export type ProductTable = Table<CachedProduct, string>
