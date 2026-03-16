"use client"

import { useEffect, useState, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { TripCard } from "@/components/trips/TripCard"
import { CreateTripDialog } from "@/components/trips/CreateTripDialog"
import { Plane, Search } from "lucide-react"
import type { TripSummary } from "@/types/trip"

type TabValue = "upcoming" | "active" | "past" | "all"

export default function TripsPage() {
  const [trips, setTrips] = useState<TripSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<TabValue>("all")

  const fetchTrips = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)

      const res = await fetch(`/api/trips?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setTrips(data)
      }
    } catch (err) {
      console.error("Failed to fetch trips:", err)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchTrips()
  }, [fetchTrips])

  const filteredTrips = tab === "all"
    ? trips
    : tab === "upcoming"
      ? trips.filter((t) => t.status === "BOOKED" || t.status === "PLANNING")
      : tab === "active"
        ? trips.filter((t) => t.status === "ACTIVE")
        : trips.filter((t) => t.status === "COMPLETED" || t.status === "CANCELLED")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trips</h1>
          <p className="text-muted-foreground">
            View and manage your business trips.
          </p>
        </div>
        <CreateTripDialog onCreated={fetchTrips} />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search trips..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          ) : filteredTrips.length === 0 ? (
            <EmptyState tab={tab} search={search} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  id={trip.id}
                  name={trip.name}
                  status={trip.status}
                  destination={trip.destination}
                  startDate={trip.startDate}
                  endDate={trip.endDate}
                  bookingCount={trip.bookingCount}
                  totalSpend={trip.totalSpend}
                  currency={trip.currency}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EmptyState({ tab, search }: { tab: TabValue; search: string }) {
  if (search) {
    return (
      <div className="text-center py-12">
        <Search className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">No trips found</h3>
        <p className="text-muted-foreground mt-1">
          No trips match &quot;{search}&quot;. Try a different search term.
        </p>
      </div>
    )
  }

  const messages: Record<TabValue, { title: string; desc: string }> = {
    upcoming: {
      title: "No upcoming trips",
      desc: "You don't have any booked trips coming up. Create a new trip to get started.",
    },
    active: {
      title: "No active trips",
      desc: "You don't have any trips in progress right now.",
    },
    past: {
      title: "No past trips",
      desc: "Completed trips will appear here.",
    },
    all: {
      title: "No trips yet",
      desc: "Create your first trip to start planning your business travel.",
    },
  }

  const msg = messages[tab]

  return (
    <div className="text-center py-12">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Plane className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold">{msg.title}</h3>
      <p className="text-muted-foreground mt-1 max-w-sm mx-auto">{msg.desc}</p>
    </div>
  )
}
