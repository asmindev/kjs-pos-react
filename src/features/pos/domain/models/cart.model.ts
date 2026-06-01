import { z } from "zod"
import { ProductSchema } from "./product.model"

export const CartItemSchema = z.object({
  product: ProductSchema,
  quantity: z.number().min(1),
})

export type CartItem = z.infer<typeof CartItemSchema>

export const CartSchema = z.object({
  items: z.array(CartItemSchema),
  subtotal: z.number().min(0),
  discount: z.number().min(0),
  total: z.number().min(0),
})

export type Cart = z.infer<typeof CartSchema>
