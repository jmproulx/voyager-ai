import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckSquare } from "lucide-react"

export default function ApprovalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Approvals</h1>
        <p className="text-muted-foreground">
          Review and manage out-of-policy booking approval requests.
        </p>
      </div>

      <Card className="text-center py-12">
        <CardHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <CheckSquare className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Approval Queue</CardTitle>
          <CardDescription>
            Approve or reject out-of-policy bookings from your team. Coming
            soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Team 4 will implement the approval workflow with email notifications
            and audit trail.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
