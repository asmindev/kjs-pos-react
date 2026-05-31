import { useState } from "react"
import { BarcodeInput } from "@/features/pos/components/barcode-input"
import { ProductGrid } from "@/features/pos/components/product-grid"
import { CartSidebar } from "@/features/pos/components/cart-sidebar"
import { CustomerSelect } from "@/features/pos/components/customer-select"
import { PromoInput } from "@/features/pos/components/promo-input"
import { PaymentModal } from "@/features/pos/components/payment-modal"
import { usePosState } from "@/features/pos/hooks/use-pos-state"
import { useSync } from "@/features/pos/hooks/use-sync"
import { Badge } from "@/components/ui/badge"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
} from "@/components/ui/input-group"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Printer } from "lucide-react"
import type { Product } from "@/features/pos/domain/models/product-model"

const mockProducts: Product[] = [
    {
        id: "1",
        barcode: "8991234567890",
        name: "Indomie Goreng",
        price: 3500,
        stock: 99,
    },
    {
        id: "2",
        barcode: "8991234567891",
        name: "Aqua 600ml",
        price: 3000,
        stock: 150,
    },
    {
        id: "3",
        barcode: "8991234567892",
        name: "Kopi Kapal Api",
        price: 1500,
        stock: 200,
    },
    {
        id: "4",
        barcode: "8991234567893",
        name: "Rokok Sampoerna",
        price: 25000,
        stock: 50,
    },
    {
        id: "5",
        barcode: "8991234567894",
        name: "Teh Botol Sosro",
        price: 5000,
        stock: 80,
    },
    {
        id: "6",
        barcode: "8991234567895",
        name: "Chitato 50g",
        price: 12000,
        stock: 60,
    },
    {
        id: "7",
        barcode: "8991234567896",
        name: "Sari Roti",
        price: 8000,
        stock: 40,
    },
    {
        id: "8",
        barcode: "8991234567897",
        name: "Beras 5kg",
        price: 65000,
        stock: 30,
    },
    {
        id: "9",
        barcode: "8991234567898",
        name: "Minyak Goreng 2L",
        price: 36000,
        stock: 45,
    },
    {
        id: "10",
        barcode: "8991234567899",
        name: "Gula Pasir 1kg",
        price: 15000,
        stock: 55,
    },
    {
        id: "11",
        barcode: "8991234567900",
        name: "Telur 1kg",
        price: 28000,
        stock: 35,
    },
    {
        id: "12",
        barcode: "8991234567901",
        name: "Susu Ultra 1L",
        price: 18000,
        stock: 70,
    },
]

const categories = [
    "Semua",
    "Makanan",
    "Minuman",
    "Rokok",
    "Sembako",
    "Snack",
    "Lainnya",
    "Favorit",
    "Terbaru",
    "Promo",
    "Habis Terjual",
    "Stok Menipis",
    "Custom",
    "Lainnya",
    "Lainnya",
    "Lainnya",
    "Lainnya",
    "Lainnya",
    "Lainnya",
]

export default function POSDashboard() {
    const [searchQuery, setSearchQuery] = useState("")
    const [activeCategory, setActiveCategory] = useState("Semua")
    const [showMore, setShowMore] = useState(false)
    const { setCustomer } = usePosState()
    const { isOnline, pendingCount } = useSync()

    return (
        <div className="flex h-full flex-col gap-3">
            {/* Top Bar */}
            <div className="flex shrink-0 items-center gap-3">
                <div className="flex-1">
                    <BarcodeInput />
                </div>
                <CustomerSelect />
                <PromoInput />
            </div>

            {/* Category Input Group */}
            <InputGroup className="w-full shrink-0">
                <InputGroupAddon className="relative gap-1">
                    {(() => {
                        const MAX_VISIBLE = 15
                        const visible = categories.slice(0, MAX_VISIBLE)
                        const overflow = categories.slice(MAX_VISIBLE)
                        return (
                            <>
                                {visible.map((cat) => (
                                    <InputGroupButton
                                        key={cat}
                                        variant={
                                            activeCategory === cat
                                                ? "default"
                                                : "ghost"
                                        }
                                        size={"sm"}
                                        onClick={() => setActiveCategory(cat)}
                                    >
                                        {cat}
                                    </InputGroupButton>
                                ))}

                                {overflow.length > 0 && (
                                    <div className="relative">
                                        <InputGroupButton
                                            size="sm"
                                            onClick={() =>
                                                setShowMore((s) => !s)
                                            }
                                        >
                                            More ▾
                                        </InputGroupButton>

                                        {showMore && (
                                            <div className="absolute right-0 z-50 mt-2 w-40 rounded-none bg-popover p-2 shadow-popover">
                                                {overflow.map((cat) => (
                                                    <button
                                                        key={cat}
                                                        className="block w-full px-2 py-1 text-left text-sm hover:bg-popover-foreground/5"
                                                        onClick={() => {
                                                            setActiveCategory(
                                                                cat
                                                            )
                                                            setShowMore(false)
                                                        }}
                                                    >
                                                        {cat}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )
                    })()}
                </InputGroupAddon>

                <div className="ml-auto flex items-center gap-2 pr-2">
                    <Badge
                        variant={isOnline ? "secondary" : "destructive"}
                        className="gap-1"
                    >
                        <span
                            className={`h-1.5 w-1.5 rounded-full ${
                                isOnline ? "bg-emerald-500" : "bg-red-500"
                            }`}
                        />
                        {isOnline ? "Online" : "Offline"}
                    </Badge>
                    {pendingCount > 0 && (
                        <Badge variant="outline" className="gap-1">
                            {pendingCount} pending
                        </Badge>
                    )}
                </div>
            </InputGroup>

            {/* Main: Product Grid + Cart Sidebar */}
            <div className="flex flex-1 gap-3 overflow-hidden">
                <Card size="sm" className="flex-1 overflow-hidden">
                    <ProductGrid
                        products={mockProducts}
                        searchQuery={searchQuery}
                    />
                </Card>
                <div className="w-80 shrink-0">
                    <CartSidebar />
                </div>
            </div>

            {/* Footer: Shortcuts */}
            <div className="flex shrink-0 items-center gap-2 text-[10px] text-muted-foreground">
                <span className="text-xs font-semibold tracking-wider uppercase">
                    Shortcut
                </span>
                {[
                    ["F1", "Cari"],
                    ["F2", "Scan"],
                    ["F9", "Bayar"],
                    ["Esc", "Batal"],
                ].map(([key, label]) => (
                    <Badge
                        key={key}
                        variant="outline"
                        className="flex items-center justify-between gap-1 font-mono"
                    >
                        <span className="text-[9px]">{key}</span>
                        <span className="font-sans">{label}</span>
                    </Badge>
                ))}
                <div className="ml-auto flex items-center gap-1 pr-2">
                    <Printer className="size-3" />
                    <span className="">EPSON TM-T82 siap</span>
                </div>
            </div>

            <PaymentModal />
        </div>
    )
}
