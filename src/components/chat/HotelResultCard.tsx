"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Building2,
  Star,
  Wifi,
  Car,
  Dumbbell,
  UtensilsCrossed,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export interface HotelResultData {
  id: string
  hotelName: string
  starRating?: number
  pricePerNight: number
  totalPrice: number
  currency: string
  amenities: string[]
  address?: string
  roomType?: string
  checkIn?: string
  checkOut?: string
  policyCompliant?: boolean
  policyViolationReason?: string
  provider?: string
}

interface HotelResultCardProps {
  hotel: HotelResultData
  onBook?: (hotel: HotelResultData) => void
}

const AMENITY_ICONS: Record<string, typeof Wifi> = {
  wifi: Wifi,
  parking: Car,
  gym: Dumbbell,
  fitness: Dumbbell,
  restaurant: UtensilsCrossed,
  dining: UtensilsCrossed,
}

function getAmenityIcon(amenity: string) {
  const lowerAmenity = amenity.toLowerCase()
  for (const [key, Icon] of Object.entries(AMENITY_ICONS)) {
    if (lowerAmenity.includes(key)) {
      return Icon
    }
  }
  return null
}

export function HotelResultCard({ hotel, onBook }: HotelResultCardProps) {
  return (
    <Card size="sm" className="my-2 max-w-lg">
      <CardContent className="space-y-3">
        {/* Header: Hotel name + Rating */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">{hotel.hotelName}</p>
              {hotel.address && (
                <p className="text-xs text-muted-foreground">{hotel.address}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {hotel.policyCompliant === false ? (
              <Badge variant="destructive">
                <ShieldAlert className="mr-1 h-3 w-3" />
                Out of Policy
              </Badge>
            ) : hotel.policyCompliant === true ? (
              <Badge variant="secondary">
                <ShieldCheck className="mr-1 h-3 w-3" />
                Policy OK
              </Badge>
            ) : null}
          </div>
        </div>

        {/* Star rating */}
        {hotel.starRating != null && hotel.starRating > 0 && (
          <div className="flex items-center gap-0.5">
            {Array.from({ length: hotel.starRating }, (_, i) => (
              <Star
                key={i}
                className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400"
              />
            ))}
            <span className="ml-1 text-xs text-muted-foreground">
              {hotel.starRating}-star hotel
            </span>
          </div>
        )}

        {/* Room type */}
        {hotel.roomType && (
          <p className="text-xs text-muted-foreground">
            Room type: {hotel.roomType}
          </p>
        )}

        {/* Amenities */}
        {hotel.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {hotel.amenities.slice(0, 6).map((amenity) => {
              const Icon = getAmenityIcon(amenity)
              return (
                <Badge key={amenity} variant="outline" className="text-xs">
                  {Icon && <Icon className="mr-1 h-3 w-3" />}
                  {amenity}
                </Badge>
              )
            })}
            {hotel.amenities.length > 6 && (
              <Badge variant="outline" className="text-xs">
                +{hotel.amenities.length - 6} more
              </Badge>
            )}
          </div>
        )}

        <Separator />

        {/* Price + Actions */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-primary">
              {formatCurrency(hotel.pricePerNight, hotel.currency)}
              <span className="text-xs font-normal text-muted-foreground">
                {" "}
                / night
              </span>
            </p>
            {hotel.totalPrice !== hotel.pricePerNight && (
              <p className="text-xs text-muted-foreground">
                Total: {formatCurrency(hotel.totalPrice, hotel.currency)}
              </p>
            )}
          </div>
          {onBook && (
            <Button size="sm" onClick={() => onBook(hotel)}>
              Book this
            </Button>
          )}
        </div>

        {hotel.policyViolationReason && (
          <p className="text-xs text-destructive">
            {hotel.policyViolationReason}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
