"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TripCard } from "@/components/trips/TripCard"
import { TripStats } from "@/components/trips/TripStats"
import { AlertCard } from "@/components/trips/AlertCard"
import { CalendarSuggestionCard } from "@/components/trips/CalendarSuggestionCard"
import {
  MessageSquare,
  Plane,
  Hotel,
  ArrowRight,
  CalendarDays,
  Bell,
} from "lucide-react"
import type { TripSummary, CalendarSuggestion } from "@/types/trip"

interface AlertData {
  id: string
  type: string
  details: Record<string, unknown> | null
  acknowledged: boolean
  createdAt: string
  booking: {
    trip: {
      name: string
    }
  }
}

export default function DashboardPage() {
  const [trips, setTrips] = useState<TripSummary[]>([])
  const [alerts, setAlerts] = useState<AlertData[]>([])
  const [suggestions, setSuggestions] = useState<CalendarSuggestion[]>([])
  const [calendarConnected, setCalendarConnected] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [tripsRes, alertsRes, suggestionsRes] = await Promise.allSettled([
          fetch("/api/trips"),
          fetch("/api/alerts"),
          fetch("/api/calendar/suggestions"),
        ])

        if (tripsRes.status === "fulfilled" && tripsRes.value.ok) {
          const data = await tripsRes.value.json()
          setTrips(data)
        }

        if (alertsRes.status === "fulfilled" && alertsRes.value.ok) {
          const data = await alertsRes.value.json()
          setAlerts(data.alerts ?? [])
        }

        if (suggestionsRes.status === "fulfilled" && suggestionsRes.value.ok) {
          const data = await suggestionsRes.value.json()
          setSuggestions(data.suggestions ?? [])
          setCalendarConnected(data.connected ?? false)
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  async function handleAcknowledgeAlert(alertId: string) {
    try {
      await fetch("/api/alerts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId }),
      })
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
      )
    } catch {
      // Silently fail
    }
  }

  const activeTrips = trips.filter(
    (t) => t.status === "ACTIVE" || t.status === "BOOKED" || t.status === "PLANNING"
  ).length
  const monthlySpend = trips.reduce((sum, t) => sum + t.totalSpend, 0)
  const upcomingBookings = trips
    .filter((t) => t.status === "BOOKED" || t.status === "ACTIVE")
    .reduce((sum, t) => sum + t.bookingCount, 0)
  const unreadAlerts = alerts.filter((a) => !a.acknowledged).length

  const upcomingTrips = trips
    .filter((t) => t.status === "PLANNING" || t.status === "BOOKED" || t.status === "ACTIVE")
    .sort((a, b) => {
      if (!a.startDate) return 1
      if (!b.startDate) return -1
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    })
    .slice(0, 3)

  const recentAlerts = alerts.filter((a) => !a.acknowledged).slice(0, 5)

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to Voyager AI -- your AI-powered business travel platform.
        </p>
      </div>

      <TripStats
        activeTrips={activeTrips}
        monthlySpend={monthlySpend}
        upcomingBookings={upcomingBookings}
        unreadAlerts={unreadAlerts}
      />

      <div className="flex items-center gap-3">
        <Link href="/chat">
          <Button>
            <MessageSquare className="h-4 w-4" />
            Plan a Trip
          </Button>
        </Link>
        <Link href="/search/flights">
          <Button variant="outline">
            <Plane className="h-4 w-4" />
            Search Flights
          </Button>
        </Link>
        <Link href="/search/hotels">
          <Button variant="outline">
            <Hotel className="h-4 w-4" />
            Search Hotels
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Upcoming Trips</h2>
            <Link href="/trips">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {upcomingTrips.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <Plane className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">
                  No upcoming trips. Start planning by chatting with Voyager AI.
                </p>
                <Link href="/chat">
                  <Button variant="outline" size="sm" className="mt-3">
                    <MessageSquare className="h-4 w-4" />
                    Start Planning
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {upcomingTrips.map((trip) => (
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
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Recent Alerts
              </CardTitle>
              {unreadAlerts > 0 && (
                <span className="text-xs text-muted-foreground">
                  {unreadAlerts} unread
                </span>
              )}
            </CardHeader>
            <CardContent>
              {recentAlerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No active alerts. Your flights are looking good.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentAlerts.map((alert) => (
                    <AlertCard
                      key={alert.id}
                      id={alert.id}
                      type={alert.type}
                      details={alert.details}
                      acknowledged={alert.acknowledged}
                      createdAt={alert.createdAt}
                      tripName={alert.booking?.trip?.name}
                      onAcknowledge={handleAcknowledgeAlert}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Calendar Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!calendarConnected ? (
                <div className="text-center py-4">
                  <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Connect your Google Calendar to get proactive travel suggestions.
                  </p>
                  <Link href="/api/calendar/auth">
                    <Button variant="outline" size="sm" className="mt-3">
                      Connect Calendar
                    </Button>
                  </Link>
                </div>
              ) : suggestions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No travel-related events detected in your upcoming calendar.
                </p>
              ) : (
                <div className="space-y-3">
                  {suggestions.slice(0, 3).map((s) => (
                    <CalendarSuggestionCard
                      key={s.eventId}
                      eventTitle={s.eventTitle}
                      eventDate={s.eventDate}
                      location={s.location}
                      reason={s.reason}
                      suggestedAction={s.suggestedAction}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
