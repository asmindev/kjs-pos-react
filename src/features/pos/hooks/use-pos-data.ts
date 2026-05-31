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
    email?: string
    street?: string
    city?: string
}

type PosDataState = {
    products: Product[]
    customers: Customer[]
    isLoading: boolean
    error: string | null
    lastFetched: number | null

    refetch: (force?: boolean) => Promise<void>
}

const CACHE_KEY = "pos_data_cache_v2"
const CACHE_TTL = 5 * 60 * 1000 // 5 menit

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
        email: c.email || undefined,
        street: c.street || undefined,
        city: c.city || undefined,
    }
}

function loadFromCache(): { products: Product[]; customers: Customer[] } | null {
    try {
        const raw = localStorage.getItem(CACHE_KEY)
        if (!raw) return null
        const cached = JSON.parse(raw)
        if (Date.now() - cached.timestamp > CACHE_TTL) return null
        return { products: cached.products, customers: cached.customers }
    } catch {
        return null
    }
}

function saveToCache(products: Product[], customers: Customer[]) {
    try {
        localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ products, customers, timestamp: Date.now() })
        )
    } catch {
        // localStorage penuh — abaikan
    }
}

export const usePosData = create<PosDataState>((set, get) => ({
    products: [],
    customers: [],
    isLoading: false,
    error: null,
    lastFetched: null,

    refetch: async (force = false) => {
        const { isLoading } = get()
        if (isLoading) return

        // Coba load dari cache dulu (kecuali force)
        if (!force) {
            const cached = loadFromCache()
            if (cached) {
                set({
                    products: cached.products,
                    customers: cached.customers,
                    isLoading: false,
                    lastFetched: Date.now(),
                })
                return
            }
        }

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

            // Simpan ke cache
            const { products, customers } = get()
            if (products.length > 0 || customers.length > 0) {
                saveToCache(products, customers)
            }
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
