import { useEffect, useState, useCallback } from "react"
import { useNetworkStatus } from "@/shared/hooks/use-network-status"
import {
    getPendingSyncCount,
    getPendingTransactions,
    markSynced,
    markFailed,
    updateSyncStatus,
    getTransactionByRef,
} from "@/features/pos/repository/sync-queue.repository"
import { createTransaction } from "@/features/pos/api/odoo.adapter"
import { eventBus } from "@/infrastructure/event-bus/event-bus"
import { logger } from "@/infrastructure/logging/logger"
import { APP_CONSTANTS } from "@/config/app.config"

export function useSync() {
    const { isOnline } = useNetworkStatus()
    const [pendingCount, setPendingCount] = useState(0)
    const [isSyncing, setIsSyncing] = useState(false)

    const refreshCount = useCallback(async () => {
        const count = await getPendingSyncCount()
        setPendingCount(count)
    }, [])

    const pushTransaction = useCallback(
        async (reference: string): Promise<boolean> => {
            try {
                const tx = await getTransactionByRef(reference)
                if (!tx) {
                    logger.warn("pushTransaction: tx not found", { reference })
                    return false
                }

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
                logger.error("pushTransaction threw", { reference, msg })
                await markFailed(reference, msg)
                return false
            }
        },
        []
    )

    const syncAll = useCallback(async () => {
        if (!isOnline || isSyncing) return

        logger.info("syncAll starting", { isOnline })
        setIsSyncing(true)
        try {
            const pending = await getPendingTransactions()
            eventBus.publish("sync:started", { count: pending.length })
            for (const tx of pending) {
                await pushTransaction(tx.reference)
            }
            eventBus.publish("sync:completed", { count: pending.length })
        } finally {
            setIsSyncing(false)
            await refreshCount()
        }
    }, [isOnline, isSyncing, pushTransaction, refreshCount])

    // Reaktif: setiap status transaksi berubah, refresh pending count
    useEffect(() => {
        const unsubscribe = eventBus.subscribe(
            "transaction:status",
            () => {
                refreshCount()
            }
        )
        return unsubscribe
    }, [refreshCount])

    // Auto-sync saat kembali online
    useEffect(() => {
        if (isOnline) {
            syncAll()
        }
    }, [isOnline, syncAll])

    // Initial count
    useEffect(() => {
        refreshCount()
    }, [refreshCount])

    // Periodic 30s
    useEffect(() => {
        if (!isOnline) return
        const interval = setInterval(syncAll, APP_CONSTANTS.SYNC_INTERVAL_MS)
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
