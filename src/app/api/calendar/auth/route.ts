import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getAuthUrl, isCalendarConfigured } from "@/lib/calendar/google"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!isCalendarConfigured()) {
      return NextResponse.json(
        { error: "Google Calendar is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." },
        { status: 503 }
      )
    }

    const url = getAuthUrl(session.user.id)
    if (!url) {
      return NextResponse.json(
        { error: "Failed to generate auth URL" },
        { status: 500 }
      )
    }

    return NextResponse.redirect(url)
  } catch (error) {
    console.error("Calendar auth error:", error)
    return NextResponse.json({ error: "Failed to initiate OAuth" }, { status: 500 })
  }
}
