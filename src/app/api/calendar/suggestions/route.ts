import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  getUpcomingEvents,
  detectTravelNeeds,
  isCalendarConfigured,
  isUserConnected,
} from "@/lib/calendar/google"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!isCalendarConfigured()) {
      return NextResponse.json(
        { suggestions: [], configured: false, connected: false },
        { status: 200 }
      )
    }

    const connected = await isUserConnected(session.user.id)
    if (!connected) {
      return NextResponse.json(
        { suggestions: [], configured: true, connected: false },
        { status: 200 }
      )
    }

    const events = await getUpcomingEvents(session.user.id, 30)
    const suggestions = detectTravelNeeds(events)

    return NextResponse.json({
      suggestions,
      configured: true,
      connected: true,
    })
  } catch (error) {
    console.error("Failed to get calendar suggestions:", error)
    return NextResponse.json(
      { error: "Failed to get suggestions" },
      { status: 500 }
    )
  }
}
