import { db, type LocalTransaction, type SyncStatus } from "@/infrastructure/database/dexie.config"

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
        syncStatus: "draft",
        createdAt: Date.now(),
    }

    const id = await db.transactions.add(transaction)

    // Also add to sync queue
    await db.syncQueue.add({
        id: crypto.randomUUID(),
        type: "transaction",
        payload: { reference: transaction.reference },
        priority: 1,
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date().toISOString(),
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

    const jobs = await db.syncQueue.filter(j => j.type === "transaction" && (j.payload as any).reference === reference).toArray()
    for (const job of jobs) {
        await db.syncQueue.delete(job.id)
    }
}

export async function markFailed(
    reference: string,
    errorMessage: string
): Promise<void> {
    await db.transactions
        .where("reference")
        .equals(reference)
        .modify({ syncStatus: "failed", errorMessage })

    const jobs = await db.syncQueue.filter(j => j.type === "transaction" && (j.payload as any).reference === reference).toArray()
    if (jobs.length > 0) {
        const job = jobs[0]
        const nextRetry = job.retryCount + 1
        if (nextRetry > job.maxRetries) {
            await db.transactions.where("reference").equals(reference).modify({ syncStatus: "dead-letter", errorMessage })
            await db.syncQueue.delete(job.id)
        } else {
            await db.syncQueue.update(job.id, {
                retryCount: nextRetry,
                lastAttempt: new Date().toISOString(),
            })
        }
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
