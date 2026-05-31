export type SyncWorkerMessage = {
  type: string
  payload?: unknown
}

export const syncWorkerName = "sync.worker"
