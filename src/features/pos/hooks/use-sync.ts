import { useEffect, useState, useCallback } from "react"
import { useNetworkStatus } from "@/shared/hooks/use-network-status"
import {
    getPendingSyncCount,
    getPendingTransactions,
    markSynced,
    markFailed,
    updateSyncStatus,
    getTransactionByRef,
} from "@/features/pos/db/sync-queue"
import { createTransaction } from "@/features/pos/api/odoo-adapter"

export function useSync() {
    const { isOnline } = useNetworkStatus()
    const [pendingCount, setPendingCount] = useState(0)
    const [isSyncing, setIsSyncing] = useState(false)

    const refreshCount = useCallback(async () => {
        const count = await getPendingSyncCount()
        setPendingCount(count)
    }, [])

    // Push a single pending transaction to Odoo
    const pushTransaction = useCallback(
        async (reference: string): Promise<boolean> => {
            try {
                const tx = await getTransactionByRef(reference)
                if (!tx) return false

                await updateSyncStatus(reference, "syncing")

                const result = await createTransaction({
                    reference: tx.reference,
                    items: tx.items,
                    subtotal: tx.subtotal,
                    discount: tx.discount,
                    total: tx.total,
                    payment_method: tx.paymentMethod,
                    paid_amount: tx.paidAmount,
                    change_amount: tx.changeAmount,
                    customer_id: tx.customerId,
                    customer_name: tx.customerName,
                    created_at: new Date(tx.createdAt).toISOString(),
                })

                if (result.ok) {
                    await markSynced(reference)
                    return true
                }

                throw new Error(result.error ?? "Sync failed")
            } catch (error) {
                const msg =
                    error instanceof Error
                        ? error.message
                        : "Unknown error"
                await markFailed(reference, msg)
                return false
            }
        },
        []
    )

    // Push all pending transactions
    const syncAll = useCallback(async () => {
        if (!isOnline || isSyncing) return

        setIsSyncing(true)
        try {
            const pending = await getPendingTransactions()
            for (const tx of pending) {
                await pushTransaction(tx.reference)
            }
        } finally {
            setIsSyncing(false)
            await refreshCount()
        }
    }, [isOnline, isSyncing, pushTransaction, refreshCount])

    // Auto-sync when coming back online
    useEffect(() => {
        if (isOnline) {
            syncAll()
        }
    }, [isOnline])

    // Refresh count on mount
    useEffect(() => {
        refreshCount()
    }, [refreshCount])

    // Periodic sync when online (every 30 seconds)
    useEffect(() => {
        if (!isOnline) return
        const interval = setInterval(syncAll, 30_000)
        return () => clearInterval(interval)
    }, [isOnline, syncAll])

    return {
        isOnline,
        pendingCount,
        isSyncing,
        syncAll,
        pushTransaction,
    }
}
