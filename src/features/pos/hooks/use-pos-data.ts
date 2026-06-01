import { create } from "zustand"
import {
    fetchProducts,
    fetchCustomers,
    fetchProductsByQuery,
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
    isUnauthorized: boolean
    lastFetched: number | null
    isSearching: boolean
    searchResults: Product[]

    refetch: (force?: boolean) => Promise<void>
    searchProducts: (query: string) => Promise<void>
    clearSearch: () => void
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
    isUnauthorized: false,
    lastFetched: null,
    isSearching: false,
    searchResults: [],

    refetch: async (force = false) => {
        const { isLoading, isUnauthorized: alreadyUnauthorized } = get()
        if (isLoading) return

        // Jika sudah unauthorized, langsung hit API (jangan pakai cache)
        if (!force && !alreadyUnauthorized) {
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
            } else if (prodResult.isUnauthorized) {
                // Hapus cache agar tidak ada data stale setelah login ulang
                try { localStorage.removeItem(CACHE_KEY) } catch { /* ignore */ }
                set({
                    isLoading: false,
                    isUnauthorized: true,
                    error: "Tidak memiliki akses ke POS. Silakan hubungi administrator.",
                })
                return
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

    searchProducts: async (query: string) => {
        if (!query.trim()) {
            set({ searchResults: [], isSearching: false })
            return
        }
        set({ isSearching: true })
        try {
            const result = await fetchProductsByQuery(query)
            if (result.ok && result.data) {
                const mapped = result.data.map(mapProduct)
                // Merge ke products lokal agar hasil search bisa dipakai cart
                set((state) => {
                    const existingIds = new Set(state.products.map((p) => p.id))
                    const newProducts = mapped.filter((p) => !existingIds.has(p.id))
                    return {
                        searchResults: mapped,
                        products: [...state.products, ...newProducts],
                        isSearching: false,
                    }
                })
            } else {
                set({ searchResults: [], isSearching: false })
            }
        } catch {
            set({ searchResults: [], isSearching: false })
        }
    },

    clearSearch: () => set({ searchResults: [], isSearching: false }),
}))
