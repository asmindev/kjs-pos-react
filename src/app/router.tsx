import {
  Link,
  Outlet,
  createRoute,
  createRootRoute,
  createRouter,
} from "@tanstack/react-router"

import CheckoutPage from "@/routes/checkout"
import CheckoutSuccessPage from "@/routes/checkout/success"
import CartPage from "@/routes/cart"
import HomePage from "@/routes/index"
import ProductBarcodePage from "@/routes/products/$barcode"
import ProductsPage from "@/routes/products"
import PrinterSettingsPage from "@/routes/settings/printer"
import SettingsPage from "@/routes/settings"
import SyncSettingsPage from "@/routes/settings/sync"
import TransactionDetailPage from "@/routes/transactions/$id"
import TransactionsPage from "@/routes/transactions"

import { AppShell } from "@/shared/components/layout/app-shell"

function RootLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

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
