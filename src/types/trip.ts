import type { Trip, Booking, ItineraryItem, Expense } from "@prisma/client"

export interface TripWithBookings extends Trip {
  bookings: Booking[]
  expenses: Expense[]
  itineraryItems: ItineraryItem[]
}

export interface TripSummary {
  id: string
  name: string
  status: Trip["status"]
  destination: string | null
  startDate: Date | null
  endDate: Date | null
  bookingCount: number
  totalSpend: number
  currency: string
}

export interface ItineraryEvent {
  id: string
  type: "flight" | "hotel" | "car_rental" | "event" | "meeting"
  title: string
  description?: string
  startTime: Date
  endTime?: Date
  location?: string
  bookingId?: string
  details?: Record<string, unknown>
}

export interface TripFilters {
  status?: Trip["status"]
  destination?: string
  startDateFrom?: string
  startDateTo?: string
}
