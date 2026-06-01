import { useQuery } from "@tanstack/react-query"
import { categoryRepository } from "../repository/category.repository"

export function useCategories() {
    return useQuery({
        queryKey: ["categories"],
        queryFn: () => categoryRepository.list(),
        staleTime: Infinity,
    })
}
