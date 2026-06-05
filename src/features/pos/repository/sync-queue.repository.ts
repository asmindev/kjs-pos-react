import { db, type LocalTransaction, type SyncStatus } from "@/infrastructure/database/dexie.config"
import { logger } from "@/infrastructure/logging/logger"
import { eventBus } from "@/infrastructure/event-bus/event-bus"
import { APP_CONSTANTS } from "@/config/app.config"

function generateReference(): string {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, "0")
    const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `POS-${ts}-${rand}`
}

export type TransactionCreatedEvent = {
    reference: string
    total: number
}

export type TransactionStatusEvent = {
    reference: string
    status: SyncStatus
    errorMessage?: string
}

/** Re-emitted whenever a transaction's `syncStatus` changes. */
const TRANSACTION_STATUS_EVENT = "transaction:status"

export async function saveTransactionLocal(
    data: Omit<LocalTransaction, "id" | "reference" | "syncStatus" | "createdAt">
): Promise<LocalTransaction> {
    const transaction: LocalTransaction = {
        ...data,
        reference: generateReference(),
        syncStatus: "draft",
        createdAt: Date.now(),
    }

    const id = await db.transactions.add(transaction)

    await db.syncQueue.add({
        id: crypto.randomUUID(),
        type: "transaction",
        payload: { reference: transaction.reference },
        priority: APP_CONSTANTS.SYNC_PRIORITY_TRANSACTION,
        retryCount: 0,
        maxRetries: APP_CONSTANTS.SYNC_MAX_RETRIES,
        createdAt: new Date().toISOString(),
    })

    logger.info("transaction saved locally", {
        reference: transaction.reference,
        total: transaction.total,
    })
    eventBus.publish<TransactionCreatedEvent>("transaction:created", {
        reference: transaction.reference,
        total: transaction.total,
    })
    eventBus.publish<TransactionStatusEvent>(TRANSACTION_STATUS_EVENT, {
        reference: transaction.reference,
        status: "draft",
    })

    return { ...transaction, id }
}

export async function getPendingSyncCount(): Promise<number> {
    return db.syncQueue.count()
}

export async function getPendingTransactions(): Promise<LocalTransaction[]> {
    return db.transactions.where("syncStatus").equals("draft").toArray()
}

export async function markSynced(reference: string): Promise<void> {
    await db.transactions
        .where("reference")
        .equals(reference)
        .modify({ syncStatus: "synced", syncedAt: Date.now() })

    const jobs = await db.syncQueue.filter(
        (j) =>
            j.type === "transaction" &&
            (j.payload as { reference?: string }).reference === reference
    ).toArray()
    for (const job of jobs) {
        await db.syncQueue.delete(job.id)
    }

    logger.info("transaction synced", { reference })
    eventBus.publish<TransactionStatusEvent>(TRANSACTION_STATUS_EVENT, {
        reference,
        status: "synced",
    })
}

export async function markFailed(
    reference: string,
    errorMessage: string
): Promise<void> {
    await db.transactions
        .where("reference")
        .equals(reference)
        .modify({ syncStatus: "failed", errorMessage })

    const jobs = await db.syncQueue.filter(
        (j) =>
            j.type === "transaction" &&
            (j.payload as { reference?: string }).reference === reference
    ).toArray()

    let finalStatus: SyncStatus = "failed"
    if (jobs.length > 0) {
        const job = jobs[0]
        const nextRetry = job.retryCount + 1
        if (nextRetry > job.maxRetries) {
            await db.transactions
                .where("reference")
                .equals(reference)
                .modify({ syncStatus: "dead-letter", errorMessage })
            await db.syncQueue.delete(job.id)
            finalStatus = "dead-letter"
        } else {
            await db.syncQueue.update(job.id, {
                retryCount: nextRetry,
                lastAttempt: new Date().toISOString(),
            })
        }
    }

    logger.warn("transaction sync failed", {
        reference,
        status: finalStatus,
        errorMessage,
    })
    eventBus.publish<TransactionStatusEvent>(TRANSACTION_STATUS_EVENT, {
        reference,
        status: finalStatus,
        errorMessage,
    })
}

export async function updateSyncStatus(
    reference: string,
    status: SyncStatus
): Promise<void> {
    await db.transactions
        .where("reference")
        .equals(reference)
        .modify({ syncStatus: status })

    logger.debug("transaction sync status updated", { reference, status })
    eventBus.publish<TransactionStatusEvent>(TRANSACTION_STATUS_EVENT, {
        reference,
        status,
    })
}

export async function getTransactionByRef(
    reference: string
): Promise<LocalTransaction | undefined> {
    return db.transactions.where("reference").equals(reference).first()
}
