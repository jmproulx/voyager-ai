"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface ComplianceGaugeProps {
  rate: number
  compliant: number
  total: number
  loading: boolean
}

function getColor(rate: number): string {
  if (rate >= 90) return "hsl(142 76% 36%)"
  if (rate >= 70) return "hsl(38 92% 50%)"
  return "hsl(0 72% 51%)"
}

function getColorClass(rate: number): string {
  if (rate >= 90) return "text-green-600"
  if (rate >= 70) return "text-yellow-500"
  return "text-red-500"
}

export function ComplianceGauge({ rate, compliant, total, loading }: ComplianceGaugeProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Policy Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  const strokeColor = getColor(rate)
  const circumference = 2 * Math.PI * 70
  const strokeDashoffset = circumference - (rate / 100) * circumference

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Policy Compliance</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center h-[300px]">
        <div className="relative">
          <svg width="180" height="180" viewBox="0 0 180 180">
            <circle
              cx="90"
              cy="90"
              r="70"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="12"
            />
            <circle
              cx="90"
              cy="90"
              r="70"
              fill="none"
              stroke={strokeColor}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 90 90)"
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${getColorClass(rate)}`}>
              {rate}%
            </span>
            <span className="text-xs text-muted-foreground">compliant</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          {compliant} of {total} bookings in policy
        </p>
      </CardContent>
    </Card>
  )
}
