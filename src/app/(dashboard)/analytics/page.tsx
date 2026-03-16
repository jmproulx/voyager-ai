"use client"

import { useEffect, useState, useCallback } from "react"
import { AnalyticsSummaryCards } from "@/components/analytics/AnalyticsSummaryCards"
import { DateRangeSelector } from "@/components/analytics/DateRangeSelector"
import { SpendingChart } from "@/components/analytics/SpendingChart"
import { CategoryBreakdown } from "@/components/analytics/CategoryBreakdown"
import { TopDestinations } from "@/components/analytics/TopDestinations"
import { ComplianceGauge } from "@/components/analytics/ComplianceGauge"
import { CarbonChart } from "@/components/analytics/CarbonChart"

interface AnalyticsData {
  summary: {
    totalSpend: number
    tripCount: number
    averageTripCost: number
    complianceRate: number
    totalCarbonKg: number
    expenseCount: number
  }
  spendingOverTime: Array<{ month: string; amount: number }>
  spendByCategory: Array<{ category: string; amount: number; count: number }>
  topDestinations: Array<{ destination: string; amount: number; tripCount: number }>
  compliance: { compliant: number; total: number; rate: number }
  carbon: { totalKg: number; monthly: Array<{ month: string; kg: number }> }
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("30d")
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/analytics?period=${period}`)
      if (!response.ok) throw new Error("Failed to fetch analytics")
      const result: AnalyticsData = await response.json()
      setData(result)
    } catch (err) {
      console.error("Error fetching analytics:", err)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Insights into your travel spending and compliance.
          </p>
        </div>
        <DateRangeSelector value={period} onChange={setPeriod} />
      </div>

      <AnalyticsSummaryCards data={data?.summary ?? null} loading={loading} />

      <SpendingChart data={data?.spendingOverTime ?? []} loading={loading} />

      <div className="grid gap-6 md:grid-cols-2">
        <CategoryBreakdown data={data?.spendByCategory ?? []} loading={loading} />
        <TopDestinations data={data?.topDestinations ?? []} loading={loading} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ComplianceGauge
          rate={data?.compliance?.rate ?? 0}
          compliant={data?.compliance?.compliant ?? 0}
          total={data?.compliance?.total ?? 0}
          loading={loading}
        />
        <CarbonChart data={data?.carbon ?? null} loading={loading} />
      </div>
    </div>
  )
}
