import { useQuery } from "@tanstack/react-query"
import { productRepository } from "../repository/product-repository"

export function useProducts(query: string = "", category: string = "Semua") {
    return useQuery({
        queryKey: ["products", query, category],
        queryFn: () => productRepository.search(query, category),
        staleTime: Infinity, // Rely on manual sync
    })
}

