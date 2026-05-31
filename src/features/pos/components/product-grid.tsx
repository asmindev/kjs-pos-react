import type { Product } from "@/features/pos/domain/models/product-model"
import { useCart } from "@/features/pos/hooks/use-cart"
import { Card, CardContent } from "@/components/ui/card"
import { Package, PackageOpen } from "lucide-react"

const accentColors = [
    "from-orange-500/20 to-orange-500/5 text-orange-400",
    "from-sky-500/20 to-sky-500/5 text-sky-400",
    "from-slate-500/20 to-slate-500/5 text-slate-400",
    "from-red-500/20 to-red-500/5 text-red-400",
    "from-emerald-500/20 to-emerald-500/5 text-emerald-400",
    "from-amber-500/20 to-amber-500/5 text-amber-400",
    "from-violet-500/20 to-violet-500/5 text-violet-400",
    "from-rose-500/20 to-rose-500/5 text-rose-400",
    "from-cyan-500/20 to-cyan-500/5 text-cyan-400",
    "from-lime-500/20 to-lime-500/5 text-lime-400",
    "from-pink-500/20 to-pink-500/5 text-pink-400",
    "from-blue-500/20 to-blue-500/5 text-blue-400",
]

type ProductGridProps = {
    products: Product[]
    searchQuery: string
}

export function ProductGrid({ products, searchQuery }: ProductGridProps) {
    const { addItem } = useCart()

    const filtered = searchQuery
        ? products.filter(
              (p) =>
                  p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.barcode.includes(searchQuery)
          )
        : products

    if (filtered.length === 0) {
        return (
            <div className="flex h-full flex-col items-center justify-center text-center">
                <PackageOpen className="mx-auto size-12 text-muted-foreground/40" />
                <p className="mt-3 text-sm font-medium text-muted-foreground">
                    {searchQuery
                        ? "Produk tidak ditemukan"
                        : "Belum ada produk"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground/60">
                    {searchQuery
                        ? "Coba kata kunci atau barcode lain"
                        : "Produk akan muncul setelah sync dengan Odoo"}
                </p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 gap-2 overflow-auto p-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((product, i) => {
                const accent = accentColors[i % accentColors.length]

                return (
                    <Card
                        key={product.id}
                        className="group cursor-pointer border-border/60 transition-all hover:border-primary/40 hover:bg-accent/5 active:scale-[0.98]"
                        onClick={() => addItem(product)}
                    >
                        <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                            <div
                                className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${accent}`}
                            >
                                <Package className="size-5" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold leading-tight">
                                    {product.name}
                                </p>
                                <p className="mt-0.5 text-[10px] text-muted-foreground/50">
                                    {product.barcode}
                                </p>
                                <p className="mt-1 text-sm font-bold">
                                    Rp {product.price.toLocaleString("id-ID")}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
