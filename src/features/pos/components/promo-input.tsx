import { Input } from "@/components/ui/input"
import { useCart } from "@/features/pos/hooks/use-cart"
import { Tag } from "lucide-react"

export function PromoInput() {
    const discount = useCart((s) => s.discount)
    const setDiscount = useCart((s) => s.setDiscount)

    return (
        <div className="relative">
            <Tag className="pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
            <Input
                type="number"
                placeholder="Diskon"
                value={discount || ""}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                className="h-8 w-full pl-7 text-xs"
                min={0}
            />
        </div>
    )
}
