import { create } from "zustand"
import type { CartItem } from "../domain/models/cart-model"
import type { Product } from "../domain/models/product-model"
import {
    calculateSubtotal,
    calculateTotal,
} from "../domain/services/pricing-service"

type CartState = {
    items: CartItem[]
    discount: number

    // Actions
    addItem: (product: Product, quantity?: number) => void
    removeItem: (productId: string) => void
    updateQuantity: (productId: string, quantity: number) => void
    setDiscount: (discount: number) => void
    clear: () => void

    // Selectors
    getItemCount: () => number
    getSubtotal: () => number
    getTotal: () => number
}

export const useCart = create<CartState>((set, get) => ({
    items: [],
    discount: 0,

    addItem: (product, quantity = 1) => {
        set((state) => {
            const existing = state.items.find(
                (item) => item.product.id === product.id
            )
            if (existing) {
                return {
                    items: state.items.map((item) =>
                        item.product.id === product.id
                            ? {
                                  ...item,
                                  quantity: item.quantity + quantity,
                              }
                            : item
                    ),
                }
            }
            return {
                items: [...state.items, { product, quantity }],
            }
        })
    },

    removeItem: (productId) => {
        set((state) => ({
            items: state.items.filter(
                (item) => item.product.id !== productId
            ),
        }))
    },

    updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
            get().removeItem(productId)
            return
        }
        set((state) => ({
            items: state.items.map((item) =>
                item.product.id === productId ? { ...item, quantity } : item
            ),
        }))
    },

    setDiscount: (discount) => set({ discount }),

    clear: () => set({ items: [], discount: 0 }),

    getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

    getSubtotal: () => calculateSubtotal(get().items),

    getTotal: () => calculateTotal(get().items, get().discount),
}))
