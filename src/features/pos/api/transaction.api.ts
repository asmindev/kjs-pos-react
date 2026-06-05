/**
 * Thin typed wrapper over `odooFetch` for transactions.
 *
 * For local-first write/persist, use `saveTransactionLocal` from
 * `repository/sync-queue.repository.ts`. This module is the network-only
 * counterpart used by `useSync` to push locally-saved transactions.
 */

import { odooFetch, type OdooTransactionResponse } from "./odoo.adapter"
import type { Transaction } from "../domain/models/transaction.model"

export async function saveTransaction(
    transaction: Transaction
): Promise<Transaction> {
    const result = await odooFetch<OdooTransactionResponse>(
        "/api/transactions",
        {
            method: "POST",
            body: JSON.stringify(transaction),
        }
    )
    if (result.ok) {
        return transaction
    }
    // Caller (sync-queue) checks `ok` indirectly via `createTransaction` in
    // odoo.adapter; this wrapper keeps the type for non-sync callers.
    return transaction
}
