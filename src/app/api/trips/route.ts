import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"
import type { Prisma } from "@prisma/client"

const createTripSchema = z.object({
  name: z.string().min(1, "Trip name is required"),
  destination: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const startDateFrom = searchParams.get("startDateFrom")
    const startDateTo = searchParams.get("startDateTo")

    const where: Prisma.TripWhereInput = {
      userId: session.user.id,
    }

    if (status && status !== "ALL") {
      where.status = status as Prisma.TripWhereInput["status"]
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { destination: { contains: search, mode: "insensitive" } },
      ]
    }

    if (startDateFrom || startDateTo) {
      where.startDate = {}
      if (startDateFrom) {
        (where.startDate as Prisma.DateTimeNullableFilter).gte = new Date(startDateFrom)
      }
      if (startDateTo) {
        (where.startDate as Prisma.DateTimeNullableFilter).lte = new Date(startDateTo)
      }
    }

    const trips = await prisma.trip.findMany({
      where,
      include: {
        bookings: {
          select: {
            id: true,
            price: true,
            currency: true,
          },
        },
        _count: {
          select: {
            bookings: true,
            expenses: true,
          },
        },
      },
      orderBy: [
        { startDate: "asc" },
        { createdAt: "desc" },
      ],
    })

    const tripSummaries = trips.map((trip) => ({
      id: trip.id,
      name: trip.name,
      status: trip.status,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      bookingCount: trip._count.bookings,
      totalSpend: trip.bookings.reduce((sum, b) => sum + b.price, 0),
      currency: trip.bookings[0]?.currency ?? "USD",
      createdAt: trip.createdAt,
      updatedAt: trip.updatedAt,
    }))

    return NextResponse.json(tripSummaries)
  } catch (error) {
    console.error("Failed to fetch trips:", error)
    return NextResponse.json({ error: "Failed to fetch trips" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = createTripSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { name, destination, startDate, endDate } = parsed.data

    const trip = await prisma.trip.create({
      data: {
        name,
        destination: destination ?? null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        userId: session.user.id,
        status: "PLANNING",
      },
      include: {
        bookings: true,
        expenses: true,
        itineraryItems: true,
      },
    })

    return NextResponse.json(trip, { status: 201 })
  } catch (error) {
    console.error("Failed to create trip:", error)
    return NextResponse.json({ error: "Failed to create trip" }, { status: 500 })
  }
}
