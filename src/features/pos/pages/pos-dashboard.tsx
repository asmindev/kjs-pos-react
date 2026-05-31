import { useState, useEffect } from "react"
import { BarcodeInput } from "@/features/pos/components/barcode-input"
import { ProductGrid } from "@/features/pos/components/product-grid"
import { CartSidebar } from "@/features/pos/components/cart-sidebar"
import { CustomerModal } from "@/features/pos/components/customer-modal"
import { PromoInput } from "@/features/pos/components/promo-input"
import { PaymentModal } from "@/features/pos/components/payment-modal"
import { usePosState } from "@/features/pos/hooks/use-pos-state"
import { useSync } from "@/features/pos/hooks/use-sync"
import { Badge } from "@/components/ui/badge"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
} from "@/components/ui/input-group"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Printer, Loader2 } from "lucide-react"
import { usePosData } from "@/features/pos/hooks/use-pos-data"
import { useDebounce } from "@/shared/hooks/use-debounce"
import { Button } from "@/components/ui/button"

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
    const debouncedSearch = useDebounce(searchQuery, 150)
    const [activeCategory, setActiveCategory] = useState("Semua")
    const [showMore, setShowMore] = useState(false)
    const { setCustomer } = usePosState()
    const { isOnline, pendingCount } = useSync()
    const { products, isLoading, error, refetch } = usePosData()

    // Fetch data on mount
    useEffect(() => {
        refetch()
    }, [refetch])

    return (
        <div className="flex h-full flex-col">
            {/* Top Bar */}
            <div className="flex shrink-0 items-center gap-3 py-0.5">
                <div className="flex-1 pl-2">
                    <BarcodeInput />
                </div>
                <CustomerModal />
            </div>

            {/* Category Input Group */}
            <InputGroup className="w-full shrink-0">
                <InputGroupAddon className="relative gap-1">
                    {(() => {
                        const MAX_VISIBLE = 15
                        const visible = categories.slice(0, MAX_VISIBLE)
                        const overflow = categories.slice(MAX_VISIBLE)
                        return (
                            <>
                                {visible.map((cat) => (
                                    <InputGroupButton
                                        key={cat}
                                        variant={
                                            activeCategory === cat
                                                ? "default"
                                                : "ghost"
                                        }
                                        size={"sm"}
                                        onClick={() => setActiveCategory(cat)}
                                    >
                                        {cat}
                                    </InputGroupButton>
                                ))}

                                {overflow.length > 0 && (
                                    <div className="relative">
                                        <InputGroupButton
                                            size="sm"
                                            onClick={() =>
                                                setShowMore((s) => !s)
                                            }
                                        >
                                            More ▾
                                        </InputGroupButton>

                                        {showMore && (
                                            <div className="absolute right-0 z-50 mt-2 w-40 rounded-none bg-popover p-2 shadow-popover">
                                                {overflow.map((cat) => (
                                                    <button
                                                        key={cat}
                                                        className="block w-full px-2 py-1 text-left text-sm hover:bg-popover-foreground/5"
                                                        onClick={() => {
                                                            setActiveCategory(
                                                                cat
                                                            )
                                                            setShowMore(false)
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
                </InputGroupAddon>

                <div className="ml-auto flex items-center gap-2 pr-2">
                    <Badge
                        variant={isOnline ? "secondary" : "destructive"}
                        className="gap-1"
                    >
                        <span
                            className={`h-1.5 w-1.5 rounded-full ${
                                isOnline ? "bg-emerald-500" : "bg-red-500"
                            }`}
                        />
                        {isOnline ? "Online" : "Offline"}
                    </Badge>
                    {pendingCount > 0 && (
                        <Badge variant="outline" className="gap-1">
                            {pendingCount} pending
                        </Badge>
                    )}
                </div>
            </InputGroup>

            {/* Main: Product Grid + Cart Sidebar */}
            <div className="flex flex-1 gap-3 overflow-hidden">
                <Card
                    size="sm"
                    className="flex flex-1 flex-col overflow-hidden bg-red-500 p-0 data-[size=sm]:py-0"
                >
                    {isLoading ? (
                        <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
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
                            >
                                Coba lagi
                            </Button>
                        </div>
                    ) : (
                        <ProductGrid
                            products={products}
                            searchQuery={debouncedSearch}
                        />
                    )}
                </Card>
                <div className="w-80 shrink-0">
                    <CartSidebar />
                </div>
            </div>

            {/* Footer: Shortcuts */}
            <div className="flex shrink-0 items-center gap-2 border-t text-[10px] text-muted-foreground">
                <span className="text-xs font-semibold tracking-wider uppercase">
                    Shortcut
                </span>
                {[
                    ["F1", "Cari"],
                    ["F2", "Scan"],
                    ["F9", "Bayar"],
                    ["Esc", "Batal"],
                ].map(([key, label]) => (
                    <Badge
                        key={key}
                        variant="outline"
                        className="flex items-center justify-between gap-1 font-mono"
                    >
                        <span className="text-[9px]">{key}</span>
                        <span className="font-sans">{label}</span>
                    </Badge>
                ))}
                <div className="ml-auto flex items-center gap-1 pr-2">
                    <Printer className="size-3" />
                    <span className="">EPSON TM-T82 siap</span>
                </div>
            </div>

            <PaymentModal />
        </div>
    )
}
