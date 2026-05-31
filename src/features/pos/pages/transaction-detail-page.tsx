import { useParams } from "@tanstack/react-router"

export default function TransactionDetailPage() {
    const { id } = useParams({ from: "/transactions/$id" })
    return (
        <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Transaction detail</h1>
            <p className="text-muted-foreground">
                Transaction ID: {id ?? "unknown"}
            </p>
        </div>
    )
}
