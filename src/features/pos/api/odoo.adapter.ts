/**
 * Odoo 10 REST API Adapter
 *
 * Semua komunikasi dengan Odoo backend via pos_rest_api module.
 * JWT token di-attach otomatis dari auth store.
 */

import { tokenRepository } from "@/features/auth/repository/token.repository"
import { logger } from "@/infrastructure/logging/logger"
import { cacheManager } from "@/infrastructure/cache/cache-manager"

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
    const authHeader = tokenRepository.getAuthHeader()

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

        const startMs = Date.now()
        let response = await fetch(`${ODOO_BASE_URL}${path}`, {
            ...options,
            headers,
        })

        if (!response.ok) {
            if (response.status === 401) {
                if (path === "/api/auth/refresh") {
                    return {
                        ok: false,
                        error: "Unauthorized",
                        isUnauthorized: true,
                    }
                }

                // Try to refresh token automatically
                const refreshRes = await refreshToken()
                if (refreshRes.ok && refreshRes.data) {
                    tokenRepository.setToken(refreshRes.data.token)
                    headers["Authorization"] = `Bearer ${refreshRes.data.token}`
                    
                    // Retry original request
                    response = await fetch(`${ODOO_BASE_URL}${path}`, {
                        ...options,
                        headers,
                    })

                    if (!response.ok) {
                        if (response.status === 401) {
                            tokenRepository.clearToken()
                            // Force clear auth state too, but maybe through event?
                            // For now we just clear the token repository.
                            return { ok: false, error: "Unauthorized", isUnauthorized: true }
                        }
                        return { ok: false, error: `HTTP ${response.status}` }
                    }
                } else {
                    tokenRepository.clearToken()
                    return {
                        ok: false,
                        error: "Unauthorized",
                        isUnauthorized: true,
                    }
                }
            } else {
                logger.warn("odooFetch non-OK response", {
                    path,
                    status: response.status,
                    elapsedMs: Date.now() - startMs,
                })
                return { ok: false, error: `HTTP ${response.status}` }
            }
        }

        const data = await response.json()
        logger.debug("odooFetch OK", {
            path,
            elapsedMs: Date.now() - startMs,
        })
        return { ok: true, data }
    } catch (error) {
        logger.error("odooFetch threw", {
            path,
            error: error instanceof Error ? error.message : error,
        })
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
    uom: string
    category?: string
}

const PRODUCT_CACHE_TTL_MS = 5 * 60_000 // 5 minutes

export async function fetchProducts(): Promise<OdooResponse<OdooProduct[]>> {
    const cacheKey = "odoo:products:all"
    const cached = await cacheManager.get<OdooProduct[]>(cacheKey)
    if (cached) {
        logger.debug("fetchProducts:cache hit")
        return { ok: true, data: cached }
    }

    const result = await odooFetch<{ products: OdooProduct[] }>("/api/products")
    if (result.ok && result.data) {
        await cacheManager.set(cacheKey, result.data.products, PRODUCT_CACHE_TTL_MS)
        return { ok: true, data: result.data.products }
    }
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
    // Search is parameterized by query — no caching to avoid stale results.
    const result = await odooFetch<{ products: OdooProduct[] }>(
        `/api/products/search?q=${encodeURIComponent(query)}`
    )
    if (result.ok && result.data) {
        return { ok: true, data: result.data.products }
    }
    return { ok: false, error: result.error, isUnauthorized: result.isUnauthorized }
}

// --- Categories ---

export type OdooCategory = {
    id: number
    name: string
}

const CATEGORY_CACHE_TTL_MS = 60 * 60_000 // 1 hour — categories rarely change

export async function fetchCategories(): Promise<
    OdooResponse<OdooCategory[]>
> {
    const cacheKey = "odoo:categories:all"
    const cached = await cacheManager.get<OdooCategory[]>(cacheKey)
    if (cached) {
        logger.debug("fetchCategories:cache hit")
        return { ok: true, data: cached }
    }

    const result = await odooFetch<{ categories: OdooCategory[] }>(
        "/api/categories"
    )
    if (result.ok && result.data) {
        await cacheManager.set(cacheKey, result.data.categories, CATEGORY_CACHE_TTL_MS)
        return { ok: true, data: result.data.categories }
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
    // Search is parameterized by query — no caching to avoid stale results.
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

export type OdooTransactionResponse = {
    id: number
    reference: string
}

export async function createTransaction(
    payload: OdooTransactionPayload
): Promise<OdooResponse<OdooTransactionResponse>> {
    return odooFetch<OdooTransactionResponse>("/api/transactions", {
        method: "POST",
        body: JSON.stringify(payload),
    })
}

// --- Health ---

export type OdooHealthResponse = {
    version: string
}

export async function checkOdooConnection(): Promise<
    OdooResponse<OdooHealthResponse>
> {
    return odooFetch<OdooHealthResponse>("/api/health")
}

// --- Auth Refresh ---

export type OdooAuthRefreshResponse = {
    token: string
    expires_at: string
}

export async function refreshToken(): Promise<
    OdooResponse<OdooAuthRefreshResponse>
> {
    return odooFetch<OdooAuthRefreshResponse>("/api/auth/refresh")
}

export { odooFetch }
