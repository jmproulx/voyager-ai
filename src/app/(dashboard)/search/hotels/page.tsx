import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search } from "lucide-react"

export default function HotelSearchPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Hotel Search</h1>
        <p className="text-muted-foreground">
          Search and compare hotels with live availability.
        </p>
      </div>

      <Card className="text-center py-12">
        <CardHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Search className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Hotel Search Engine</CardTitle>
          <CardDescription>
            Search hotels via Amadeus with real availability and pricing.
            Coming soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Team 2 will implement hotel search, filters, and booking flow.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
