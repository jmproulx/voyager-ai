import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { checkForDisruptions, isFlightAwareConfigured } from "@/lib/alerts/flightaware"
import { createFlightAlert } from "@/lib/alerts/notifications"
import type { Prisma } from "@prisma/client"

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!isFlightAwareConfigured()) {
      return NextResponse.json(
        { error: "FlightAware API is not configured", configured: false, disruptions: [] },
        { status: 200 }
      )
    }

    // Get all active flight bookings for the user
    const bookings = await prisma.booking.findMany({
      where: {
        type: "FLIGHT",
        status: { in: ["PENDING", "CONFIRMED"] },
        trip: {
          userId: session.user.id,
          status: { in: ["BOOKED", "ACTIVE"] },
        },
      },
      select: {
        id: true,
        type: true,
        details: true,
      },
    })

    if (bookings.length === 0) {
      return NextResponse.json({
        disruptions: [],
        checked: 0,
        configured: true,
      })
    }

    const normalizedBookings = bookings.map((b) => ({
      id: b.id,
      type: b.type,
      details: b.details as Record<string, string> | null,
    }))

    const disruptions = await checkForDisruptions(normalizedBookings)

    // Create alerts for each disruption
    const alertsCreated = []
    for (const disruption of disruptions) {
      const alert = await createFlightAlert({
        bookingId: disruption.bookingId,
        type: disruption.type,
        details: disruption.details as Prisma.InputJsonValue,
      })
      alertsCreated.push(alert)
    }

    return NextResponse.json({
      disruptions,
      alertsCreated: alertsCreated.length,
      checked: bookings.length,
      configured: true,
    })
  } catch (error) {
    console.error("Failed to check for disruptions:", error)
    return NextResponse.json(
      { error: "Failed to check for disruptions" },
      { status: 500 }
    )
  }
}
