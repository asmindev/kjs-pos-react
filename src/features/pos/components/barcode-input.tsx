import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { usePosState } from "@/features/pos/hooks/use-pos-state"
import { Scan } from "lucide-react"

interface BarcodeInputProps {
    value: string
    onChange: (value: string) => void
    onEnter?: () => void
}

export function BarcodeInput({ value, onChange, onEnter }: BarcodeInputProps) {
    const phase = usePosState((s) => s.phase)
    const startScanning = usePosState((s) => s.startScanning)
    const stopScanning = usePosState((s) => s.stopScanning)
    const isScanning = phase === "scanning"

    return (
        <div className="relative flex-1">
            <Input
                id="barcode-input"
                type="text"
                placeholder={
                    isScanning
                        ? "Scan barcode... (Esc untuk berhenti)"
                        : "Ketik atau scan barcode produk..."
                }
                className="h-11 pr-28 text-sm"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                autoFocus
                onFocus={() => startScanning()}
                onBlur={() => {
                    if (isScanning) stopScanning()
                }}
                onKeyDown={(e) => {
                    if (e.key === "Escape") {
                        stopScanning()
                        e.currentTarget.blur()
                    }
                    if (e.key === "Enter") {
                        if (onEnter) onEnter()
                    }
                }}
            />
            <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
                {isScanning && (
                    <span className="flex h-2 w-2 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_6px] shadow-emerald-500/50" />
                )}
                <Button
                    size="xs"
                    variant="ghost"
                    className="h-7 gap-1 text-[10px] text-muted-foreground"
                >
                    <Scan className="size-3" />
                    F2 Scan
                </Button>
            </div>
        </div>
    )
}
