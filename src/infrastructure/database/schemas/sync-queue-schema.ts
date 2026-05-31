export type SyncQueueRecord = {
  id: string
  type: string
  payload: unknown
  retries: number
}

export const syncQueueSchema = {
  tableName: "syncQueue",
  primaryKey: "id",
} as const
