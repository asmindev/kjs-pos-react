export const initialMigration = {
  version: 1,
  name: "initial",
  tables: ["products", "transactions", "syncQueue"],
} as const
