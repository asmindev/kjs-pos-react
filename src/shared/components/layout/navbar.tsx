import { Link } from "@tanstack/react-router"

export function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div>
          <p className="font-heading text-lg font-semibold tracking-tight">
            POS Retail
          </p>
          <p className="text-xs text-muted-foreground">
            Retail operations workspace
          </p>
        </div>
        <nav className="flex items-center gap-2 text-sm">
          <Link className="rounded-full px-3 py-1.5 hover:bg-muted" to="/">
            Dashboard
          </Link>
          <Link
            className="rounded-full px-3 py-1.5 hover:bg-muted"
            to="/products"
          >
            Products
          </Link>
          <Link
            className="rounded-full px-3 py-1.5 hover:bg-muted"
            to="/settings"
          >
            Settings
          </Link>
        </nav>
      </div>
    </header>
  )
}
