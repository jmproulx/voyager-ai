import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Travel spending insights and compliance metrics.
        </p>
      </div>

      <Card className="text-center py-12">
        <CardHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Analytics Dashboard</CardTitle>
          <CardDescription>
            Spending trends, policy compliance rates, carbon footprint, and
            per-traveler breakdowns. Coming soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Team 4 will implement charts, reports, and analytics using real
            booking and expense data.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
