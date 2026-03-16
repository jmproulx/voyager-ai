import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  getSpendingOverTime,
  getSpendByCategory,
  getTopDestinations,
  getPolicyComplianceRate,
  getAverageBookingLeadTime,
  getCarbonFootprint,
  getAnalyticsSummary,
} from "@/lib/expenses/analytics"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") ?? "30d"

    const [
      summary,
      spendingOverTime,
      spendByCategory,
      topDestinations,
      compliance,
      leadTime,
      carbon,
    ] = await Promise.all([
      getAnalyticsSummary(session.user.id, period),
      getSpendingOverTime(session.user.id, period),
      getSpendByCategory(session.user.id, period),
      getTopDestinations(session.user.id, period),
      getPolicyComplianceRate(session.user.id, period),
      getAverageBookingLeadTime(session.user.id),
      getCarbonFootprint(session.user.id, period),
    ])

    return NextResponse.json({
      summary,
      spendingOverTime,
      spendByCategory,
      topDestinations,
      compliance,
      averageLeadTimeDays: leadTime,
      carbon,
      period,
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
