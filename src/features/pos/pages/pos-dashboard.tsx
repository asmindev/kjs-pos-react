import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import {
    BarcodeInput,
    type BarcodeInputRef,
} from "@/features/pos/components/barcode-input"
import { ProductGrid } from "@/features/pos/components/product-grid"
import { CartSidebar } from "@/features/pos/components/cart-sidebar"
import { CustomerModal } from "@/features/pos/components/customer-modal"
import { PaymentModal } from "@/features/pos/components/payment-modal"
import { useSync } from "@/features/pos/hooks/use-sync"
import { Badge } from "@/components/ui/badge"
import { Printer, Loader2, User, Store, Check, ChevronsUpDown } from "lucide-react"
import { useAuth } from "@/features/pos/hooks/use-auth"
import { useProducts } from "@/features/pos/hooks/use-products"
import { useCategories } from "@/features/pos/hooks/use-categories"
import { usePosSync } from "@/features/pos/hooks/use-pos-sync"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ButtonGroup } from "@/components/ui/button-group"
import { RestrictedModal } from "@/features/pos/components/restricted-modal"
import { useCart } from "@/features/pos/hooks/use-cart"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"



export default function POSDashboard() {
    const [searchTerm, setSearchTerm] = useState("")
    const barcodeRef = useRef<BarcodeInputRef>(null)
    const [activeCategory, setActiveCategory] = useState("Semua")
    const [openCategory, setOpenCategory] = useState(false)
    const { isOnline, pendingCount } = useSync()
    
    // TanStack Query Hooks
    const { data: products = [], isLoading, error, isFetching } = useProducts(searchTerm, activeCategory)
    const { data: categoriesData = [] } = useCategories()
    const { mutate: syncData, isPending: isSyncing } = usePosSync()
    
    // Derivasi kategori dengan "Semua" di awal
    const categories = useMemo(() => {
        const names = categoriesData.map(c => c.name)
        return ["Semua", ...Array.from(new Set(names))]
    }, [categoriesData])

    const { isAuthenticated, payload } = useAuth()
    const addItem = useCart((s) => s.addItem)

    // Cek apakah baru saja di-kick karena 401 (terjadi saat refresh gagal di odoo-adapter)
    const isUnauthorized = !isAuthenticated

    // Dipanggil dari BarcodeInput setelah debounce 300ms
    const handleSearch = useCallback((query: string) => {
        setSearchTerm(query)
    }, [])

    // Dipanggil saat Enter ditekan
    const handleEnter = useCallback(
        (currentValue: string) => {
            if (!currentValue) return
            const match = products.find((p) => p.barcode === currentValue)
            if (match) {
                addItem(match)
                barcodeRef.current?.clear()
                setSearchTerm("")
            }
        },
        [products, addItem]
    )

    const hasAttemptedSync = useRef(false)

    // Fetch / Sync on mount if needed
    useEffect(() => {
        // Jika products kosong dan query Dexie sudah selesai, trigger sync 1x
        if (products.length === 0 && !isLoading && !isFetching && !hasAttemptedSync.current) {
            hasAttemptedSync.current = true
            syncData()
        }
    }, [products.length, isLoading, isFetching, syncData])

    return (
        <div className="flex h-full">
            {/* Left Column: Header + Action Area + Products + Footer */}
            <div className="flex flex-1 flex-col gap-y-2 overflow-hidden bg-muted/10 px-4">
                {/* Header */}
                <div className="z-10 flex shrink-0 items-center justify-between gap-4 bg-background py-2">
                    <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Store className="size-4" />
                        </div>
                        <h1 className="font-heading text-lg font-bold tracking-tight">
                            POS KJS
                        </h1>
                        {products.length > 0 && (
                            <span className="text-xs font-normal text-muted-foreground">
                                {products.length.toLocaleString("id-ID")} SKU
                            </span>
                        )}
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
                            <div className="flex items-center gap-2 bg-muted/30 px-3 py-1">
                                <User className="size-3.5 text-muted-foreground" />
                                <span className="text-xs font-medium">
                                    {payload.name}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action & Filter Area */}
                <div className="flex shrink-0 flex-col gap-3">
                    {/* Input Bar: Barcode + Customer */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 rounded-md transition-shadow focus-within:shadow-md">
                            <BarcodeInput
                                ref={barcodeRef}
                                onSearch={handleSearch}
                                onEnter={handleEnter}
                            />
                        </div>
                        <div className="rounded-md transition-shadow focus-within:shadow-md">
                            <CustomerModal />
                        </div>
                    </div>

                    <div className="flex w-full shrink-0 items-start justify-between pb-2">
                        <div className="flex w-full">
                            <Popover open={openCategory} onOpenChange={setOpenCategory}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openCategory}
                                        className="w-full sm:w-[300px] justify-between font-normal bg-background"
                                    >
                                        <span className="truncate">{activeCategory}</span>
                                        <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Cari kategori..." />
                                        <CommandList>
                                            <CommandEmpty>Kategori tidak ditemukan.</CommandEmpty>
                                            <CommandGroup>
                                                {categories.map((cat) => (
                                                    <CommandItem
                                                        key={cat}
                                                        value={cat}
                                                        onSelect={() => {
                                                            setActiveCategory(cat)
                                                            setOpenCategory(false)
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 size-4 shrink-0",
                                                                activeCategory === cat ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        <span className="truncate">{cat}</span>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

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
                <div className="flex flex-1 flex-col overflow-hidden">
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
                                    {error?.message || String(error)}
                                </p>
                                <Button
                                    type="button"
                                    onClick={() => syncData()}
                                    disabled={isSyncing}
                                    className="text-xs text-primary hover:underline"
                                    variant="ghost"
                                >
                                    {isSyncing ? "Menyelaraskan..." : "Coba lagi"}
                                </Button>
                            </div>
                        ) : isFetching && products.length === 0 ? (
                            <div className="flex h-full animate-in flex-col items-center justify-center gap-3 text-center opacity-0 duration-500 fade-in">
                                <Loader2 className="size-8 animate-spin text-primary" />
                                <p className="text-sm font-medium text-muted-foreground">
                                    Mencari di Odoo...
                                </p>
                            </div>
                        ) : (
                            <div className="flex-1 animate-in overflow-hidden duration-300 fade-in">
                                <ProductGrid
                                    products={products}
                                    searchQuery={searchTerm}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer: Shortcuts */}
                <div className="flex shrink-0 items-center justify-between bg-background pb-1 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
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
            <div className="w-120 shrink-0 border-l">
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
