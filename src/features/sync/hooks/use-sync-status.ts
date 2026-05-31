import { useState } from "react"

export function useSyncStatus() {
  const [isOnline, setIsOnline] = useState(true)

  return { isOnline, setIsOnline }
}
