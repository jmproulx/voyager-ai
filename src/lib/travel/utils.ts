import type { FlightOffer, FlightSegment } from "@/types/travel"

/**
 * Format a duration in minutes to a human-readable string.
 * @example formatDuration(155) => "2h 35m"
 */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return "0m"
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

/**
 * Parse an ISO 8601 duration string (PT2H35M) to minutes.
 */
export function parseDurationToMinutes(isoDuration: string): number {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!match) return 0
  const hours = parseInt(match[1] || "0", 10)
  const minutes = parseInt(match[2] || "0", 10)
  return hours * 60 + minutes
}

/**
 * Format flight departure and arrival times for display.
 */
export function formatFlightTimes(
  departure: string,
  arrival: string
): { departureFormatted: string; arrivalFormatted: string; nextDay: boolean } {
  const dep = new Date(departure)
  const arr = new Date(arrival)

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })

  const nextDay =
    arr.getUTCDate() !== dep.getUTCDate() ||
    arr.getUTCMonth() !== dep.getUTCMonth()

  return {
    departureFormatted: formatTime(dep),
    arrivalFormatted: formatTime(arr),
    nextDay,
  }
}

/**
 * Calculate stops from flight segments.
 */
export function calculateStops(segments: FlightSegment[]): {
  count: number
  cities: string[]
} {
  if (segments.length <= 1) {
    return { count: 0, cities: [] }
  }

  const stopCities = segments.slice(0, -1).map((seg) => seg.arrivalAirport)

  return {
    count: segments.length - 1,
    cities: stopCities,
  }
}

/**
 * Merge and deduplicate flight offers from multiple providers.
 * Deduplication is based on matching flight numbers and similar pricing.
 */
export function mergeAndDeduplicateOffers(
  amadeusOffers: FlightOffer[],
  duffelOffers: FlightOffer[]
): FlightOffer[] {
  const merged: FlightOffer[] = [...amadeusOffers]

  for (const duffelOffer of duffelOffers) {
    const duffelFlightNums = duffelOffer.segments
      .map((s) => s.flightNumber)
      .sort()
      .join(",")

    const isDuplicate = merged.some((existing) => {
      const existingFlightNums = existing.segments
        .map((s) => s.flightNumber)
        .sort()
        .join(",")

      if (duffelFlightNums !== existingFlightNums) return false

      // Check if prices are within 5% of each other
      const priceDiff = Math.abs(existing.totalPrice - duffelOffer.totalPrice)
      const avgPrice = (existing.totalPrice + duffelOffer.totalPrice) / 2
      return avgPrice > 0 && priceDiff / avgPrice < 0.05
    })

    if (!isDuplicate) {
      merged.push(duffelOffer)
    }
  }

  return merged
}

/**
 * Map a cabin class string from various API formats to our standard format.
 */
export function normalizeCabinClass(
  cabinClass: string
): "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST" {
  const normalized = cabinClass.toUpperCase().replace(/[\s-_]/g, "")
  if (normalized.includes("FIRST")) return "FIRST"
  if (normalized.includes("BUSINESS")) return "BUSINESS"
  if (normalized.includes("PREMIUM")) return "PREMIUM_ECONOMY"
  return "ECONOMY"
}

/**
 * Extract unique airlines from a list of flight offers.
 */
export function extractUniqueAirlines(offers: FlightOffer[]): string[] {
  const airlines = new Set<string>()
  for (const offer of offers) {
    for (const segment of offer.segments) {
      if (segment.airline) {
        airlines.add(segment.airline)
      }
    }
  }
  return Array.from(airlines).sort()
}

/**
 * Calculate total duration in minutes from segments.
 */
export function calculateTotalDurationMinutes(
  segments: FlightSegment[]
): number {
  if (segments.length === 0) return 0

  const firstDep = new Date(segments[0].departureTime).getTime()
  const lastArr = new Date(
    segments[segments.length - 1].arrivalTime
  ).getTime()

  return Math.round((lastArr - firstDep) / 60000)
}
