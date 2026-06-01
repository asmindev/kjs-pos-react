import { create } from "zustand"
import {
    fetchProducts,
    fetchCustomers,
    fetchProductsByQuery,
    fetchCategories,
    refreshToken,
    type OdooProduct,
    type OdooCustomer,
} from "@/features/pos/api/odoo-adapter"
import { useAuth } from "@/features/pos/hooks/use-auth"

type Product = {
    id: string
    barcode: string
    name: string
    price: number
    stock: number
    category: string
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
    categories: string[]
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

const mapProduct = (p: OdooProduct): Product => ({
    id: String(p.id),
    barcode: p.barcode || "",
    name: p.name,
    price: p.price,
    stock: p.stock,
    category: p.category || "Lainnya",
})

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

function saveToCache(
    products: Product[],
    customers: Customer[],
    categories: string[]
) {
    try {
        const data = {
            products,
            customers,
            categories,
            timestamp: Date.now(),
        }
        localStorage.setItem(CACHE_KEY, JSON.stringify(data))
    } catch {
        // ignore storage errors
    }
}

function loadFromCache(): {
    products: Product[]
    customers: Customer[]
    categories: string[]
} | null {
    try {
        const raw = localStorage.getItem(CACHE_KEY)
        if (!raw) return null
        const cached = JSON.parse(raw)
        if (Date.now() - cached.timestamp > CACHE_TTL) return null
        return {
            products: cached.products,
            customers: cached.customers,
            categories: cached.categories,
        }
    } catch {
        return null
    }
}

export const usePosData = create<PosDataState>((set, get) => ({
    products: [],
    customers: [],
    categories: ["Semua"],
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
                    categories: cached.categories || ["Semua"],
                    isLoading: false,
                    lastFetched: Date.now(),
                })
                return
            }
        }

        set({ isLoading: true, error: null })

        try {
            const [prodResult, custResult, catResult] = await Promise.all([
                fetchProducts(),
                fetchCustomers(),
                fetchCategories(),
            ])

            const updates: Partial<PosDataState> = {}

            if (prodResult.ok && prodResult.data) {
                updates.products = prodResult.data.map(mapProduct)
            } else if (prodResult.isUnauthorized) {
                // Coba refresh token otomatis sebelum menyerah
                const refreshResult = await refreshToken()
                if (refreshResult.ok && refreshResult.data?.token) {
                    // Token berhasil di-refresh — update auth dan retry
                    useAuth.getState().setToken(refreshResult.data.token)
                    set({ isLoading: false, isUnauthorized: false })
                    // Retry refetch dengan token baru
                    get().refetch(true)
                    return
                }
                // Refresh juga gagal — tampilkan restricted modal
                try {
                    localStorage.removeItem(CACHE_KEY)
                } catch {
                    /* ignore */
                }
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

            if (catResult.ok && catResult.data) {
                // Tambahkan "Semua" di awal
                const catNames = catResult.data.map((c) => c.name)
                // Filter out duplicates and keep alphabetical if needed, but let's just prepend "Semua"
                updates.categories = ["Semua", ...Array.from(new Set<string>(catNames))]
            }

            updates.lastFetched = Date.now()
            updates.isLoading = false
            set(updates)

            // Simpan ke cache
            const { products, customers, categories } = get()
            if (products.length > 0 || customers.length > 0) {
                saveToCache(products, customers, categories)
            }
        } catch (e) {
            set({
                isLoading: false,
                error: e instanceof Error ? e.message : "Gagal memuat data",
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
                    const newProducts = mapped.filter(
                        (p) => !existingIds.has(p.id)
                    )
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
