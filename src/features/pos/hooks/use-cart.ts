import { useMemo, useState } from "react"

import type { CartItem } from "../domain/models/cart-model"
import {
  calculateSubtotal,
  calculateTotal,
} from "../domain/services/pricing-service"

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])
  const [discount, setDiscount] = useState(0)

  const subtotal = useMemo(() => calculateSubtotal(items), [items])
  const total = useMemo(
    () => calculateTotal(items, discount),
    [discount, items]
  )

  return {
    items,
    subtotal,
    total,
    discount,
    setDiscount,
    setItems,
  }
}
