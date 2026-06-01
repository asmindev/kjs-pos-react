import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from "react"
import { Input } from "@/shared/components/ui/input"
import { Button } from "@/shared/components/ui/button"
import { usePosState } from "@/features/pos/hooks/use-pos-state"
import { useDebounce } from "@/shared/hooks/use-debounce"
import { Scan } from "lucide-react"

export interface BarcodeInputRef {
    clear: () => void
    focus: () => void
}

interface BarcodeInputProps {
    /** Dipanggil dengan nilai yang sudah di-debounce (300ms) — tidak menyebabkan parent re-render saat mengetik */
    onSearch: (query: string) => void
    /** Dipanggil saat Enter ditekan, menerima nilai mentah saat ini */
    onEnter?: (currentValue: string) => void
}

export const BarcodeInput = forwardRef<BarcodeInputRef, BarcodeInputProps>(
    function BarcodeInput({ onSearch, onEnter }, ref) {
        const [inputValue, setInputValue] = useState("")
        const debouncedValue = useDebounce(inputValue, 300)
        const inputRef = useRef<HTMLInputElement>(null)

        const phase = usePosState((s) => s.phase)
        const startScanning = usePosState((s) => s.startScanning)
        const stopScanning = usePosState((s) => s.stopScanning)
        const isScanning = phase === "scanning"

        // Expose clear() dan focus() ke parent via ref
        useImperativeHandle(ref, () => ({
            clear: () => {
                setInputValue("")
                onSearch("")
            },
            focus: () => inputRef.current?.focus(),
        }))

        // Beritahu parent hanya setelah debounce — parent tidak re-render saat mengetik
        useEffect(() => {
            onSearch(debouncedValue)
        }, [debouncedValue, onSearch])

        return (
            <div className="relative flex-1">
                <Input
                    ref={inputRef}
                    id="barcode-input"
                    type="text"
                    placeholder={
                        isScanning
                            ? "Scan barcode... (Esc untuk berhenti)"
                            : "Ketik atau scan barcode produk..."
                    }
                    className="h-11 pr-28 text-sm focus:border-none focus:shadow-none focus:ring-0"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    autoFocus
                    onFocus={() => startScanning()}
                    onBlur={() => {
                        if (isScanning) stopScanning()
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Escape") {
                            setInputValue("")
                            onSearch("")
                            stopScanning()
                            e.currentTarget.blur()
                        }
                        if (e.key === "Enter") {
                            if (onEnter) onEnter(inputValue)
                        }
                    }}
                />
                <div className="absolute top-1/2 right-1.5 flex -translate-y-1/2 items-center gap-1.5">
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
)
