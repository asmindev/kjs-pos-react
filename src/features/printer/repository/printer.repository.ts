export interface IPrinterRepository {
  getStatus(): { connected: boolean }
}

export class PrinterRepository implements IPrinterRepository {
  getStatus() {
    return { connected: false }
  }
}

export const printerRepository = new PrinterRepository()
