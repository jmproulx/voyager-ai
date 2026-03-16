import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { z } from "zod/v4"
import {
  createApprovalRequest,
  getPendingApprovals,
  getApprovalHistory,
} from "@/lib/policy/approvals"

const createApprovalSchema = z.object({
  bookingId: z.string(),
  reason: z.string(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tab = searchParams.get("tab") ?? "pending"

    if (tab === "history") {
      const history = await getApprovalHistory(session.user.id)
      return NextResponse.json({ approvals: history, tab: "history" })
    }

    const pending = await getPendingApprovals(session.user.id)
    return NextResponse.json({ approvals: pending, tab: "pending" })
  } catch (error) {
    console.error("Error fetching approvals:", error)
    return NextResponse.json({ error: "Failed to fetch approvals" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = createApprovalSchema.parse(body)

    const approval = await createApprovalRequest({
      bookingId: data.bookingId,
      requesterId: session.user.id,
      reason: data.reason,
    })

    return NextResponse.json(approval, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 })
    }
    console.error("Error creating approval request:", error)
    const message = error instanceof Error ? error.message : "Failed to create approval request"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
