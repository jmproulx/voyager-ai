import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  getUpcomingEvents,
  isCalendarConfigured,
  isUserConnected,
} from "@/lib/calendar/google"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!isCalendarConfigured()) {
      return NextResponse.json(
        { error: "Google Calendar is not configured", configured: false },
        { status: 503 }
      )
    }

    const connected = await isUserConnected(session.user.id)
    if (!connected) {
      return NextResponse.json(
        { error: "Calendar not connected", connected: false },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get("days") ?? "30", 10)

    const events = await getUpcomingEvents(session.user.id, days)

    return NextResponse.json({ events, connected: true })
  } catch (error) {
    console.error("Failed to fetch calendar events:", error)
    return NextResponse.json(
      { error: "Failed to fetch calendar events" },
      { status: 500 }
    )
  }
}
