import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plane } from "lucide-react"

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trip Details</h1>
        <p className="text-muted-foreground">Trip ID: {id}</p>
      </div>

      <Card className="text-center py-12">
        <CardHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Plane className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Trip Itinerary</CardTitle>
          <CardDescription>
            Full itinerary with timeline, bookings, and events will appear here.
            Coming soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Team 3 will implement the full trip detail view with itinerary
            builder.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
