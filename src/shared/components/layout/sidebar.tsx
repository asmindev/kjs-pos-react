import { Link } from "@tanstack/react-router"

const links = [
  { to: "/products", label: "Products" },
  { to: "/cart", label: "Cart" },
  { to: "/checkout", label: "Checkout" },
  { to: "/transactions", label: "Transactions" },
  { to: "/settings/sync", label: "Sync" },
  { to: "/settings/printer", label: "Printer" },
]

export function Sidebar() {
  return (
    <aside className="rounded-3xl border border-border/70 bg-card/80 p-4 backdrop-blur">
      <p className="mb-4 text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
        Navigation
      </p>
      <div className="flex flex-col gap-2">
        {links.map((link) => (
          <Link
            key={link.to}
            className="rounded-2xl px-3 py-2 text-sm transition-colors hover:bg-muted"
            to={link.to}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </aside>
  )
}
