import { useContext } from "react"

import { SyncContext } from "./sync-context.ts"

export function useSyncContext() {
  const context = useContext(SyncContext)

  if (!context) {
    throw new Error("useSyncContext must be used within SyncProvider")
  }

  return context
}
