import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod/v4"

const updateTripSchema = z.object({
  name: z.string().min(1).optional(),
  destination: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(["PLANNING", "BOOKED", "ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
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

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        bookings: {
          include: {
            flightAlerts: {
              where: { acknowledged: false },
              orderBy: { createdAt: "desc" },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        expenses: {
          orderBy: { date: "desc" },
        },
        itineraryItems: {
          orderBy: { startTime: "asc" },
        },
        _count: {
          select: {
            bookings: true,
            expenses: true,
          },
        },
      },
    })

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    if (trip.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(trip)
  } catch (error) {
    console.error("Failed to fetch trip:", error)
    return NextResponse.json({ error: "Failed to fetch trip" }, { status: 500 })
  }
}

export async function PUT(
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
    const existing = await prisma.trip.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!existing) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const parsed = updateTripSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { name, destination, startDate, endDate, status } = parsed.data

    const trip = await prisma.trip.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(destination !== undefined && { destination }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: new Date(endDate) }),
        ...(status !== undefined && { status }),
      },
      include: {
        bookings: {
          include: {
            flightAlerts: true,
          },
        },
        expenses: true,
        itineraryItems: true,
      },
    })

    return NextResponse.json(trip)
  } catch (error) {
    console.error("Failed to update trip:", error)
    return NextResponse.json({ error: "Failed to update trip" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const existing = await prisma.trip.findUnique({
      where: { id },
      select: { userId: true, status: true },
    })

    if (!existing) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // If trip has active bookings, mark as cancelled instead of deleting
    if (existing.status === "ACTIVE" || existing.status === "BOOKED") {
      await prisma.trip.update({
        where: { id },
        data: { status: "CANCELLED" },
      })
      return NextResponse.json({ message: "Trip cancelled" })
    }

    // For PLANNING trips, delete entirely
    await prisma.trip.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Trip deleted" })
  } catch (error) {
    console.error("Failed to delete trip:", error)
    return NextResponse.json({ error: "Failed to delete trip" }, { status: 500 })
  }
}
