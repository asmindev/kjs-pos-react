import { db, type LocalTransaction, type SyncStatus } from "./index"

function generateReference(): string {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, "0")
    const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `POS-${ts}-${rand}`
}

export async function saveTransactionLocal(
    data: Omit<LocalTransaction, "id" | "reference" | "syncStatus" | "createdAt">
): Promise<LocalTransaction> {
    const transaction: LocalTransaction = {
        ...data,
        reference: generateReference(),
        syncStatus: "pending",
        createdAt: Date.now(),
    }

    const id = await db.transactions.add(transaction)

    // Also add to sync queue
    await db.syncQueue.add({
        transactionRef: transaction.reference,
        retries: 0,
        lastAttempt: 0,
    })

    return { ...transaction, id }
}

export async function getPendingSyncCount(): Promise<number> {
    return db.syncQueue.count()
}

export async function getPendingTransactions(): Promise<LocalTransaction[]> {
    return db.transactions.where("syncStatus").equals("pending").toArray()
}

export async function markSynced(reference: string): Promise<void> {
    await db.transactions
        .where("reference")
        .equals(reference)
        .modify({ syncStatus: "synced", syncedAt: Date.now() })

    await db.syncQueue.where("transactionRef").equals(reference).delete()
}

export async function markFailed(
    reference: string,
    errorMessage: string
): Promise<void> {
    await db.transactions
        .where("reference")
        .equals(reference)
        .modify({ syncStatus: "failed", errorMessage })

    // Increment retries
    const queueItem = await db.syncQueue
        .where("transactionRef")
        .equals(reference)
        .first()

    if (queueItem && queueItem.id) {
        await db.syncQueue.update(queueItem.id, {
            retries: queueItem.retries + 1,
            lastAttempt: Date.now(),
        })
    }
}

export async function updateSyncStatus(
    reference: string,
    status: SyncStatus
): Promise<void> {
    await db.transactions
        .where("reference")
        .equals(reference)
        .modify({ syncStatus: status })
}

export async function getTransactionByRef(
    reference: string
): Promise<LocalTransaction | undefined> {
    return db.transactions.where("reference").equals(reference).first()
}
