import { useInfiniteQuery } from "@tanstack/react-query"
import { customerRepository } from "../repository/customer.repository"

export function useCustomers(query: string = "", limit: number = 50) {
    return useInfiniteQuery({
        queryKey: ["customers", query],
        queryFn: ({ pageParam = 0 }) => customerRepository.search(query, limit, pageParam),
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.length === limit ? allPages.length * limit : undefined
        },
        staleTime: Infinity,
    })
}
