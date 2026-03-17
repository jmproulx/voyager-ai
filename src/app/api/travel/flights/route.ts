import { NextRequest, NextResponse } from "next/server"
import { searchFlights as searchAmadeusFlights } from "@/lib/travel/amadeus"
import { createOfferRequest as searchDuffelFlights } from "@/lib/travel/duffel"
import {
  searchFlights as searchKiwiFlights,
  isKiwiConfigured,
} from "@/lib/travel/kiwi"
import { mergeAndDeduplicateOffers } from "@/lib/travel/utils"
import type { FlightOffer } from "@/types/travel"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  const origin = searchParams.get("origin")
  const destination = searchParams.get("destination")
  const departureDate = searchParams.get("departureDate")
  const returnDate = searchParams.get("returnDate")
  const passengers = parseInt(searchParams.get("passengers") || "1", 10)
  const cabinClass = searchParams.get("cabinClass") || "ECONOMY"

  // Validate required parameters
  if (!origin || !destination || !departureDate) {
    return NextResponse.json(
      { error: "Missing required parameters: origin, destination, departureDate" },
      { status: 400 }
    )
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(departureDate)) {
    return NextResponse.json(
      { error: "Invalid departureDate format. Use YYYY-MM-DD." },
      { status: 400 }
    )
  }

  if (returnDate && !dateRegex.test(returnDate)) {
    return NextResponse.json(
      { error: "Invalid returnDate format. Use YYYY-MM-DD." },
      { status: 400 }
    )
  }

  // Map cabin class to Amadeus format
  const amadeusClassMap: Record<string, string> = {
    ECONOMY: "ECONOMY",
    PREMIUM_ECONOMY: "PREMIUM_ECONOMY",
    BUSINESS: "BUSINESS",
    FIRST: "FIRST",
  }

  // Map cabin class to Duffel format
  const duffelClassMap: Record<string, "economy" | "premium_economy" | "business" | "first"> = {
    ECONOMY: "economy",
    PREMIUM_ECONOMY: "premium_economy",
    BUSINESS: "business",
    FIRST: "first",
  }

  // Build search promises — include Kiwi only if configured
  const searchPromises: Array<Promise<FlightOffer[]>> = [
    // Amadeus search
    searchAmadeusFlights({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate,
      returnDate: returnDate || undefined,
      adults: passengers,
      travelClass: amadeusClassMap[cabinClass] || "ECONOMY",
      max: 30,
    }),

    // Duffel search
    searchDuffelFlights({
      slices: [
        {
          origin,
          destination,
          departure_date: departureDate,
        },
        ...(returnDate
          ? [
              {
                origin: destination,
                destination: origin,
                departure_date: returnDate,
              },
            ]
          : []),
      ],
      passengers: Array.from({ length: passengers }, () => ({
        type: "adult" as const,
      })),
      cabin_class: duffelClassMap[cabinClass] || "economy",
    }),
  ]

  // Add Kiwi search if API key is configured
  const kiwiEnabled = isKiwiConfigured()
  if (kiwiEnabled) {
    searchPromises.push(
      searchKiwiFlights({
        origin,
        destination,
        departureDate,
        returnDate: returnDate || undefined,
        adults: passengers,
        cabinClass: cabinClass || "ECONOMY",
        maxResults: 30,
      })
    )
  }

  // Search all providers in parallel
  const results = await Promise.allSettled(searchPromises)

  const amadeusOffers: FlightOffer[] =
    results[0].status === "fulfilled" ? results[0].value : []
  const duffelOffers: FlightOffer[] =
    results[1].status === "fulfilled" ? results[1].value : []
  const kiwiOffers: FlightOffer[] =
    kiwiEnabled && results[2]?.status === "fulfilled" ? results[2].value : []

  // Collect errors for debugging (but still return any successful results)
  const errors: string[] = []
  if (results[0].status === "rejected") {
    errors.push(`Amadeus: ${results[0].reason instanceof Error ? results[0].reason.message : "Unknown error"}`)
  }
  if (results[1].status === "rejected") {
    errors.push(`Duffel: ${results[1].reason instanceof Error ? results[1].reason.message : "Unknown error"}`)
  }
  if (kiwiEnabled && results[2]?.status === "rejected") {
    errors.push(`Kiwi: ${results[2].reason instanceof Error ? results[2].reason.message : "Unknown error"}`)
  }

  // Merge and deduplicate
  const mergedOffers = mergeAndDeduplicateOffers(
    amadeusOffers,
    duffelOffers,
    kiwiOffers
  )

  // Sort by price (default)
  mergedOffers.sort((a, b) => a.totalPrice - b.totalPrice)

  return NextResponse.json({
    offers: mergedOffers,
    meta: {
      amadeusCount: amadeusOffers.length,
      duffelCount: duffelOffers.length,
      kiwiCount: kiwiOffers.length,
      totalCount: mergedOffers.length,
      errors: errors.length > 0 ? errors : undefined,
    },
  })
}
