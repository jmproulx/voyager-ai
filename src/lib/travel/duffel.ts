import type { FlightOffer, FlightSegment } from "@/types/travel"
import {
  formatDuration,
  normalizeCabinClass,
  calculateTotalDurationMinutes,
} from "./utils"

// ─── Types ──────────────────────────────────────────────────────────────────

interface DuffelOfferRequestParams {
  slices: Array<{
    origin: string
    destination: string
    departure_date: string
  }>
  passengers: Array<{ type: "adult" | "child" | "infant_without_seat" }>
  cabin_class?: "economy" | "premium_economy" | "business" | "first"
}

interface DuffelPassenger {
  id: string
  type: string
  given_name: string
  family_name: string
  gender: string
  born_on: string
  email: string
  phone_number: string
  title: string
}

interface DuffelCreateOrderParams {
  selected_offers: string[]
  passengers: DuffelPassenger[]
  type: "instant" | "hold"
  payments?: Array<{
    type: "balance"
    amount: string
    currency: string
  }>
}

// Duffel API response types (partial)
interface DuffelSlice {
  id: string
  origin: { iata_code: string; name: string }
  destination: { iata_code: string; name: string }
  duration: string | null
  segments: DuffelSegment[]
}

interface DuffelSegment {
  id: string
  origin: { iata_code: string; name: string }
  destination: { iata_code: string; name: string }
  departing_at: string
  arriving_at: string
  operating_carrier: { iata_code: string; name: string }
  marketing_carrier: { iata_code: string; name: string }
  marketing_carrier_flight_number: string
  duration: string | null
  aircraft?: { iata_code: string; name: string }
  passengers: Array<{
    cabin_class: string
    baggages: Array<{
      type: string
      quantity: number
    }>
  }>
}

interface DuffelOffer {
  id: string
  total_amount: string
  total_currency: string
  slices: DuffelSlice[]
  passengers: Array<{
    id: string
    type: string
  }>
  payment_requirements: {
    requires_instant_payment: boolean
    price_guarantee_expires_at: string | null
  }
}

interface DuffelOfferRequestResponse {
  data: {
    id: string
    offers: DuffelOffer[]
  }
}

interface DuffelOffersListResponse {
  data: DuffelOffer[]
  meta: {
    after?: string
    before?: string
    limit: number
  }
}

interface DuffelOrderResponse {
  data: {
    id: string
    booking_reference: string
    total_amount: string
    total_currency: string
    created_at: string
  }
}

// ─── Client ─────────────────────────────────────────────────────────────────

const DUFFEL_BASE_URL = "https://api.duffel.com"
const DUFFEL_VERSION = "v2"

function getDuffelToken(): string {
  const token = process.env.DUFFEL_ACCESS_TOKEN
  if (!token) {
    throw new Error(
      "Duffel access token not configured. Set DUFFEL_ACCESS_TOKEN."
    )
  }
  return token
}

async function duffelRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getDuffelToken()

  const response = await fetch(`${DUFFEL_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Duffel-Version": DUFFEL_VERSION,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
  })

  if (response.status === 429) {
    throw new Error(
      "Duffel rate limit exceeded. Please wait a moment and try again."
    )
  }

  if (!response.ok) {
    const errorBody = await response.text()
    let errorMessage = `Duffel API error (${response.status})`
    try {
      const parsed = JSON.parse(errorBody)
      if (parsed.errors?.[0]?.message) {
        errorMessage = parsed.errors[0].message
      }
    } catch {
      // use default message
    }
    throw new Error(errorMessage)
  }

  return response.json()
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseDuffelDuration(duration: string | null): number {
  if (!duration) return 0
  // Duffel uses ISO 8601 duration format: PT2H35M
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!match) return 0
  const hours = parseInt(match[1] || "0", 10)
  const minutes = parseInt(match[2] || "0", 10)
  return hours * 60 + minutes
}

function mapDuffelOfferToFlightOffer(offer: DuffelOffer): FlightOffer {
  const allSegments: FlightSegment[] = []

  for (const slice of offer.slices) {
    for (const segment of slice.segments) {
      const cabinClass =
        segment.passengers?.[0]?.cabin_class || "economy"
      const hasBaggage =
        segment.passengers?.[0]?.baggages?.some(
          (b) => b.type === "checked" && b.quantity > 0
        ) || false

      allSegments.push({
        departureAirport: segment.origin.iata_code,
        arrivalAirport: segment.destination.iata_code,
        departureTime: segment.departing_at,
        arrivalTime: segment.arriving_at,
        flightNumber: `${segment.marketing_carrier.iata_code}${segment.marketing_carrier_flight_number}`,
        airline: segment.operating_carrier.name || segment.marketing_carrier.name,
        duration: formatDuration(parseDuffelDuration(segment.duration)),
        cabinClass: normalizeCabinClass(cabinClass),
        aircraft: segment.aircraft?.name,
      })
    }
  }

  const totalDurationMinutes = calculateTotalDurationMinutes(allSegments)
  const cabin =
    offer.slices[0]?.segments[0]?.passengers?.[0]?.cabin_class || "economy"
  const hasBaggage =
    offer.slices[0]?.segments[0]?.passengers?.[0]?.baggages?.some(
      (b) => b.type === "checked" && b.quantity > 0
    ) || false

  return {
    id: `duffel-${offer.id}`,
    provider: "DUFFEL" as const,
    providerOfferId: offer.id,
    segments: allSegments,
    totalPrice: parseFloat(offer.total_amount),
    currency: offer.total_currency,
    stops: Math.max(0, allSegments.length - 1),
    totalDuration: formatDuration(totalDurationMinutes),
    cabinClass: normalizeCabinClass(cabin),
    baggageIncluded: hasBaggage,
  }
}

// ─── Offer Requests ─────────────────────────────────────────────────────────

export async function createOfferRequest(
  params: DuffelOfferRequestParams
): Promise<FlightOffer[]> {
  const response = await duffelRequest<DuffelOfferRequestResponse>(
    "/air/offer_requests",
    {
      method: "POST",
      body: JSON.stringify({
        data: {
          slices: params.slices,
          passengers: params.passengers,
          cabin_class: params.cabin_class,
        },
      }),
    }
  )

  return response.data.offers.map(mapDuffelOfferToFlightOffer)
}

// ─── Get Offers (paginated) ─────────────────────────────────────────────────

export async function getOffers(
  offerRequestId: string,
  options?: { limit?: number; after?: string }
): Promise<{ offers: FlightOffer[]; nextCursor?: string }> {
  const queryParams = new URLSearchParams({
    offer_request_id: offerRequestId,
    limit: String(options?.limit || 50),
  })

  if (options?.after) {
    queryParams.set("after", options.after)
  }

  const response = await duffelRequest<DuffelOffersListResponse>(
    `/air/offers?${queryParams.toString()}`
  )

  return {
    offers: response.data.map(mapDuffelOfferToFlightOffer),
    nextCursor: response.meta.after,
  }
}

// ─── Create Order (Booking) ─────────────────────────────────────────────────

export async function createOrder(
  params: DuffelCreateOrderParams
): Promise<{
  orderId: string
  bookingReference: string
  totalAmount: string
  currency: string
}> {
  const response = await duffelRequest<DuffelOrderResponse>("/air/orders", {
    method: "POST",
    body: JSON.stringify({ data: params }),
  })

  return {
    orderId: response.data.id,
    bookingReference: response.data.booking_reference,
    totalAmount: response.data.total_amount,
    currency: response.data.total_currency,
  }
}
