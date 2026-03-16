"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, MapPin, Minus, Plus } from "lucide-react"
import { searchCityCodes } from "@/lib/travel/airports"
import { cn } from "@/lib/utils"

interface HotelSearchFormProps {
  onSearch: (params: {
    cityCode: string
    checkInDate: string
    checkOutDate: string
    guests: number
  }) => void
  isLoading?: boolean
}

export function HotelSearchForm({ onSearch, isLoading }: HotelSearchFormProps) {
  const [cityQuery, setCityQuery] = useState("")
  const [cityCode, setCityCode] = useState("")
  const [checkInDate, setCheckInDate] = useState("")
  const [checkOutDate, setCheckOutDate] = useState("")
  const [guests, setGuests] = useState(1)
  const [cityResults, setCityResults] = useState<Array<{ city: string; code: string }>>([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleCitySearch = useCallback((query: string) => {
    setCityQuery(query)
    setCityCode("")
    if (query.length >= 1) {
      const matches = searchCityCodes(query)
      setCityResults(matches)
      setIsDropdownOpen(matches.length > 0)
      setHighlightedIndex(-1)
    } else {
      setCityResults([])
      setIsDropdownOpen(false)
    }
  }, [])

  const handleCitySelect = useCallback((city: string, code: string) => {
    setCityQuery(city)
    setCityCode(code)
    setIsDropdownOpen(false)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isDropdownOpen) return
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setHighlightedIndex((prev) =>
          prev < cityResults.length - 1 ? prev + 1 : 0
        )
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : cityResults.length - 1
        )
      } else if (e.key === "Enter" && highlightedIndex >= 0) {
        e.preventDefault()
        const selected = cityResults[highlightedIndex]
        handleCitySelect(selected.city, selected.code)
      } else if (e.key === "Escape") {
        setIsDropdownOpen(false)
      }
    },
    [isDropdownOpen, cityResults, highlightedIndex, handleCitySelect]
  )

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!cityCode || !checkInDate || !checkOutDate) return

    onSearch({
      cityCode,
      checkInDate,
      checkOutDate,
      guests,
    })
  }

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split("T")[0]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* City input */}
      <div className="space-y-1.5" ref={containerRef}>
        <Label>City / Destination</Label>
        <div className="relative">
          <Input
            value={cityQuery}
            onChange={(e) => handleCitySearch(e.target.value)}
            onFocus={() => {
              if (cityResults.length > 0) setIsDropdownOpen(true)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter a city name"
            className="h-9"
          />

          {isDropdownOpen && cityResults.length > 0 && (
            <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg">
              <ul className="max-h-60 overflow-y-auto py-1">
                {cityResults.map((result, index) => (
                  <li
                    key={result.code}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted",
                      highlightedIndex === index && "bg-muted"
                    )}
                    onClick={() => handleCitySelect(result.city, result.code)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="font-medium">{result.city}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {result.code}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Dates row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="checkInDate">Check-in</Label>
          <Input
            id="checkInDate"
            type="date"
            value={checkInDate}
            onChange={(e) => setCheckInDate(e.target.value)}
            min={minDate}
            className="h-9"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="checkOutDate">Check-out</Label>
          <Input
            id="checkOutDate"
            type="date"
            value={checkOutDate}
            onChange={(e) => setCheckOutDate(e.target.value)}
            min={checkInDate || minDate}
            className="h-9"
            required
          />
        </div>
      </div>

      {/* Guests */}
      <div className="space-y-1.5">
        <Label>Guests</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => setGuests(Math.max(1, guests - 1))}
            disabled={guests <= 1}
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <span className="w-8 text-center text-sm font-medium">{guests}</span>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => setGuests(Math.min(9, guests + 1))}
            disabled={guests >= 9}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Search button */}
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isLoading || !cityCode || !checkInDate || !checkOutDate}
      >
        <Search className="mr-2 h-4 w-4" />
        {isLoading ? "Searching..." : "Search Hotels"}
      </Button>
    </form>
  )
}
