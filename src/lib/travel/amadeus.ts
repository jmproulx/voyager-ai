import type {
  FlightOffer,
  FlightSegment,
  HotelOffer,
} from "@/types/travel"
import {
  formatDuration,
  parseDurationToMinutes,
  normalizeCabinClass,
} from "./utils"

// ─── Types ──────────────────────────────────────────────────────────────────

interface AmadeusTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface AmadeusFlightSearchParams {
  originLocationCode: string
  destinationLocationCode: string
  departureDate: string
  returnDate?: string
  adults: number
  travelClass?: string
  max?: number
}

interface AmadeusHotelSearchParams {
  cityCode: string
  radius?: number
  radiusUnit?: "KM" | "MILE"
  hotelSource?: string
}

interface AmadeusHotelOffersParams {
  hotelIds: string[]
  checkInDate: string
  checkOutDate: string
  adults: number
  roomQuantity?: number
}

// Amadeus response types (partial — we only type what we use)
interface AmadeusFlightOfferResponse {
  data: AmadeusFlightOfferData[]
  dictionaries?: {
    carriers?: Record<string, string>
    aircraft?: Record<string, string>
  }
}

interface AmadeusFlightOfferData {
  id: string
  itineraries: Array<{
    duration: string
    segments: Array<{
      departure: { iataCode: string; at: string }
      arrival: { iataCode: string; at: string }
      carrierCode: string
      number: string
      duration: string
      aircraft?: { code: string }
      operating?: { carrierCode: string }
    }>
  }>
  price: {
    grandTotal: string
    currency: string
  }
  travelerPricings: Array<{
    fareDetailsBySegment: Array<{
      cabin: string
      includedCheckedBags?: {
        weight?: number
        quantity?: number
      }
    }>
  }>
}

interface AmadeusHotelData {
  hotelId: string
  name: string
  chainCode?: string
  geoCode?: { latitude: number; longitude: number }
  address?: {
    countryCode?: string
    cityName?: string
    lines?: string[]
  }
  rating?: string
}

interface AmadeusHotelOfferData {
  hotel: {
    hotelId: string
    name: string
    chainCode?: string
    rating?: string
    address?: {
      lines?: string[]
      cityName?: string
      countryCode?: string
    }
    amenities?: string[]
    media?: Array<{ uri: string }>
    latitude?: number
    longitude?: number
  }
  offers: Array<{
    id: string
    room: {
      type: string
      typeEstimated?: {
        category?: string
        beds?: number
        bedType?: string
      }
      description?: { text?: string }
    }
    price: {
      total: string
      currency: string
      base?: string
    }
    policies?: {
      cancellations?: Array<{
        description?: { text?: string }
      }>
    }
    checkInDate: string
    checkOutDate: string
  }>
}

interface AmadeusPriceConfirmation {
  data: {
    flightOffers: Array<{
      id: string
      price: {
        grandTotal: string
        currency: string
      }
    }>
  }
}

// ─── Token cache ────────────────────────────────────────────────────────────

let cachedToken: string | null = null
let tokenExpiresAt: number = 0

// ─── Client ─────────────────────────────────────────────────────────────────

const BASE_URL =
  process.env.AMADEUS_BASE_URL || "https://test.api.amadeus.com"

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedToken
  }

  const apiKey = process.env.AMADEUS_API_KEY
  const apiSecret = process.env.AMADEUS_API_SECRET

  if (!apiKey || !apiSecret) {
    throw new Error(
      "Amadeus API credentials not configured. Set AMADEUS_API_KEY and AMADEUS_API_SECRET."
    )
  }

  const response = await fetch(`${BASE_URL}/v1/security/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: apiKey,
      client_secret: apiSecret,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Amadeus authentication failed (${response.status}): ${errorText}`
    )
  }

  const data: AmadeusTokenResponse = await response.json()
  cachedToken = data.access_token
  tokenExpiresAt = Date.now() + data.expires_in * 1000

  return data.access_token
}

async function amadeusRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken()

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  if (response.status === 429) {
    throw new Error(
      "Amadeus rate limit exceeded. Please wait a moment and try again."
    )
  }

  if (!response.ok) {
    const errorBody = await response.text()
    let errorMessage = `Amadeus API error (${response.status})`
    try {
      const parsed = JSON.parse(errorBody)
      if (parsed.errors?.[0]?.detail) {
        errorMessage = parsed.errors[0].detail
      }
    } catch {
      // use default message
    }
    throw new Error(errorMessage)
  }

  return response.json()
}

// ─── Flight Search ──────────────────────────────────────────────────────────

export async function searchFlights(
  params: AmadeusFlightSearchParams
): Promise<FlightOffer[]> {
  const queryParams = new URLSearchParams({
    originLocationCode: params.originLocationCode,
    destinationLocationCode: params.destinationLocationCode,
    departureDate: params.departureDate,
    adults: String(params.adults),
    max: String(params.max || 20),
    currencyCode: "USD",
  })

  if (params.returnDate) {
    queryParams.set("returnDate", params.returnDate)
  }

  if (params.travelClass) {
    queryParams.set("travelClass", params.travelClass)
  }

  const response = await amadeusRequest<AmadeusFlightOfferResponse>(
    `/v2/shopping/flight-offers?${queryParams.toString()}`
  )

  const carriers = response.dictionaries?.carriers || {}

  return response.data.map((offer) => {
    const allSegments: FlightSegment[] = []
    let totalDurationMinutes = 0

    for (const itinerary of offer.itineraries) {
      totalDurationMinutes += parseDurationToMinutes(itinerary.duration)

      for (const segment of itinerary.segments) {
        const carrierCode =
          segment.operating?.carrierCode || segment.carrierCode
        const airlineName =
          carriers[carrierCode] || carriers[segment.carrierCode] || carrierCode

        allSegments.push({
          departureAirport: segment.departure.iataCode,
          arrivalAirport: segment.arrival.iataCode,
          departureTime: segment.departure.at,
          arrivalTime: segment.arrival.at,
          flightNumber: `${segment.carrierCode}${segment.number}`,
          airline: airlineName,
          duration: formatDuration(parseDurationToMinutes(segment.duration)),
          cabinClass: normalizeCabinClass(
            offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin ||
              "ECONOMY"
          ),
          aircraft: segment.aircraft?.code,
        })
      }
    }

    const cabin =
      offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || "ECONOMY"
    const baggage =
      offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]
        ?.includedCheckedBags

    return {
      id: `amadeus-${offer.id}`,
      provider: "AMADEUS" as const,
      providerOfferId: offer.id,
      segments: allSegments,
      totalPrice: parseFloat(offer.price.grandTotal),
      currency: offer.price.currency,
      stops: Math.max(0, allSegments.length - 1),
      totalDuration: formatDuration(totalDurationMinutes),
      cabinClass: normalizeCabinClass(cabin),
      baggageIncluded: !!(baggage?.weight || baggage?.quantity),
    }
  })
}

// ─── Flight Price Confirmation ──────────────────────────────────────────────

export async function confirmFlightPrice(offerId: string): Promise<{
  available: boolean
  price: number
  currency: string
}> {
  try {
    const response = await amadeusRequest<AmadeusPriceConfirmation>(
      "/v1/shopping/flight-offers/pricing",
      {
        method: "POST",
        body: JSON.stringify({
          data: {
            type: "flight-offers-pricing",
            flightOffers: [{ type: "flight-offer", id: offerId }],
          },
        }),
      }
    )

    const confirmedOffer = response.data.flightOffers[0]

    return {
      available: true,
      price: parseFloat(confirmedOffer.price.grandTotal),
      currency: confirmedOffer.price.currency,
    }
  } catch (error) {
    // If pricing fails, the offer may no longer be available
    return {
      available: false,
      price: 0,
      currency: "USD",
    }
  }
}

// ─── Hotel Search ───────────────────────────────────────────────────────────

export async function searchHotelsByCity(
  params: AmadeusHotelSearchParams
): Promise<string[]> {
  const queryParams = new URLSearchParams({
    cityCode: params.cityCode,
    radius: String(params.radius || 5),
    radiusUnit: params.radiusUnit || "KM",
    hotelSource: params.hotelSource || "ALL",
  })

  const response = await amadeusRequest<{ data: AmadeusHotelData[] }>(
    `/v1/reference-data/locations/hotels/by-city?${queryParams.toString()}`
  )

  return response.data.map((hotel) => hotel.hotelId)
}

export async function getHotelOffers(
  params: AmadeusHotelOffersParams
): Promise<HotelOffer[]> {
  // Amadeus limits to 20 hotel IDs per request
  const hotelIdsBatch = params.hotelIds.slice(0, 20)

  const queryParams = new URLSearchParams({
    hotelIds: hotelIdsBatch.join(","),
    checkInDate: params.checkInDate,
    checkOutDate: params.checkOutDate,
    adults: String(params.adults),
    roomQuantity: String(params.roomQuantity || 1),
    currency: "USD",
  })

  const response = await amadeusRequest<{ data: AmadeusHotelOfferData[] }>(
    `/v3/shopping/hotel-offers?${queryParams.toString()}`
  )

  const offers: HotelOffer[] = []

  for (const hotelData of response.data) {
    for (const offer of hotelData.offers) {
      const totalPrice = parseFloat(offer.price.total)
      const checkIn = new Date(offer.checkInDate)
      const checkOut = new Date(offer.checkOutDate)
      const nights = Math.max(
        1,
        Math.ceil(
          (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
        )
      )

      const addressParts: string[] = []
      if (hotelData.hotel.address?.lines) {
        addressParts.push(...hotelData.hotel.address.lines)
      }
      if (hotelData.hotel.address?.cityName) {
        addressParts.push(hotelData.hotel.address.cityName)
      }
      if (hotelData.hotel.address?.countryCode) {
        addressParts.push(hotelData.hotel.address.countryCode)
      }

      const roomType =
        offer.room.typeEstimated?.category ||
        offer.room.type ||
        "Standard Room"

      const cancellation =
        offer.policies?.cancellations?.[0]?.description?.text

      offers.push({
        id: `amadeus-hotel-${hotelData.hotel.hotelId}-${offer.id}`,
        provider: "AMADEUS" as const,
        providerOfferId: offer.id,
        hotelName: hotelData.hotel.name,
        hotelChain: hotelData.hotel.chainCode,
        address: addressParts.join(", ") || "Address not available",
        latitude: hotelData.hotel.latitude,
        longitude: hotelData.hotel.longitude,
        starRating: hotelData.hotel.rating
          ? parseInt(hotelData.hotel.rating)
          : undefined,
        photos: hotelData.hotel.media?.map((m) => m.uri) || [],
        amenities: hotelData.hotel.amenities || [],
        roomType,
        pricePerNight: Math.round((totalPrice / nights) * 100) / 100,
        totalPrice,
        currency: offer.price.currency,
        checkIn: offer.checkInDate,
        checkOut: offer.checkOutDate,
        cancellationPolicy: cancellation,
      })
    }
  }

  return offers
}
