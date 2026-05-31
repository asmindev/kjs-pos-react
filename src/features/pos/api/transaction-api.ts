import type { Transaction } from "../domain/models/transaction-model"

export async function saveTransaction(
  transaction: Transaction
): Promise<Transaction> {
  return transaction
}
