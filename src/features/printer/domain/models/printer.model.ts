import { z } from "zod"

export const PrinterStatusSchema = z.enum(["disconnected", "ready", "printing"])

export type PrinterStatus = z.infer<typeof PrinterStatusSchema>

export const PrinterSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: PrinterStatusSchema,
})

export type Printer = z.infer<typeof PrinterSchema>
