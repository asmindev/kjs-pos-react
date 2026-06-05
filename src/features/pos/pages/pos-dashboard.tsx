import { usePosDashboard } from "@/features/pos/hooks/use-pos-dashboard"
import { BarcodeInput } from "@/features/pos/components/barcode-input"
import { ProductGrid } from "@/features/pos/components/product-grid"
import { CartSidebar } from "@/features/pos/components/cart-sidebar"
import { CustomerModal } from "@/features/pos/components/customer-modal"
import { PaymentModal } from "@/features/pos/components/payment-modal"
import { useSync } from "@/features/pos/hooks/use-sync"
import { Badge } from "@/shared/components/ui/badge"
import {
    Printer,
    Loader2,
    User,
    Store,
    Check,
    ChevronsUpDown,
    RefreshCw,
} from "lucide-react"
import { useAuth } from "@/features/pos/hooks/use-auth"
import { Button } from "@/shared/components/ui/button"
import { cn } from "@/lib/utils"
import { ButtonGroup } from "@/shared/components/ui/button-group"
import { ModeToggle } from "@/shared/components/mode-toggle"
import { RestrictedModal } from "@/features/pos/components/restricted-modal"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/shared/components/ui/popover"
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from "@/shared/components/ui/command"

export default function POSDashboard() {
    const {
        searchTerm,
        activeCategory,
        setActiveCategory,
        openCategory,
        setOpenCategory,
        barcodeRef,
        products,
        isLoading,
        error,
        isFetching,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
        categories,
        isSyncing,
        syncData,
        handleSearch,
        handleEnter,
    } = usePosDashboard()

    const { isOnline, pendingCount } = useSync()
    const isAuthenticated = useAuth((s) => s.isAuthenticated)
    const payload = useAuth((s) => s.payload)
    const isUnauthorized = !isAuthenticated

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
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-[10px] font-medium"
                            onClick={() => syncData()}
                            disabled={isSyncing || !isOnline}
                        >
                            <RefreshCw
                                className={cn(
                                    "mr-1.5 size-3",
                                    isSyncing && "animate-spin"
                                )}
                            />
                            {isSyncing ? "Syncing..." : "Sync Data"}
                        </Button>
                        <ModeToggle />
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
                                            <Popover
                                                open={openCategory}
                                                onOpenChange={setOpenCategory}
                                            >
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={
                                                            overflow.includes(
                                                                activeCategory
                                                            )
                                                                ? "default"
                                                                : "outline"
                                                        }
                                                        size="sm"
                                                        role="combobox"
                                                        aria-expanded={
                                                            openCategory
                                                        }
                                                        className={cn(
                                                            "h-8 rounded-none text-xs transition-all",
                                                            overflow.includes(
                                                                activeCategory
                                                            )
                                                                ? ""
                                                                : "bg-background hover:bg-muted hover:text-foreground"
                                                        )}
                                                    >
                                                        {overflow.includes(
                                                            activeCategory
                                                        )
                                                            ? activeCategory
                                                            : "Lainnya"}
                                                        <ChevronsUpDown className="ml-1 size-3 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="w-50 p-0"
                                                    align="end"
                                                >
                                                    <Command>
                                                        <CommandInput placeholder="Cari kategori..." />
                                                        <CommandList>
                                                            <CommandEmpty>
                                                                Kategori tidak
                                                                ditemukan.
                                                            </CommandEmpty>
                                                            <CommandGroup>
                                                                {overflow.map(
                                                                    (cat) => (
                                                                        <CommandItem
                                                                            key={
                                                                                cat
                                                                            }
                                                                            value={
                                                                                cat
                                                                            }
                                                                            onSelect={() => {
                                                                                setActiveCategory(
                                                                                    cat
                                                                                )
                                                                                setOpenCategory(
                                                                                    false
                                                                                )
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 size-4 shrink-0",
                                                                                    activeCategory ===
                                                                                        cat
                                                                                        ? "opacity-100"
                                                                                        : "opacity-0"
                                                                                )}
                                                                            />
                                                                            <span className="truncate">
                                                                                {
                                                                                    cat
                                                                                }
                                                                            </span>
                                                                        </CommandItem>
                                                                    )
                                                                )}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
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
                                    {isSyncing
                                        ? "Menyelaraskan..."
                                        : "Coba lagi"}
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
                                    hasNextPage={hasNextPage}
                                    fetchNextPage={fetchNextPage}
                                    isFetchingNextPage={isFetchingNextPage}
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
