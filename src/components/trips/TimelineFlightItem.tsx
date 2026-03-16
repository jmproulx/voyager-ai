"use client"

import { Plane, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { FlightStatusBadge } from "./FlightStatusBadge"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"

interface TimelineFlightItemProps {
  details: Record<string, string> | null
  price: number
  currency: string
  status: string
  alerts?: Array<{ type: string; details: Record<string, unknown> | null }>
}

export function TimelineFlightItem({
  details,
  price,
  currency,
  status,
  alerts,
}: TimelineFlightItemProps) {
  if (!details) return null

  const flightNumber = details.flightNumber ?? details.flight_number ?? "Unknown"
  const airline = details.airline ?? ""
  const departureAirport = details.departureAirport ?? details.departure_airport ?? ""
  const arrivalAirport = details.arrivalAirport ?? details.arrival_airport ?? ""
  const departureTime = details.departureTime ?? details.departure_time
  const arrivalTime = details.arrivalTime ?? details.arrival_time
  const flightStatus = details.status ?? status

  const hasDelay = alerts?.some((a) => a.type === "DELAY")
  const hasCancellation = alerts?.some((a) => a.type === "CANCELLATION")
  const hasGateChange = alerts?.some((a) => a.type === "GATE_CHANGE")

  return (
    <Card className={hasCancellation ? "border-destructive/50" : hasDelay ? "border-yellow-500/50" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <Plane className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium">
                  {airline} {flightNumber}
                </p>
                <FlightStatusBadge status={flightStatus} />
              </div>
              <div className="mt-2 flex items-center gap-3 text-sm">
                <div className="text-center">
                  <p className="font-semibold text-lg">{departureAirport}</p>
                  {departureTime && (
                    <p className="text-muted-foreground text-xs">
                      {format(new Date(departureTime), "h:mm a")}
                    </p>
                  )}
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <Plane className="h-3 w-3 text-muted-foreground" />
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-lg">{arrivalAirport}</p>
                  {arrivalTime && (
                    <p className="text-muted-foreground text-xs">
                      {format(new Date(arrivalTime), "h:mm a")}
                    </p>
                  )}
                </div>
              </div>
              {(hasDelay || hasCancellation || hasGateChange) && (
                <div className="mt-2 space-y-1">
                  {alerts?.map((alert, i) => {
                    const alertDetails = alert.details as Record<string, string> | null
                    return (
                      <div
                        key={i}
                        className={`text-xs px-2 py-1 rounded ${
                          alert.type === "CANCELLATION"
                            ? "bg-destructive/10 text-destructive"
                            : alert.type === "DELAY"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        }`}
                      >
                        {alertDetails?.message ?? `${alert.type}`}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="font-semibold">{formatCurrency(price, currency)}</p>
            {departureTime && arrivalTime && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Clock className="h-3 w-3" />
                <span>
                  {(() => {
                    const ms = new Date(arrivalTime).getTime() - new Date(departureTime).getTime()
                    const hours = Math.floor(ms / 3600000)
                    const minutes = Math.round((ms % 3600000) / 60000)
                    return `${hours}h ${minutes}m`
                  })()}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
