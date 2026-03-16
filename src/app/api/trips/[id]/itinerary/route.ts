import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

const createItineraryItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().optional(),
  location: z.string().optional(),
  type: z.string().default("event"),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const trip = await prisma.trip.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    if (trip.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const items = await prisma.itineraryItem.findMany({
      where: { tripId: id },
      orderBy: { startTime: "asc" },
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error("Failed to fetch itinerary items:", error)
    return NextResponse.json(
      { error: "Failed to fetch itinerary items" },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const trip = await prisma.trip.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    if (trip.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const parsed = createItineraryItemSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { title, description, startTime, endTime, location, type } = parsed.data

    const item = await prisma.itineraryItem.create({
      data: {
        tripId: id,
        title,
        description: description ?? null,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        location: location ?? null,
        type,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error("Failed to create itinerary item:", error)
    return NextResponse.json(
      { error: "Failed to create itinerary item" },
      { status: 500 }
    )
  }
}
