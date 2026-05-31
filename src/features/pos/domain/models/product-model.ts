import type { ID } from "@/shared/types/common-types"

export type Product = {
  id: ID
  barcode: string
  name: string
  price: number
  stock: number
}
