"use client"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts"

interface CarbonData {
  totalKg: number
  monthly: Array<{ month: string; kg: number }>
}

interface CarbonChartProps {
  data: CarbonData | null
  loading: boolean
}

const chartConfig: ChartConfig = {
  kg: {
    label: "CO2 (kg)",
    color: "hsl(var(--chart-3, 142 76% 36%))",
  },
}

export function CarbonChart({ data, loading }: CarbonChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Carbon Footprint</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.monthly.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Carbon Footprint</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">No carbon data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Carbon Footprint</CardTitle>
          <span className="text-sm font-mono text-muted-foreground">
            Total: {data.totalKg.toLocaleString()} kg CO2
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={data.monthly} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              fontSize={12}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              fontSize={12}
              tickFormatter={(value: number) => `${value} kg`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => [`${Number(value).toLocaleString()} kg CO2`, "Carbon"]}
                />
              }
            />
            <defs>
              <linearGradient id="carbonGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-kg)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-kg)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="kg"
              stroke="var(--color-kg)"
              fill="url(#carbonGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
