import { z } from "zod"

export const ProductSchema = z.object({
    id: z.string(),
    barcode: z.string().optional(),
    name: z.string(),
    price: z.number(),
    stock: z.number(),
    category: z.string(),
})

export type Product = z.infer<typeof ProductSchema>
