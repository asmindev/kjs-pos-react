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
import { ScrollArea } from "@/components/ui/scroll-area"
import { CustomerSelect } from "@/features/pos/components/customer-select"
import { PromoInput } from "@/features/pos/components/promo-input"
import { ShoppingCart, Minus, Plus, X, Banknote } from "lucide-react"

export function CartSidebar() {
    const { items, removeItem, updateQuantity, getSubtotal, getTotal } =
        useCart()
    const { startPayment, phase, setCustomer } = usePosState()

    const subtotal = getSubtotal()
    const total = getTotal()
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
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
                    <ScrollArea className="flex-1">
                        <CardContent className="space-y-1 pb-0">
                            {items.map((item) => (
                                <div
                                    key={item.product.id}
                                    className="flex items-center gap-2 px-2 py-2 transition-colors hover:bg-muted/50"
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
                                    <div className="flex items-center gap-0.5">
                                        <Button
                                            variant="ghost"
                                            size="icon-xs"
                                            onClick={() =>
                                                updateQuantity(
                                                    item.product.id,
                                                    item.quantity - 1
                                                )
                                            }
                                            disabled={isPaymentLocked}
                                        >
                                            <Minus className="size-3" />
                                        </Button>
                                        <span className="w-6 text-center text-xs font-semibold tabular-nums">
                                            {item.quantity}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon-xs"
                                            onClick={() =>
                                                updateQuantity(
                                                    item.product.id,
                                                    item.quantity + 1
                                                )
                                            }
                                            disabled={isPaymentLocked}
                                        >
                                            <Plus className="size-3" />
                                        </Button>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon-xs"
                                        onClick={() =>
                                            removeItem(item.product.id)
                                        }
                                        disabled={isPaymentLocked}
                                        className="text-muted-foreground hover:text-destructive"
                                    >
                                        <X className="size-3" />
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </ScrollArea>

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
                                <CustomerSelect onSelect={setCustomer} />
                            </div>
                            <div className="w-24">
                                <PromoInput />
                            </div>
                        </div>

                        <Button
                            className="h-11 w-full text-sm font-bold tracking-wide"
                            onClick={startPayment}
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
