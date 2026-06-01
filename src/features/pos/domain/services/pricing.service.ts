import type { CartItem } from "../models/cart.model"

export function calculateLineTotal(item: CartItem) {
  return item.product.price * item.quantity
}

export function calculateSubtotal(items: CartItem[]) {
  return items.reduce(
    (total, item) => total + calculateLineTotal(item),
    0
  )
}

export function calculateTotal(items: CartItem[], discount = 0) {
  return Math.max(calculateSubtotal(items) - discount, 0)
}
