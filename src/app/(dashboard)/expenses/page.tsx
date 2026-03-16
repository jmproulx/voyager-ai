import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Receipt } from "lucide-react"

export default function ExpensesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
        <p className="text-muted-foreground">
          Track and manage your travel expenses.
        </p>
      </div>

      <Card className="text-center py-12">
        <CardHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Receipt className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Expense Management</CardTitle>
          <CardDescription>
            Upload receipts, auto-categorize expenses, and generate reports.
            Coming soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Team 4 will implement expense CRUD, receipt OCR via Claude Vision,
            and expense reports.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
