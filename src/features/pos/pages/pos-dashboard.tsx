import { Button } from "@/components/ui/button"

export default function POSDashboard() {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm tracking-[0.24em] text-muted-foreground uppercase">
          Dashboard
        </p>
        <h1 className="font-heading text-3xl font-semibold">
          Retail operations at a glance
        </h1>
      </div>
      <Button>Start sale</Button>
    </section>
  )
}
