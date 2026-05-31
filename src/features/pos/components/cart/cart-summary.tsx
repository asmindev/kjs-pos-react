type CartSummaryProps = {
  subtotal: number
  total: number
}

export function CartSummary({ subtotal, total }: CartSummaryProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">Subtotal: {subtotal}</p>
      <p className="text-lg font-semibold">Total: {total}</p>
    </div>
  )
}
