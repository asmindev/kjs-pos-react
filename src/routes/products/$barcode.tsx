type BarcodeRouteProps = {
  barcode?: string
}

export const Route = {} as never

export default function ProductBarcodeRoute({
  barcode,
}: BarcodeRouteProps = {}) {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Product lookup</h1>
      <p className="text-muted-foreground">Barcode: {barcode ?? "unknown"}</p>
    </div>
  )
}
