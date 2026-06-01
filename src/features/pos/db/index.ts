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
    category: string
    cachedAt: number
}

import type { Customer } from "../domain/models/customer.model"
import type { Category } from "../domain/models/category.model"

interface CacheEntry {
    key: string
    value: any
    expiresAt: number | null
}

export class POSDatabase extends Dexie {
    transactions!: EntityTable<LocalTransaction, "id">
    syncQueue!: EntityTable<{ id?: number; transactionRef: string; retries: number; lastAttempt: number }, "id">
    cachedProducts!: EntityTable<CachedProduct, "id">
    cachedCustomers!: EntityTable<Customer, "id">
    cachedCategories!: EntityTable<Category, "id">
    keyValueCache!: EntityTable<CacheEntry, "key">

    constructor() {
        super("pos-offline-db")

        this.version(2).stores({
            transactions: "++id, reference, syncStatus, createdAt, customerId",
            syncQueue: "++id, transactionRef, retries, lastAttempt",
            cachedProducts: "id, barcode, name",
            cachedCustomers: "id, name",
            cachedCategories: "id, name",
        })

        this.version(3).stores({
            transactions: "++id, reference, syncStatus, createdAt, customerId",
            syncQueue: "++id, transactionRef, retries, lastAttempt",
            cachedProducts: "id, barcode, name, category, cachedAt",
            cachedCustomers: "id, name, email, phone, barcode",
            cachedCategories: "id, name",
            keyValueCache: "key",
        })
    }
}

const db = new POSDatabase()

export { db }
