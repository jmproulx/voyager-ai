import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { generateExpenseReport, exportToCsv } from "@/lib/expenses/report"
import { z } from "zod/v4"

const reportSchema = z.object({
  tripId: z.string().optional(),
  category: z.enum(["FLIGHT", "HOTEL", "MEAL", "TRANSPORT", "OTHER"]).optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  format: z.enum(["json", "csv"]).default("json"),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = reportSchema.parse(body)

    const report = await generateExpenseReport(session.user.id, {
      tripId: data.tripId,
      category: data.category,
      status: data.status,
      dateFrom: data.dateFrom,
      dateTo: data.dateTo,
    })

    if (data.format === "csv") {
      const csv = exportToCsv(report.expenses)
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="expense-report-${report.id}.csv"`,
        },
      })
    }

    return NextResponse.json(report)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 })
    }
    console.error("Error generating report:", error)
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
  }
}
