"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DollarSign, Clock, CheckCircle, TrendingUp } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface ExpenseSummaryData {
  totalAmount: number
  averageAmount: number
  pendingCount: number
  approvedTotal: number
}

interface ExpenseSummaryProps {
  data: ExpenseSummaryData | null
  loading: boolean
}

export function ExpenseSummary({ data, loading }: ExpenseSummaryProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-20 mb-1" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const cards = [
    {
      title: "Total Expenses",
      value: formatCurrency(data?.totalAmount ?? 0),
      description: "All expenses",
      icon: DollarSign,
    },
    {
      title: "Average Expense",
      value: formatCurrency(data?.averageAmount ?? 0),
      description: "Per transaction",
      icon: TrendingUp,
    },
    {
      title: "Pending",
      value: String(data?.pendingCount ?? 0),
      description: "Awaiting approval",
      icon: Clock,
    },
    {
      title: "Approved Total",
      value: formatCurrency(data?.approvedTotal ?? 0),
      description: "Approved expenses",
      icon: CheckCircle,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
