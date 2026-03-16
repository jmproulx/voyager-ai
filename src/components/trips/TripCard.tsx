"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, CreditCard, Luggage } from "lucide-react"
import { formatDate, formatCurrency } from "@/lib/utils"

interface TripCardProps {
  id: string
  name: string
  status: string
  destination: string | null
  startDate: string | Date | null
  endDate: string | Date | null
  bookingCount: number
  totalSpend: number
  currency: string
}

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

function getStatusLabel(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase()
}

export function TripCard({
  id,
  name,
  status,
  destination,
  startDate,
  endDate,
  bookingCount,
  totalSpend,
  currency,
}: TripCardProps) {
  return (
    <Link href={`/trips/${id}`}>
      <Card className="transition-all hover:ring-2 hover:ring-primary/20 cursor-pointer">
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="truncate">{name}</CardTitle>
            {destination && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{destination}</span>
              </div>
            )}
          </div>
          <Badge variant={getStatusVariant(status)}>
            {getStatusLabel(status)}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {startDate && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {formatDate(startDate)}
                  {endDate ? ` - ${formatDate(endDate)}` : ""}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Luggage className="h-3.5 w-3.5" />
              <span>{bookingCount} booking{bookingCount !== 1 ? "s" : ""}</span>
            </div>
            {totalSpend > 0 && (
              <div className="flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5" />
                <span>{formatCurrency(totalSpend, currency)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
