"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DollarSign,
  Plane,
  TrendingUp,
  ShieldCheck,
  Leaf,
  Receipt,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface SummaryData {
  totalSpend: number
  tripCount: number
  averageTripCost: number
  complianceRate: number
  totalCarbonKg: number
  expenseCount: number
}

interface AnalyticsSummaryCardsProps {
  data: SummaryData | null
  loading: boolean
}

export function AnalyticsSummaryCards({ data, loading }: AnalyticsSummaryCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-16 mb-1" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    {
      title: "Total Spend",
      value: formatCurrency(data?.totalSpend ?? 0),
      icon: DollarSign,
    },
    {
      title: "Trips",
      value: String(data?.tripCount ?? 0),
      icon: Plane,
    },
    {
      title: "Avg Trip Cost",
      value: formatCurrency(data?.averageTripCost ?? 0),
      icon: TrendingUp,
    },
    {
      title: "Compliance",
      value: `${data?.complianceRate ?? 0}%`,
      icon: ShieldCheck,
    },
    {
      title: "Carbon",
      value: `${data?.totalCarbonKg ?? 0} kg`,
      icon: Leaf,
    },
    {
      title: "Expenses",
      value: String(data?.expenseCount ?? 0),
      icon: Receipt,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
