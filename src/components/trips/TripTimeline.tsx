"use client"

import { format, isSameDay } from "date-fns"
import { TimelineFlightItem } from "./TimelineFlightItem"
import { TimelineHotelItem } from "./TimelineHotelItem"
import { TimelineCustomItem } from "./TimelineCustomItem"
import type { Booking, ItineraryItem, FlightAlert } from "@prisma/client"

interface TimelineEntry {
  id: string
  date: Date
  type: "flight" | "hotel" | "car_rental" | "custom"
  booking?: Booking & { flightAlerts: FlightAlert[] }
  itineraryItem?: ItineraryItem
}

interface TripTimelineProps {
  bookings: (Booking & { flightAlerts: FlightAlert[] })[]
  itineraryItems: ItineraryItem[]
}

function getBookingDate(booking: Booking): Date {
  const details = booking.details as Record<string, string> | null
  if (!details) return booking.createdAt

  if (booking.type === "FLIGHT") {
    const dep = details.departureTime ?? details.departure_time
    return dep ? new Date(dep) : booking.createdAt
  }

  if (booking.type === "HOTEL") {
    const checkIn = details.checkIn ?? details.check_in
    return checkIn ? new Date(checkIn) : booking.createdAt
  }

  return booking.createdAt
}

export function TripTimeline({ bookings, itineraryItems }: TripTimelineProps) {
  // Build unified timeline entries
  const entries: TimelineEntry[] = []

  for (const booking of bookings) {
    entries.push({
      id: `booking-${booking.id}`,
      date: getBookingDate(booking),
      type: booking.type === "FLIGHT" ? "flight" : booking.type === "HOTEL" ? "hotel" : "car_rental",
      booking,
    })
  }

  for (const item of itineraryItems) {
    entries.push({
      id: `item-${item.id}`,
      date: item.startTime,
      type: "custom",
      itineraryItem: item,
    })
  }

  // Sort chronologically
  entries.sort((a, b) => a.date.getTime() - b.date.getTime())

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No items in this itinerary yet. Add bookings or custom events to get started.
        </p>
      </div>
    )
  }

  // Group by day
  const dayGroups: { date: Date; entries: TimelineEntry[] }[] = []
  for (const entry of entries) {
    const lastGroup = dayGroups[dayGroups.length - 1]
    if (lastGroup && isSameDay(lastGroup.date, entry.date)) {
      lastGroup.entries.push(entry)
    } else {
      dayGroups.push({ date: entry.date, entries: [entry] })
    }
  }

  return (
    <div className="space-y-6">
      {dayGroups.map((group, groupIdx) => (
        <div key={groupIdx}>
          {/* Day header */}
          <div className="sticky top-0 z-10 mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              {format(group.date, "d")}
            </div>
            <div>
              <p className="font-semibold">{format(group.date, "EEEE")}</p>
              <p className="text-xs text-muted-foreground">
                {format(group.date, "MMMM d, yyyy")}
              </p>
            </div>
          </div>

          {/* Timeline items */}
          <div className="ml-5 space-y-3 border-l-2 border-border pl-6">
            {group.entries.map((entry) => {
              if (entry.type === "flight" && entry.booking) {
                return (
                  <TimelineFlightItem
                    key={entry.id}
                    details={entry.booking.details as Record<string, string> | null}
                    price={entry.booking.price}
                    currency={entry.booking.currency}
                    status={entry.booking.status}
                    alerts={entry.booking.flightAlerts.map((a) => ({
                      type: a.type,
                      details: a.details as Record<string, unknown> | null,
                    }))}
                  />
                )
              }

              if (entry.type === "hotel" && entry.booking) {
                return (
                  <TimelineHotelItem
                    key={entry.id}
                    details={entry.booking.details as Record<string, string> | null}
                    price={entry.booking.price}
                    currency={entry.booking.currency}
                  />
                )
              }

              if (entry.type === "custom" && entry.itineraryItem) {
                const item = entry.itineraryItem
                return (
                  <TimelineCustomItem
                    key={entry.id}
                    title={item.title}
                    description={item.description}
                    startTime={item.startTime}
                    endTime={item.endTime}
                    location={item.location}
                    type={item.type}
                  />
                )
              }

              // Car rental fallback
              if (entry.booking) {
                const details = entry.booking.details as Record<string, string> | null
                return (
                  <TimelineCustomItem
                    key={entry.id}
                    title={details?.company ?? "Car Rental"}
                    description={details?.description ?? null}
                    startTime={entry.date}
                    endTime={null}
                    location={details?.pickup_location ?? details?.location ?? null}
                    type="transport"
                  />
                )
              }

              return null
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
