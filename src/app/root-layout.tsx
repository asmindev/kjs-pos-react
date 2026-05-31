import { useEffect } from "react"
import { Outlet } from "@tanstack/react-router"
import { useAuth } from "@/features/pos/hooks/use-auth"

export function RootLayout() {
    const { isAuthenticated, setToken } = useAuth()

    useEffect(() => {
        if (!isAuthenticated) {
            const saved = localStorage.getItem("pos_jwt")
            if (saved) {
                setToken(saved)
            }
        }
    }, [])

    return (
        <div className="h-svh">
            <Outlet />
        </div>
    )
}
