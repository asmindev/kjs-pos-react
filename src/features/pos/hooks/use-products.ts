import { useInfiniteQuery } from "@tanstack/react-query"
import { productRepository } from "../repository/product.repository"
import { APP_CONSTANTS } from "@/config/app.config"

export function useProducts(query: string = "", category: string = APP_CONSTANTS.CATEGORY_ALL, limit: number = APP_CONSTANTS.PRODUCT_PAGE_LIMIT) {
    return useInfiniteQuery({
        queryKey: ["products", query, category],
        queryFn: ({ pageParam = 0 }) => productRepository.search(query, category, limit, pageParam),
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.length === limit ? allPages.length * limit : undefined
        },
        staleTime: Infinity, // Rely on manual sync
    })
}

