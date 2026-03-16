"use client"

import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/utils"
import { Star } from "lucide-react"

export interface HotelFilterState {
  priceRange: [number, number]
  starRatings: number[] // e.g., [3, 4, 5]
  amenities: string[]
}

interface HotelFiltersProps {
  filters: HotelFilterState
  onChange: (filters: HotelFilterState) => void
  priceMin: number
  priceMax: number
  availableAmenities: string[]
}

export function HotelFilters({
  filters,
  onChange,
  priceMin,
  priceMax,
  availableAmenities,
}: HotelFiltersProps) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-3 text-sm font-semibold">Filters</h3>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Price per Night</Label>
        <Slider
          min={priceMin}
          max={priceMax}
          value={filters.priceRange}
          onValueChange={(value) =>
            onChange({ ...filters, priceRange: value as [number, number] })
          }
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatCurrency(filters.priceRange[0])}</span>
          <span>{formatCurrency(filters.priceRange[1])}</span>
        </div>
      </div>

      <Separator />

      {/* Star Rating */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Star Rating</Label>
        <div className="space-y-1.5">
          {[5, 4, 3, 2, 1].map((rating) => (
            <label
              key={rating}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Checkbox
                checked={
                  filters.starRatings.length === 0 ||
                  filters.starRatings.includes(rating)
                }
                onCheckedChange={(checked) => {
                  if (checked) {
                    if (filters.starRatings.length === 0) {
                      onChange({ ...filters, starRatings: [rating] })
                    } else {
                      onChange({
                        ...filters,
                        starRatings: [...filters.starRatings, rating],
                      })
                    }
                  } else {
                    onChange({
                      ...filters,
                      starRatings: filters.starRatings.filter(
                        (r) => r !== rating
                      ),
                    })
                  }
                }}
              />
              <div className="flex items-center gap-0.5">
                {Array.from({ length: rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-3 w-3 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">& up</span>
            </label>
          ))}
        </div>
      </div>

      <Separator />

      {/* Amenities */}
      {availableAmenities.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-medium">Amenities</Label>
          <div className="max-h-40 space-y-1.5 overflow-y-auto">
            {availableAmenities.map((amenity) => (
              <label
                key={amenity}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <Checkbox
                  checked={filters.amenities.includes(amenity)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange({
                        ...filters,
                        amenities: [...filters.amenities, amenity],
                      })
                    } else {
                      onChange({
                        ...filters,
                        amenities: filters.amenities.filter(
                          (a) => a !== amenity
                        ),
                      })
                    }
                  }}
                />
                <span className="truncate capitalize">
                  {amenity.toLowerCase().replace(/_/g, " ")}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
