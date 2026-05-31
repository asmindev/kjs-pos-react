import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { User, X } from "lucide-react"

type Customer = {
    id: string
    name: string
    phone?: string
}

type CustomerSelectProps = {
    onSelect: (customer: Customer | null) => void
}

const mockCustomers: Customer[] = [
    { id: "1", name: "Budi Santoso", phone: "081234567890" },
    { id: "2", name: "Siti Rahayu", phone: "082345678901" },
    { id: "3", name: "Pak Joko", phone: "083456789012" },
]

export function CustomerSelect({ onSelect }: CustomerSelectProps) {
    const [query, setQuery] = useState("")
    const [isOpen, setIsOpen] = useState(false)
    const [selected, setSelected] = useState<Customer | null>(null)

    const filtered = query
        ? mockCustomers.filter(
              (c) =>
                  c.name.toLowerCase().includes(query.toLowerCase()) ||
                  c.phone?.includes(query)
          )
        : mockCustomers

    return (
        <div className="relative">
            {selected ? (
                <Badge variant="secondary" className="gap-1">
                    <User className="size-3" />
                    {selected.name}
                    <button
                        type="button"
                        onClick={() => {
                            setSelected(null)
                            onSelect(null)
                        }}
                        className="ml-0.5 hover:text-destructive"
                    >
                        <X className="size-3" />
                    </button>
                </Badge>
            ) : (
                <div className="relative">
                    <User className="pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Customer"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value)
                            setIsOpen(true)
                        }}
                        onFocus={() => setIsOpen(true)}
                        onBlur={() =>
                            setTimeout(() => setIsOpen(false), 200)
                        }
                        className="h-8 w-full pl-7 text-xs"
                    />
                </div>
            )}
            {isOpen && !selected && (
                <ul className="absolute left-0 top-full z-30 mt-1 max-h-40 w-56 overflow-auto border bg-popover p-1 shadow-lg">
                    {filtered.length === 0 ? (
                        <li className="px-3 py-2 text-xs text-muted-foreground">
                            Tidak ditemukan
                        </li>
                    ) : (
                        filtered.map((c) => (
                            <li key={c.id}>
                                <button
                                    type="button"
                                    className="w-full px-3 py-2 text-left text-xs transition-colors hover:bg-muted"
                                    onMouseDown={() => {
                                        setSelected(c)
                                        setQuery("")
                                        setIsOpen(false)
                                        onSelect(c)
                                    }}
                                >
                                    <p className="font-medium">{c.name}</p>
                                    {c.phone && (
                                        <p className="text-[10px] text-muted-foreground">
                                            {c.phone}
                                        </p>
                                    )}
                                </button>
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    )
}
