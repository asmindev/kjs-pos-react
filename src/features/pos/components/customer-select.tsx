import { useState, memo, useMemo, useRef, useEffect } from "react"
import { Check, ChevronsUpDown, User, X, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/shared/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/shared/components/ui/popover"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import { usePosState } from "@/features/pos/hooks/use-pos-state"
import { useCustomers } from "@/features/pos/hooks/use-customers"

type CustomerSelectProps = { className?: string }

const MAX_VISIBLE = 50

export const CustomerSelect = memo(function CustomerSelect({
    className,
}: CustomerSelectProps) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)

    const customer = usePosState((s) => s.customer)
    const setCustomer = usePosState((s) => s.setCustomer)
    const { data: allCustomers = [], isLoading } = useCustomers("")

    // Filter in-memory — O(n) tapi untuk 2000 item <1ms
    const filtered = useMemo(() => {
        if (!search) return allCustomers
        const q = search.toLowerCase()
        return allCustomers.filter(
            (c) =>
                c.name.toLowerCase().includes(q) || (c.phone || "").includes(q)
        )
    }, [allCustomers, search])

    const visible = filtered.slice(0, MAX_VISIBLE)
    const hasMore = filtered.length > MAX_VISIBLE

    // Focus input saat popover terbuka
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 50)
        } else {
            setSearch("")
        }
    }, [open])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "h-8 w-55 justify-between px-3 text-xs",
                        className
                    )}
                >
                    {customer ? (
                        <div className="flex w-full items-center justify-between gap-2">
                            <div className="flex items-center gap-2 truncate">
                                <User className="size-3 shrink-0" />
                                <span className="truncate">
                                    {customer.name}
                                </span>
                            </div>
                            <div
                                role="button"
                                tabIndex={0}
                                className="rounded hover:bg-muted"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setCustomer(null)
                                }}
                            >
                                <X className="size-3 shrink-0 text-muted-foreground hover:text-foreground" />
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 truncate text-muted-foreground">
                            <User className="size-3 shrink-0" />
                            <span>
                                {isLoading ? "Memuat..." : "Pilih Customer..."}
                            </span>
                        </div>
                    )}
                    {!customer && (
                        <ChevronsUpDown className="ml-2 size-3 shrink-0 opacity-50" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-65 p-0" align="start" sideOffset={4}>
                {/* Search input */}
                <div className="flex items-center border-b px-3 py-2">
                    <Search className="mr-2 size-3.5 shrink-0 text-muted-foreground" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Cari nama atau no. HP..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/60"
                        onKeyDown={(e) => {
                            if (e.key === "Escape") setOpen(false)
                        }}
                    />
                </div>

                {/* Results */}
                <ScrollArea className="max-h-64">
                    {visible.length === 0 ? (
                        <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                            Tidak ditemukan
                        </p>
                    ) : (
                        <ul className="p-1">
                            {visible.map((c) => (
                                <li key={c.id}>
                                    <button
                                        type="button"
                                        className={cn(
                                            "flex w-full items-center justify-between rounded-sm px-3 py-2 text-left text-xs transition-colors hover:bg-muted",
                                            customer?.id === c.id &&
                                                "bg-primary/10"
                                        )}
                                        onClick={() => {
                                            setCustomer(
                                                customer?.id === c.id ? null : c
                                            )
                                            setOpen(false)
                                        }}
                                    >
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-medium">
                                                {c.name}
                                            </span>
                                            {c.phone && (
                                                <span className="text-[10px] text-muted-foreground">
                                                    {c.phone}
                                                </span>
                                            )}
                                        </div>
                                        {customer?.id === c.id && (
                                            <Check className="size-4" />
                                        )}
                                    </button>
                                </li>
                            ))}
                            {hasMore && (
                                <li className="px-3 py-2 text-center text-[10px] text-muted-foreground">
                                    +{filtered.length - MAX_VISIBLE} lainnya —
                                    ketik untuk mencari
                                </li>
                            )}
                        </ul>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
})
