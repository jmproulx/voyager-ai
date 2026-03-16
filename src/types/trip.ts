import type { Trip, Booking, ItineraryItem, Expense, FlightAlert } from "@prisma/client"

export interface TripWithBookings extends Trip {
  bookings: Booking[]
  expenses: Expense[]
  itineraryItems: ItineraryItem[]
}

export interface TripWithDetails extends Trip {
  bookings: (Booking & { flightAlerts: FlightAlert[] })[]
  expenses: Expense[]
  itineraryItems: ItineraryItem[]
  _count?: {
    bookings: number
    expenses: number
  }
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
  search?: string
}

export interface FlightDetails {
  flightNumber: string
  airline: string
  departureAirport: string
  arrivalAirport: string
  departureTime: string
  arrivalTime: string
  terminal?: string
  gate?: string
  status?: string
}

export interface HotelDetails {
  hotelName: string
  address: string
  checkIn: string
  checkOut: string
  roomType?: string
  confirmationNumber?: string
}

export interface CalendarSuggestion {
  eventId: string
  eventTitle: string
  eventDate: string
  location: string
  reason: string
  suggestedAction: string
}

export interface FlightAlertInfo {
  id: string
  type: string
  bookingId: string
  flightNumber?: string
  details: Record<string, unknown>
  acknowledged: boolean
  createdAt: Date
}
