import { useState, useMemo, useRef, useEffect, memo } from "react"
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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { usePosState } from "@/features/pos/hooks/use-pos-state"
import { usePosData } from "@/features/pos/hooks/use-pos-data"

type CustomerModalProps = { className?: string }

const PAGE_SIZE = 50

export const CustomerModal = memo(function CustomerModal({
    className,
}: CustomerModalProps) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")
    const [displayCount, setDisplayCount] = useState(PAGE_SIZE)
    const inputRef = useRef<HTMLInputElement>(null)

    const customer = usePosState((s) => s.customer)
    const setCustomer = usePosState((s) => s.setCustomer)
    const allCustomers = usePosData((s) => s.customers)

    // Local state for modal selection before confirming
    const [localSelected, setLocalSelected] = useState<typeof customer>(null)

    // Filter in-memory
    const filtered = useMemo(() => {
        if (!search) return allCustomers
        const q = search.toLowerCase()
        return allCustomers.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                (c.phone || "").includes(q) ||
                (c.street || "").toLowerCase().includes(q)
        )
    }, [allCustomers, search])

    const visible = filtered.slice(0, displayCount)
    const hasMore = filtered.length > displayCount

    // Focus search on open, reset on close, sync local selection
    useEffect(() => {
        if (open) {
            setSearch("")
            setDisplayCount(PAGE_SIZE)
            setLocalSelected(customer)
            setTimeout(() => inputRef.current?.focus(), 50)
        }
    }, [open, customer])

    const handleConfirm = () => {
        setCustomer(localSelected)
        setOpen(false)
    }

    const address = customer
        ? [customer.street, customer.city].filter(Boolean).join(", ")
        : ""

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
                                setDisplayCount(PAGE_SIZE)
                            }}
                            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                        />
                        <span className="text-xs text-muted-foreground">
                            {filtered.length} customer
                        </span>
                    </div>

                    {/* Customer List */}
                    <ScrollArea className="max-h-[50vh]">
                        {visible.length === 0 ? (
                            <p className="py-12 text-center text-sm text-muted-foreground">
                                Tidak ditemukan
                            </p>
                        ) : (
                            <div className="space-y-1 py-1">
                                {visible.map((c) => {
                                    const cAddress = [c.street, c.city]
                                        .filter(Boolean)
                                        .join(", ")
                                    const isSelected =
                                        localSelected?.id === c.id

                                    return (
                                        <button
                                            key={c.id}
                                            type="button"
                                            className={cn(
                                                "flex w-full items-start gap-3 rounded-sm px-3 py-3 text-left transition-colors hover:bg-muted",
                                                isSelected && "bg-primary/10"
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
                                    )
                                })}
                                {hasMore && (
                                    <div className="py-3 text-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs"
                                            onClick={() =>
                                                setDisplayCount(
                                                    (c) => c + PAGE_SIZE
                                                )
                                            }
                                        >
                                            Tampilkan lebih banyak (
                                            {filtered.length - displayCount}{" "}
                                            tersisa)
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </ScrollArea>

                    <div className="flex items-center justify-between border-t pt-4">
                        <div className="flex-1 truncate pr-4">
                            {localSelected ? (
                                <div className="flex flex-col">
                                    <span className="truncate text-sm font-semibold">
                                        {localSelected.name}
                                    </span>
                                    <span className="truncate text-[10px] text-muted-foreground">
                                        {[
                                            localSelected.street,
                                            localSelected.city,
                                        ]
                                            .filter(Boolean)
                                            .join(", ") || "Tidak ada alamat"}
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
