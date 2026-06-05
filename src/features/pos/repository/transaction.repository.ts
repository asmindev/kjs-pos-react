/**
 * TransactionRepository — high-level save that goes through the
 * offline-first pipeline (`saveTransactionLocal`) so callers don't have
 * to know about Dexie or the sync queue.
 */

import {
    saveTransactionLocal,
    type LocalTransaction,
} from "./sync-queue.repository"
import type { Transaction } from "../domain/models/transaction.model"

export interface ITransactionRepository {
    save(
        data: Omit<
            LocalTransaction,
            "id" | "reference" | "syncStatus" | "createdAt"
        >
    ): Promise<LocalTransaction>
    saveLegacy(transaction: Transaction): Promise<Transaction>
}

export class TransactionRepository implements ITransactionRepository {
    async save(
        data: Omit<
            LocalTransaction,
            "id" | "reference" | "syncStatus" | "createdAt"
        >
    ): Promise<LocalTransaction> {
        return saveTransactionLocal(data)
    }

    /**
     * Thin shim for callers still passing the legacy `Transaction` shape.
     * Delegates to the canonical offline-first path.
     */
    async saveLegacy(transaction: Transaction): Promise<Transaction> {
        await saveTransactionLocal({
            items: [],
            subtotal: transaction.total,
            discount: 0,
            total: transaction.total,
            paymentMethod: "cash",
            paidAmount: transaction.total,
            changeAmount: 0,
        })
        return transaction
    }
}

export const transactionRepository = new TransactionRepository()
