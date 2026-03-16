import { prisma } from "@/lib/prisma"
import type { FlightAlertType, Prisma } from "@prisma/client"

export interface CreateAlertInput {
  bookingId: string
  type: FlightAlertType
  details: Prisma.InputJsonValue
}

export async function createFlightAlert(input: CreateAlertInput) {
  // Check for existing unacknowledged alert of same type for same booking
  const existing = await prisma.flightAlert.findFirst({
    where: {
      bookingId: input.bookingId,
      type: input.type,
      acknowledged: false,
    },
  })

  if (existing) {
    // Update existing alert with new details
    return prisma.flightAlert.update({
      where: { id: existing.id },
      data: {
        details: input.details,
      },
    })
  }

  return prisma.flightAlert.create({
    data: {
      bookingId: input.bookingId,
      type: input.type,
      details: input.details,
    },
  })
}

export async function getAlertsForUser(userId: string) {
  return prisma.flightAlert.findMany({
    where: {
      booking: {
        trip: {
          userId,
        },
      },
    },
    include: {
      booking: {
        select: {
          id: true,
          type: true,
          details: true,
          trip: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })
}

export async function getUnacknowledgedAlerts(userId: string) {
  return prisma.flightAlert.findMany({
    where: {
      acknowledged: false,
      booking: {
        trip: {
          userId,
        },
      },
    },
    include: {
      booking: {
        select: {
          id: true,
          type: true,
          details: true,
          trip: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })
}

export async function acknowledgeAlert(alertId: string) {
  return prisma.flightAlert.update({
    where: { id: alertId },
    data: { acknowledged: true },
  })
}

export async function acknowledgeAllAlerts(userId: string) {
  const alerts = await prisma.flightAlert.findMany({
    where: {
      acknowledged: false,
      booking: {
        trip: {
          userId,
        },
      },
    },
    select: { id: true },
  })

  if (alerts.length === 0) return 0

  const result = await prisma.flightAlert.updateMany({
    where: {
      id: { in: alerts.map((a) => a.id) },
    },
    data: { acknowledged: true },
  })

  return result.count
}
