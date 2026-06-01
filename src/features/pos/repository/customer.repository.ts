import { db } from "@/infrastructure/database/dexie.config"
import type { Customer } from "../domain/models/customer.model"
import { CustomerSchema } from "../domain/models/customer.model"
import { fetchCustomers } from "../api/odoo.adapter"

export interface ICustomerRepository {
    list(): Promise<Customer[]>
    search(query: string, limit?: number, offset?: number): Promise<Customer[]>
    sync(): Promise<number>
}

export class CustomerRepository implements ICustomerRepository {
    async list(): Promise<Customer[]> {
        const results = await db.cachedCustomers.toArray()
        return results
            .map((c) => {
                const parsed = CustomerSchema.safeParse(c)
                return parsed.success ? parsed.data : null
            })
            .filter(Boolean) as Customer[]
    }

    async search(query: string, limit: number = 50, offset: number = 0): Promise<Customer[]> {
        let collection = db.cachedCustomers.toCollection()

        if (query) {
            const q = query.toLowerCase()
            collection = db.cachedCustomers.filter((c) => {
                return !!(
                    c.name.toLowerCase().includes(q) ||
                    (c.email && c.email.toLowerCase().includes(q)) ||
                    (c.phone && c.phone.toLowerCase().includes(q)) ||
                    (c.barcode && c.barcode.toLowerCase().includes(q))
                )
            })
        }
        
        const results = await collection.offset(offset).limit(limit).toArray()
        return results
            .map((c) => {
                const parsed = CustomerSchema.safeParse(c)
                return parsed.success ? parsed.data : null
            })
            .filter(Boolean) as Customer[]
    }

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
    }
}

export const customerRepository = new CustomerRepository()
