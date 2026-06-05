import { useInfiniteQuery } from "@tanstack/react-query"
import { customerRepository } from "../repository/customer.repository"
import { APP_CONSTANTS } from "@/config/app.config"

export function useCustomers(query: string = "", limit: number = APP_CONSTANTS.CUSTOMER_PAGE_LIMIT) {
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
