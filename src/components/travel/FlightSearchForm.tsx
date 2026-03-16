"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AirportAutocomplete } from "./AirportAutocomplete"
import { Search, ArrowRightLeft, Minus, Plus } from "lucide-react"

interface FlightSearchFormProps {
  onSearch: (params: {
    origin: string
    destination: string
    departureDate: string
    returnDate?: string
    passengers: number
    cabinClass: string
  }) => void
  isLoading?: boolean
}

export function FlightSearchForm({ onSearch, isLoading }: FlightSearchFormProps) {
  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")
  const [departureDate, setDepartureDate] = useState("")
  const [returnDate, setReturnDate] = useState("")
  const [passengers, setPassengers] = useState(1)
  const [cabinClass, setCabinClass] = useState("ECONOMY")

  const handleSwapAirports = () => {
    const temp = origin
    setOrigin(destination)
    setDestination(temp)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!origin || !destination || !departureDate) return

    onSearch({
      origin,
      destination,
      departureDate,
      returnDate: returnDate || undefined,
      passengers,
      cabinClass,
    })
  }

  // Get tomorrow's date as the minimum date
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split("T")[0]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Origin / Destination row */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="origin">From</Label>
          <AirportAutocomplete
            value={origin}
            onChange={setOrigin}
            placeholder="Origin airport"
          />
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleSwapAirports}
          className="mb-0.5"
        >
          <ArrowRightLeft className="h-4 w-4" />
        </Button>

        <div className="space-y-1.5">
          <Label htmlFor="destination">To</Label>
          <AirportAutocomplete
            value={destination}
            onChange={setDestination}
            placeholder="Destination airport"
          />
        </div>
      </div>

      {/* Dates row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="departureDate">Departure</Label>
          <Input
            id="departureDate"
            type="date"
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
            min={minDate}
            className="h-9"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="returnDate">Return (optional)</Label>
          <Input
            id="returnDate"
            type="date"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
            min={departureDate || minDate}
            className="h-9"
          />
        </div>
      </div>

      {/* Passengers and Class row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Passengers</Label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => setPassengers(Math.max(1, passengers - 1))}
              disabled={passengers <= 1}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span className="w-8 text-center text-sm font-medium">
              {passengers}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => setPassengers(Math.min(9, passengers + 1))}
              disabled={passengers >= 9}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Cabin Class</Label>
          <Select value={cabinClass} onValueChange={(v) => { if (v) setCabinClass(v) }}>
            <SelectTrigger className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ECONOMY">Economy</SelectItem>
              <SelectItem value="PREMIUM_ECONOMY">Premium Economy</SelectItem>
              <SelectItem value="BUSINESS">Business</SelectItem>
              <SelectItem value="FIRST">First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search button */}
      <Button type="submit" className="w-full" size="lg" disabled={isLoading || !origin || !destination || !departureDate}>
        <Search className="mr-2 h-4 w-4" />
        {isLoading ? "Searching..." : "Search Flights"}
      </Button>
    </form>
  )
}
