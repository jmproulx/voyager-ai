"use client"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PieChart, Pie, Cell } from "recharts"

interface CategoryData {
  category: string
  amount: number
  count: number
}

interface CategoryBreakdownProps {
  data: CategoryData[]
  loading: boolean
}

const CATEGORY_COLORS: Record<string, string> = {
  FLIGHT: "hsl(220 70% 50%)",
  HOTEL: "hsl(160 60% 45%)",
  MEAL: "hsl(30 80% 55%)",
  TRANSPORT: "hsl(280 65% 55%)",
  OTHER: "hsl(0 0% 60%)",
}

function buildChartConfig(data: CategoryData[]): ChartConfig {
  const config: ChartConfig = {}
  for (const item of data) {
    config[item.category] = {
      label: item.category.charAt(0) + item.category.slice(1).toLowerCase(),
      color: CATEGORY_COLORS[item.category] ?? "hsl(0 0% 60%)",
    }
  }
  return config
}

export function CategoryBreakdown({ data, loading }: CategoryBreakdownProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Spend by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Spend by Category</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">No category data available</p>
        </CardContent>
      </Card>
    )
  }

  const chartConfig = buildChartConfig(data)
  const total = data.reduce((sum, d) => sum + d.amount, 0)
  const chartData = data.map((d) => ({
    ...d,
    fill: CATEGORY_COLORS[d.category] ?? "hsl(0 0% 60%)",
    percentage: total > 0 ? Math.round((d.amount / total) * 100) : 0,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Spend by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => [
                    `$${Number(value).toLocaleString()}`,
                    String(name).charAt(0) + String(name).slice(1).toLowerCase(),
                  ]}
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="amount"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
            >
              {chartData.map((entry) => (
                <Cell key={entry.category} fill={entry.fill} />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="category" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
