import type { FlightOffer, FlightSegment } from "@/types/travel"
import {
  formatDuration,
  normalizeCabinClass,
} from "./utils"

// ─── Types ──────────────────────────────────────────────────────────────────

interface KiwiSearchParams {
  flyFrom: string
  flyTo: string
  dateFrom: string
  dateTo: string
  returnFrom?: string
  returnTo?: string
  flightType: "round" | "oneway"
  adults: number
  children?: number
  infants?: number
  selectedCabins?: "M" | "W" | "C" | "F"
  curr?: string
  limit?: number
  sort?: "price" | "duration" | "quality" | "date"
  maxStopovers?: number
}

interface KiwiRouteSegment {
  id: string
  airline: string
  flight_no: number
  flyFrom: string
  flyTo: string
  cityFrom: string
  cityTo: string
  local_departure: string
  local_arrival: string
  return: 0 | 1
  equipment: string
  fare_classes: string
}

interface KiwiFlightData {
  id: string
  flyFrom: string
  flyTo: string
  cityFrom: string
  cityTo: string
  price: number
  airlines: string[]
  duration: { departure: number; return: number; total: number }
  fly_duration: string
  availability: { seats?: number }
  booking_token: string
  deep_link: string
  route: KiwiRouteSegment[]
  bags_price: Record<string, number>
  baglimit: {
    hold_weight: number
    hand_weight: number
    hold_dimensions_sum?: number
    hold_height?: number
    hold_length?: number
    hold_width?: number
    personal_item_weight?: number
  }
  quality: number
  distance: number
  has_airport_change: boolean
  virtual_interlining: boolean
  countryFrom: { code: string; name: string }
  countryTo: { code: string; name: string }
}

interface KiwiSearchResponse {
  currency: string
  data: KiwiFlightData[]
}

interface KiwiLocation {
  id: string
  code: string
  name: string
  type: string
  city?: { name: string }
  country?: { name: string }
}

interface KiwiLocationsResponse {
  locations: KiwiLocation[]
}

interface KiwiCheckFlightsResponse {
  flights_checked: boolean
  flights_invalid: boolean
  price_change: boolean
  total: number
  currency: string
  booking_token: string
}

interface KiwiSaveBookingResponse {
  booking_id: number
  transaction_id: string
  status: string
  total: number
}

interface KiwiConfirmPaymentResponse {
  status: number
  booking_id: number
  transaction_id: string
}

interface KiwiPassenger {
  name: string
  surname: string
  nationality: string
  birthday: string
  email: string
  phone: string
  title: "Mr" | "Ms" | "Mrs"
  cardno?: string
  expiration?: string
}

// ─── Client ─────────────────────────────────────────────────────────────────

const KIWI_BASE_URL = "https://tequila-api.kiwi.com"

function getKiwiApiKey(): string {
  const apiKey = process.env.KIWI_API_KEY
  if (!apiKey) {
    throw new Error(
      "Kiwi API key not configured. Set KIWI_API_KEY."
    )
  }
  return apiKey
}

/**
 * Check if Kiwi API is configured (API key is set).
 */
export function isKiwiConfigured(): boolean {
  return !!process.env.KIWI_API_KEY
}

async function kiwiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const apiKey = getKiwiApiKey()

  const response = await fetch(`${KIWI_BASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
  })

  if (response.status === 429) {
    throw new Error(
      "Kiwi rate limit exceeded. Please wait a moment and try again."
    )
  }

  if (!response.ok) {
    const errorBody = await response.text()
    let errorMessage = `Kiwi API error (${response.status})`
    try {
      const parsed = JSON.parse(errorBody)
      if (parsed.error) {
        errorMessage = typeof parsed.error === "string" ? parsed.error : JSON.stringify(parsed.error)
      }
    } catch {
      // use default message
    }
    throw new Error(errorMessage)
  }

  return response.json()
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Convert a date string from YYYY-MM-DD to dd/mm/yyyy format for Kiwi API.
 */
function toKiwiDateFormat(isoDate: string): string {
  const [year, month, day] = isoDate.split("-")
  return `${day}/${month}/${year}`
}

/**
 * Map our cabin class format to Kiwi's selected_cabins parameter.
 */
function mapCabinClassToKiwi(
  cabinClass: string
): "M" | "W" | "C" | "F" {
  const normalized = cabinClass.toUpperCase().replace(/[\s-_]/g, "")
  if (normalized.includes("FIRST")) return "F"
  if (normalized.includes("BUSINESS")) return "C"
  if (normalized.includes("PREMIUM")) return "W"
  return "M"
}

/**
 * Map Kiwi cabin code to our normalized cabin class.
 */
function mapKiwiCabinClass(
  kiwiCabin: string
): "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST" {
  switch (kiwiCabin) {
    case "F":
      return "FIRST"
    case "C":
      return "BUSINESS"
    case "W":
      return "PREMIUM_ECONOMY"
    case "M":
    default:
      return "ECONOMY"
  }
}

/**
 * Convert seconds to minutes.
 */
function secondsToMinutes(seconds: number): number {
  return Math.round(seconds / 60)
}

function mapKiwiFlightToOffer(
  flight: KiwiFlightData,
  currency: string,
  requestedCabin: string
): FlightOffer {
  // Separate outbound and return segments
  const outboundSegments = flight.route.filter((r) => r.return === 0)
  const returnSegments = flight.route.filter((r) => r.return === 1)
  const allRouteSegments = [...outboundSegments, ...returnSegments]

  const cabinClass = requestedCabin
    ? normalizeCabinClass(requestedCabin)
    : "ECONOMY"

  // Determine fare class from route segments
  const fareClass = flight.route[0]?.fare_classes || ""
  const resolvedCabin = fareClass
    ? mapKiwiCabinClass(fareClass)
    : cabinClass

  const segments: FlightSegment[] = allRouteSegments.map((segment) => {
    const depTime = new Date(segment.local_departure)
    const arrTime = new Date(segment.local_arrival)
    const durationMinutes = Math.round(
      (arrTime.getTime() - depTime.getTime()) / 60000
    )

    return {
      departureAirport: segment.flyFrom,
      arrivalAirport: segment.flyTo,
      departureTime: segment.local_departure,
      arrivalTime: segment.local_arrival,
      flightNumber: `${segment.airline}${segment.flight_no}`,
      airline: segment.airline,
      duration: formatDuration(Math.max(0, durationMinutes)),
      cabinClass: resolvedCabin,
      aircraft: segment.equipment || undefined,
    }
  })

  const totalDurationMinutes = secondsToMinutes(flight.duration.total)

  // Determine stops: for one-way, it's outbound segments - 1
  // For round-trip, count connection stops (exclude the turnaround)
  const outboundStops = Math.max(0, outboundSegments.length - 1)
  const returnStops = Math.max(0, returnSegments.length - 1)
  const totalStops = outboundStops + returnStops

  // Baglimit with hand_weight > 0 means at least a carry-on is included
  // Check if checked bag is free (bags_price for first bag is 0 or absent)
  const firstBagPrice = flight.bags_price?.["1"] ?? flight.bags_price?.[1]
  const checkedBagIncluded =
    firstBagPrice !== undefined && firstBagPrice === 0

  return {
    id: `kiwi-${flight.id}`,
    provider: "KIWI" as const,
    providerOfferId: flight.id,
    segments,
    totalPrice: flight.price,
    currency,
    stops: totalStops,
    totalDuration: formatDuration(totalDurationMinutes),
    cabinClass: resolvedCabin,
    baggageIncluded: checkedBagIncluded,
    deepLink: flight.deep_link,
    bookingToken: flight.booking_token,
  }
}

// ─── Flight Search ──────────────────────────────────────────────────────────

export async function searchFlights(params: {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  adults: number
  cabinClass?: string
  maxResults?: number
  maxStopovers?: number
}): Promise<FlightOffer[]> {
  const kiwiDateFrom = toKiwiDateFormat(params.departureDate)
  const isRoundTrip = !!params.returnDate
  const kiwiCabin = params.cabinClass
    ? mapCabinClassToKiwi(params.cabinClass)
    : "M"

  const queryParams = new URLSearchParams({
    fly_from: params.origin,
    fly_to: params.destination,
    date_from: kiwiDateFrom,
    date_to: kiwiDateFrom,
    flight_type: isRoundTrip ? "round" : "oneway",
    adults: String(params.adults),
    selected_cabins: kiwiCabin,
    curr: "USD",
    limit: String(params.maxResults || 30),
    sort: "price",
  })

  if (isRoundTrip && params.returnDate) {
    const kiwiReturnDate = toKiwiDateFormat(params.returnDate)
    queryParams.set("return_from", kiwiReturnDate)
    queryParams.set("return_to", kiwiReturnDate)
  }

  if (params.maxStopovers !== undefined) {
    queryParams.set("max_stopovers", String(params.maxStopovers))
  }

  const response = await kiwiRequest<KiwiSearchResponse>(
    `/v2/search?${queryParams.toString()}`
  )

  return response.data.map((flight) =>
    mapKiwiFlightToOffer(flight, response.currency, params.cabinClass || "ECONOMY")
  )
}

// ─── Location Autocomplete ──────────────────────────────────────────────────

export interface KiwiLocationResult {
  id: string
  code: string
  name: string
  type: string
  cityName?: string
  countryName?: string
}

export async function searchLocations(
  term: string,
  options?: { locationTypes?: string; limit?: number }
): Promise<KiwiLocationResult[]> {
  const queryParams = new URLSearchParams({
    term,
    location_types: options?.locationTypes || "airport",
    limit: String(options?.limit || 10),
  })

  const response = await kiwiRequest<KiwiLocationsResponse>(
    `/locations/query?${queryParams.toString()}`
  )

  return response.locations.map((loc) => ({
    id: loc.id,
    code: loc.code,
    name: loc.name,
    type: loc.type,
    cityName: loc.city?.name,
    countryName: loc.country?.name,
  }))
}

// ─── Booking: Check Flights ─────────────────────────────────────────────────

export async function checkFlights(params: {
  bookingToken: string
  adults: number
  children?: number
  infants?: number
  currency?: string
}): Promise<KiwiCheckFlightsResponse> {
  const queryParams = new URLSearchParams({
    booking_token: params.bookingToken,
    bnum: "0",
    adults: String(params.adults),
    children: String(params.children || 0),
    infants: String(params.infants || 0),
    currency: params.currency || "USD",
  })

  // Poll until flights are checked (max 10 attempts, 3s interval)
  const maxAttempts = 10
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await kiwiRequest<KiwiCheckFlightsResponse>(
      `/v2/booking/check_flights?${queryParams.toString()}`
    )

    if (response.flights_checked) {
      return response
    }

    // Wait 3 seconds before polling again
    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, 3000))
    }
  }

  throw new Error(
    "Kiwi flight check timed out. Please try again."
  )
}

// ─── Booking: Save Booking ──────────────────────────────────────────────────

export async function saveBooking(params: {
  bookingToken: string
  sessionId: string
  passengers: KiwiPassenger[]
}): Promise<KiwiSaveBookingResponse> {
  const response = await kiwiRequest<KiwiSaveBookingResponse>(
    "/v2/booking/save_booking",
    {
      method: "POST",
      body: JSON.stringify({
        booking_token: params.bookingToken,
        session_id: params.sessionId,
        passengers: params.passengers,
        lang: "en",
        locale: "en",
      }),
    }
  )

  return response
}

// ─── Booking: Confirm Payment ───────────────────────────────────────────────

export async function confirmPayment(params: {
  bookingId: number
  transactionId: string
}): Promise<KiwiConfirmPaymentResponse> {
  const response = await kiwiRequest<KiwiConfirmPaymentResponse>(
    "/v2/booking/confirm_payment",
    {
      method: "POST",
      body: JSON.stringify({
        booking_id: params.bookingId,
        transaction_id: params.transactionId,
      }),
    }
  )

  return response
}
