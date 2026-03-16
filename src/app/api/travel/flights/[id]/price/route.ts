import { NextRequest, NextResponse } from "next/server"
import { confirmFlightPrice } from "@/lib/travel/amadeus"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!id) {
    return NextResponse.json(
      { error: "Missing flight offer ID" },
      { status: 400 }
    )
  }

  // Extract the provider prefix and actual ID
  let provider: "AMADEUS" | "DUFFEL" = "AMADEUS"
  let providerOfferId = id

  if (id.startsWith("amadeus-")) {
    provider = "AMADEUS"
    providerOfferId = id.replace("amadeus-", "")
  } else if (id.startsWith("duffel-")) {
    provider = "DUFFEL"
    providerOfferId = id.replace("duffel-", "")
  }

  try {
    if (provider === "AMADEUS") {
      const result = await confirmFlightPrice(providerOfferId)

      return NextResponse.json({
        offerId: id,
        provider,
        available: result.available,
        price: result.price,
        currency: result.currency,
      })
    }

    // Duffel price confirmation — offers are valid until their expiry
    // so we return the stored price as confirmed
    return NextResponse.json({
      offerId: id,
      provider,
      available: true,
      message: "Duffel offers are guaranteed until their expiry time.",
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to confirm price"

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
