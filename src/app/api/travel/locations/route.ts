import { NextRequest, NextResponse } from "next/server"
import {
  searchLocations,
  isKiwiConfigured,
} from "@/lib/travel/kiwi"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const term = searchParams.get("term")
  const locationTypes = searchParams.get("locationTypes") || "airport"
  const limit = parseInt(searchParams.get("limit") || "10", 10)

  if (!term || term.length < 1) {
    return NextResponse.json(
      { error: "Missing required parameter: term" },
      { status: 400 }
    )
  }

  // Only call Kiwi if configured
  if (!isKiwiConfigured()) {
    return NextResponse.json({
      locations: [],
      source: "none",
      message: "Kiwi API not configured. Using static airport list on client.",
    })
  }

  try {
    const locations = await searchLocations(term, {
      locationTypes,
      limit,
    })

    return NextResponse.json({
      locations,
      source: "kiwi",
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Location search failed"

    console.error("Location search error:", error)

    return NextResponse.json({
      locations: [],
      source: "error",
      error: message,
    })
  }
}
