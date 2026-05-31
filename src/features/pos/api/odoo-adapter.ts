/**
 * Odoo 10 REST API Adapter
 *
 * Handles communication with Odoo backend.
 * All calls go through this adapter so we can:
 * - Swap endpoints easily
 * - Handle auth centrally
 * - Queue requests when offline
 */

// TODO: Move to environment config
const ODOO_BASE_URL = import.meta.env.VITE_ODOO_URL ?? "http://localhost:8069"

type OdooResponse<T> = {
    ok: boolean
    data?: T
    error?: string
}

async function odooFetch<T>(
    path: string,
    options?: RequestInit
): Promise<OdooResponse<T>> {
    try {
        const response = await fetch(`${ODOO_BASE_URL}${path}`, {
            headers: {
                "Content-Type": "application/json",
                ...options?.headers,
            },
            ...options,
        })

        if (!response.ok) {
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
    list_price: number
    qty_available: number
}

export async function fetchProducts(): Promise<OdooResponse<OdooProduct[]>> {
    return odooFetch<OdooProduct[]>("/api/products")
}

export async function fetchProductByBarcode(
    barcode: string
): Promise<OdooResponse<OdooProduct>> {
    return odooFetch<OdooProduct>(`/api/products/barcode/${barcode}`)
}

// --- Customers ---

export type OdooCustomer = {
    id: number
    name: string
    phone?: string
    mobile?: string
    email?: string
}

export async function fetchCustomers(
    query?: string
): Promise<OdooResponse<OdooCustomer[]>> {
    const params = query ? `?q=${encodeURIComponent(query)}` : ""
    return odooFetch<OdooCustomer[]>(`/api/customers${params}`)
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

// --- Session / Health ---

export async function checkOdooConnection(): Promise<OdooResponse<{ version: string }>> {
    return odooFetch("/api/health")
}

export { odooFetch }
