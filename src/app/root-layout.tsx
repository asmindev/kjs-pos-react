import { useEffect } from "react"
import { Outlet, useRouter } from "@tanstack/react-router"
import { useNetworkStatus } from "@/shared/hooks/use-network-status"
import { useAuth } from "@/features/pos/hooks/use-auth"
import { Badge } from "@/components/ui/badge"
import { User } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"

export function RootLayout() {
    const { isOnline } = useNetworkStatus()
    const { isAuthenticated, payload, setToken } = useAuth()
    const router = useRouter()

    // Check localStorage for persisted JWT on mount
    useEffect(() => {
        if (!isAuthenticated) {
            const saved = localStorage.getItem("pos_jwt")
            if (saved) {
                setToken(saved)
            }
        }
    }, [])

    return (
        <div className="flex h-svh flex-col text-foreground">
            {/* Navbar */}
            <header className="z-20 shrink-0 border-b border-border/70 bg-background/80 backdrop-blur">
                <div className="mx-auto flex h-14 items-center justify-between px-4">
                    <div>
                        <p className="font-heading text-lg font-semibold tracking-tight">
                            POS Retail
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Point of Sale
                        </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                        {isAuthenticated && payload && (
                            <Badge variant="secondary" className="gap-1.5">
                                <User className="size-3" />
                                {payload.name}
                            </Badge>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <span
                                    className={`h-2 w-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-red-500"}`}
                                />
                                <span>{isOnline ? "Online" : "Offline"}</span>
                            </div>
                            <ModeToggle />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <Outlet />
            </main>
        </div>
    )
}
