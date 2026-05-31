import { createContext } from "react"

export type SyncState = {
  isSyncing: boolean
  lastSyncedAt: string | null
  startSync: () => void
  finishSync: () => void
}

export const SyncContext = createContext<SyncState | null>(null)
