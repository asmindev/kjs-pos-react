import { z } from "zod"

export const CustomerSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().optional(),
    phone: z.string().optional(),
    barcode: z.string().optional(),
})

export type Customer = z.infer<typeof CustomerSchema>
