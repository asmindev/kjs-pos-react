import { db } from "../db"
import type { Customer } from "../domain/models/customer.model"
import { CustomerSchema } from "../domain/models/customer.model"
import { fetchCustomers } from "../api/odoo-adapter"

export const customerRepository = {
    async list(): Promise<Customer[]> {
        const results = await db.cachedCustomers.toArray()
        return results
            .map((c) => {
                const parsed = CustomerSchema.safeParse(c)
                return parsed.success ? parsed.data : null
            })
            .filter(Boolean) as Customer[]
    },

    async search(query: string): Promise<Customer[]> {
        const q = query.toLowerCase()
        const collection = db.cachedCustomers.filter((c) => {
            return !!(
                c.name.toLowerCase().includes(q) ||
                (c.email && c.email.toLowerCase().includes(q)) ||
                (c.phone && c.phone.toLowerCase().includes(q)) ||
                (c.barcode && c.barcode.toLowerCase().includes(q))
            )
        })
        const results = await collection.toArray()
        return results
            .map((c) => {
                const parsed = CustomerSchema.safeParse(c)
                return parsed.success ? parsed.data : null
            })
            .filter(Boolean) as Customer[]
    },

    async sync(): Promise<number> {
        const response = await fetchCustomers()
        if (response.ok && response.data) {
            const validated = response.data.map((c) => {
                return CustomerSchema.parse({
                    id: String(c.id),
                    name: c.name || "Unknown",
                    email: c.email || undefined,
                    phone: c.phone || c.mobile || undefined,
                    barcode: undefined,
                })
            })

            await db.cachedCustomers.clear()
            await db.cachedCustomers.bulkPut(validated)
            return validated.length
        }
        throw new Error(response.error || "Failed to sync customers")
    },
}
