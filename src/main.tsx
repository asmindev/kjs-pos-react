import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./styles/globals.css"
import { PrinterProvider } from "./app/providers/printer-provider"
import { QueryProvider } from "./app/providers/query-provider"
import { ThemeProvider } from "@/shared/components/theme-provider"
import { Root } from "./app/root"

const rootElement = document.getElementById("root")

if (rootElement) {
    createRoot(rootElement).render(
        <StrictMode>
            <ThemeProvider>
                <QueryProvider>
                    <PrinterProvider>
                        <Root />
                    </PrinterProvider>
                </QueryProvider>
            </ThemeProvider>
        </StrictMode>
    )
}
