import type { ID } from "@/shared/types/common-types"

export type TransactionStatus = "draft" | "paid" | "void"

export type Transaction = {
  id: ID
  reference: string
  total: number
  status: TransactionStatus
  createdAt: string
}
