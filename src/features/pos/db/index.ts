import Dexie, { type EntityTable } from "dexie"

export type SyncStatus = "pending" | "syncing" | "synced" | "failed"

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

export type CachedProduct = {
    id: string
    barcode: string
    name: string
    price: number
    stock: number
    cachedAt: number
}

export type KeyValueCache = {
    key: string
    value: any
    expiresAt: number | null
}

const db = new Dexie("pos-offline-db") as Dexie & {
    transactions: EntityTable<LocalTransaction, "id">
    syncQueue: EntityTable<
        { id?: number; transactionRef: string; retries: number; lastAttempt: number },
        "id"
    >
    cachedProducts: EntityTable<CachedProduct, "id">
    keyValueCache: EntityTable<KeyValueCache, "key">
}

db.version(1).stores({
    transactions: "++id, reference, syncStatus, createdAt, customerId",
    syncQueue: "++id, transactionRef, retries, lastAttempt",
    cachedProducts: "id, barcode, name",
})

db.version(2).stores({
    keyValueCache: "key",
})

export { db }
