import { useEffect, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useAuth } from "@/features/pos/hooks/use-auth"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Check, X } from "lucide-react"

export function AuthPage() {
    const navigate = useNavigate()
    const { setToken, payload } = useAuth()
    const [status, setStatus] = useState<"loading" | "success" | "error">(
        "loading"
    )
    const [error, setError] = useState("")

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const token = params.get("token")

        if (!token) {
            // Cek localStorage
            const saved = localStorage.getItem("pos_jwt")
            if (saved) {
                setToken(saved)
                const { isAuthenticated } = useAuth.getState()
                if (isAuthenticated) {
                    setStatus("success")
                    setTimeout(
                        () =>
                            navigate({ to: "/", replace: true }),
                        600
                    )
                    return
                }
            }
            setStatus("error")
            setError("Token tidak ditemukan. Buka dari Odoo POS session.")
            return
        }

        setToken(token)

        // Tunggu state update
        setTimeout(() => {
            const { isAuthenticated, isExpired } = useAuth.getState()
            if (isAuthenticated) {
                setStatus("success")
                // Redirect ke dashboard
                setTimeout(
                    () =>
                        navigate({
                            to: "/",
                            replace: true,
                        }),
                    800
                )
            } else if (isExpired) {
                setStatus("error")
                setError("Token sudah kedaluwarsa. Buka sesi POS baru.")
            } else {
                setStatus("error")
                setError("Token tidak valid.")
            }
        }, 100)
    }, [navigate, setToken])

    return (
        <div className="flex min-h-full items-center justify-center p-4">
            <Card size="sm" className="w-full max-w-sm text-center">
                <CardContent className="flex flex-col items-center gap-4 py-8">
                    {status === "loading" && (
                        <>
                            <Loader2 className="size-10 animate-spin text-primary" />
                            <div>
                                <p className="font-heading text-sm font-medium">
                                    Memverifikasi token...
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Sedang menghubungkan ke sesi POS
                                </p>
                            </div>
                        </>
                    )}

                    {status === "success" && payload && (
                        <>
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
                                <Check className="size-7 text-emerald-500" />
                            </div>
                            <div>
                                <p className="font-heading text-sm font-medium">
                                    Selamat datang, {payload.name}!
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Sesi POS aktif · Mengalihkan...
                                </p>
                            </div>
                            <Badge variant="secondary">
                                {payload.login}
                            </Badge>
                        </>
                    )}

                    {status === "error" && (
                        <>
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-destructive/20">
                                <X className="size-7 text-destructive" />
                            </div>
                            <div>
                                <p className="font-heading text-sm font-medium">
                                    Autentikasi Gagal
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {error}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    navigate({
                                        to: "/",
                                        replace: true,
                                    })
                                }
                            >
                                Lanjutkan tanpa auth
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
