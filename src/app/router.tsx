import {
    createRoute,
    createRootRoute,
    createRouter,
} from "@tanstack/react-router"

import POSDashboard from "@/features/pos/pages/pos-dashboard"
import { AuthPage } from "@/features/pos/pages/auth-page"
import { RootLayout } from "@/app/root-layout.tsx"

const rootRoute = createRootRoute({ component: RootLayout })

const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: POSDashboard,
})

const authRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/auth",
    component: AuthPage,
})

const routeTree = rootRoute.addChildren([indexRoute, authRoute])

export const router = createRouter({
    routeTree,
    defaultPreload: "intent",
})
