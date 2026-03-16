"use client"

import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/utils"

export interface FlightFilterState {
  priceRange: [number, number]
  maxStops: number | null // null = any
  airlines: string[]
  departureTimeRange: [number, number] // hours 0-24
}

interface FlightFiltersProps {
  filters: FlightFilterState
  onChange: (filters: FlightFilterState) => void
  availableAirlines: string[]
  priceMin: number
  priceMax: number
}

export function FlightFilters({
  filters,
  onChange,
  availableAirlines,
  priceMin,
  priceMax,
}: FlightFiltersProps) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-3 text-sm font-semibold">Filters</h3>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Price Range</Label>
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

      {/* Stops */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Stops</Label>
        <div className="space-y-1.5">
          {[
            { label: "Any number of stops", value: null },
            { label: "Nonstop only", value: 0 },
            { label: "1 stop or fewer", value: 1 },
            { label: "2 stops or fewer", value: 2 },
          ].map((option) => (
            <label
              key={String(option.value)}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Checkbox
                checked={filters.maxStops === option.value}
                onCheckedChange={() =>
                  onChange({ ...filters, maxStops: option.value })
                }
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <Separator />

      {/* Airlines */}
      {availableAirlines.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-medium">Airlines</Label>
          <div className="max-h-40 space-y-1.5 overflow-y-auto">
            {availableAirlines.map((airline) => (
              <label
                key={airline}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <Checkbox
                  checked={
                    filters.airlines.length === 0 ||
                    filters.airlines.includes(airline)
                  }
                  onCheckedChange={(checked) => {
                    if (checked) {
                      // If no airlines selected, selecting one means "only this one"
                      if (filters.airlines.length === 0) {
                        onChange({ ...filters, airlines: [airline] })
                      } else {
                        onChange({
                          ...filters,
                          airlines: [...filters.airlines, airline],
                        })
                      }
                    } else {
                      const remaining = filters.airlines.filter(
                        (a) => a !== airline
                      )
                      onChange({
                        ...filters,
                        airlines: remaining,
                      })
                    }
                  }}
                />
                <span className="truncate">{airline}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Departure Time */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Departure Time</Label>
        <Slider
          min={0}
          max={24}
          value={filters.departureTimeRange}
          onValueChange={(value) =>
            onChange({
              ...filters,
              departureTimeRange: value as [number, number],
            })
          }
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTimeFromHour(filters.departureTimeRange[0])}</span>
          <span>{formatTimeFromHour(filters.departureTimeRange[1])}</span>
        </div>
      </div>
    </div>
  )
}

function formatTimeFromHour(hour: number): string {
  if (hour === 0) return "12:00 AM"
  if (hour === 12) return "12:00 PM"
  if (hour === 24) return "11:59 PM"
  if (hour < 12) return `${hour}:00 AM`
  return `${hour - 12}:00 PM`
}
