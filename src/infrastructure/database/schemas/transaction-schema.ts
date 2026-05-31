export type TransactionRecord = {
  id: string
  total: number
  paymentMethod: string
  createdAt: string
}

export const transactionSchema = {
  tableName: "transactions",
  primaryKey: "id",
} as const
