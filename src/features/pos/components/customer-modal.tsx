import { useState, useMemo, useRef, useEffect, memo } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import {
    Search,
    User,
    X,
    Check,
    ChevronsUpDown,
    MapPin,
    Phone,
    Mail,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/shared/components/ui/dialog"
import { usePosState } from "@/features/pos/hooks/use-pos-state"
import { useCustomers } from "@/features/pos/hooks/use-customers"

type CustomerModalProps = { className?: string }

export const CustomerModal = memo(function CustomerModal({
    className,
}: CustomerModalProps) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)

    const customer = usePosState((s) => s.customer)
    const setCustomer = usePosState((s) => s.setCustomer)
    const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
        useCustomers(search)

    const allCustomers = useMemo(() => {
        return data?.pages.flatMap((page) => page) ?? []
    }, [data])

    // Local state for modal selection before confirming
    const [localSelected, setLocalSelected] = useState<typeof customer>(null)

    const parentRef = useRef<HTMLDivElement>(null)

    const rowVirtualizer = useVirtualizer({
        count: hasNextPage ? allCustomers.length + 1 : allCustomers.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 64, // approximate height for modal list item
        overscan: 5,
    })

    const virtualItems = rowVirtualizer.getVirtualItems()

    useEffect(() => {
        const lastItem = virtualItems[virtualItems.length - 1]
        if (!lastItem) return

        if (
            lastItem.index >= allCustomers.length - 1 &&
            hasNextPage &&
            !isFetchingNextPage
        ) {
            fetchNextPage()
        }
    }, [
        hasNextPage,
        fetchNextPage,
        allCustomers.length,
        isFetchingNextPage,
        virtualItems,
    ])

    // Focus search on open, reset on close, sync local selection
    useEffect(() => {
        if (open) {
            setSearch("")
            setLocalSelected(customer)
            setTimeout(() => inputRef.current?.focus(), 50)
        }
    }, [open, customer])

    const handleConfirm = () => {
        setCustomer(localSelected)
        setOpen(false)
    }

    const address = ""

    return (
        <>
            {/* Trigger Button */}
            <Button
                variant="outline"
                className={cn(
                    "h-11 min-h-8 justify-between px-3 py-1.5 text-xs",
                    !customer && "w-55",
                    customer && "max-w-55",
                    className
                )}
                onClick={() => setOpen(true)}
            >
                {customer ? (
                    <div className="flex flex-col items-start truncate text-left">
                        <div className="flex w-full items-center gap-2 truncate">
                            <User className="size-3 shrink-0" />
                            <span className="truncate font-semibold">
                                {customer.name}
                            </span>
                        </div>
                        {address && (
                            <span className="mt-0.5 w-full truncate text-[10px] text-muted-foreground">
                                {address}
                            </span>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-2 truncate text-muted-foreground">
                        <User className="size-3 shrink-0" />
                        <span>
                            {allCustomers.length === 0
                                ? "Memuat..."
                                : "Pilih Customer..."}
                        </span>
                    </div>
                )}
                <ChevronsUpDown className="ml-2 size-3 shrink-0 opacity-50" />
            </Button>

            {/* Modal */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="min-w-11/12" showCloseButton>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <User className="size-4" />
                            Pilih Customer
                            {localSelected && (
                                <Badge
                                    variant="secondary"
                                    className="ml-2 gap-1 font-normal"
                                >
                                    Terpilih: {localSelected.name}
                                    <X
                                        className="size-3 cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setLocalSelected(null)
                                        }}
                                    />
                                </Badge>
                            )}
                        </DialogTitle>
                    </DialogHeader>

                    {/* Search */}
                    <div className="flex items-center border-b pb-3">
                        <Search className="mr-2 size-4 shrink-0 text-muted-foreground" />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Cari nama, no. HP, atau alamat..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value)
                            }}
                            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                        />
                        <span className="text-xs text-muted-foreground">
                            {allCustomers.length} customer
                        </span>
                    </div>

                    {/* Customer List */}
                    <div
                        ref={parentRef}
                        className="max-h-[50vh] overflow-y-auto"
                    >
                        {allCustomers.length === 0 && !isLoading ? (
                            <p className="py-12 text-center text-sm text-muted-foreground">
                                Tidak ditemukan
                            </p>
                        ) : (
                            <div
                                className="relative w-full"
                                style={{
                                    height: `${rowVirtualizer.getTotalSize()}px`,
                                }}
                            >
                                {virtualItems.map((virtualRow) => {
                                    const isLoaderRow =
                                        virtualRow.index >
                                        allCustomers.length - 1
                                    const c = allCustomers[virtualRow.index]

                                    if (isLoaderRow) {
                                        return (
                                            <div
                                                key={virtualRow.key}
                                                className="absolute top-0 left-0 w-full"
                                                style={{
                                                    height: `${virtualRow.size}px`,
                                                    transform: `translateY(${virtualRow.start}px)`,
                                                }}
                                            >
                                                <div className="animate-pulse py-3 text-center text-xs text-muted-foreground">
                                                    Memuat lebih banyak...
                                                </div>
                                            </div>
                                        )
                                    }

                                    const cAddress = ""
                                    const isSelected =
                                        localSelected?.id === c.id

                                    return (
                                        <div
                                            key={virtualRow.key}
                                            className="absolute top-0 left-0 w-full"
                                            style={{
                                                height: `${virtualRow.size}px`,
                                                transform: `translateY(${virtualRow.start}px)`,
                                            }}
                                        >
                                            <button
                                                type="button"
                                                className={cn(
                                                    "flex h-full w-full items-start gap-3 rounded-sm px-3 py-3 text-left transition-colors hover:bg-muted",
                                                    isSelected &&
                                                        "bg-primary/10"
                                                )}
                                                onClick={() =>
                                                    setLocalSelected(
                                                        isSelected ? null : c
                                                    )
                                                }
                                            >
                                                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                                                    <User className="size-4 text-muted-foreground" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">
                                                            {c.name}
                                                        </span>
                                                        {isSelected && (
                                                            <Check className="size-4 text-primary" />
                                                        )}
                                                    </div>
                                                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-muted-foreground">
                                                        {c.phone && (
                                                            <span className="inline-flex items-center gap-1">
                                                                <Phone className="size-3" />
                                                                {c.phone}
                                                            </span>
                                                        )}
                                                        {c.email && (
                                                            <span className="inline-flex items-center gap-1">
                                                                <Mail className="size-3" />
                                                                {c.email}
                                                            </span>
                                                        )}
                                                        {cAddress && (
                                                            <span className="inline-flex items-center gap-1">
                                                                <MapPin className="size-3" />
                                                                {cAddress}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between border-t pt-4">
                        <div className="flex-1 truncate pr-4">
                            {localSelected ? (
                                <div className="flex flex-col">
                                    <span className="truncate text-sm font-semibold">
                                        {localSelected.name}
                                    </span>
                                    <span className="truncate text-[10px] text-muted-foreground">
                                        "Tidak ada alamat"
                                    </span>
                                </div>
                            ) : (
                                <span className="text-xs text-muted-foreground">
                                    Belum ada customer dipilih
                                </span>
                            )}
                        </div>
                        <Button onClick={handleConfirm} disabled={false}>
                            Set Customer
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
})
