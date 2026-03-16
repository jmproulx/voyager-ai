"use client"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"

interface DestinationData {
  destination: string
  amount: number
  tripCount: number
}

interface TopDestinationsProps {
  data: DestinationData[]
  loading: boolean
}

const chartConfig: ChartConfig = {
  amount: {
    label: "Spend",
    color: "hsl(var(--chart-2, 160 60% 45%))",
  },
}

export function TopDestinations({ data, loading }: TopDestinationsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Top Destinations</CardTitle>
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
          <CardTitle className="text-sm">Top Destinations</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">No destination data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Top Destinations</CardTitle>
          <div className="flex gap-1">
            {data.slice(0, 3).map((d) => (
              <Badge key={d.destination} variant="outline" className="text-xs">
                {d.tripCount} {d.tripCount === 1 ? "trip" : "trips"}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart
            data={data.slice(0, 8)}
            layout="vertical"
            margin={{ top: 5, right: 20, bottom: 5, left: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              fontSize={12}
              tickFormatter={(value: number) => `$${value.toLocaleString()}`}
            />
            <YAxis
              type="category"
              dataKey="destination"
              tickLine={false}
              axisLine={false}
              fontSize={12}
              width={70}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => [`$${Number(value).toLocaleString()}`, "Spend"]}
                />
              }
            />
            <Bar
              dataKey="amount"
              fill="var(--color-amount)"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
