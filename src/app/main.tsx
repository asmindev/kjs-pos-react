import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "../styles/globals.css"
import { Root } from "./root"
import { PrinterProvider } from "./providers/printer-provider"
import { QueryProvider } from "./providers/query-provider"
import { SyncProvider } from "./providers/sync-provider"
import { ThemeProvider } from "@/components/theme-provider"

const rootElement = document.getElementById("root")

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ThemeProvider>
        <QueryProvider>
          <SyncProvider>
            <PrinterProvider>
              <Root />
            </PrinterProvider>
          </SyncProvider>
        </QueryProvider>
      </ThemeProvider>
    </StrictMode>
  )
}
