import { createContext, useContext, useMemo, useState } from "react"

type PrinterState = {
  deviceName: string
  isConnected: boolean
  setDeviceName: (deviceName: string) => void
  setIsConnected: (isConnected: boolean) => void
}

const PrinterContext = createContext<PrinterState | null>(null)

type PrinterProviderProps = {
  children: React.ReactNode
}

export function PrinterProvider({ children }: PrinterProviderProps) {
  const [deviceName, setDeviceName] = useState("ESC/POS Printer")
  const [isConnected, setIsConnected] = useState(false)

  const value = useMemo<PrinterState>(
    () => ({
      deviceName,
      isConnected,
      setDeviceName,
      setIsConnected,
    }),
    [deviceName, isConnected]
  )

  return (
    <PrinterContext.Provider value={value}>{children}</PrinterContext.Provider>
  )
}

export function usePrinterContext() {
  const context = useContext(PrinterContext)

  if (!context) {
    throw new Error("usePrinterContext must be used within PrinterProvider")
  }

  return context
}
