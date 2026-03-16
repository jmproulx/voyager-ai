import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod/v4"
import { getDefaultPolicyRules } from "@/lib/policy/engine"
import type { Prisma } from "@prisma/client"

const updatePolicySchema = z.object({
  maxFlightPrice: z.number().positive().nullable().optional(),
  maxHotelPrice: z.number().positive().nullable().optional(),
  preferredAirlines: z.array(z.string()).optional(),
  preferredHotelChains: z.array(z.string()).optional(),
  requireApprovalAbove: z.number().positive().nullable().optional(),
  advanceBookingDays: z.number().int().positive().nullable().optional(),
  allowBusinessClass: z.boolean().optional(),
  internationalRequiresApproval: z.boolean().optional(),
  rules: z.array(z.record(z.string(), z.unknown())).optional(),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true, role: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json({ policy: null, defaults: getDefaultPolicyRules() })
    }

    const policy = await prisma.travelPolicy.findUnique({
      where: { organizationId: user.organizationId },
    })

    return NextResponse.json({ policy, defaults: getDefaultPolicyRules() })
  } catch (error) {
    console.error("Error fetching policy:", error)
    return NextResponse.json({ error: "Failed to fetch policy" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true, role: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: "User must belong to an organization" }, { status: 400 })
    }

    if (user.role !== "ADMIN" && user.role !== "MANAGER") {
      return NextResponse.json({ error: "Only admins and managers can update policies" }, { status: 403 })
    }

    const body = await request.json()
    const data = updatePolicySchema.parse(body)

    const rulesValue = (data.rules ?? []) as Prisma.InputJsonValue

    const policy = await prisma.travelPolicy.upsert({
      where: { organizationId: user.organizationId },
      create: {
        organizationId: user.organizationId,
        maxFlightPrice: data.maxFlightPrice ?? null,
        maxHotelPrice: data.maxHotelPrice ?? null,
        preferredAirlines: data.preferredAirlines ?? [],
        preferredHotelChains: data.preferredHotelChains ?? [],
        requireApprovalAbove: data.requireApprovalAbove ?? null,
        advanceBookingDays: data.advanceBookingDays ?? null,
        allowBusinessClass: data.allowBusinessClass ?? false,
        internationalRequiresApproval: data.internationalRequiresApproval ?? true,
        rules: rulesValue,
      },
      update: {
        ...(data.maxFlightPrice !== undefined && { maxFlightPrice: data.maxFlightPrice }),
        ...(data.maxHotelPrice !== undefined && { maxHotelPrice: data.maxHotelPrice }),
        ...(data.preferredAirlines !== undefined && { preferredAirlines: data.preferredAirlines }),
        ...(data.preferredHotelChains !== undefined && { preferredHotelChains: data.preferredHotelChains }),
        ...(data.requireApprovalAbove !== undefined && { requireApprovalAbove: data.requireApprovalAbove }),
        ...(data.advanceBookingDays !== undefined && { advanceBookingDays: data.advanceBookingDays }),
        ...(data.allowBusinessClass !== undefined && { allowBusinessClass: data.allowBusinessClass }),
        ...(data.internationalRequiresApproval !== undefined && { internationalRequiresApproval: data.internationalRequiresApproval }),
        ...(data.rules !== undefined && { rules: rulesValue }),
      },
    })

    return NextResponse.json(policy)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 })
    }
    console.error("Error updating policy:", error)
    return NextResponse.json({ error: "Failed to update policy" }, { status: 500 })
  }
}
