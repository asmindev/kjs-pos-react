import { useMemo, useState } from "react"

import { SyncContext, type SyncState } from "./sync-context.ts"

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
