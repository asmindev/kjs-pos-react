import { db } from "../db"
import type { Product } from "../domain/models/product.model"
import { ProductSchema } from "../domain/models/product.model"
import { fetchProducts } from "../api/odoo-adapter"

export const productRepository = {
    async list(): Promise<Product[]> {
        const results = await db.cachedProducts.toArray()
        // Map any legacy data if needed, or rely on schema
        return results
            .map((p) => {
                const parsed = ProductSchema.safeParse({
                    id: p.id,
                    barcode: p.barcode,
                    name: p.name,
                    price: p.price,
                    stock: p.stock,
                    category: (p as any).category || "Uncategorized",
                })
                return parsed.success ? parsed.data : null
            })
            .filter(Boolean) as Product[]
    },

    async search(query: string, category: string): Promise<Product[]> {
        let collection = db.cachedProducts.toCollection()
        
        if (query) {
            const q = query.toLowerCase()
            collection = db.cachedProducts.filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    p.barcode.toLowerCase().includes(q)
            )
        }

        const results = await collection.toArray()
        
        return results
            .map((p) => {
                const parsed = ProductSchema.safeParse({
                    id: p.id,
                    barcode: p.barcode,
                    name: p.name,
                    price: p.price,
                    stock: p.stock,
                    category: (p as any).category || "Uncategorized",
                })
                return parsed.success ? parsed.data : null
            })
            .filter((p): p is Product => p !== null && (category === "Semua" || p.category === category))
    },

    async sync(): Promise<number> {
        const response = await fetchProducts()
        if (response.ok && response.data) {
            const validated = response.data.map((p) => {
                return ProductSchema.parse({
                    id: String(p.id),
                    barcode: p.barcode || "",
                    name: p.name || "Unknown Product",
                    price: p.price || 0,
                    stock: p.stock || 0,
                    category: p.category ? String(p.category) : "Uncategorized",
                })
            })

            // Format back for Dexie CachedProduct
            const toCache = validated.map((v) => ({
                id: v.id,
                barcode: v.barcode || "",
                name: v.name,
                price: v.price,
                stock: v.stock,
                category: v.category,
                cachedAt: Date.now(),
            }))

            await db.cachedProducts.clear()
            await db.cachedProducts.bulkPut(toCache)
            return validated.length
        }
        throw new Error(response.error || "Failed to sync products")
    },
}
