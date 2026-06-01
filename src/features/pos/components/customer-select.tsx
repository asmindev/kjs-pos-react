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

export const CustomerSelect = memo(function CustomerSelect({
    className,
}: CustomerSelectProps) {
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

    // Intersection Observer for infinite scrolling
    const observer = useRef<IntersectionObserver | null>(null)
    const bottomRef = (node: HTMLElement | null) => {
        if (isFetchingNextPage) return
        if (observer.current) observer.current.disconnect()
        observer.current = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasNextPage) {
                fetchNextPage()
            }
        })
        if (node) observer.current.observe(node)
    }

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
                    {allCustomers.length === 0 && !isLoading ? (
                        <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                            Tidak ditemukan
                        </p>
                    ) : (
                        <ul className="p-1">
                            {allCustomers.map((c) => (
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
                            {isFetchingNextPage && (
                                <li className="animate-pulse px-3 py-2 text-center text-[10px] text-muted-foreground">
                                    Memuat lebih banyak...
                                </li>
                            )}
                            {/* Sentinel for IntersectionObserver */}
                            <li ref={bottomRef} className="h-1 w-full" />
                        </ul>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
})
