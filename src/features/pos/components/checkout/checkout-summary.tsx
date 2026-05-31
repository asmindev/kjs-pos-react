type CheckoutSummaryProps = {
  total: number
}

export function CheckoutSummary({ total }: CheckoutSummaryProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      Checkout total: {total}
    </div>
  )
}
