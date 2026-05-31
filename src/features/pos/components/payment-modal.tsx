import { useEffect } from "react"
import { usePosState } from "@/features/pos/hooks/use-pos-state"
import { useCart } from "@/features/pos/hooks/use-cart"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
    Banknote,
    CreditCard,
    Landmark,
    Check,
    Clock,
    Printer,
    Loader2,
} from "lucide-react"

const paymentLabels: Record<string, string> = {
    cash: "Tunai",
    card: "Kartu",
    transfer: "Transfer",
}

const paymentIcons: Record<string, React.ReactNode> = {
    cash: <Banknote className="size-5" />,
    card: <CreditCard className="size-5" />,
    transfer: <Landmark className="size-5" />,
}

export function PaymentModal() {
    const {
        phase,
        paymentMethod,
        paidAmount,
        changeAmount,
        errorMessage,
        transactionRef,
        syncSuccess,
        selectPaymentMethod,
        setPaidAmount,
        processPayment,
        finishTransaction,
        resetToIdle,
    } = usePosState()

    const { getTotal } = useCart()
    const total = getTotal()

    const isOpen = ["payment", "processing", "success", "error"].includes(phase)
    const isLocked = phase === "payment" || phase === "processing"
    const isProcessing = phase === "processing"
    const isSuccess = phase === "success"
    const isError = phase === "error"

    useEffect(() => {
        if (!isOpen) return
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isLocked) e.preventDefault()
            if (e.key === "Enter" && phase === "success") finishTransaction()
            if (e.key === "Enter" && phase === "payment") {
                const { paymentMethod, paidAmount } = usePosState.getState()
                const total = useCart.getState().getTotal()
                if (
                    paymentMethod &&
                    (paymentMethod !== "cash" || paidAmount >= total)
                ) {
                    processPayment()
                }
            }
        }
        window.addEventListener("keydown", handler)
        return () => window.removeEventListener("keydown", handler)
    }, [isOpen, phase, isLocked, finishTransaction, processPayment])

    const canPay =
        !!paymentMethod &&
        (paymentMethod !== "cash" || paidAmount >= total)

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open && isSuccess) finishTransaction()
                if (!open && isError) finishTransaction()
                if (!open && !isLocked) resetToIdle()
            }}
        >
            <DialogContent
                showCloseButton={!isLocked}
                className="sm:max-w-md"
                onPointerDownOutside={(e) => {
                    if (isLocked) e.preventDefault()
                }}
                onEscapeKeyDown={(e) => {
                    if (isLocked) e.preventDefault()
                }}
            >
                {/* Payment Input */}
                {phase === "payment" && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Pembayaran</DialogTitle>
                            <DialogDescription>
                                Pilih metode pembayaran
                            </DialogDescription>
                        </DialogHeader>

                        <div className="text-center">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                                Total
                            </p>
                            <p className="mt-1 text-2xl font-extrabold tracking-tight tabular-nums">
                                Rp {total.toLocaleString("id-ID")}
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {(["cash", "card", "transfer"] as const).map(
                                (method) => (
                                    <Button
                                        key={method}
                                        variant={
                                            paymentMethod === method
                                                ? "default"
                                                : "outline"
                                        }
                                        onClick={() =>
                                            selectPaymentMethod(method)
                                        }
                                        className={cn(
                                            "h-auto flex-col gap-1 py-3 text-xs font-medium",
                                            paymentMethod === method &&
                                                "ring-1 ring-primary/20"
                                        )}
                                    >
                                        {paymentIcons[method]}
                                        <span>{paymentLabels[method]}</span>
                                    </Button>
                                )
                            )}
                        </div>

                        {paymentMethod === "cash" && (
                            <div className="space-y-2">
                                <label
                                    htmlFor="paid-amount"
                                    className="text-xs font-medium"
                                >
                                    Jumlah Dibayar
                                </label>
                                <Input
                                    id="paid-amount"
                                    type="number"
                                    placeholder="0"
                                    value={paidAmount || ""}
                                    onChange={(e) =>
                                        setPaidAmount(
                                            Number(e.target.value) || 0
                                        )
                                    }
                                    className="h-12 text-right text-xl font-bold"
                                    autoFocus
                                />
                                {changeAmount > 0 && (
                                    <div className="flex justify-between bg-emerald-500/10 px-4 py-2">
                                        <span className="text-xs text-emerald-600 dark:text-emerald-400">
                                            Kembali:
                                        </span>
                                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                            Rp{" "}
                                            {changeAmount.toLocaleString(
                                                "id-ID"
                                            )}
                                        </span>
                                    </div>
                                )}
                                {paidAmount > 0 && paidAmount < total && (
                                    <p className="text-[10px] text-destructive">
                                        Kurang Rp{" "}
                                        {(total - paidAmount).toLocaleString(
                                            "id-ID"
                                        )}
                                    </p>
                                )}
                            </div>
                        )}

                        {paymentMethod && paymentMethod !== "cash" && (
                            <div className="bg-muted p-4 text-center">
                                <p className="text-sm font-semibold">
                                    {paymentLabels[paymentMethod]}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Pembayaran sebesar{" "}
                                    <strong>
                                        Rp {total.toLocaleString("id-ID")}
                                    </strong>
                                </p>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={resetToIdle}
                            >
                                Batal
                            </Button>
                            <Button
                                className="flex-1 font-bold shadow-lg shadow-emerald-500/25"
                                onClick={processPayment}
                                disabled={!canPay}
                            >
                                Konfirmasi
                            </Button>
                        </div>
                    </>
                )}

                {/* Processing */}
                {isProcessing && (
                    <div className="space-y-4 py-8 text-center">
                        <Loader2 className="mx-auto size-12 animate-spin text-primary" />
                        <DialogTitle>Memproses...</DialogTitle>
                        <DialogDescription>
                            Mohon tunggu sebentar
                        </DialogDescription>
                    </div>
                )}

                {/* Success */}
                {isSuccess && (
                    <div className="space-y-4 py-4 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
                            <Check className="size-8 text-emerald-500" />
                        </div>

                        <div>
                            <DialogTitle className="text-lg">
                                Pembayaran Berhasil!
                            </DialogTitle>
                            {transactionRef && (
                                <Badge variant="secondary" className="mt-1">
                                    #{transactionRef}
                                </Badge>
                            )}
                            <DialogDescription className="mt-1">
                                Total: Rp {total.toLocaleString("id-ID")}
                            </DialogDescription>
                            <div className="mt-2 flex items-center justify-center gap-1.5">
                                {syncSuccess ? (
                                    <Badge variant="secondary">
                                        <Check className="size-3" />
                                        Tersinkron ke Odoo
                                    </Badge>
                                ) : (
                                    <Badge variant="outline">
                                        <Clock className="size-3" />
                                        Tersimpan lokal — sync nanti
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <Button
                                className="w-full font-bold shadow-lg shadow-emerald-500/25"
                                onClick={() => {
                                    finishTransaction()
                                }}
                            >
                                <Printer className="size-4" />
                                Cetak Struk
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={finishTransaction}
                            >
                                Transaksi Baru
                            </Button>
                        </div>
                    </div>
                )}

                {/* Error */}
                {isError && (
                    <div className="space-y-4 py-6 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-destructive/20">
                            <X className="size-8 text-destructive" />
                        </div>
                        <DialogTitle>Pembayaran Gagal</DialogTitle>
                        <DialogDescription>
                            {errorMessage ||
                                "Terjadi kesalahan. Silakan coba lagi."}
                        </DialogDescription>
                        <Button
                            className="w-full font-bold"
                            onClick={finishTransaction}
                        >
                            Transaksi Baru
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
