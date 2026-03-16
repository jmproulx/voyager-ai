import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getAlertsForUser, acknowledgeAlert, acknowledgeAllAlerts } from "@/lib/alerts/notifications"
import { z } from "zod/v4"

const acknowledgeSchema = z.object({
  alertId: z.string().optional(),
  acknowledgeAll: z.boolean().optional(),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const alerts = await getAlertsForUser(session.user.id)

    return NextResponse.json({ alerts })
  } catch (error) {
    console.error("Failed to fetch alerts:", error)
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = acknowledgeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { alertId, acknowledgeAll: ackAll } = parsed.data

    if (ackAll) {
      const count = await acknowledgeAllAlerts(session.user.id)
      return NextResponse.json({ acknowledged: count })
    }

    if (alertId) {
      const alert = await acknowledgeAlert(alertId)
      return NextResponse.json({ alert })
    }

    return NextResponse.json(
      { error: "Provide alertId or acknowledgeAll" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Failed to acknowledge alert:", error)
    return NextResponse.json(
      { error: "Failed to acknowledge alert" },
      { status: 500 }
    )
  }
}
