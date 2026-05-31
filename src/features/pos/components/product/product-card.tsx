import type { Product } from "../../domain/models/product-model"

type ProductCardProps = {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <h3 className="font-medium">{product.name}</h3>
      <p className="text-sm text-muted-foreground">{product.barcode}</p>
    </article>
  )
}
