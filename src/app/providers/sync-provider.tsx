import { createContext, useContext, useMemo, useState } from "react"

type SyncState = {
  isSyncing: boolean
  lastSyncedAt: string | null
  startSync: () => void
  finishSync: () => void
}

const SyncContext = createContext<SyncState | null>(null)

type SyncProviderProps = {
  children: React.ReactNode
}

export function SyncProvider({ children }: SyncProviderProps) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)

  const value = useMemo<SyncState>(
    () => ({
      isSyncing,
      lastSyncedAt,
      startSync: () => setIsSyncing(true),
      finishSync: () => {
        setIsSyncing(false)
        setLastSyncedAt(new Date().toISOString())
      },
    }),
    [isSyncing, lastSyncedAt]
  )

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>
}

export function useSyncContext() {
  const context = useContext(SyncContext)

  if (!context) {
    throw new Error("useSyncContext must be used within SyncProvider")
  }

  return context
}
