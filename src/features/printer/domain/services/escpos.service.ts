import type { Printer } from "../models/printer.model"

export function buildReceiptPayload(printer: Printer, lines: string[]) {
  return {
    printer,
    lines,
    createdAt: new Date().toISOString(),
  }
}
