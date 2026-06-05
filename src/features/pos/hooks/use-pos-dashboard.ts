import { useState, useRef, useCallback, useMemo, useEffect } from "react"
import { useProducts } from "./use-products"
import { useCategories } from "./use-categories"
import { usePosSync } from "./use-pos-sync"
import { useCart } from "./use-cart"
import type { BarcodeInputRef } from "../components/barcode-input"
import { APP_CONSTANTS } from "@/config/app.config"

export function usePosDashboard() {
    const [searchTerm, setSearchTerm] = useState("")
    const [activeCategory, setActiveCategory] = useState(APP_CONSTANTS.CATEGORY_ALL)
    const [openCategory, setOpenCategory] = useState(false)
    const barcodeRef = useRef<BarcodeInputRef>(null)

    const {
        data,
        isLoading,
        error,
        isFetching,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
    } = useProducts(searchTerm, activeCategory)
    
    const products = useMemo(() => {
        return data?.pages.flatMap((page) => page) ?? []
    }, [data])
    
    const { data: categoriesData = [] } = useCategories()
    const { mutate: syncData, isPending: isSyncing } = usePosSync()
    const addItem = useCart((s) => s.addItem)

    const categories = useMemo(() => {
        const names = categoriesData.map((c) => c.name)
        return [APP_CONSTANTS.CATEGORY_ALL, ...Array.from(new Set(names))]
    }, [categoriesData])

    const handleSearch = useCallback((query: string) => {
        setSearchTerm(query)
    }, [])

    const handleEnter = useCallback(
        (currentValue: string) => {
            if (!currentValue) return
            const match = products.find((p) => p.barcode === currentValue)
            if (match) {
                addItem(match)
                barcodeRef.current?.clear()
                setSearchTerm("")
            }
        },
        [products, addItem]
    )

    const hasAttemptedSync = useRef(false)

    useEffect(() => {
        if (
            products.length === 0 &&
            !isLoading &&
            !isFetching &&
            !hasAttemptedSync.current
        ) {
            hasAttemptedSync.current = true
            syncData()
        }
    }, [products.length, isLoading, isFetching, syncData])

    return {
        searchTerm,
        activeCategory,
        setActiveCategory,
        openCategory,
        setOpenCategory,
        barcodeRef,
        products,
        isLoading,
        error,
        isFetching,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
        categories,
        isSyncing,
        syncData,
        handleSearch,
        handleEnter,
    }
}
