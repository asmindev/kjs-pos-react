import { Outlet } from "@tanstack/react-router"
import { useNetworkStatus } from "@/shared/hooks/use-network-status"

export function RootLayout() {
    const { isOnline } = useNetworkStatus()

    return (
        <div className="min-h-svh text-foreground">
            {/* Navbar */}
            <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur">
                <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
                    <div>
                        <p className="font-heading text-lg font-semibold tracking-tight">
                            POS Retail
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Point of Sale
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span
                            className={`h-2 w-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`}
                        />
                        <span>{isOnline ? "Online" : "Offline"}</span>
                    </div>
                </div>
            </header>

            {/* Main Content — full height, no sidebar */}
            <main className="w-full">
                <Outlet />
            </main>
        </div>
    )
}
