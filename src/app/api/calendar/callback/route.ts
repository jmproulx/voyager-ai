import { NextRequest, NextResponse } from "next/server"
import { handleCallback, isCalendarConfigured } from "@/lib/calendar/google"

export async function GET(req: NextRequest) {
  try {
    if (!isCalendarConfigured()) {
      return NextResponse.json(
        { error: "Google Calendar is not configured" },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(req.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state") // userId
    const error = searchParams.get("error")

    if (error) {
      const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
      return NextResponse.redirect(
        `${baseUrl}/settings?calendar_error=${encodeURIComponent(error)}`
      )
    }

    if (!code || !state) {
      return NextResponse.json(
        { error: "Missing code or state parameter" },
        { status: 400 }
      )
    }

    const success = await handleCallback(code, state)
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"

    if (success) {
      return NextResponse.redirect(`${baseUrl}/?calendar_connected=true`)
    } else {
      return NextResponse.redirect(
        `${baseUrl}/settings?calendar_error=failed_to_connect`
      )
    }
  } catch (error) {
    console.error("Calendar callback error:", error)
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
    return NextResponse.redirect(
      `${baseUrl}/settings?calendar_error=unexpected_error`
    )
  }
}
