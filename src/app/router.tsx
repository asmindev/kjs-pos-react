import {
    Link,
    createRoute,
    createRootRoute,
    createRouter,
} from "@tanstack/react-router"

import CheckoutPage from "@/features/pos/pages/checkout-page"
import CheckoutSuccessPage from "@/features/pos/pages/checkout-success-page"
import CartPage from "@/features/pos/pages/cart-page"
import HomePage from "@/features/pos/pages/pos-dashboard"
import ProductBarcodePage from "@/features/pos/pages/product-barcode-page"
import ProductsPage from "@/features/pos/pages/product-browser"
import PrinterSettingsPage from "@/features/printer/pages/printer-settings"
import SettingsPage from "@/features/pos/pages/settings-page"
import SyncSettingsPage from "@/features/sync/pages/sync-settings"
import TransactionDetailPage from "@/features/pos/pages/transaction-detail-page"
import TransactionsPage from "@/features/pos/pages/transactions-page"

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
