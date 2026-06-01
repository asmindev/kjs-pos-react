import { useMutation, useQueryClient } from "@tanstack/react-query"
import { productRepository } from "../repository/product-repository"
import { customerRepository } from "../repository/customer-repository"
import { categoryRepository } from "../repository/category-repository"

export function usePosSync() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async () => {
            await Promise.all([
                productRepository.sync(),
                customerRepository.sync(),
                categoryRepository.sync(),
            ])
        },
        onSuccess: () => {
            // Invalidate all related queries to trigger a re-render from Dexie
            queryClient.invalidateQueries({ queryKey: ["products"] })
            queryClient.invalidateQueries({ queryKey: ["customers"] })
            queryClient.invalidateQueries({ queryKey: ["categories"] })
        },
    })
}
