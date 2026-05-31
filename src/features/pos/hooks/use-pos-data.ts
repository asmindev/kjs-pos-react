import { create } from "zustand"
import {
    fetchProducts,
    fetchCustomers,
    type OdooProduct,
    type OdooCustomer,
} from "@/features/pos/api/odoo-adapter"

type Product = {
    id: string
    barcode: string
    name: string
    price: number
    stock: number
}

type Customer = {
    id: string
    name: string
    phone?: string
}

type PosDataState = {
    products: Product[]
    customers: Customer[]
    isLoading: boolean
    error: string | null
    lastFetched: number | null

    refetch: () => Promise<void>
}

function mapProduct(p: OdooProduct): Product {
    return {
        id: String(p.id),
        barcode: p.barcode || "",
        name: p.name,
        price: p.price,
        stock: p.stock,
    }
}

function mapCustomer(c: OdooCustomer): Customer {
    return {
        id: String(c.id),
        name: c.name,
        phone: c.phone || c.mobile || undefined,
    }
}

export const usePosData = create<PosDataState>((set, get) => ({
    products: [],
    customers: [],
    isLoading: false,
    error: null,
    lastFetched: null,

    refetch: async () => {
        const { isLoading } = get()
        if (isLoading) return // Jangan fetch ulang saat masih loading

        set({ isLoading: true, error: null })

        try {
            const [prodResult, custResult] = await Promise.all([
                fetchProducts(),
                fetchCustomers(),
            ])

            const updates: Partial<PosDataState> = {}

            if (prodResult.ok && prodResult.data) {
                updates.products = prodResult.data.map(mapProduct)
            } else if (prodResult.error) {
                updates.error = prodResult.error
            }

            if (custResult.ok && custResult.data) {
                updates.customers = custResult.data.map(mapCustomer)
            }

            updates.lastFetched = Date.now()
            updates.isLoading = false
            set(updates)
        } catch (e) {
            set({
                isLoading: false,
                error:
                    e instanceof Error
                        ? e.message
                        : "Gagal memuat data",
            })
        }
    },
}))
