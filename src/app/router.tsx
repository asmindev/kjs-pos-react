import {
    createRoute,
    createRootRoute,
    createRouter,
} from "@tanstack/react-router"

import POSDashboard from "@/features/pos/pages/pos-dashboard"

import { RootLayout } from "@/app/root-layout.tsx"

const rootRoute = createRootRoute({ component: RootLayout })

const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: POSDashboard,
})

const routeTree = rootRoute.addChildren([indexRoute])

export const router = createRouter({
    routeTree,
    defaultPreload: "intent",
})
