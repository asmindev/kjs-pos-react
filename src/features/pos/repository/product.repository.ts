import { db } from "@/infrastructure/database/dexie.config"
import type { Product } from "../domain/models/product.model"
import { ProductSchema } from "../domain/models/product.model"
import { fetchProducts } from "../api/odoo.adapter"
import { APP_CONSTANTS } from "@/config/app.config"

export interface IProductRepository {
    list(): Promise<Product[]>
    search(query: string, category: string, limit?: number, offset?: number): Promise<Product[]>
    sync(): Promise<number>
}

export class ProductRepository implements IProductRepository {
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
    }

    async search(query: string, category: string, limit: number = 100, offset: number = 0): Promise<Product[]> {
        let collection = db.cachedProducts.toCollection()
        
        if (query) {
            const q = query.toLowerCase()
            collection = db.cachedProducts.filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    p.barcode.toLowerCase().includes(q)
            )
        }

        // Apply category filter before pagination if possible, 
        // but Dexie filter is executed sequentially.
        // It's safer to filter first, then limit/offset.
        if (category !== APP_CONSTANTS.CATEGORY_ALL) {
            const currentCollection = collection
            collection = currentCollection.filter((p) => p.category === category)
        }

        const results = await collection.offset(offset).limit(limit).toArray()
        
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
    }

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
    }
}

export const productRepository = new ProductRepository()
