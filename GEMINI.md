# GEMINI.md — POS Retail Offline-First Development Guide

> **Project**: POS Retail Offline-First
> **Stack**: React + Vite + TanStack Router (Code-Based) + TanStack Query + Zod + Zustand + Dexie.js + shadcn/ui
> **Backend**: Odoo 10 REST API
> **Hardware**: Thermal Printer (ESC/POS via Web Serial API)
> **Architecture**: Feature-Based + Domain-Driven Design + Repository Pattern

---

## Table of Contents

1. [Architecture Principles](#architecture-principles)
2. [Folder Structure Rules](#folder-structure-rules)
3. [Naming Conventions](#naming-conventions)
4. [Code Patterns](#code-patterns)
5. [Feature Development Workflow](#feature-development-workflow)
6. [Database Schema](#database-schema)
7. [API Integration (Odoo 10)](#api-integration-odoo-10)
8. [Offline-First Rules](#offline-first-rules)
9. [Printer Integration](#printer-integration)
10. [State Management Rules](#state-management-rules)
11. [Error Handling](#error-handling)
12. [Common Pitfalls](#common-pitfalls)

---

## Architecture Principles

### 1. Separation of Concerns

```

┌─────────────────────────────────────────┐
│ Presentation (React Components) │
│ → Pure UI, no business logic │
├─────────────────────────────────────────┤
│ Application (Hooks, Pages) │
│ → Orchestrate domain operations │
├─────────────────────────────────────────┤
│ Domain (Models, Services) │
│ → Business rules, calculations │
│ → Pure functions, framework-agnostic │
├─────────────────────────────────────────┤
│ Infrastructure (Repository, API) │
│ → Data access, external services │
└─────────────────────────────────────────┘

```

### 2. Dependency Rule

- **Domain** layer MUST NOT import from Application, Infrastructure, or Presentation
- **Application** layer CAN import from Domain
- **Infrastructure** layer CAN import from Domain
- **Presentation** layer CAN import from all layers above

### 3. Offline-First Mantra

```

ALWAYS write to local DB first → THEN attempt sync to server
NEVER block UI waiting for server response
ALWAYS show optimistic updates
ALWAYS handle conflict resolution gracefully

```

---

## Folder Structure Rules

### Absolute Rules

| Rule                                                       | Enforcement                                   |
| ---------------------------------------------------------- | --------------------------------------------- |
| Code-based routing in `src/app/router.tsx`                 | No file-based routing, define routes manually |
| Business logic MUST be in `src/features/*/domain/`         | Never in components                           |
| Data access MUST go through Repository                     | Never call Dexie directly from hooks          |
| Shared components MUST be in `src/shared/components/ui/`   | shadcn primitives only                        |
| Feature components MUST be in `src/features/*/components/` | Domain-specific UI                            |

### Import Rules

```typescript
// ✅ CORRECT: Use path aliases
import { Product } from "@/features/pos/domain/models/product.model"
import { Button } from "@/shared/components/ui/button"
import { db } from "@/infrastructure/database/dexie.config"

// ❌ WRONG: Relative paths for cross-feature imports
import { Product } from "../../features/pos/domain/models/product.model"
```

### File Organization Per Feature

```
features/[feature-name]/
├── domain/
│   ├── models/           # Zod schemas + types
│   └── services/         # Pure business logic functions
├── api/                  # External API adapters
├── repository/           # Data access layer (IndexedDB + API)
├── hooks/                # React hooks (useQuery, useMutation, useState)
├── components/           # Feature-specific React components
│   └── [subdomain]/      # Group by subdomain (product/, cart/, etc.)
├── pages/                # Page-level components (used in routes)
└── constants.ts          # Feature constants
```

---

## Naming Conventions

### Files: Kebab-Case ONLY

| Pattern           | Example                 | Purpose                         |
| ----------------- | ----------------------- | ------------------------------- |
| `*.model.ts`      | `product.model.ts`      | Zod schema + types              |
| `*.service.ts`    | `pricing.service.ts`    | Business logic (pure functions) |
| `*.repository.ts` | `product.repository.ts` | Data access                     |
| `*.adapter.ts`    | `odoo.adapter.ts`       | External API client             |
| `*.api.ts`        | `product.api.ts`        | TanStack Query hooks            |
| `use-*.ts`        | `use-products.ts`       | React hooks                     |
| `*.tsx`           | `product-card.tsx`      | React components                |

### Types & Interfaces

```typescript
// Domain models: PascalCase, descriptive
interface Product { ... }
interface CartLine { ... }
interface Transaction { ... }

// DTOs for API: suffix with Dto or Input/Output
interface CreateTransactionInput { ... }
interface OdooProductResponse { ... }

// Repository interfaces: prefix with I
interface IProductRepository { ... }
interface ITransactionRepository { ... }
```

### Functions

```typescript
// Services: verb + noun, descriptive
function calculateLineTotal(...) { ... }
function formatReceiptData(...) { ... }

// Repositories: CRUD naming
async function findById(id: number) { ... }
async function findByBarcode(barcode: string) { ... }
async function bulkInsert(items: T[]) { ... }

// Hooks: prefix with use, describe state
function useCart() { ... }
function useProducts(search: ProductSearch) { ... }
```

---

## Code Patterns

### 1. Domain Model Pattern

```typescript
// features/pos/domain/models/product.model.ts
import { z } from "zod"

export const ProductSchema = z.object({
    id: z.number(),
    name: z.string().min(1),
    barcode: z.string().optional(),
    listPrice: z.number().positive(),
    // ... more fields
    meta: z.object({
        lastSynced: z.string().datetime(),
        version: z.number().default(1),
    }),
})

export type Product = z.infer<typeof ProductSchema>

// Export search params schema too
export const ProductSearchSchema = z.object({
    query: z.string().optional(),
    categoryId: z.number().optional(),
    limit: z.number().max(100).default(20),
    offset: z.number().default(0),
})

export type ProductSearch = z.infer<typeof ProductSearchSchema>
```

### 2. Repository Pattern

```typescript
// features/pos/repository/product.repository.ts
import { db } from "@/infrastructure/database/dexie.config"
import {
    Product,
    ProductSchema,
    ProductSearch,
} from "../domain/models/product.model"
import { odooAdapter } from "../api/odoo.adapter"

export interface IProductRepository {
    findById(id: number): Promise<Product | undefined>
    findByBarcode(barcode: string): Promise<Product | undefined>
    search(params: ProductSearch): Promise<Product[]>
    syncFromServer(): Promise<number>
}

export class ProductRepository implements IProductRepository {
    async findById(id: number): Promise<Product | undefined> {
        const raw = await db.products.get(id)
        return raw ? ProductSchema.parse(raw) : undefined
    }

    async findByBarcode(barcode: string): Promise<Product | undefined> {
        const raw = await db.products.where("barcode").equals(barcode).first()
        return raw ? ProductSchema.parse(raw) : undefined
    }

    async search({
        query,
        categoryId,
        limit = 20,
        offset = 0,
    }: ProductSearch): Promise<Product[]> {
        let collection = db.products.toCollection()

        if (query) {
            collection = db.products
                .where("name")
                .startsWithIgnoreCase(query)
                .or("barcode")
                .startsWith(query)
        }

        const results = await collection.offset(offset).limit(limit).toArray()
        return results.map((p) => ProductSchema.parse(p))
    }

    async syncFromServer(): Promise<number> {
        const lastSync = await db.metadata.get("products-last-sync")
        const products = await odooAdapter.getProducts({
            updatedAfter: lastSync?.value,
        })

        const validated = products.map((p) =>
            ProductSchema.parse({
                ...p,
                meta: { lastSynced: new Date().toISOString(), version: 1 },
            })
        )

        await db.products.bulkPut(validated)
        await db.metadata.put({
            key: "products-last-sync",
            value: new Date().toISOString(),
        })

        return validated.length
    }
}

// Singleton export
export const productRepository = new ProductRepository()
```

### 3. Service Pattern (Pure Business Logic)

```typescript
// features/pos/domain/services/pricing.service.ts
import { Product } from "../models/product.model"

export interface PricingResult {
    subtotal: number
    taxAmount: number
    discountAmount: number
    total: number
}

export interface CartLineInput {
    product: Product
    quantity: number
    discountPercent: number
}

export class PricingService {
    private readonly DEFAULT_TAX_RATE = 0.11 // PPN 11%

    calculateLineTotal(
        product: Product,
        quantity: number,
        discountPercent: number = 0,
        taxRate: number = this.DEFAULT_TAX_RATE
    ): PricingResult {
        const subtotal = product.listPrice * quantity
        const discountAmount = subtotal * (discountPercent / 100)
        const taxableAmount = subtotal - discountAmount
        const taxAmount = taxableAmount * taxRate
        const total = taxableAmount + taxAmount

        return { subtotal, taxAmount, discountAmount, total }
    }

    calculateCartTotal(lines: CartLineInput[]): PricingResult {
        return lines.reduce(
            (acc, line) => {
                const lineResult = this.calculateLineTotal(
                    line.product,
                    line.quantity,
                    line.discountPercent
                )
                return {
                    subtotal: acc.subtotal + lineResult.subtotal,
                    taxAmount: acc.taxAmount + lineResult.taxAmount,
                    discountAmount:
                        acc.discountAmount + lineResult.discountAmount,
                    total: acc.total + lineResult.total,
                }
            },
            { subtotal: 0, taxAmount: 0, discountAmount: 0, total: 0 }
        )
    }
}

export const pricingService = new PricingService()
```

### 4. TanStack Query Hook Pattern

```typescript
// features/pos/hooks/use-products.ts
import { useQuery } from "@tanstack/react-query"
import { productRepository } from "../repository/product.repository"
import { ProductSearch } from "../domain/models/product.model"

export function useProducts(search: ProductSearch = {}) {
    return useQuery({
        queryKey: ["products", search],
        queryFn: () => productRepository.search(search),
        staleTime: 1000 * 60 * 5, // 5 minutes
    })
}

export function useProductByBarcode(barcode: string) {
    return useQuery({
        queryKey: ["product", "barcode", barcode],
        queryFn: () => productRepository.findByBarcode(barcode),
        enabled: barcode.length > 0,
    })
}

export function useSyncProducts() {
    return useQuery({
        queryKey: ["products", "sync"],
        queryFn: () => productRepository.syncFromServer(),
        enabled: false, // Manual trigger only
    })
}
```

### 5. Zustand Store Pattern

```typescript
// features/pos/hooks/use-cart.ts
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { Product } from "../domain/models/product.model"
import {
    pricingService,
    PricingResult,
} from "../domain/services/pricing.service"

interface CartItem {
    product: Product
    quantity: number
    discountPercent: number
    note?: string
}

interface CartState {
    items: CartItem[]
    customerId?: number

    // Actions
    addItem: (product: Product, quantity?: number) => void
    removeItem: (productId: number) => void
    updateQuantity: (productId: number, quantity: number) => void
    updateDiscount: (productId: number, discount: number) => void
    clear: () => void

    // Computed (use getters or selectors)
    getTotals: () => PricingResult
    getItemCount: () => number
}

export const useCart = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            customerId: undefined,

            addItem: (product, quantity = 1) => {
                set((state) => {
                    const existing = state.items.find(
                        (i) => i.product.id === product.id
                    )
                    if (existing) {
                        return {
                            items: state.items.map((i) =>
                                i.product.id === product.id
                                    ? { ...i, quantity: i.quantity + quantity }
                                    : i
                            ),
                        }
                    }
                    return {
                        items: [
                            ...state.items,
                            { product, quantity, discountPercent: 0 },
                        ],
                    }
                })
            },

            removeItem: (productId) => {
                set((state) => ({
                    items: state.items.filter(
                        (i) => i.product.id !== productId
                    ),
                }))
            },

            updateQuantity: (productId, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(productId)
                    return
                }
                set((state) => ({
                    items: state.items.map((i) =>
                        i.product.id === productId ? { ...i, quantity } : i
                    ),
                }))
            },

            updateDiscount: (productId, discount) => {
                set((state) => ({
                    items: state.items.map((i) =>
                        i.product.id === productId
                            ? { ...i, discountPercent: discount }
                            : i
                    ),
                }))
            },

            clear: () => set({ items: [], customerId: undefined }),

            getTotals: () => {
                const { items } = get()
                return pricingService.calculateCartTotal(
                    items.map((i) => ({
                        product: i.product,
                        quantity: i.quantity,
                        discountPercent: i.discountPercent,
                    }))
                )
            },

            getItemCount: () => {
                return get().items.reduce((sum, i) => sum + i.quantity, 0)
            },
        }),
        {
            name: "pos-cart-storage",
            partialize: (state) => ({
                items: state.items,
                customerId: state.customerId,
            }),
        }
    )
)
```

### 6. Code-Based Route Pattern

```typescript
// src/app/router.tsx
import {
    createRouter,
    createRoute,
    createRootRoute,
} from "@tanstack/react-router"
import { RootLayout } from "@/shared/components/layout/root-layout"
import { LoginPage } from "@/features/auth/pages/login-page"
import { PosDashboard } from "@/features/pos/pages/pos-dashboard"
import { ProductBrowser } from "@/features/pos/pages/product-browser"
import { CartPage } from "@/features/pos/pages/cart-page"
import { CheckoutPage } from "@/features/pos/pages/checkout-page"
import { TransactionHistory } from "@/features/pos/pages/transaction-history"
import { tokenRepository } from "@/features/auth/repository/token.repository"

// Root route
const rootRoute = createRootRoute({
    component: RootLayout,
    beforeLoad: async ({ location }) => {
        if (location.pathname === "/login") return
        const isValid = await tokenRepository.isAccessTokenValid()
        if (!isValid) {
            throw redirect({ to: "/login" })
        }
    },
})

// Auth routes (public)
const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/login",
    component: LoginPage,
    beforeLoad: async () => {
        const isValid = await tokenRepository.isAccessTokenValid()
        if (isValid) throw redirect({ to: "/" })
    },
})

// POS routes (protected)
const dashboardRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: PosDashboard,
})

const productsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/products",
    component: ProductBrowser,
})

const productDetailRoute = createRoute({
    getParentRoute: () => productsRoute,
    path: "$barcode",
    component: ProductDetailPage,
    loader: async ({ params }) => {
        const { productRepository } =
            await import("@/features/pos/repository/product.repository")
        const product = await productRepository.findByBarcode(params.barcode)
        if (!product) throw new Error("Product not found")
        return { product }
    },
})

const cartRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/cart",
    component: CartPage,
})

const checkoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/checkout",
    component: CheckoutPage,
})

const checkoutSuccessRoute = createRoute({
    getParentRoute: () => checkoutRoute,
    path: "success",
    component: CheckoutSuccessPage,
})

const transactionsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/transactions",
    component: TransactionHistory,
})

const transactionDetailRoute = createRoute({
    getParentRoute: () => transactionsRoute,
    path: "$id",
    component: TransactionDetailPage,
})

// Build route tree
const routeTree = rootRoute.addChildren([
    loginRoute,
    dashboardRoute,
    productsRoute.addChildren([productDetailRoute]),
    cartRoute,
    checkoutRoute.addChildren([checkoutSuccessRoute]),
    transactionsRoute.addChildren([transactionDetailRoute]),
])

export const router = createRouter({
    routeTree,
    context: {
        queryClient,
    },
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
})

declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router
    }
}
```

---

## Feature Development Workflow

### Step-by-Step

```
1. Define domain models (Zod schemas + types)
   ↓
2. Implement business logic services (pure functions)
   ↓
3. Create repository interface + implementation
   ↓
4. Build API adapter (Odoo integration)
   ↓
5. Create TanStack Query hooks
   ↓
6. Build React components
   ↓
7. Create page components
   ↓
8. Wire up routes in router.tsx
   ↓
9. Add error boundaries & loading states
   ↓
10. Test offline behavior
```

### Checklist for New Feature

- [ ] Domain models defined with Zod
- [ ] Business logic in services (testable, pure)
- [ ] Repository implements interface
- [ ] API adapter handles Odoo mapping
- [ ] Hooks use TanStack Query properly
- [ ] Components are presentational (no business logic)
- [ ] Routes defined in router.tsx
- [ ] Offline behavior tested
- [ ] Error states handled
- [ ] Loading states implemented

---

## Database Schema

### Dexie.js Tables

```typescript
// infrastructure/database/dexie.config.ts
import Dexie, { Table } from "dexie"

interface ProductRecord {
    id: number
    name: string
    barcode?: string
    listPrice: number
    categoryId?: number
    taxId?: number
    imageUrl?: string
    stockQuantity: number
    isActive: boolean
    lastSynced: string
}

interface TransactionRecord {
    id: string // UUID (local)
    odooId?: number // Set after sync
    lines: Array<{
        productId: number
        quantity: number
        priceUnit: number
        discount: number
    }>
    total: number
    paymentMethod: "cash" | "card" | "transfer"
    state: "draft" | "confirmed" | "synced" | "failed"
    createdAt: string
    syncedAt?: string
}

interface SyncJobRecord {
    id: string
    type: "transaction" | "product-update"
    payload: unknown
    priority: number
    retryCount: number
    maxRetries: number
    createdAt: string
    lastAttempt?: string
}

interface MetadataRecord {
    key: string
    value: string
}

class POSDatabase extends Dexie {
    products!: Table<ProductRecord>
    transactions!: Table<TransactionRecord>
    syncQueue!: Table<SyncJobRecord>
    metadata!: Table<MetadataRecord>

    constructor() {
        super("POSRetailDB")

        this.version(1).stores({
            products: "++id, barcode, categoryId, name, [name+barcode]",
            transactions: "id, state, createdAt, [state+createdAt]",
            syncQueue: "id, priority, retryCount, [retryCount+priority]",
            metadata: "key",
        })
    }
}

export const db = new POSDatabase()
```

---

## API Integration (Odoo 10)

### Token-Based Authentication (Custom)

```typescript
// features/auth/api/auth.adapter.ts
import {
    LoginInput,
    LoginResponse,
    LoginResponseSchema,
} from "../domain/services/auth.service"
import { tokenRepository } from "../repository/token.repository"

const API_BASE = import.meta.env.VITE_ODOO_URL

class AuthAdapter {
    async login(credentials: LoginInput): Promise<LoginResponse> {
        const response = await fetch(`${API_BASE}/api/pos/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                params: credentials,
            }),
        })

        const data = await response.json()
        if (data.error) throw new Error(data.error)

        const result = LoginResponseSchema.parse(data.result)

        // Store tokens
        await tokenRepository.setTokens({
            accessToken: result.access_token,
            refreshToken: result.refresh_token,
            expiresAt: new Date(
                Date.now() + result.expires_in * 1000
            ).toISOString(),
        })

        return result
    }

    async refreshToken(): Promise<{
        access_token: string
        expires_in: number
    }> {
        const refreshToken = await tokenRepository.getRefreshToken()
        if (!refreshToken) throw new Error("No refresh token available")

        const response = await fetch(`${API_BASE}/api/pos/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jsonrpc: "2.0",
                params: { refresh_token: refreshToken },
            }),
        })

        const data = await response.json()
        if (data.error) throw new Error(data.error)

        // Update stored access token
        const tokens = await tokenRepository.getTokens()
        if (tokens) {
            await tokenRepository.setTokens({
                ...tokens,
                accessToken: data.result.access_token,
                expiresAt: new Date(
                    Date.now() + data.result.expires_in * 1000
                ).toISOString(),
            })
        }

        return data.result
    }

    async logout(): Promise<void> {
        const refreshToken = await tokenRepository.getRefreshToken()

        try {
            await fetch(`${API_BASE}/api/pos/auth/logout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    params: { refresh_token: refreshToken },
                }),
            })
        } finally {
            await tokenRepository.clearTokens()
        }
    }
}

export const authAdapter = new AuthAdapter()
```

### HTTP Client dengan Auto-Refresh

```typescript
// infrastructure/api/http-client.ts
import { tokenRepository } from "@/features/auth/repository/token.repository"
import { authAdapter } from "@/features/auth/api/auth.adapter"

interface RequestConfig extends RequestInit {
    skipAuth?: boolean
}

class HttpClient {
    private baseUrl: string
    private refreshPromise: Promise<void> | null = null

    constructor() {
        this.baseUrl = import.meta.env.VITE_ODOO_URL
    }

    async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`
        const { skipAuth, ...fetchConfig } = config

        // Attach auth header
        if (!skipAuth) {
            const token = await this.getValidToken()
            if (token) {
                fetchConfig.headers = {
                    ...fetchConfig.headers,
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                }
            }
        }

        const response = await fetch(url, fetchConfig)

        // Handle 401 - attempt refresh
        if (response.status === 401 && !skipAuth) {
            await this.refreshAccessToken()
            const newToken = await tokenRepository.getAccessToken()

            // Retry with new token
            const retryResponse = await fetch(url, {
                ...fetchConfig,
                headers: {
                    ...fetchConfig.headers,
                    Authorization: `Bearer ${newToken}`,
                },
            })

            if (!retryResponse.ok) {
                throw new Error(
                    `HTTP ${retryResponse.status}: ${retryResponse.statusText}`
                )
            }

            return retryResponse.json()
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        return response.json()
    }

    private async getValidToken(): Promise<string | null> {
        const isValid = await tokenRepository.isAccessTokenValid()

        if (!isValid) {
            await this.refreshAccessToken()
        }

        return tokenRepository.getAccessToken()
    }

    private async refreshAccessToken(): Promise<void> {
        // Prevent multiple simultaneous refresh requests
        if (this.refreshPromise) {
            return this.refreshPromise
        }

        this.refreshPromise = this.doRefresh()

        try {
            await this.refreshPromise
        } finally {
            this.refreshPromise = null
        }
    }

    private async doRefresh(): Promise<void> {
        try {
            await authAdapter.refreshToken()
        } catch (error) {
            // Refresh failed - clear tokens and redirect to login
            await tokenRepository.clearTokens()
            window.location.href = "/login"
            throw error
        }
    }
}

export const httpClient = new HttpClient()
```

### Environment Variables

```bash
# .env
VITE_ODOO_URL=http://localhost:8069
VITE_ODOO_DB=your_database
```

---

## Offline-First Rules

### Golden Rules

1. **Write to local DB FIRST** — Always persist to IndexedDB before any other operation
2. **Optimistic UI** — Update UI immediately, sync in background
3. **Queue everything** — If offline, queue for later sync
4. **Idempotent operations** — Ensure retrying sync is safe
5. **Conflict resolution** — Define strategy (last-write-wins, merge, manual)

### Sync Flow

```
User Action
    ↓
Update Local DB (IndexedDB)
    ↓
Update UI (Optimistic)
    ↓
Is Online?
    ├── YES → Push to Odoo → Update sync status
    └── NO  → Queue in syncQueue → Show pending indicator
```

### Transaction State Machine

```
[draft] → [confirmed] → [synced]
              ↓
          [failed] → retry → [synced] or [dead-letter]
```

### Implementation Pattern

```typescript
// features/pos/hooks/use-create-transaction.ts
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { db } from "@/infrastructure/database/dexie.config"
import { syncService } from "@/features/sync/domain/services/sync.service"

export function useCreateTransaction() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (transactionData: CreateTransactionInput) => {
            // 1. Generate local ID
            const localId = crypto.randomUUID()

            // 2. Save to local DB immediately
            const transaction = {
                id: localId,
                ...transactionData,
                state: "draft",
                createdAt: new Date().toISOString(),
            }

            await db.transactions.add(transaction)

            // 3. Attempt sync (non-blocking)
            try {
                const result = await odooAdapter.createPosOrder(transaction)
                await db.transactions.update(localId, {
                    state: "synced",
                    odooId: result.id,
                    syncedAt: new Date().toISOString(),
                })
            } catch (error) {
                // 4. Queue for retry
                await syncService.enqueue({
                    id: localId,
                    type: "transaction",
                    payload: transaction,
                    priority: 1,
                })
                await db.transactions.update(localId, { state: "failed" })
            }

            return transaction
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] })
        },
    })
}
```

---

## Printer Integration

### ESC/POS Service

```typescript
// features/printer/domain/services/escpos.service.ts
export interface PrinterConfig {
    vendorId: number
    productId: number
    baudRate: number
    paperWidth: 48 | 64
}

export class EscPosService {
    private encoder = new TextEncoder()

    generateReceipt(data: ReceiptData): Uint8Array {
        const cmds: number[] = []

        // Initialize
        cmds.push(0x1b, 0x40)

        // Header (center, bold)
        cmds.push(...this.center())
        cmds.push(...this.bold(true))
        cmds.push(...this.text(data.header.storeName))
        cmds.push(...this.bold(false))
        cmds.push(...this.text(data.header.address))
        cmds.push(...this.text("-".repeat(48)))

        // Items
        cmds.push(...this.left())
        for (const item of data.items) {
            cmds.push(...this.text(item.name.substring(0, 40)))
            cmds.push(
                ...this.text(
                    `${item.qty}x ${item.price.toLocaleString()} = ${item.total.toLocaleString()}`
                )
            )
        }

        // Summary
        cmds.push(...this.text("-".repeat(48)))
        cmds.push(...this.text(`TOTAL: ${data.summary.total.toLocaleString()}`))
        cmds.push(...this.text(`Bayar: ${data.summary.paid.toLocaleString()}`))
        cmds.push(
            ...this.text(`Kembali: ${data.summary.change.toLocaleString()}`)
        )

        // Footer
        cmds.push(...this.center())
        cmds.push(...this.text("Terima Kasih"))
        cmds.push(...this.text(""))

        // Cut paper
        cmds.push(0x1d, 0x56, 0x01)

        return new Uint8Array(cmds)
    }

    private text(str: string): number[] {
        return Array.from(this.encoder.encode(str + "\n"))
    }

    private center(): number[] {
        return [0x1b, 0x61, 0x01]
    }
    private left(): number[] {
        return [0x1b, 0x61, 0x00]
    }
    private bold(on: boolean): number[] {
        return [0x1b, 0x45, on ? 0x01 : 0x00]
    }
}
```

### Web Serial Connection

```typescript
// features/printer/api/serial.adapter.ts
export class SerialPrinterAdapter {
    private port: SerialPort | null = null
    private writer: WritableStreamDefaultWriter | null = null

    async connect(): Promise<void> {
        this.port = await navigator.serial.requestPort({
            filters: [{ usbVendorId: 0x1234 }], // Adjust for your printer
        })
        await this.port.open({ baudRate: 9600 })
        this.writer = this.port.writable.getWriter()
    }

    async print(data: Uint8Array): Promise<void> {
        if (!this.writer) throw new Error("Printer not connected")
        await this.writer.write(data)
    }

    async disconnect(): Promise<void> {
        this.writer?.releaseLock()
        await this.port?.close()
        this.port = null
        this.writer = null
    }

    get isConnected(): boolean {
        return this.port !== null && this.writer !== null
    }
}
```

---

## State Management Rules

### When to Use What

| State Type            | Tool              | Example                               |
| --------------------- | ----------------- | ------------------------------------- |
| Server state          | TanStack Query    | Products, transactions, sync status   |
| Client state (global) | Zustand           | Cart, auth, UI theme, printer config  |
| Client state (local)  | useState          | Form inputs, modal open, dropdown     |
| URL state             | TanStack Router   | Search params, filters, pagination    |
| Cache                 | IndexedDB (Dexie) | Product catalog, offline transactions |

### Rules

1. **Never put server state in Zustand** — Use TanStack Query
2. **Never put derived state in Zustand** — Compute in selectors
3. **Cart MUST be persisted** — Use Zustand persist middleware
4. **Auth MUST be in Zustand** — With secure storage consideration
5. **UI state in useState** — Unless needed across routes

---

## Error Handling

### Strategy

```typescript
// Layer-specific error handling

// Domain: Throw descriptive errors
function calculateDiscount(price: number, percent: number): number {
  if (percent < 0 || percent > 100) {
    throw new DomainError('Discount must be between 0 and 100')
  }
  return price * (percent / 100)
}

// Repository: Wrap and log
async function findById(id: number): Promise<Product | undefined> {
  try {
    const raw = await db.products.get(id)
    return raw ? ProductSchema.parse(raw) : undefined
  } catch (error) {
    logger.error('Repository error', { operation: 'findById', id, error })
    throw new RepositoryError('Failed to fetch product', { cause: error })
  }
}

// UI: Show user-friendly messages
function ProductCard({ productId }: { productId: number }) {
  const { data, error, isError } = useProduct(productId)

  if (isError) {
    return <ErrorFallback message={error.message} retry={() => refetch()} />
  }

  return <div>{data.name}</div>
}
```

### Error Types

```typescript
// shared/types/common.types.ts
export class DomainError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "DomainError"
    }
}

export class RepositoryError extends Error {
    constructor(message: string, options?: { cause?: unknown }) {
        super(message, options)
        this.name = "RepositoryError"
    }
}

export class SyncError extends Error {
    constructor(
        message: string,
        public readonly jobId: string,
        options?: { cause?: unknown }
    ) {
        super(message, options)
        this.name = "SyncError"
    }
}
```

---

## Common Pitfalls

### ❌ DON'T

```typescript
// DON'T: Business logic in components
function ProductCard({ product }: { product: Product }) {
  const total = product.price * 1.11 // Tax logic in component!
  return <div>{total}</div>
}

// DON'T: Call Dexie directly from components
function ProductList() {
  const [products, setProducts] = useState([])
  useEffect(() => {
    db.products.toArray().then(setProducts) // Bypass repository!
  }, [])
}

// DON'T: Put server state in Zustand
const useStore = create(() => ({
  products: [], // ❌ Should be in TanStack Query
}))

// DON'T: Forget error handling in async operations
async function checkout() {
  await odooAdapter.createOrder(data) // No try-catch!
}

// DON'T: Block UI on sync
function CheckoutButton() {
  const [isLoading, setIsLoading] = useState(false)
  const handleClick = async () => {
    setIsLoading(true)
    await syncToServer() // ❌ Blocks UI!
    setIsLoading(false)
  }
}
```

### ✅ DO

```typescript
// DO: Use services for business logic
function ProductCard({ product }: { product: Product }) {
  const { total } = pricingService.calculateLineTotal(product, 1)
  return <div>{total}</div>
}

// DO: Use repository pattern
function ProductList() {
  const { data: products } = useProducts() // Uses repository internally
  return <div>{products?.map(p => <ProductCard key={p.id} product={p} />)}</div>
}

// DO: Use TanStack Query for server state
function ProductList() {
  const { data, isLoading, error } = useProducts()
  if (isLoading) return <Skeleton />
  if (error) return <ErrorFallback error={error} />
  return <div>...</div>
}

// DO: Handle errors gracefully
async function checkout() {
  try {
    await transactionRepository.create(data)
  } catch (error) {
    toast.error('Gagal menyimpan transaksi')
    logger.error('Checkout failed', error)
  }
}

// DO: Non-blocking sync
function CheckoutButton() {
  const mutation = useCreateTransaction()
  const handleClick = () => {
    mutation.mutate(data) // Async, non-blocking
  }
  return <Button loading={mutation.isPending}>Bayar</Button>
}
```

---

## Quick Reference

### File Templates

#### New Feature Domain Model

```typescript
// features/[feature]/domain/models/[name].model.ts
import { z } from 'zod'

export const [Name]Schema = z.object({
  // ...fields
})

export type [Name] = z.infer<typeof [Name]Schema>
```

#### New Repository

```typescript
// features/[feature]/repository/[name].repository.ts
import { db } from '@/infrastructure/database/dexie.config'

export interface I[Name]Repository {
  // ...methods
}

export class [Name]Repository implements I[Name]Repository {
  // ...implementation
}

export const [name]Repository = new [Name]Repository()
```

#### New TanStack Query Hook

```typescript
// features/[feature]/hooks/use-[name].ts
import { useQuery } from '@tanstack/react-query'
import { [name]Repository } from '../repository/[name].repository'

export function use[Name]s() {
  return useQuery({
    queryKey: ['[name]s'],
    queryFn: () => [name]Repository.findAll(),
  })
}
```

#### New Route

```typescript
// Add to src/app/router.tsx
const [name]Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/[path]',
  component: [PageComponent],
  // loader: async () => { ... }
})
```

---

## Environment Setup Checklist

- [ ] Node.js 22+
- [ ] Vite project initialized
- [ ] shadcn/ui installed
- [ ] TanStack Router configured (code-based)
- [ ] Path aliases in `tsconfig.json` & `vite.config.ts`
- [ ] Environment variables in `.env`
- [ ] Dexie.js database initialized
- [ ] Odoo 10 API accessible (CORS enabled)
- [ ] Thermal printer connected (Web Serial API supported browser)

---

## Browser Requirements

| Feature                  | Chrome | Firefox | Safari | Edge   |
| ------------------------ | ------ | ------- | ------ | ------ |
| Web Serial API (Printer) | ✅ 89+ | ❌      | ❌     | ✅ 89+ |
| IndexedDB (Dexie.js)     | ✅     | ✅      | ✅     | ✅     |
| Service Worker           | ✅     | ✅      | ✅     | ✅     |
| ES2020 Modules           | ✅     | ✅      | ✅     | ✅     |

**Recommendation**: Deploy on Chromium-based browsers (Chrome/Edge) for full printer support.

---

## Deployment Notes

1. **HTTPS Required** — Web Serial API requires secure context
2. **PWA** — Add manifest.json & service worker for installability
3. **Background Sync** — Use Service Worker for sync when app closed
4. **Cache Strategy** — Cache product images with Service Worker
5. **Database Backup** — Export IndexedDB periodically for disaster recovery

---

_Last Updated: 2026-05-31_
_Version: 2.0_
