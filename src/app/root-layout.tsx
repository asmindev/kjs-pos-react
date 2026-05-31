import { Outlet } from "@tanstack/react-router"
import { useNetworkStatus } from "@/shared/hooks/use-network-status"

export function RootLayout() {
    const { isOnline } = useNetworkStatus()

    return (
        <div className="flex h-svh flex-col text-foreground">
            {/* Navbar */}
            <header className="shrink-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur">
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

            {/* Main Content — flex-1 to fill remaining height, overflow-auto for scrolling child pages if needed */}
            <main className="flex-1 overflow-auto w-full">
                <Outlet />
            </main>
        </div>
    )
}
