import { useMemo, memo, useRef, useState, useEffect } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import type { Product } from "@/features/pos/domain/models/product.model"
import { useCart } from "@/features/pos/hooks/use-cart"
import { Card, CardContent } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { Package, PackageOpen } from "lucide-react"

type ProductGridProps = {
    products: Product[]
    searchQuery: string
    hasNextPage: boolean
    fetchNextPage: () => void
    isFetchingNextPage: boolean
}

const ProductCard = memo(function ProductCard({
    product,
    onAdd,
}: {
    product: Product
    onAdd: (product: Product) => void
}) {
    return (
        <Card
            className="group relative cursor-pointer overflow-hidden border-border/40 p-0 px-3 py-2 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg active:scale-[0.98]"
            onClick={() => onAdd(product)}
        >
            <CardContent className="flex flex-col p-0 px-0 group-data-[size=sm]/card:px-0">
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
                    ) : (
                        <Badge
                            variant="secondary"
                            className="px-1.5 py-0 text-[9px] text-muted-foreground"
                        >
                            Stok {product.stock}
                        </Badge>
                    )}
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
})

export const ProductGrid = memo(function ProductGrid({
    products,
    searchQuery,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
}: ProductGridProps) {
    const addItem = useCart((s) => s.addItem)

    const filtered = useMemo(() => {
        // Because pagination is already handled in the backend based on query,
        // we might not even need client-side filtering here, but we'll keep it
        // just in case any results slip through or for smaller fast filtering.
        if (!searchQuery) return products
        const q = searchQuery.toLowerCase()
        return products.filter(
            (p) =>
                p.name.toLowerCase().includes(q) ||
                p.barcode?.includes(searchQuery)
        )
    }, [products, searchQuery])

    const parentRef = useRef<HTMLDivElement>(null)
    const [cols, setCols] = useState(2)

    const gridRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const updateCols = () => {
            if (!gridRef.current) return
            const style = window.getComputedStyle(gridRef.current)
            const gridTemplateColumns = style.getPropertyValue("grid-template-columns")
            if (gridTemplateColumns && gridTemplateColumns !== "none") {
                // Computed style returns something like "150px 150px 150px"
                const numCols = gridTemplateColumns.split(" ").length
                if (numCols > 0 && numCols !== cols) {
                    setCols(numCols)
                }
            }
        }

        updateCols()
        window.addEventListener("resize", updateCols)
        return () => window.removeEventListener("resize", updateCols)
    }, [cols])

    const rows = useMemo(() => {
        const result = []
        for (let i = 0; i < filtered.length; i += cols) {
            result.push(filtered.slice(i, i + cols))
        }
        return result
    }, [filtered, cols])

    const rowVirtualizer = useVirtualizer({
        count: hasNextPage ? rows.length + 1 : rows.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 140, // Approximate height of ProductCard + gap
        overscan: 6, // Tweak this value to control how many extra rows are rendered outside the viewport.
    })

    const virtualItems = rowVirtualizer.getVirtualItems()

    useEffect(() => {
        const lastItem = virtualItems[virtualItems.length - 1]
        if (!lastItem) return

        if (
            lastItem.index >= rows.length - 1 &&
            hasNextPage &&
            !isFetchingNextPage
        ) {
            fetchNextPage()
        }
    }, [
        hasNextPage,
        fetchNextPage,
        rows.length,
        isFetchingNextPage,
        virtualItems,
    ])

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
        <div className="flex h-full flex-col overflow-hidden bg-muted p-2">
            {/* Invisible grid to dynamically measure CSS computed columns */}
            <div ref={gridRef} className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 invisible h-0" aria-hidden="true" />
            
            <div ref={parentRef} className="flex-1 overflow-auto">
                <div
                    className="relative w-full"
                    style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
                >
                    {virtualItems.map((virtualRow) => {
                        const isLoaderRow = virtualRow.index > rows.length - 1
                        const rowProducts = rows[virtualRow.index]

                        if (isLoaderRow) {
                            return (
                                <div
                                    key={virtualRow.key}
                                    className="absolute top-0 left-0 flex w-full items-center justify-center pb-4"
                                    style={{
                                        height: `${virtualRow.size}px`,
                                        transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                >
                                    <span className="animate-pulse text-xs text-muted-foreground">
                                        Memuat...
                                    </span>
                                </div>
                            )
                        }

                        return (
                            <div
                                key={virtualRow.key}
                                ref={rowVirtualizer.measureElement}
                                data-index={virtualRow.index}
                                className="absolute top-0 left-0 w-full pb-3"
                                style={{
                                    transform: `translateY(${virtualRow.start}px)`,
                                }}
                            >
                                <div className="grid h-full grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                                    {rowProducts.map((product) => (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                            onAdd={addItem}
                                        />
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
})
