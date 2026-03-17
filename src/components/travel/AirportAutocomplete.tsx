"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { searchAirports, type Airport } from "@/lib/travel/airports"
import { Plane } from "lucide-react"
import { cn } from "@/lib/utils"

interface AirportAutocompleteProps {
  value: string
  onChange: (code: string) => void
  placeholder?: string
  className?: string
}

/**
 * Fetch airport suggestions from the Kiwi locations API.
 * Returns an Airport-shaped array, or null if the API is unavailable.
 */
async function fetchKiwiLocations(
  term: string
): Promise<Airport[] | null> {
  try {
    const response = await fetch(
      `/api/travel/locations?term=${encodeURIComponent(term)}&locationTypes=airport&limit=10`
    )
    if (!response.ok) return null

    const data: {
      locations: Array<{
        code: string
        name: string
        cityName?: string
        countryName?: string
      }>
      source: string
    } = await response.json()

    if (data.source === "none" || data.locations.length === 0) {
      return null
    }

    return data.locations.map((loc) => ({
      code: loc.code,
      name: loc.name,
      city: loc.cityName || loc.name,
      country: loc.countryName || "",
    }))
  } catch {
    return null
  }
}

export function AirportAutocomplete({
  value,
  onChange,
  placeholder = "Airport code or city",
  className,
}: AirportAutocompleteProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Airport[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync display value with external value
  useEffect(() => {
    if (value && !selectedAirport) {
      const airports = searchAirports(value)
      const match = airports.find((a) => a.code === value)
      if (match) {
        setSelectedAirport(match)
        setQuery(`${match.code} - ${match.city}`)
      } else {
        setQuery(value)
      }
    }
  }, [value, selectedAirport])

  const handleSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery)

    if (searchQuery.length < 1) {
      setResults([])
      setIsOpen(false)
      return
    }

    // Show static results immediately for responsiveness
    const staticMatches = searchAirports(searchQuery)
    setResults(staticMatches)
    setIsOpen(staticMatches.length > 0)
    setHighlightedIndex(-1)

    // Debounce the API call to Kiwi for live results
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (searchQuery.length >= 2) {
      debounceRef.current = setTimeout(async () => {
        const kiwiResults = await fetchKiwiLocations(searchQuery)
        if (kiwiResults && kiwiResults.length > 0) {
          // Merge: Kiwi results first, then static results that aren't duplicates
          const kiwiCodes = new Set(kiwiResults.map((r) => r.code))
          const uniqueStatic = staticMatches.filter(
            (a) => !kiwiCodes.has(a.code)
          )
          const merged = [...kiwiResults, ...uniqueStatic].slice(0, 10)
          setResults(merged)
          setIsOpen(merged.length > 0)
        }
      }, 300)
    }
  }, [])

  const handleSelect = useCallback(
    (airport: Airport) => {
      setSelectedAirport(airport)
      setQuery(`${airport.code} - ${airport.city}`)
      setIsOpen(false)
      onChange(airport.code)
    },
    [onChange]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === "ArrowDown") {
        e.preventDefault()
        setHighlightedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : 0
        )
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : results.length - 1
        )
      } else if (e.key === "Enter" && highlightedIndex >= 0) {
        e.preventDefault()
        handleSelect(results[highlightedIndex])
      } else if (e.key === "Escape") {
        setIsOpen(false)
      }
    },
    [isOpen, results, highlightedIndex, handleSelect]
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Input
        ref={inputRef}
        value={query}
        onChange={(e) => {
          handleSearch(e.target.value)
          setSelectedAirport(null)
          if (e.target.value === "") {
            onChange("")
          }
        }}
        onFocus={() => {
          if (results.length > 0) setIsOpen(true)
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="h-9"
      />

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg">
          <ul className="max-h-60 overflow-y-auto py-1">
            {results.map((airport, index) => (
              <li
                key={airport.code}
                className={cn(
                  "flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted",
                  highlightedIndex === index && "bg-muted"
                )}
                onClick={() => handleSelect(airport)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <Plane className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="font-medium">
                    {airport.code}{" "}
                    <span className="font-normal text-muted-foreground">
                      - {airport.name}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {airport.city}, {airport.country}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
