export type PrinterStatus = "disconnected" | "ready" | "printing"

export type Printer = {
  id: string
  name: string
  status: PrinterStatus
}
