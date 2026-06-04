import type { Table } from "dexie"

/**
 * Lifecycle of a transaction in the offline-first sync pipeline.
 *
 *   draft → syncing → synced
 *                ↓
 *             failed → (retry) → syncing → synced | failed → dead-letter
 */
export type SyncStatus =
    | "draft"
    | "confirmed"
    | "syncing"
    | "synced"
    | "failed"
    | "dead-letter"

export type LocalTransaction = {
    id?: number
    reference: string
    items: Array<{
        productId: string
        productName: string
        price: number
        quantity: number
    }>
    subtotal: number
    discount: number
    total: number
    paymentMethod: string
    paidAmount: number
    changeAmount: number
    customerId?: string
    customerName?: string
    syncStatus: SyncStatus
    createdAt: number
    syncedAt?: number
    errorMessage?: string
}

/**
 * Dexie v3 store spec for `transactions`.
 */
export const transactionStoreSpec = {
    tableName: "transactions",
    primaryKey: "++id",
    indexes: ["reference", "syncStatus", "createdAt", "customerId"],
} as const

export type TransactionTable = Table<LocalTransaction, number>
