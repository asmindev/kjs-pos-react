import { saveTransaction } from "../api/transaction.api"
import type { Transaction } from "../domain/models/transaction.model"

export interface ITransactionRepository {
  save(transaction: Transaction): Promise<Transaction>
}

export class TransactionRepository implements ITransactionRepository {
  async save(transaction: Transaction): Promise<Transaction> {
    return saveTransaction(transaction)
  }
}

export const transactionRepository = new TransactionRepository()
