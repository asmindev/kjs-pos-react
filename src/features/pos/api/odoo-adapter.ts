/**
 * Odoo 10 REST API Adapter
 *
 * Semua komunikasi dengan Odoo backend via pos_rest_api module.
 * JWT token di-attach otomatis dari auth store.
 */

import { useAuth } from "@/features/pos/hooks/use-auth"

const ODOO_BASE_URL =
    import.meta.env.VITE_ODOO_URL ?? "http://localhost:8001"

type OdooResponse<T> = {
    ok: boolean
    data?: T
    error?: string
    isUnauthorized?: boolean
}

async function odooFetch<T>(
    path: string,
    options?: RequestInit
): Promise<OdooResponse<T>> {
    const { getAuthHeader } = useAuth.getState()
    const authHeader = getAuthHeader()

    try {
        const headers: Record<string, string> = {
            ...(options?.headers as Record<string, string>),
        }
        // Jangan set Content-Type untuk GET — Odoo coba parse body kosong
        if (options?.method && options.method !== "GET") {
            headers["Content-Type"] = "application/json"
        }

        if (authHeader) {
            headers["Authorization"] = authHeader
        }

        const response = await fetch(`${ODOO_BASE_URL}${path}`, {
            ...options,
            headers,
        })

        if (!response.ok) {
            if (response.status === 401) {
                return {
                    ok: false,
                    error: "Unauthorized",
                    isUnauthorized: true,
                }
            }
            return { ok: false, error: `HTTP ${response.status}` }
        }

        const data = await response.json()
        return { ok: true, data }
    } catch (error) {
        return {
            ok: false,
            error:
                error instanceof Error ? error.message : "Network error",
        }
    }
}

// --- Products ---

export type OdooProduct = {
    id: number
    barcode: string
    name: string
    price: number
    stock: number
    uom?: string
}

export async function fetchProducts(): Promise<OdooResponse<OdooProduct[]>> {
    const result = await odooFetch<{ products: OdooProduct[] }>(
        "/api/products"
    )
    if (result.ok && result.data) {
        return { ok: true, data: result.data.products }
    }
    // Teruskan isUnauthorized agar caller bisa deteksi 401
    return { ok: false, error: result.error, isUnauthorized: result.isUnauthorized }
}

export async function fetchProductByBarcode(
    barcode: string
): Promise<OdooResponse<OdooProduct>> {
    const result = await odooFetch<{ product: OdooProduct }>(
        `/api/products/barcode/${barcode}`
    )
    if (result.ok && result.data) {
        return { ok: true, data: result.data.product }
    }
    return { ok: false, error: result.error }
}

export async function fetchProductsByQuery(
    query: string
): Promise<OdooResponse<OdooProduct[]>> {
    const result = await odooFetch<{ products: OdooProduct[] }>(
        `/api/products/search?q=${encodeURIComponent(query)}`
    )
    if (result.ok && result.data) {
        return { ok: true, data: result.data.products }
    }
    return { ok: false, error: result.error, isUnauthorized: result.isUnauthorized }
}

// --- Customers ---

export type OdooCustomer = {
    id: number
    name: string
    phone?: string
    mobile?: string
    email?: string
    street?: string
    city?: string
}

export async function fetchCustomers(
    query?: string
): Promise<OdooResponse<OdooCustomer[]>> {
    const params = query ? `?q=${encodeURIComponent(query)}` : ""
    const result = await odooFetch<{ customers: OdooCustomer[] }>(
        `/api/customers${params}`
    )
    if (result.ok && result.data) {
        return { ok: true, data: result.data.customers }
    }
    return { ok: false, error: result.error }
}

// --- Transactions ---

export type OdooTransactionPayload = {
    reference: string
    items: Array<{
        productId: string
        productName: string
        price: number
        quantity: number
    }>
    subtotal: number
    discount: number
    total: number
    payment_method: string
    paid_amount: number
    change_amount: number
    customer_id?: string
    customer_name?: string
    created_at: string
}

export async function createTransaction(
    payload: OdooTransactionPayload
): Promise<OdooResponse<{ id: number; reference: string }>> {
    return odooFetch("/api/transactions", {
        method: "POST",
        body: JSON.stringify(payload),
    })
}

// --- Health ---

export async function checkOdooConnection(): Promise<
    OdooResponse<{ version: string }>
> {
    return odooFetch("/api/health")
}

export { odooFetch }
