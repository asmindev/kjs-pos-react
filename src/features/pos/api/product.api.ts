import type { Product } from "../domain/models/product.model"

export async function listProducts(): Promise<Product[]> {
  return []
}

export async function findProductByBarcode(
  barcode: string
): Promise<Product | null> {
  void barcode
  return null
}
