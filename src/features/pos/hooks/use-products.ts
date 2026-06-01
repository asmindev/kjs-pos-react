import { useInfiniteQuery } from "@tanstack/react-query"
import { productRepository } from "../repository/product.repository"

export function useProducts(query: string = "", category: string = "Semua", limit: number = 100) {
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

