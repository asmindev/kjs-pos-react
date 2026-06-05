/**
 * Thin typed wrappers over `odooFetch`.
 *
 * Repository code (in `repository/`) is the canonical path for product
 * data — it writes to Dexie and reads from there. This module exists for
 * one-shot lookups (barcode scan, server-side search) where caching
 * through the repository would be overkill.
 */

import { z } from "zod"
import { odooFetch, type OdooProduct } from "./odoo.adapter"
import { ProductSchema, type Product } from "../domain/models/product.model"

export const OdooProductWrapperSchema = ProductSchema.extend({
    serverId: z.number().optional(),
})

export type OdooProductWrapper = z.infer<typeof OdooProductWrapperSchema>

export async function listProducts(): Promise<Product[]> {
    const result = await odooFetch<{ products: OdooProduct[] }>(
        "/api/products"
    )
    if (!result.ok || !result.data) {
        return []
    }
    return result.data.products
        .map((p) => {
            const parsed = ProductSchema.safeParse({
                id: String(p.id),
                barcode: p.barcode,
                name: p.name,
                price: p.price,
                stock: p.stock,
                category: p.category ?? "",
            })
            return parsed.success ? parsed.data : null
        })
        .filter(Boolean) as Product[]
}

export async function findProductByBarcode(
    barcode: string
): Promise<Product | null> {
    const result = await odooFetch<{ product: OdooProduct }>(
        `/api/products/barcode/${encodeURIComponent(barcode)}`
    )
    if (!result.ok || !result.data) {
        return null
    }
    const p = result.data.product
    const parsed = ProductSchema.safeParse({
        id: String(p.id),
        barcode: p.barcode,
        name: p.name,
        price: p.price,
        stock: p.stock,
        category: p.category ?? "",
    })
    return parsed.success ? parsed.data : null
}
