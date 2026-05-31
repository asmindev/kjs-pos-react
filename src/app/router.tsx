import {
    Link,
    createRoute,
    createRootRoute,
    createRouter,
} from "@tanstack/react-router"

import CheckoutPage from "@/routes/checkout/index.tsx"
import CheckoutSuccessPage from "@/features/pos/pages/checkout-success-page"
import CartPage from "@/routes/cart/index.tsx"
import HomePage from "@/routes/index.tsx"
import ProductBarcodePage from "@/routes/products/$barcode.tsx"
import ProductsPage from "@/routes/products/index.tsx"
import PrinterSettingsPage from "@/routes/settings/printer.tsx"
import SettingsPage from "@/routes/settings/index.tsx"
import SyncSettingsPage from "@/routes/settings/sync.tsx"
import TransactionDetailPage from "@/routes/transactions/$id.tsx"
import TransactionsPage from "@/routes/transactions/index.tsx"

import { RootLayout } from "@/app/root-layout.tsx"

const rootRoute = createRootRoute({ component: RootLayout })
const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: HomePage,
})
const productsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "products",
    component: ProductsPage,
})
const productBarcodeRoute = createRoute({
    getParentRoute: () => productsRoute,
    path: "$barcode",
    component: ProductBarcodePage,
})
const cartRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "cart",
    component: CartPage,
})
const checkoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "checkout",
    component: CheckoutPage,
})
const checkoutSuccessRoute = createRoute({
    getParentRoute: () => checkoutRoute,
    path: "success",
    component: CheckoutSuccessPage,
})
const transactionsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "transactions",
    component: TransactionsPage,
})
const transactionDetailRoute = createRoute({
    getParentRoute: () => transactionsRoute,
    path: "$id",
    component: TransactionDetailPage,
})
const settingsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "settings",
    component: SettingsPage,
})
const syncSettingsRoute = createRoute({
    getParentRoute: () => settingsRoute,
    path: "sync",
    component: SyncSettingsPage,
})
const printerSettingsRoute = createRoute({
    getParentRoute: () => settingsRoute,
    path: "printer",
    component: PrinterSettingsPage,
})

const routeTree = rootRoute.addChildren([
    indexRoute,
    productsRoute.addChildren([productBarcodeRoute]),
    cartRoute,
    checkoutRoute.addChildren([checkoutSuccessRoute]),
    transactionsRoute.addChildren([transactionDetailRoute]),
    settingsRoute.addChildren([syncSettingsRoute, printerSettingsRoute]),
])

export const router = createRouter({
    routeTree,
    defaultPreload: "intent",
    context: {
        breadcrumb: <Link to="/">POS Retail</Link>,
    },
})
