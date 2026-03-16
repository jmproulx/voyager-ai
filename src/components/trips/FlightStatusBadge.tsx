"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface FlightStatusBadgeProps {
  status: string
  className?: string
}

function getStatusConfig(status: string): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  switch (status.toLowerCase()) {
    case "on time":
    case "scheduled":
      return { label: "On Time", variant: "default" }
    case "in air":
    case "en route":
      return { label: "In Air", variant: "default" }
    case "arrived":
    case "landed":
      return { label: "Arrived", variant: "secondary" }
    case "delayed":
      return { label: "Delayed", variant: "destructive" }
    case "cancelled":
      return { label: "Cancelled", variant: "destructive" }
    case "diverted":
      return { label: "Diverted", variant: "destructive" }
    default:
      return { label: status, variant: "outline" }
  }
}

export function FlightStatusBadge({ status, className }: FlightStatusBadgeProps) {
  const config = getStatusConfig(status)

  return (
    <Badge variant={config.variant} className={cn(className)}>
      {config.label}
    </Badge>
  )
}
