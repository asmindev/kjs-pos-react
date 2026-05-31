import { useQuery } from "@tanstack/react-query"

import { productRepository } from "../repository/product-repository"

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: productRepository.list,
  })
}
