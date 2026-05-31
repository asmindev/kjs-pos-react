type TransactionRouteProps = {
  id?: string
}

export const Route = {} as never

export default function TransactionDetailRoute({
  id,
}: TransactionRouteProps = {}) {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Transaction detail</h1>
      <p className="text-muted-foreground">Transaction ID: {id ?? "unknown"}</p>
    </div>
  )
}
