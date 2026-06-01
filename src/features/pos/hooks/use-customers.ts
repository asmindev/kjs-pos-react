import { useQuery } from "@tanstack/react-query"
import { customerRepository } from "../repository/customer.repository"

export function useCustomers(query: string = "") {
    return useQuery({
        queryKey: ["customers", query],
        queryFn: () => customerRepository.search(query),
        staleTime: Infinity,
    })
}
