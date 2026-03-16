"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Plane,
  Clock,
  ArrowRight,
  Leaf,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export interface FlightResultData {
  id: string
  airline: string
  flightNumber: string
  departureAirport: string
  arrivalAirport: string
  departureTime: string
  arrivalTime: string
  duration: string
  stops: number
  price: number
  currency: string
  cabinClass: string
  carbonKg?: number
  policyCompliant?: boolean
  policyViolationReason?: string
  provider?: string
}

interface FlightResultCardProps {
  flight: FlightResultData
  onBook?: (flight: FlightResultData) => void
}

export function FlightResultCard({ flight, onBook }: FlightResultCardProps) {
  const formatTime = (timeStr: string): string => {
    try {
      const date = new Date(timeStr)
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    } catch {
      return timeStr
    }
  }

  return (
    <Card size="sm" className="my-2 max-w-lg">
      <CardContent className="space-y-3">
        {/* Header: Airline + Policy */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
              <Plane className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">{flight.airline}</p>
              <p className="text-xs text-muted-foreground">
                {flight.flightNumber}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {flight.policyCompliant === false ? (
              <Badge variant="destructive">
                <ShieldAlert className="mr-1 h-3 w-3" />
                Out of Policy
              </Badge>
            ) : flight.policyCompliant === true ? (
              <Badge variant="secondary">
                <ShieldCheck className="mr-1 h-3 w-3" />
                Policy OK
              </Badge>
            ) : null}
            <Badge variant="outline">{flight.cabinClass}</Badge>
          </div>
        </div>

        {/* Flight Route */}
        <div className="flex items-center justify-between">
          <div className="text-center">
            <p className="text-lg font-semibold">
              {formatTime(flight.departureTime)}
            </p>
            <p className="text-xs font-medium text-muted-foreground">
              {flight.departureAirport}
            </p>
          </div>

          <div className="flex flex-1 flex-col items-center px-4">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {flight.duration}
            </div>
            <div className="relative my-1 w-full">
              <div className="h-px w-full bg-border" />
              <ArrowRight className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              {flight.stops === 0
                ? "Nonstop"
                : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}
            </p>
          </div>

          <div className="text-center">
            <p className="text-lg font-semibold">
              {formatTime(flight.arrivalTime)}
            </p>
            <p className="text-xs font-medium text-muted-foreground">
              {flight.arrivalAirport}
            </p>
          </div>
        </div>

        <Separator />

        {/* Price + Carbon + Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="text-lg font-bold text-primary">
              {formatCurrency(flight.price, flight.currency)}
            </p>
            {flight.carbonKg != null && (
              <Badge variant="secondary">
                <Leaf className="mr-1 h-3 w-3" />
                {flight.carbonKg} kg CO2
              </Badge>
            )}
          </div>
          {onBook && (
            <Button size="sm" onClick={() => onBook(flight)}>
              Book this
            </Button>
          )}
        </div>

        {flight.policyViolationReason && (
          <p className="text-xs text-destructive">
            {flight.policyViolationReason}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
