import Dexie from "dexie"

export class RetailDatabase extends Dexie {
  products!: Dexie.Table<
    { barcode: string; name: string; price: number },
    string
  >
  transactions!: Dexie.Table<
    { id: string; total: number; createdAt: string },
    string
  >
  syncQueue!: Dexie.Table<
    { id: string; type: string; payload: unknown },
    string
  >

  constructor() {
    super("pos-retail")

    this.version(1).stores({
      products: "barcode, name, price",
      transactions: "id, createdAt",
      syncQueue: "id, type",
    })
  }
}

export const database = new RetailDatabase()
