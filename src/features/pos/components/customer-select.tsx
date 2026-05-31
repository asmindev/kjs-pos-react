import { useState } from "react"
import { Check, ChevronsUpDown, User, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { usePosState } from "@/features/pos/hooks/use-pos-state"
import { usePosData } from "@/features/pos/hooks/use-pos-data"

type CustomerSelectProps = {
    className?: string
}

export function CustomerSelect({ className }: CustomerSelectProps) {
    const [open, setOpen] = useState(false)
    const { customer: selected, setCustomer } = usePosState()
    const { customers } = usePosData()

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "h-8 w-[220px] justify-between px-3 text-xs",
                        className
                    )}
                >
                    {selected ? (
                        <div className="flex w-full items-center justify-between gap-2">
                            <div className="flex items-center gap-2 truncate">
                                <User className="size-3 shrink-0" />
                                <span className="truncate">
                                    {selected.name}
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
                                {customers.length === 0
                                    ? "Memuat..."
                                    : "Pilih Customer..."}
                            </span>
                        </div>
                    )}
                    {!selected && (
                        <ChevronsUpDown className="ml-2 size-3 shrink-0 opacity-50" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-0" align="start">
                <Command>
                    <CommandInput
                        placeholder="Cari nama atau no. HP..."
                        className="h-9 text-xs"
                    />
                    <CommandList>
                        <CommandEmpty className="py-2 text-center text-xs text-muted-foreground">
                            Tidak ditemukan.
                        </CommandEmpty>
                        <CommandGroup>
                            {customers.map((c) => (
                                <CommandItem
                                    key={c.id}
                                    value={`${c.name} ${c.phone || ""}`}
                                    onSelect={() => {
                                        const newValue =
                                            selected?.id === c.id
                                                ? null
                                                : c
                                        setCustomer(newValue)
                                        setOpen(false)
                                    }}
                                    className="flex items-center justify-between"
                                >
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-xs font-medium">
                                            {c.name}
                                        </span>
                                        {c.phone && (
                                            <span className="text-[10px] text-muted-foreground">
                                                {c.phone}
                                            </span>
                                        )}
                                    </div>
                                    <Check
                                        className={cn(
                                            "mr-2 size-4",
                                            selected?.id === c.id
                                                ? "opacity-100"
                                                : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
