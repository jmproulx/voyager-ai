import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod/v4"
import { checkBookingPolicy, type BookingInput } from "@/lib/policy/engine"

const checkSchema = z.object({
  type: z.enum(["FLIGHT", "HOTEL", "CAR_RENTAL"]),
  price: z.number().positive(),
  currency: z.string().default("USD"),
  cabinClass: z.string().optional(),
  airline: z.string().optional(),
  hotelChain: z.string().optional(),
  isInternational: z.boolean().optional(),
  departureDate: z.string().optional(),
  bookingDate: z.string().optional(),
  nightlyRate: z.number().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = checkSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    })

    let policy = null
    if (user?.organizationId) {
      policy = await prisma.travelPolicy.findUnique({
        where: { organizationId: user.organizationId },
      })
    }

    const bookingInput: BookingInput = {
      type: data.type,
      price: data.price,
      currency: data.currency,
      cabinClass: data.cabinClass,
      airline: data.airline,
      hotelChain: data.hotelChain,
      isInternational: data.isInternational,
      departureDate: data.departureDate,
      bookingDate: data.bookingDate,
      nightlyRate: data.nightlyRate,
    }

    const result = checkBookingPolicy(bookingInput, policy)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 })
    }
    console.error("Error checking policy:", error)
    return NextResponse.json({ error: "Failed to check policy" }, { status: 500 })
  }
}
