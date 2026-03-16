import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getFlightStatus, isFlightAwareConfigured } from "@/lib/alerts/flightaware"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!isFlightAwareConfigured()) {
      return NextResponse.json(
        { error: "FlightAware API is not configured. Set FLIGHTAWARE_API_KEY.", configured: false },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(req.url)
    const flightNumber = searchParams.get("flight")
    const date = searchParams.get("date")

    if (!flightNumber) {
      return NextResponse.json(
        { error: "Flight number is required" },
        { status: 400 }
      )
    }

    const status = await getFlightStatus(flightNumber, date ?? undefined)

    if (!status) {
      return NextResponse.json(
        { error: "Flight not found", flightNumber },
        { status: 404 }
      )
    }

    return NextResponse.json({ status, configured: true })
  } catch (error) {
    console.error("Failed to fetch flight status:", error)
    return NextResponse.json(
      { error: "Failed to fetch flight status" },
      { status: 500 }
    )
  }
}
