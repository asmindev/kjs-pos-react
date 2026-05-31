import type { Product } from "@/features/pos/domain/models/product-model"
import { useCart } from "@/features/pos/hooks/use-cart"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, PackageOpen } from "lucide-react"

type ProductGridProps = {
    products: Product[]
    searchQuery: string
}

function ProductCard({
    product,
    addItem,
}: {
    product: Product
    addItem: (product: Product) => void
}) {
    return (
        <Card
            key={product.id}
            className="group relative cursor-pointer overflow-hidden border-border/40 bg-card transition-all duration-300 hover:-translate-y-[2px] hover:border-primary/50 hover:shadow-lg active:scale-[0.98]"
            onClick={() => addItem(product)}
        >
            <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                        <Package className="size-5" />
                    </div>
                    {product.stock <= 0 ? (
                        <Badge
                            variant="destructive"
                            className="px-1.5 py-0 text-[9px]"
                        >
                            Habis
                        </Badge>
                    ) : product.stock <= 5 ? (
                        <Badge
                            variant="outline"
                            className="border-amber-500/30 px-1.5 py-0 text-[9px] text-amber-500"
                        >
                            Sisa {product.stock}
                        </Badge>
                    ) : null}
                </div>

                <div className="mt-1 min-w-0 space-y-1">
                    <p
                        className="text-xs leading-tight font-semibold"
                        title={product.name}
                    >
                        {product.name}
                    </p>
                    <p className="font-mono text-[10px] text-muted-foreground/60">
                        {product.barcode}
                    </p>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-border/40 pt-2">
                    <span className="text-sm font-bold text-primary tabular-nums">
                        Rp {product.price.toLocaleString("id-ID")}
                    </span>
                </div>
            </CardContent>
        </Card>
    )
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
        <div className="flex h-full flex-col overflow-hidden">
            <div className="flex-1 overflow-auto p-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                    {filtered.map((product) => {
                        return (
                            <ProductCard
                                key={product.id}
                                product={product}
                                addItem={addItem}
                            />
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
