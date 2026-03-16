import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search } from "lucide-react"

export default function FlightSearchPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Flight Search</h1>
        <p className="text-muted-foreground">
          Search and compare flights from multiple providers.
        </p>
      </div>

      <Card className="text-center py-12">
        <CardHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Search className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Flight Search Engine</CardTitle>
          <CardDescription>
            Search flights across Amadeus and Duffel with real-time pricing.
            Coming soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Team 2 will implement flight search, filters, sorting, and booking
            flow.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
