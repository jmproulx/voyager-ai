import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createOrder as createDuffelOrder } from "@/lib/travel/duffel"
import {
  checkFlights as checkKiwiFlights,
  saveBooking as saveKiwiBooking,
  confirmPayment as confirmKiwiPayment,
} from "@/lib/travel/kiwi"

interface BookingRequestBody {
  offerId: string
  provider: "AMADEUS" | "DUFFEL" | "KIWI"
  tripId: string
  type: "FLIGHT" | "HOTEL"
  price: number
  currency: string
  details: Record<string, unknown>
  bookingToken?: string
  deepLink?: string
  passengerDetails?: Array<{
    id: string
    type: string
    givenName: string
    familyName: string
    gender: string
    bornOn: string
    email: string
    phoneNumber: string
    title: string
    nationality?: string
  }>
}

export async function POST(request: NextRequest) {
  let body: BookingRequestBody

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    )
  }

  const {
    offerId,
    provider,
    tripId,
    type,
    price,
    currency,
    details,
    bookingToken,
    deepLink,
    passengerDetails,
  } = body

  // Validate required fields
  if (!offerId || !provider || !tripId || !type || !price) {
    return NextResponse.json(
      { error: "Missing required fields: offerId, provider, tripId, type, price" },
      { status: 400 }
    )
  }

  // Verify trip exists
  const trip = await prisma.trip.findUnique({ where: { id: tripId } })
  if (!trip) {
    return NextResponse.json(
      { error: "Trip not found" },
      { status: 404 }
    )
  }

  try {
    let providerBookingId: string | null = null
    let kiwiDeepLink: string | undefined = deepLink || undefined

    // Book through the appropriate provider
    if (provider === "KIWI" && type === "FLIGHT" && bookingToken && passengerDetails) {
      // Step 1: Check flight availability
      const checkResult = await checkKiwiFlights({
        bookingToken,
        adults: passengerDetails.filter((p) => p.type === "adult").length || 1,
        children: passengerDetails.filter((p) => p.type === "child").length,
        infants: passengerDetails.filter((p) => p.type === "infant").length,
        currency: currency || "USD",
      })

      if (checkResult.flights_invalid) {
        return NextResponse.json(
          { error: "Kiwi flights are no longer available. Please search again." },
          { status: 410 }
        )
      }

      // Step 2: Save booking
      const kiwiPassengers = passengerDetails.map((p) => ({
        name: p.givenName,
        surname: p.familyName,
        nationality: p.nationality || "US",
        birthday: p.bornOn,
        email: p.email,
        phone: p.phoneNumber,
        title: (p.title === "Mr" || p.title === "Ms" || p.title === "Mrs"
          ? p.title
          : "Mr") as "Mr" | "Ms" | "Mrs",
      }))

      const sessionId = checkResult.booking_token
      const saveResult = await saveKiwiBooking({
        bookingToken: checkResult.booking_token,
        sessionId,
        passengers: kiwiPassengers,
      })

      // Step 3: Confirm payment
      const confirmation = await confirmKiwiPayment({
        bookingId: saveResult.booking_id,
        transactionId: saveResult.transaction_id,
      })

      providerBookingId = String(confirmation.booking_id)
    } else if (provider === "KIWI" && type === "FLIGHT") {
      // If no passenger details, store the booking token as reference
      providerBookingId = offerId.replace("kiwi-", "")
    } else if (provider === "DUFFEL" && type === "FLIGHT" && passengerDetails) {
      const duffelPassengers = passengerDetails.map((p) => ({
        id: p.id,
        type: p.type,
        given_name: p.givenName,
        family_name: p.familyName,
        gender: p.gender,
        born_on: p.bornOn,
        email: p.email,
        phone_number: p.phoneNumber,
        title: p.title,
      }))

      const order = await createDuffelOrder({
        selected_offers: [offerId.replace("duffel-", "")],
        passengers: duffelPassengers,
        type: "instant",
      })

      providerBookingId = order.bookingReference
    } else if (provider === "AMADEUS") {
      // Amadeus booking requires more complex flow (create order endpoint)
      // For now, store the offer ID as the reference
      providerBookingId = offerId.replace("amadeus-", "")
    }

    // Build booking details, including Kiwi deep link if available
    const bookingDetails = {
      ...(details as Record<string, unknown>),
      ...(kiwiDeepLink ? { kiwiDeepLink } : {}),
    }

    // Map provider string to Prisma BookingProvider enum
    const providerEnum = provider === "AMADEUS"
      ? "AMADEUS"
      : provider === "KIWI"
        ? "KIWI"
        : "DUFFEL"

    // Create booking record in database
    const booking = await prisma.booking.create({
      data: {
        type: type === "FLIGHT" ? "FLIGHT" : "HOTEL",
        tripId,
        status: "CONFIRMED",
        provider: providerEnum,
        providerBookingId,
        details: bookingDetails as unknown as import("@prisma/client").Prisma.InputJsonValue,
        price,
        currency,
        policyCompliant: true,
      },
    })

    // Update trip status to BOOKED if it was PLANNING
    if (trip.status === "PLANNING") {
      await prisma.trip.update({
        where: { id: tripId },
        data: { status: "BOOKED" },
      })
    }

    return NextResponse.json({
      booking: {
        id: booking.id,
        type: booking.type,
        status: booking.status,
        provider: booking.provider,
        providerBookingId: booking.providerBookingId,
        price: booking.price,
        currency: booking.currency,
      },
      message: "Booking confirmed successfully",
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create booking"

    console.error("Booking error:", error)

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
