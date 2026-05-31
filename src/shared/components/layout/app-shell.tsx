import type { ReactNode } from "react"

import { Navbar } from "./navbar"
import { Sidebar } from "./sidebar"

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-svh bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_40%),linear-gradient(180deg,_var(--background),_color-mix(in_oklch,var(--background),var(--muted)_8%))] text-foreground">
      <Navbar />
      <div className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <Sidebar />
        <main className="min-w-0 rounded-3xl border border-border/70 bg-background/90 p-4 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.35)] backdrop-blur md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
