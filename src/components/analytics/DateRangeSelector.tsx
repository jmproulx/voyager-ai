"use client"

import { Button } from "@/components/ui/button"

interface DateRangeSelectorProps {
  value: string
  onChange: (period: string) => void
}

const PERIODS = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "1y", label: "1y" },
]

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border p-0.5">
      {PERIODS.map((period) => (
        <Button
          key={period.value}
          variant={value === period.value ? "default" : "ghost"}
          size="sm"
          onClick={() => onChange(period.value)}
          className="h-7 px-3 text-xs"
        >
          {period.label}
        </Button>
      ))}
    </div>
  )
}
