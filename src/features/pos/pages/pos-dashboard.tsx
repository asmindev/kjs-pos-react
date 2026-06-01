import { useState, useEffect, useMemo } from "react"
import { BarcodeInput } from "@/features/pos/components/barcode-input"
import { ProductGrid } from "@/features/pos/components/product-grid"
import { CartSidebar } from "@/features/pos/components/cart-sidebar"
import { CustomerModal } from "@/features/pos/components/customer-modal"
import { PaymentModal } from "@/features/pos/components/payment-modal"
import { useSync } from "@/features/pos/hooks/use-sync"
import { Badge } from "@/components/ui/badge"
import { Printer, Loader2, User, Store } from "lucide-react"
import { useAuth } from "@/features/pos/hooks/use-auth"
import { usePosData } from "@/features/pos/hooks/use-pos-data"
import { useDebounce } from "@/shared/hooks/use-debounce"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ButtonGroup } from "@/components/ui/button-group"
import { RestrictedModal } from "@/features/pos/components/restricted-modal"
import { useCart } from "@/features/pos/hooks/use-cart"

const categories = [
    "Semua",
    "Makanan",
    "Minuman",
    "Rokok",
    "Sembako",
    "Snack",
    "Favorit",
    "Lainnya",
]

export default function POSDashboard() {
    const [searchQuery, setSearchQuery] = useState("")
    const debouncedSearch = useDebounce(searchQuery, 300)
    const [activeCategory, setActiveCategory] = useState("Semua")
    const [showMore, setShowMore] = useState(false)
    const { isOnline, pendingCount } = useSync()
    const products = usePosData((s) => s.products)
    const isLoading = usePosData((s) => s.isLoading)
    const isSearching = usePosData((s) => s.isSearching)
    const searchResults = usePosData((s) => s.searchResults)
    const error = usePosData((s) => s.error)
    const isUnauthorized = usePosData((s) => s.isUnauthorized)
    const refetch = usePosData((s) => s.refetch)
    const searchProducts = usePosData((s) => s.searchProducts)
    const clearSearch = usePosData((s) => s.clearSearch)
    const { isAuthenticated, payload } = useAuth()
    const addItem = useCart((s) => s.addItem)

    const handleSearchEnter = () => {
        if (!searchQuery) return
        const match = products.find((p) => p.barcode === searchQuery)
        if (match) {
            addItem(match)
            setSearchQuery("")
            clearSearch()
        }
    }

    // Filter lokal dari products cache — hanya dihitung saat debouncedSearch berubah
    const localFiltered = useMemo(() => {
        if (!debouncedSearch) return products
        const q = debouncedSearch.toLowerCase()
        return products.filter(
            (p) =>
                p.name.toLowerCase().includes(q) ||
                p.barcode.includes(debouncedSearch)
        )
    }, [products, debouncedSearch])

    // Fallback ke API jika hasil lokal kosong dan ada query
    useEffect(() => {
        if (debouncedSearch && localFiltered.length === 0) {
            searchProducts(debouncedSearch)
        } else {
            clearSearch()
        }
    }, [debouncedSearch, localFiltered.length, searchProducts, clearSearch])

    // Produk yang ditampilkan: lokal jika ada, fallback dari API
    const displayProducts = useMemo(
        () =>
            debouncedSearch && localFiltered.length === 0 && searchResults.length > 0
                ? searchResults
                : localFiltered,
        [debouncedSearch, localFiltered, searchResults]
    )

    // Fetch data on mount
    useEffect(() => {
        refetch()
    }, [refetch])

    return (
        <div className="flex h-full">
            {/* Left Column: Header + Action Area + Products + Footer */}
            <div className="flex flex-1 flex-col overflow-hidden bg-muted/10">
                {/* Header */}
                <div className="z-10 flex shrink-0 items-center justify-between gap-4 border-b bg-background px-4 py-3">
                    <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Store className="size-4" />
                        </div>
                        <h1 className="font-heading text-lg font-bold tracking-tight">
                            POS KJS
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="relative flex size-2">
                                {isOnline && (
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                )}
                                <span
                                    className={cn(
                                        "relative inline-flex size-2 rounded-full",
                                        isOnline
                                            ? "bg-emerald-500"
                                            : "bg-red-500"
                                    )}
                                ></span>
                            </span>
                            <span className="text-xs font-medium text-muted-foreground">
                                {isOnline ? "Online" : "Offline"}
                            </span>
                        </div>
                        {isAuthenticated && payload && (
                            <div className="flex items-center gap-2 border bg-muted/30 px-3 py-1">
                                <User className="size-3.5 text-muted-foreground" />
                                <span className="text-xs font-medium">
                                    {payload.name}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action & Filter Area */}
                <div className="flex shrink-0 flex-col gap-3 px-4 pt-4">
                    {/* Input Bar: Barcode + Customer */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 rounded-md transition-shadow focus-within:shadow-md">
                            <BarcodeInput 
                                value={searchQuery}
                                onChange={setSearchQuery}
                                onEnter={handleSearchEnter}
                            />
                        </div>
                        <div className="rounded-md transition-shadow focus-within:shadow-md">
                            <CustomerModal />
                        </div>
                    </div>

                    <div className="flex w-full shrink-0 items-start justify-between pb-2">
                        <ButtonGroup className="w-full flex-wrap gap-y-1">
                            {(() => {
                                const MAX_VISIBLE = 15
                                const visible = categories.slice(0, MAX_VISIBLE)
                                const overflow = categories.slice(MAX_VISIBLE)
                                return (
                                    <>
                                        {visible.map((cat) => (
                                            <Button
                                                key={cat}
                                                variant={
                                                    activeCategory === cat
                                                        ? "default"
                                                        : "outline"
                                                }
                                                size="sm"
                                                onClick={() =>
                                                    setActiveCategory(cat)
                                                }
                                            >
                                                {cat}
                                            </Button>
                                        ))}

                                        {overflow.length > 0 && (
                                            <div className="relative inline-block">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className={cn(
                                                        "h-8 rounded-none bg-background text-xs transition-all hover:bg-muted hover:text-foreground",
                                                        showMore && "bg-accent"
                                                    )}
                                                    onClick={() =>
                                                        setShowMore((s) => !s)
                                                    }
                                                >
                                                    More ▾
                                                </Button>

                                                {showMore && (
                                                    <div className="absolute right-0 z-50 mt-2 w-40 rounded-md border bg-popover p-1 shadow-md">
                                                        {overflow.map((cat) => (
                                                            <button
                                                                key={cat}
                                                                className={cn(
                                                                    "block w-full rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                                                                    activeCategory ===
                                                                        cat &&
                                                                        "bg-accent text-accent-foreground"
                                                                )}
                                                                onClick={() => {
                                                                    setActiveCategory(
                                                                        cat
                                                                    )
                                                                    setShowMore(
                                                                        false
                                                                    )
                                                                }}
                                                            >
                                                                {cat}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )
                            })()}
                        </ButtonGroup>

                        {pendingCount > 0 && (
                            <div className="shrink-0 pl-2">
                                <Badge
                                    variant="outline"
                                    className="gap-1 bg-background"
                                >
                                    {pendingCount} pending
                                </Badge>
                            </div>
                        )}
                    </div>
                </div>

                {/* Products */}
                <div className="flex flex-1 flex-col overflow-hidden px-4 pb-4">
                    <div className="flex flex-1 flex-col overflow-hidden border bg-background ring-1 ring-black/5 dark:ring-white/5">
                        {isLoading ? (
                            <div className="flex h-full animate-in flex-col items-center justify-center gap-3 text-center opacity-0 duration-500 fade-in">
                                <Loader2 className="size-8 animate-spin text-primary" />
                                <p className="text-sm font-medium text-muted-foreground">
                                    Memuat produk...
                                </p>
                            </div>
                        ) : error ? (
                            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                                <p className="text-sm font-medium text-destructive">
                                    Gagal memuat data
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {error}
                                </p>
                                <Button
                                    type="button"
                                    onClick={() => refetch()}
                                    className="text-xs text-primary hover:underline"
                                    variant="ghost"
                                >
                                    Coba lagi
                                </Button>
                            </div>
                        ) : isSearching ? (
                            <div className="flex h-full animate-in flex-col items-center justify-center gap-3 text-center opacity-0 duration-500 fade-in">
                                <Loader2 className="size-8 animate-spin text-primary" />
                                <p className="text-sm font-medium text-muted-foreground">
                                    Mencari di Odoo...
                                </p>
                            </div>
                        ) : (
                            <div className="flex-1 animate-in overflow-hidden duration-300 fade-in">
                            <ProductGrid
                                    products={displayProducts}
                                    searchQuery={debouncedSearch}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer: Shortcuts */}
                <div className="flex shrink-0 items-center justify-between border-t bg-background px-4 py-2 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                            Shortcuts
                        </span>
                        <div className="flex items-center gap-3">
                            {[
                                ["F1", "Cari"],
                                ["F2", "Scan"],
                                ["F9", "Bayar"],
                                ["Esc", "Batal"],
                            ].map(([key, label]) => (
                                <div
                                    key={key}
                                    className="flex items-center gap-1.5"
                                >
                                    <kbd className="pointer-events-none inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground select-none">
                                        {key}
                                    </kbd>
                                    <span className="text-[11px] text-muted-foreground">
                                        {label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Printer className="size-3.5" />
                        <span className="font-medium">EPSON TM-T82 siap</span>
                    </div>
                </div>
            </div>

            {/* Right Column: Cart (full height) */}
            <div className="w-80 shrink-0 border-l">
                <CartSidebar />
            </div>

            <PaymentModal />

            {/* Modal tidak bisa ditutup saat 401 Unauthorized */}
            <RestrictedModal
                open={isUnauthorized}
                userName={payload?.name}
                userLogin={payload?.login}
            />
        </div>
    )
}
