"use client"

import type { FlightOffer } from "@/types/travel"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { formatFlightTimes } from "@/lib/travel/utils"
import {
  Plane,
  Clock,
  Luggage,
  ArrowRight,
  CircleDot,
  Plus,
} from "lucide-react"

interface FlightCardProps {
  offer: FlightOffer
  onAddToTrip?: (offer: FlightOffer) => void
}

export function FlightCard({ offer, onAddToTrip }: FlightCardProps) {
  const firstSegment = offer.segments[0]
  const lastSegment = offer.segments[offer.segments.length - 1]

  const { departureFormatted, arrivalFormatted, nextDay } = formatFlightTimes(
    firstSegment.departureTime,
    lastSegment.arrivalTime
  )

  const stopLabel =
    offer.stops === 0
      ? "Nonstop"
      : offer.stops === 1
      ? "1 stop"
      : `${offer.stops} stops`

  // Collect stop cities
  const stopCities =
    offer.stops > 0
      ? offer.segments
          .slice(0, -1)
          .map((s) => s.arrivalAirport)
          .join(", ")
      : ""

  // Display the cabin class nicely
  const cabinDisplay: Record<string, string> = {
    ECONOMY: "Economy",
    PREMIUM_ECONOMY: "Premium Economy",
    BUSINESS: "Business",
    FIRST: "First",
  }

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Flight details */}
          <div className="flex-1 space-y-3">
            {/* Airline and flight number */}
            <div className="flex items-center gap-2">
              <Plane className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {firstSegment.airline}
              </span>
              <span className="text-xs text-muted-foreground">
                {firstSegment.flightNumber}
                {offer.segments.length > 1 &&
                  ` + ${offer.segments.length - 1} more`}
              </span>
              <Badge
                variant={offer.provider === "AMADEUS" ? "secondary" : "outline"}
                className="ml-auto text-[10px]"
              >
                {offer.provider}
              </Badge>
            </div>

            {/* Time and route */}
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-lg font-semibold">{departureFormatted}</p>
                <p className="text-xs text-muted-foreground">
                  {firstSegment.departureAirport}
                </p>
              </div>

              <div className="flex flex-1 flex-col items-center gap-0.5">
                <span className="text-xs text-muted-foreground">
                  {offer.totalDuration}
                </span>
                <div className="flex w-full items-center gap-1">
                  <div className="h-px flex-1 bg-border" />
                  {offer.stops > 0 ? (
                    <>
                      {offer.segments.slice(0, -1).map((_, i) => (
                        <CircleDot
                          key={i}
                          className="h-2.5 w-2.5 text-muted-foreground"
                        />
                      ))}
                    </>
                  ) : null}
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <span className="text-xs text-muted-foreground">
                  {stopLabel}
                  {stopCities && ` (${stopCities})`}
                </span>
              </div>

              <div className="text-center">
                <p className="text-lg font-semibold">
                  {arrivalFormatted}
                  {nextDay && (
                    <span className="ml-0.5 text-xs font-normal text-destructive">
                      +1
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {lastSegment.arrivalAirport}
                </p>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className="text-[10px]">
                <Clock className="mr-0.5 h-2.5 w-2.5" />
                {offer.totalDuration}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {cabinDisplay[offer.cabinClass] || offer.cabinClass}
              </Badge>
              {offer.baggageIncluded && (
                <Badge variant="outline" className="text-[10px]">
                  <Luggage className="mr-0.5 h-2.5 w-2.5" />
                  Bag included
                </Badge>
              )}
              {offer.carbonKg && (
                <Badge variant="outline" className="text-[10px]">
                  {offer.carbonKg.toFixed(0)} kg CO2
                </Badge>
              )}
            </div>
          </div>

          {/* Right: Price and action */}
          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <p className="text-2xl font-bold">
                {formatCurrency(offer.totalPrice, offer.currency)}
              </p>
              <p className="text-xs text-muted-foreground">
                per person
              </p>
            </div>

            {onAddToTrip && (
              <Button
                size="sm"
                onClick={() => onAddToTrip(offer)}
                className="mt-1"
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add to trip
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
