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
import { HotelSearchForm } from "@/components/travel/HotelSearchForm"
import { HotelCard } from "@/components/travel/HotelCard"
import {
  HotelFilters,
  type HotelFilterState,
} from "@/components/travel/HotelFilters"
import { HotelResultsSkeleton } from "@/components/travel/HotelResultsSkeleton"
import { BookingConfirmation } from "@/components/travel/BookingConfirmation"
import type { HotelOffer } from "@/types/travel"
import { toast } from "sonner"
import { Building2, SlidersHorizontal, AlertCircle } from "lucide-react"

type SortOption = "price-asc" | "price-desc" | "rating-desc"

interface SearchMeta {
  totalCount: number
  hotelsSearched: number
  totalHotelsInCity: number
}

export default function HotelSearchPage() {
  const [offers, setOffers] = useState<HotelOffer[]>([])
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
    if (offers.length === 0) return { min: 0, max: 500 }
    const prices = offers.map((o) => o.pricePerNight)
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    }
  }, [offers])

  const [filters, setFilters] = useState<HotelFilterState>({
    priceRange: [0, 5000],
    starRatings: [],
    amenities: [],
  })

  // Extract available amenities from offers
  const availableAmenities = useMemo(() => {
    const amenitySet = new Set<string>()
    for (const offer of offers) {
      for (const amenity of offer.amenities) {
        amenitySet.add(amenity)
      }
    }
    return Array.from(amenitySet).sort().slice(0, 15)
  }, [offers])

  // Apply filters and sorting
  const filteredOffers = useMemo(() => {
    let filtered = offers.filter((offer) => {
      // Price filter (per night)
      if (
        offer.pricePerNight < filters.priceRange[0] ||
        offer.pricePerNight > filters.priceRange[1]
      ) {
        return false
      }

      // Star rating filter
      if (filters.starRatings.length > 0) {
        const rating = offer.starRating || 0
        if (!filters.starRatings.some((r) => rating >= r)) {
          return false
        }
      }

      // Amenities filter
      if (filters.amenities.length > 0) {
        const hasAll = filters.amenities.every((a) =>
          offer.amenities.includes(a)
        )
        if (!hasAll) return false
      }

      return true
    })

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return a.totalPrice - b.totalPrice
        case "price-desc":
          return b.totalPrice - a.totalPrice
        case "rating-desc":
          return (b.starRating || 0) - (a.starRating || 0)
        default:
          return 0
      }
    })

    return filtered
  }, [offers, filters, sortBy])

  const handleSearch = useCallback(
    async (params: {
      cityCode: string
      checkInDate: string
      checkOutDate: string
      guests: number
    }) => {
      setIsLoading(true)
      setHasSearched(true)

      try {
        const queryParams = new URLSearchParams({
          cityCode: params.cityCode,
          checkInDate: params.checkInDate,
          checkOutDate: params.checkOutDate,
          guests: String(params.guests),
        })

        const response = await fetch(
          `/api/travel/hotels?${queryParams.toString()}`
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Search failed")
        }

        const data = await response.json()
        setOffers(data.offers)
        setMeta(data.meta)

        // Reset filters to match new results
        const prices = data.offers.map((o: HotelOffer) => o.pricePerNight)
        if (prices.length > 0) {
          setFilters({
            priceRange: [
              Math.floor(Math.min(...prices)),
              Math.ceil(Math.max(...prices)),
            ],
            starRatings: [],
            amenities: [],
          })
        }

        if (data.offers.length === 0) {
          toast.info("No hotels found for your search criteria.")
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to search hotels"
        toast.error(message)
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const handleAddToTrip = useCallback((offer: HotelOffer) => {
    toast.info(
      `To book ${offer.hotelName}, create a trip first from the Trips page.`
    )
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Hotel Search</h1>
        <p className="text-muted-foreground">
          Search and compare hotels with live availability via Amadeus.
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Search Hotels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <HotelSearchForm onSearch={handleSearch} isLoading={isLoading} />
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading && <HotelResultsSkeleton />}

      {!isLoading && hasSearched && (
        <>
          {/* Results header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {filteredOffers.length} hotel{filteredOffers.length !== 1 ? "s" : ""} found
              </span>
              {meta && (
                <Badge variant="secondary" className="text-[10px]">
                  Searched {meta.hotelsSearched} of {meta.totalHotelsInCity} hotels
                </Badge>
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
                  <SelectItem value="price-desc">Price (highest)</SelectItem>
                  <SelectItem value="rating-desc">Rating (highest)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filters + Results layout */}
          <div className="flex gap-6">
            {/* Filter sidebar */}
            {showFilters && offers.length > 0 && (
              <div className="w-56 shrink-0">
                <HotelFilters
                  filters={filters}
                  onChange={setFilters}
                  priceMin={priceBounds.min}
                  priceMax={priceBounds.max}
                  availableAmenities={availableAmenities}
                />
              </div>
            )}

            {/* Results grid */}
            <div className="flex-1">
              {filteredOffers.length === 0 ? (
                <Card className="py-12 text-center">
                  <CardContent>
                    <p className="text-muted-foreground">
                      {offers.length === 0
                        ? "No hotels found. Try different search criteria."
                        : "No hotels match your filter criteria. Try adjusting filters."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredOffers.map((offer) => (
                    <HotelCard
                      key={offer.id}
                      offer={offer}
                      onAddToTrip={handleAddToTrip}
                    />
                  ))}
                </div>
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
