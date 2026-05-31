type BarcodeScannerProps = {
  onScan?: (barcode: string) => void
}

export function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  return (
    <button
      className="rounded-2xl border border-border px-4 py-2"
      type="button"
      onClick={() => onScan?.("000000")}
    >
      Scan barcode
    </button>
  )
}
