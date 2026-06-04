import type { Table } from "dexie"

/**
 * One queued operation waiting to be pushed to the server.
 * Payload is intentionally `unknown` — each job type knows its own shape.
 */
export type SyncQueueJob = {
    id: string
    type: "transaction" | "product-update"
    payload: unknown
    /** Lower number = higher priority. */
    priority: number
    retryCount: number
    maxRetries: number
    createdAt: string
    lastAttempt?: string
}

/**
 * Dexie v3 store spec for `syncQueue`.
 * Compound index `[retryCount+priority]` lets the worker cheaply fetch
 * "next runnable job" sorted by retries ascending, priority ascending.
 */
export const syncQueueStoreSpec = {
    tableName: "syncQueue",
    primaryKey: "id",
    indexes: ["priority", "retryCount", "[retryCount+priority]"],
} as const

export type SyncQueueTable = Table<SyncQueueJob, string>
