import { useState } from "react"

export function usePrinter() {
  const [isConnected, setIsConnected] = useState(false)

  return { isConnected, setIsConnected }
}
