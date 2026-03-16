import { NextRequest, NextResponse } from "next/server"
import { searchHotelsByCity, getHotelOffers } from "@/lib/travel/amadeus"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  const cityCode = searchParams.get("cityCode")
  const checkInDate = searchParams.get("checkInDate")
  const checkOutDate = searchParams.get("checkOutDate")
  const guests = parseInt(searchParams.get("guests") || "1", 10)

  // Validate required parameters
  if (!cityCode || !checkInDate || !checkOutDate) {
    return NextResponse.json(
      { error: "Missing required parameters: cityCode, checkInDate, checkOutDate" },
      { status: 400 }
    )
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(checkInDate) || !dateRegex.test(checkOutDate)) {
    return NextResponse.json(
      { error: "Invalid date format. Use YYYY-MM-DD." },
      { status: 400 }
    )
  }

  try {
    // Step 1: Get hotel IDs for the city
    const hotelIds = await searchHotelsByCity({
      cityCode: cityCode.toUpperCase(),
      radius: 10,
      radiusUnit: "KM",
    })

    if (hotelIds.length === 0) {
      return NextResponse.json({
        offers: [],
        meta: {
          totalCount: 0,
          message: "No hotels found for this city code.",
        },
      })
    }

    // Step 2: Get hotel offers (limited to 20 hotel IDs)
    const offers = await getHotelOffers({
      hotelIds: hotelIds.slice(0, 20),
      checkInDate,
      checkOutDate,
      adults: guests,
    })

    // Sort by price (default)
    offers.sort((a, b) => a.totalPrice - b.totalPrice)

    return NextResponse.json({
      offers,
      meta: {
        totalCount: offers.length,
        hotelsSearched: Math.min(hotelIds.length, 20),
        totalHotelsInCity: hotelIds.length,
      },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to search hotels"

    console.error("Hotel search error:", error)

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
