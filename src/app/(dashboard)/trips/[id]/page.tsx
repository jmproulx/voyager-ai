"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TripTimeline } from "@/components/trips/TripTimeline"
import { AddEventDialog } from "@/components/trips/AddEventDialog"
import {
  MapPin,
  Calendar,
  CreditCard,
  ArrowLeft,
  Plane,
  Hotel,
  CalendarSync,
  Trash2,
  Edit,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatDate, formatCurrency } from "@/lib/utils"
import type { TripWithDetails } from "@/types/trip"

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "ACTIVE":
      return "default"
    case "BOOKED":
      return "secondary"
    case "PLANNING":
      return "outline"
    case "COMPLETED":
      return "secondary"
    case "CANCELLED":
      return "destructive"
    default:
      return "outline"
  }
}

export default function TripDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [trip, setTrip] = useState<TripWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [syncing, setSyncing] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const [editName, setEditName] = useState("")
  const [editDestination, setEditDestination] = useState("")
  const [editStartDate, setEditStartDate] = useState("")
  const [editEndDate, setEditEndDate] = useState("")
  const [editLoading, setEditLoading] = useState(false)

  const fetchTrip = useCallback(async () => {
    try {
      const res = await fetch(`/api/trips/${id}`)
      if (!res.ok) {
        if (res.status === 404) {
          setError("Trip not found")
        } else {
          setError("Failed to load trip")
        }
        return
      }
      const data = await res.json()
      setTrip(data)
    } catch {
      setError("Failed to load trip")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchTrip()
  }, [fetchTrip])

  useEffect(() => {
    if (trip) {
      setEditName(trip.name)
      setEditDestination(trip.destination ?? "")
      setEditStartDate(trip.startDate ? new Date(trip.startDate).toISOString().split("T")[0] : "")
      setEditEndDate(trip.endDate ? new Date(trip.endDate).toISOString().split("T")[0] : "")
    }
  }, [trip])

  async function handleSyncCalendar() {
    setSyncing(true)
    try {
      const res = await fetch("/api/calendar/events")
      const data = await res.json()
      if (!data.connected) {
        window.location.href = "/api/calendar/auth"
        return
      }
      alert("Calendar sync initiated. Events will appear in your Google Calendar shortly.")
    } catch {
      alert("Failed to sync calendar. Please connect your Google Calendar first.")
    } finally {
      setSyncing(false)
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    setEditLoading(true)
    try {
      const res = await fetch(`/api/trips/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          destination: editDestination || undefined,
          startDate: editStartDate || undefined,
          endDate: editEndDate || undefined,
        }),
      })
      if (res.ok) {
        setEditOpen(false)
        fetchTrip()
      }
    } catch {
      // Error handled silently
    } finally {
      setEditLoading(false)
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch(`/api/trips/${id}`, { method: "DELETE" })
      if (res.ok) {
        router.push("/trips")
      }
    } catch {
      // Error handled silently
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (error || !trip) {
    return (
      <div className="text-center py-12">
        <Plane className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">{error || "Trip not found"}</h3>
        <Link href="/trips">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Trips
          </Button>
        </Link>
      </div>
    )
  }

  const totalSpend = trip.bookings.reduce((sum, b) => sum + b.price, 0)
  const flightCount = trip.bookings.filter((b) => b.type === "FLIGHT").length
  const hotelCount = trip.bookings.filter((b) => b.type === "HOTEL").length
  const expenseTotal = trip.expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="space-y-6">
      <Link href="/trips" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Trips
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{trip.name}</h1>
            <Badge variant={getStatusVariant(trip.status)}>
              {trip.status.charAt(0) + trip.status.slice(1).toLowerCase()}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {trip.destination && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {trip.destination}
              </span>
            )}
            {trip.startDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(trip.startDate)}
                {trip.endDate ? ` - ${formatDate(trip.endDate)}` : ""}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSyncCalendar} disabled={syncing}>
            <CalendarSync className="h-4 w-4" />
            {syncing ? "Syncing..." : "Sync to Calendar"}
          </Button>
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger render={<Button variant="outline" size="sm" />}>
              <Edit className="h-4 w-4" />
              Edit
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleEdit}>
                <DialogHeader>
                  <DialogTitle>Edit Trip</DialogTitle>
                  <DialogDescription>Update trip details.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-name">Name</Label>
                    <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-dest">Destination</Label>
                    <Input id="edit-dest" value={editDestination} onChange={(e) => setEditDestination(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-start">Start Date</Label>
                      <Input id="edit-start" type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-end">End Date</Label>
                      <Input id="edit-end" type="date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={editLoading}>
                    {editLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          {trip.status !== "CANCELLED" && (
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
              <DialogTrigger render={<Button variant="destructive" size="sm" />}>
                <Trash2 className="h-4 w-4" />
                {trip.status === "ACTIVE" || trip.status === "BOOKED" ? "Cancel" : "Delete"}
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {trip.status === "ACTIVE" || trip.status === "BOOKED" ? "Cancel Trip?" : "Delete Trip?"}
                  </DialogTitle>
                  <DialogDescription>
                    {trip.status === "ACTIVE" || trip.status === "BOOKED"
                      ? "This will mark the trip as cancelled. Any active bookings may need to be cancelled separately."
                      : "This action cannot be undone. The trip and all associated data will be permanently deleted."}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                    Keep Trip
                  </Button>
                  <Button variant="destructive" onClick={handleDelete}>
                    {trip.status === "ACTIVE" || trip.status === "BOOKED" ? "Cancel Trip" : "Delete Trip"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalSpend, trip.bookings[0]?.currency ?? "USD")}
            </div>
            <p className="text-xs text-muted-foreground">Booking costs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flights</CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{flightCount}</div>
            <p className="text-xs text-muted-foreground">Flight bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hotels</CardTitle>
            <Hotel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hotelCount}</div>
            <p className="text-xs text-muted-foreground">Hotel stays</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(expenseTotal)}</div>
            <p className="text-xs text-muted-foreground">{trip.expenses.length} expense{trip.expenses.length !== 1 ? "s" : ""}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Itinerary</h2>
            <AddEventDialog tripId={id} onCreated={fetchTrip} />
          </div>
          <TripTimeline
            bookings={trip.bookings}
            itineraryItems={trip.itineraryItems}
          />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Expense Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {trip.expenses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No expenses recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {trip.expenses.slice(0, 5).map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between text-sm">
                      <span className="truncate">{expense.description ?? expense.category}</span>
                      <span className="font-medium">{formatCurrency(expense.amount, expense.currency)}</span>
                    </div>
                  ))}
                  {trip.expenses.length > 5 && (
                    <p className="text-xs text-muted-foreground">
                      +{trip.expenses.length - 5} more expenses
                    </p>
                  )}
                  <div className="border-t pt-2 flex items-center justify-between font-medium">
                    <span>Total</span>
                    <span>{formatCurrency(expenseTotal)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/search/flights" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Plane className="h-4 w-4" />
                  Search Flights
                </Button>
              </Link>
              <Link href="/search/hotels" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Hotel className="h-4 w-4" />
                  Search Hotels
                </Button>
              </Link>
              <Link href="/expenses" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <CreditCard className="h-4 w-4" />
                  Add Expense
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
