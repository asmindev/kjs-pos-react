export type ProductRecord = {
  barcode: string
  name: string
  price: number
  stock: number
}

export const productSchema = {
  tableName: "products",
  primaryKey: "barcode",
} as const
