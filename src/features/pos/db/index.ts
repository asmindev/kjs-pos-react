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

const db = new Dexie("pos-offline-db") as Dexie & {
    transactions: EntityTable<LocalTransaction, "id">
    syncQueue: EntityTable<
        { id?: number; transactionRef: string; retries: number; lastAttempt: number },
        "id"
    >
    cachedProducts: EntityTable<CachedProduct, "id">
}

db.version(1).stores({
    transactions:
        "++id, reference, syncStatus, createdAt, customerId",
    syncQueue:
        "++id, transactionRef, retries, lastAttempt",
    cachedProducts:
        "id, barcode, name",
})

export { db }
