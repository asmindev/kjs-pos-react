import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./styles/globals.css"
import { PrinterProvider } from "./app/providers/printer-provider"
import { QueryProvider } from "./app/providers/query-provider"
import { SyncProvider } from "./app/providers/sync-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { Root } from "./app/root"

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
