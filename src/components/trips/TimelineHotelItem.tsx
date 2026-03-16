"use client"

import { Hotel, MapPin } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency, formatDate } from "@/lib/utils"

interface TimelineHotelItemProps {
  details: Record<string, string> | null
  price: number
  currency: string
}

export function TimelineHotelItem({
  details,
  price,
  currency,
}: TimelineHotelItemProps) {
  if (!details) return null

  const hotelName = details.hotelName ?? details.hotel_name ?? "Hotel"
  const address = details.address ?? ""
  const checkIn = details.checkIn ?? details.check_in
  const checkOut = details.checkOut ?? details.check_out
  const roomType = details.roomType ?? details.room_type ?? ""

  const nights =
    checkIn && checkOut
      ? Math.ceil(
          (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000
        )
      : null

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
              <Hotel className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium">{hotelName}</p>
              {address && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{address}</span>
                </div>
              )}
              <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                {checkIn && (
                  <div>
                    <span className="text-xs uppercase tracking-wide">Check-in</span>
                    <p className="font-medium text-foreground">{formatDate(checkIn)}</p>
                  </div>
                )}
                {checkOut && (
                  <div>
                    <span className="text-xs uppercase tracking-wide">Check-out</span>
                    <p className="font-medium text-foreground">{formatDate(checkOut)}</p>
                  </div>
                )}
                {nights !== null && (
                  <div>
                    <span className="text-xs uppercase tracking-wide">Duration</span>
                    <p className="font-medium text-foreground">
                      {nights} night{nights !== 1 ? "s" : ""}
                    </p>
                  </div>
                )}
              </div>
              {roomType && (
                <p className="text-xs text-muted-foreground mt-1">{roomType}</p>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="font-semibold">{formatCurrency(price, currency)}</p>
            {nights !== null && nights > 0 && (
              <p className="text-xs text-muted-foreground">
                {formatCurrency(price / nights, currency)}/night
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
