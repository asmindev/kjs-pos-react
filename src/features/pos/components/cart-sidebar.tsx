import { useMemo, startTransition } from "react"
import { useCart } from "@/features/pos/hooks/use-cart"
import { usePosState } from "@/features/pos/hooks/use-pos-state"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CustomerModal } from "@/features/pos/components/customer-modal"
import { PromoInput } from "@/features/pos/components/promo-input"
import { ShoppingCart, Banknote } from "lucide-react"
import { calculateSubtotal } from "@/features/pos/domain/services/pricing-service"

export function CartSidebar() {
    const items = useCart((s) => s.items)
    const selectedId = useCart((s) => s.selectedId)
    const selectItem = useCart((s) => s.selectItem)
    const phase = usePosState((s) => s.phase)
    const startPayment = usePosState((s) => s.startPayment)

    const discount = useCart((s) => s.discount)
    const subtotal = useMemo(() => calculateSubtotal(items), [items])
    const total = useMemo(
        () => Math.max(subtotal - discount, 0),
        [subtotal, discount]
    )
    const itemCount = useMemo(
        () => items.reduce((sum, i) => sum + i.quantity, 0),
        [items]
    )
    const isPaymentLocked = ["payment", "processing"].includes(phase)

    return (
        <Card size="sm" className="flex h-full flex-col">
            <CardHeader className="border-b pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <ShoppingCart className="size-4" />
                        Keranjang
                    </CardTitle>
                    {itemCount > 0 && (
                        <Badge variant="secondary">{itemCount} item</Badge>
                    )}
                </div>
            </CardHeader>

            {items.length === 0 ? (
                <CardContent className="flex flex-1 flex-col items-center justify-center text-center">
                    <ShoppingCart className="size-10 text-muted-foreground/30" />
                    <p className="mt-3 text-sm font-medium text-muted-foreground">
                        Keranjang kosong
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/60">
                        Scan barcode atau klik produk
                    </p>
                </CardContent>
            ) : (
                <>
                    <div className="flex-1 overflow-x-hidden overflow-y-auto">
                        <div className="space-y-1 px-0 pt-1 pb-0">
                            {items.map((item) => {
                                const isSelected =
                                    selectedId === item.product.id
                                return (
                                    <button
                                        key={item.product.id}
                                        type="button"
                                        className={`flex w-full items-center gap-2 px-2 py-2 text-left transition-colors ${
                                            isSelected
                                                ? "bg-muted ring-1 ring-muted"
                                                : "hover:bg-muted"
                                        }`}
                                        onClick={() =>
                                            selectItem(
                                                isSelected
                                                    ? null
                                                    : item.product.id
                                            )
                                        }
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-semibold">
                                                {item.product.name}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">
                                                Rp{" "}
                                                {item.product.price.toLocaleString(
                                                    "id-ID"
                                                )}
                                            </p>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <CardFooter className="flex-col gap-3">
                        <Separator />

                        <div className="w-full space-y-1 text-xs">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    Subtotal
                                </span>
                                <span className="font-medium tabular-nums">
                                    Rp {subtotal.toLocaleString("id-ID")}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    TOTAL
                                </span>
                                <span className="text-base font-extrabold tracking-tight tabular-nums">
                                    Rp {total.toLocaleString("id-ID")}
                                </span>
                            </div>
                        </div>

                        <div className="flex w-full gap-2">
                            <div className="flex-1">
                                <CustomerModal />
                            </div>
                            <div className="w-24">
                                <PromoInput />
                            </div>
                        </div>

                        <Button
                            className="h-11 w-full text-sm font-bold tracking-wide"
                            onClick={() =>
                                startTransition(() => {
                                    startPayment()
                                })
                            }
                            disabled={items.length === 0 || isPaymentLocked}
                        >
                            <Banknote className="size-4" />
                            BAYAR SEKARANG
                        </Button>
                    </CardFooter>
                </>
            )}
        </Card>
    )
}
