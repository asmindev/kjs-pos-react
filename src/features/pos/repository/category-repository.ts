import { db } from "../db"
import type { Category } from "../domain/models/category.model"
import { CategorySchema } from "../domain/models/category.model"
import { fetchCategories } from "../api/odoo-adapter"

export const categoryRepository = {
    async list(): Promise<Category[]> {
        const results = await db.cachedCategories.toArray()
        return results
            .map((c) => {
                const parsed = CategorySchema.safeParse(c)
                return parsed.success ? parsed.data : null
            })
            .filter(Boolean) as Category[]
    },

    async sync(): Promise<number> {
        const response = await fetchCategories()
        if (response.ok && response.data) {
            const validated = response.data.map((c) => {
                return CategorySchema.parse({
                    id: String(c.id),
                    name: c.name || "Unknown",
                })
            })

            await db.cachedCategories.clear()
            await db.cachedCategories.bulkPut(validated)
            return validated.length
        }
        throw new Error(response.error || "Failed to sync categories")
    },
}
