import { z } from "zod"

export const TransactionStatusSchema = z.enum(["draft", "paid", "void"])

export type TransactionStatus = z.infer<typeof TransactionStatusSchema>

export const TransactionSchema = z.object({
  id: z.string(),
  reference: z.string(),
  total: z.number().min(0),
  status: TransactionStatusSchema,
  createdAt: z.string().datetime(),
})

export type Transaction = z.infer<typeof TransactionSchema>
