import { create } from "zustand"
import { useCart } from "./use-cart"
import {
    saveTransactionLocal,
    markSynced,
    markFailed,
} from "@/features/pos/db/sync-queue"
import { createTransaction } from "@/features/pos/api/odoo-adapter"

export type PosPhase =
    | "idle"
    | "scanning"
    | "cart-review"
    | "payment"
    | "processing"
    | "success"
    | "error"

export type PaymentMethod = "cash" | "card" | "transfer"

export type SelectedCustomer = {
    id: string
    name: string
    phone?: string
    street?: string
    city?: string
} | null

type PosState = {
    phase: PosPhase
    paymentMethod: PaymentMethod | null
    paidAmount: number
    changeAmount: number
    errorMessage: string | null
    transactionRef: string | null
    syncSuccess: boolean // true if synced to Odoo, false if saved local only
    customer: SelectedCustomer

    // Actions
    setPhase: (phase: PosPhase) => void
    setCustomer: (customer: SelectedCustomer) => void
    startScanning: () => void
    stopScanning: () => void
    openCartReview: () => void
    closeCartReview: () => void
    startPayment: () => boolean
    selectPaymentMethod: (method: PaymentMethod) => void
    setPaidAmount: (amount: number) => void
    processPayment: () => Promise<void>
    finishTransaction: () => void
    resetToIdle: () => void
}

export const usePosState = create<PosState>((set, get) => ({
    phase: "idle",
    paymentMethod: null,
    paidAmount: 0,
    changeAmount: 0,
    errorMessage: null,
    transactionRef: null,
    syncSuccess: false,
    customer: null,

    setPhase: (phase) => set({ phase }),

    setCustomer: (customer) => set({ customer }),

    startScanning: () => set({ phase: "scanning" }),

    stopScanning: () => set({ phase: "idle" }),

    openCartReview: () => set({ phase: "cart-review" }),

    closeCartReview: () => set({ phase: "idle" }),

    startPayment: () => {
        const { getItemCount } = useCart.getState()
        if (getItemCount() === 0) return false
        set({
            phase: "payment",
            paymentMethod: null,
            paidAmount: 0,
            changeAmount: 0,
            errorMessage: null,
            transactionRef: null,
            syncSuccess: false,
        })
        return true
    },

    selectPaymentMethod: (method) => set({ paymentMethod: method }),

    setPaidAmount: (amount) => {
        const { getTotal } = useCart.getState()
        const total = getTotal()
        const change = amount >= total ? amount - total : 0
        set({ paidAmount: amount, changeAmount: change })
    },

    processPayment: async () => {
        const { paymentMethod, paidAmount, changeAmount, customer } = get()
        const { items, discount, getSubtotal, getTotal, clear } =
            useCart.getState()

        if (!paymentMethod) return
        const total = getTotal()
        if (paymentMethod === "cash" && paidAmount < total) return

        set({ phase: "processing", errorMessage: null })

        try {
            // Step 1: Always save to local DB first (offline-first)
            const tx = await saveTransactionLocal({
                items: items.map((item) => ({
                    productId: item.product.id,
                    productName: item.product.name,
                    price: item.product.price,
                    quantity: item.quantity,
                })),
                subtotal: getSubtotal(),
                discount,
                total,
                paymentMethod,
                paidAmount,
                changeAmount,
                customerId: customer?.id ? String(customer.id) : undefined,
                customerName: customer?.name,
            })

            set({ transactionRef: tx.reference })

            // Step 2: Try to sync to Odoo
            try {
                const result = await createTransaction({
                    reference: tx.reference,
                    items: tx.items,
                    subtotal: tx.subtotal,
                    discount: tx.discount,
                    total: tx.total,
                    payment_method: tx.paymentMethod,
                    paid_amount: tx.paidAmount,
                    change_amount: tx.changeAmount,
                    customer_id: tx.customerId,
                    customer_name: tx.customerName,
                    created_at: new Date(
                        tx.createdAt
                    ).toISOString(),
                })

                if (result.ok) {
                    await markSynced(tx.reference)
                    set({ syncSuccess: true })
                } else {
                    throw new Error(result.error ?? "HTTP error")
                }
            } catch {
                // Sync failed — transaction already saved locally
                // Will be picked up by background sync
                await markFailed(
                    tx.reference,
                    "Gagal sync ke Odoo"
                )
                set({ syncSuccess: false })
            }

            // Clear cart on success
            clear()
            set({ phase: "success" })
        } catch (error) {
            const msg =
                error instanceof Error
                    ? error.message
                    : "Gagal menyimpan transaksi"
            set({
                phase: "error",
                errorMessage: msg,
            })
        }
    },

    finishTransaction: () => {
        set({
            phase: "idle",
            paymentMethod: null,
            paidAmount: 0,
            changeAmount: 0,
            errorMessage: null,
            transactionRef: null,
            syncSuccess: false,
        })
    },

    resetToIdle: () =>
        set({
            phase: "idle",
            paymentMethod: null,
            paidAmount: 0,
            changeAmount: 0,
            errorMessage: null,
            transactionRef: null,
            syncSuccess: false,
        }),
}))
