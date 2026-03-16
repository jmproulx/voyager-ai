import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { z } from "zod/v4"
import { processApproval } from "@/lib/policy/approvals"

const processApprovalSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  responseNote: z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const data = processApprovalSchema.parse(body)

    const approval = await processApproval(
      id,
      session.user.id,
      data.status,
      data.responseNote
    )

    return NextResponse.json(approval)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 })
    }
    console.error("Error processing approval:", error)
    const message = error instanceof Error ? error.message : "Failed to process approval"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
