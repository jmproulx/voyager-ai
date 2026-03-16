"use client"

import type { HotelOffer } from "@/types/travel"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import {
  Star,
  MapPin,
  Wifi,
  Car,
  Dumbbell,
  UtensilsCrossed,
  Plus,
} from "lucide-react"

interface HotelCardProps {
  offer: HotelOffer
  onAddToTrip?: (offer: HotelOffer) => void
}

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  WIFI: <Wifi className="h-3 w-3" />,
  INTERNET: <Wifi className="h-3 w-3" />,
  PARKING: <Car className="h-3 w-3" />,
  FITNESS: <Dumbbell className="h-3 w-3" />,
  GYM: <Dumbbell className="h-3 w-3" />,
  RESTAURANT: <UtensilsCrossed className="h-3 w-3" />,
}

function getAmenityIcon(amenity: string): React.ReactNode | null {
  const upper = amenity.toUpperCase()
  for (const [key, icon] of Object.entries(AMENITY_ICONS)) {
    if (upper.includes(key)) return icon
  }
  return null
}

export function HotelCard({ offer, onAddToTrip }: HotelCardProps) {
  // Calculate number of nights
  const checkIn = new Date(offer.checkIn)
  const checkOut = new Date(offer.checkOut)
  const nights = Math.max(
    1,
    Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    )
  )

  // Format the top amenities (limit to 5)
  const displayAmenities = offer.amenities.slice(0, 5)

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          {/* Header: Hotel name and rating */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="font-semibold leading-tight">{offer.hotelName}</h3>
              {offer.hotelChain && (
                <p className="text-xs text-muted-foreground">
                  {offer.hotelChain}
                </p>
              )}
            </div>

            {offer.starRating && offer.starRating > 0 && (
              <div className="flex items-center gap-0.5">
                {Array.from({ length: offer.starRating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Address */}
          <div className="flex items-start gap-1.5">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{offer.address}</p>
          </div>

          {/* Room type */}
          <p className="text-sm">{offer.roomType}</p>

          {/* Amenities */}
          {displayAmenities.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {displayAmenities.map((amenity) => {
                const icon = getAmenityIcon(amenity)
                return (
                  <Badge
                    key={amenity}
                    variant="outline"
                    className="text-[10px]"
                  >
                    {icon}
                    <span className="ml-0.5 capitalize">
                      {amenity.toLowerCase().replace(/_/g, " ")}
                    </span>
                  </Badge>
                )
              })}
            </div>
          )}

          {/* Cancellation policy */}
          {offer.cancellationPolicy && (
            <p className="text-xs text-green-600 dark:text-green-400">
              {offer.cancellationPolicy.length > 80
                ? `${offer.cancellationPolicy.substring(0, 80)}...`
                : offer.cancellationPolicy}
            </p>
          )}

          {/* Price and action */}
          <div className="flex items-end justify-between border-t pt-3">
            <div>
              <p className="text-xl font-bold">
                {formatCurrency(offer.totalPrice, offer.currency)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(offer.pricePerNight, offer.currency)} / night
                {" "}
                &middot; {nights} {nights === 1 ? "night" : "nights"}
              </p>
            </div>

            {onAddToTrip && (
              <Button
                size="sm"
                onClick={() => onAddToTrip(offer)}
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
