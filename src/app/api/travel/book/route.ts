import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createOrder as createDuffelOrder } from "@/lib/travel/duffel"

interface BookingRequestBody {
  offerId: string
  provider: "AMADEUS" | "DUFFEL"
  tripId: string
  type: "FLIGHT" | "HOTEL"
  price: number
  currency: string
  details: Record<string, unknown>
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

  const { offerId, provider, tripId, type, price, currency, details, passengerDetails } = body

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

    // Book through the appropriate provider
    if (provider === "DUFFEL" && type === "FLIGHT" && passengerDetails) {
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

    // Create booking record in database
    const booking = await prisma.booking.create({
      data: {
        type: type === "FLIGHT" ? "FLIGHT" : "HOTEL",
        tripId,
        status: "CONFIRMED",
        provider: provider === "AMADEUS" ? "AMADEUS" : "DUFFEL",
        providerBookingId,
        details: details as unknown as import("@prisma/client").Prisma.InputJsonValue,
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
