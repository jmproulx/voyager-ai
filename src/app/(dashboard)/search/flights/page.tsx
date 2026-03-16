"use client"

import { useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FlightSearchForm } from "@/components/travel/FlightSearchForm"
import { FlightCard } from "@/components/travel/FlightCard"
import {
  FlightFilters,
  type FlightFilterState,
} from "@/components/travel/FlightFilters"
import { FlightResultsSkeleton } from "@/components/travel/FlightResultsSkeleton"
import { PriceComparison } from "@/components/travel/PriceComparison"
import { BookingConfirmation } from "@/components/travel/BookingConfirmation"
import { extractUniqueAirlines, calculateTotalDurationMinutes } from "@/lib/travel/utils"
import type { FlightOffer } from "@/types/travel"
import { toast } from "sonner"
import { Plane, SlidersHorizontal, AlertCircle } from "lucide-react"

type SortOption = "price-asc" | "duration-asc" | "departure-asc"

interface SearchMeta {
  amadeusCount: number
  duffelCount: number
  totalCount: number
  errors?: string[]
}

export default function FlightSearchPage() {
  const [offers, setOffers] = useState<FlightOffer[]>([])
  const [meta, setMeta] = useState<SearchMeta | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>("price-asc")
  const [showFilters, setShowFilters] = useState(true)
  const [bookingConfirmation, setBookingConfirmation] = useState<{
    id: string
    type: "FLIGHT" | "HOTEL"
    provider: string
    providerBookingId: string | null
    price: number
    currency: string
  } | null>(null)

  // Price bounds for filters
  const priceBounds = useMemo(() => {
    if (offers.length === 0) return { min: 0, max: 1000 }
    const prices = offers.map((o) => o.totalPrice)
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    }
  }, [offers])

  const [filters, setFilters] = useState<FlightFilterState>({
    priceRange: [0, 10000],
    maxStops: null,
    airlines: [],
    departureTimeRange: [0, 24],
  })

  const availableAirlines = useMemo(() => extractUniqueAirlines(offers), [offers])

  // Apply filters and sorting
  const filteredOffers = useMemo(() => {
    let filtered = offers.filter((offer) => {
      // Price filter
      if (
        offer.totalPrice < filters.priceRange[0] ||
        offer.totalPrice > filters.priceRange[1]
      ) {
        return false
      }

      // Stops filter
      if (filters.maxStops !== null && offer.stops > filters.maxStops) {
        return false
      }

      // Airlines filter
      if (filters.airlines.length > 0) {
        const offerAirlines = offer.segments.map((s) => s.airline)
        if (!offerAirlines.some((a) => filters.airlines.includes(a))) {
          return false
        }
      }

      // Departure time filter
      const firstDep = new Date(offer.segments[0].departureTime)
      const depHour = firstDep.getHours()
      if (
        depHour < filters.departureTimeRange[0] ||
        depHour > filters.departureTimeRange[1]
      ) {
        return false
      }

      return true
    })

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return a.totalPrice - b.totalPrice
        case "duration-asc":
          return (
            calculateTotalDurationMinutes(a.segments) -
            calculateTotalDurationMinutes(b.segments)
          )
        case "departure-asc": {
          const aDep = new Date(a.segments[0].departureTime).getTime()
          const bDep = new Date(b.segments[0].departureTime).getTime()
          return aDep - bDep
        }
        default:
          return 0
      }
    })

    return filtered
  }, [offers, filters, sortBy])

  const handleSearch = useCallback(
    async (params: {
      origin: string
      destination: string
      departureDate: string
      returnDate?: string
      passengers: number
      cabinClass: string
    }) => {
      setIsLoading(true)
      setHasSearched(true)

      try {
        const queryParams = new URLSearchParams({
          origin: params.origin,
          destination: params.destination,
          departureDate: params.departureDate,
          passengers: String(params.passengers),
          cabinClass: params.cabinClass,
        })

        if (params.returnDate) {
          queryParams.set("returnDate", params.returnDate)
        }

        const response = await fetch(
          `/api/travel/flights?${queryParams.toString()}`
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Search failed")
        }

        const data = await response.json()
        setOffers(data.offers)
        setMeta(data.meta)

        // Reset filters to match new results
        const prices = data.offers.map(
          (o: FlightOffer) => o.totalPrice
        )
        if (prices.length > 0) {
          setFilters({
            priceRange: [
              Math.floor(Math.min(...prices)),
              Math.ceil(Math.max(...prices)),
            ],
            maxStops: null,
            airlines: [],
            departureTimeRange: [0, 24],
          })
        }

        if (data.meta.errors) {
          for (const err of data.meta.errors) {
            toast.error(err)
          }
        }

        if (data.offers.length === 0) {
          toast.info("No flights found for your search criteria.")
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to search flights"
        toast.error(message)
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const handleAddToTrip = useCallback((offer: FlightOffer) => {
    // In a full implementation, this would open a trip selection dialog
    // and call the booking API. For now, show a toast.
    toast.info(
      `To book ${offer.segments[0].airline} ${offer.segments[0].flightNumber}, create a trip first from the Trips page.`
    )
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Flight Search</h1>
        <p className="text-muted-foreground">
          Search and compare flights from Amadeus and Duffel with real-time
          pricing.
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Search Flights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FlightSearchForm onSearch={handleSearch} isLoading={isLoading} />
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading && <FlightResultsSkeleton />}

      {!isLoading && hasSearched && (
        <>
          {/* Results header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {filteredOffers.length} flight{filteredOffers.length !== 1 ? "s" : ""} found
              </span>
              {meta && (
                <div className="flex gap-1">
                  {meta.amadeusCount > 0 && (
                    <Badge variant="secondary" className="text-[10px]">
                      Amadeus: {meta.amadeusCount}
                    </Badge>
                  )}
                  {meta.duffelCount > 0 && (
                    <Badge variant="outline" className="text-[10px]">
                      Duffel: {meta.duffelCount}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="mr-1 h-3.5 w-3.5" />
                Filters
              </Button>

              <Select
                value={sortBy}
                onValueChange={(v) => setSortBy(v as SortOption)}
              >
                <SelectTrigger className="h-8 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price-asc">Price (lowest)</SelectItem>
                  <SelectItem value="duration-asc">Duration (shortest)</SelectItem>
                  <SelectItem value="departure-asc">Departure (earliest)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Provider errors */}
          {meta?.errors && meta.errors.length > 0 && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Some providers returned errors
                  </p>
                  {meta.errors.map((err, i) => (
                    <p
                      key={i}
                      className="text-xs text-yellow-700 dark:text-yellow-300"
                    >
                      {err}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Price Comparison */}
          <PriceComparison offers={offers} />

          {/* Filters + Results layout */}
          <div className="flex gap-6">
            {/* Filter sidebar */}
            {showFilters && offers.length > 0 && (
              <div className="w-56 shrink-0">
                <FlightFilters
                  filters={filters}
                  onChange={setFilters}
                  availableAirlines={availableAirlines}
                  priceMin={priceBounds.min}
                  priceMax={priceBounds.max}
                />
              </div>
            )}

            {/* Results list */}
            <div className="flex-1 space-y-3">
              {filteredOffers.length === 0 ? (
                <Card className="py-12 text-center">
                  <CardContent>
                    <p className="text-muted-foreground">
                      {offers.length === 0
                        ? "No flights found. Try different search criteria."
                        : "No flights match your filter criteria. Try adjusting filters."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredOffers.map((offer) => (
                  <FlightCard
                    key={offer.id}
                    offer={offer}
                    onAddToTrip={handleAddToTrip}
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Booking confirmation dialog */}
      <BookingConfirmation
        open={!!bookingConfirmation}
        onOpenChange={(open) => {
          if (!open) setBookingConfirmation(null)
        }}
        booking={bookingConfirmation}
      />
    </div>
  )
}
