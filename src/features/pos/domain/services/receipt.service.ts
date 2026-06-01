import type { CartItem } from "../models/cart.model"

export function buildReceiptLines(items: CartItem[]) {
  return items.map((item) => `${item.quantity} x ${item.product.name}`)
}
