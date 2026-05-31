import { useEffect, useState, useCallback } from "react"
import {
    fetchProducts,
    fetchCustomers,
    type OdooProduct,
    type OdooCustomer,
} from "@/features/pos/api/odoo-adapter"
import { useAuth } from "@/features/pos/hooks/use-auth"
import { useNetworkStatus } from "@/shared/hooks/use-network-status"

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

export function usePosData(): PosDataState {
    const { isAuthenticated } = useAuth()
    const { isOnline } = useNetworkStatus()
    const [products, setProducts] = useState<Product[]>([])
    const [customers, setCustomers] = useState<Customer[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [lastFetched, setLastFetched] = useState<number | null>(null)

    const refetch = useCallback(async () => {
        if (!isAuthenticated || !isOnline) return

        setIsLoading(true)
        setError(null)

        try {
            const [prodResult, custResult] = await Promise.all([
                fetchProducts(),
                fetchCustomers(),
            ])

            if (prodResult.ok && prodResult.data) {
                setProducts(prodResult.data.map(mapProduct))
            } else {
                setError(prodResult.error || "Gagal fetch produk")
            }

            if (custResult.ok && custResult.data) {
                setCustomers(custResult.data.map(mapCustomer))
            }
            // Customer gagal tidak blocking — gunakan empty list

            setLastFetched(Date.now())
        } catch (e) {
            setError(
                e instanceof Error ? e.message : "Gagal memuat data"
            )
        } finally {
            setIsLoading(false)
        }
    }, [isAuthenticated, isOnline])

    // Auto-fetch on mount and when auth/online changes
    useEffect(() => {
        if (isAuthenticated && isOnline) {
            refetch()
        }
    }, [isAuthenticated, isOnline, refetch])

    return {
        products,
        customers,
        isLoading,
        error,
        lastFetched,
        refetch,
    }
}
