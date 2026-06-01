import type { Product } from "./product.model"

export type CartItem = {
  product: Product
  quantity: number
}

export type Cart = {
  items: CartItem[]
  subtotal: number
  discount: number
  total: number
}
