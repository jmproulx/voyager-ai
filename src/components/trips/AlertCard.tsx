"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Clock, XCircle, ArrowRight, Check } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"

interface AlertCardProps {
  id: string
  type: string
  details: Record<string, unknown> | null
  acknowledged: boolean
  createdAt: string | Date
  tripName?: string
  onAcknowledge?: (id: string) => void
}

function getAlertIcon(type: string) {
  switch (type) {
    case "DELAY":
      return <Clock className="h-4 w-4" />
    case "CANCELLATION":
      return <XCircle className="h-4 w-4" />
    case "GATE_CHANGE":
      return <ArrowRight className="h-4 w-4" />
    case "PRICE_DROP":
      return <AlertTriangle className="h-4 w-4" />
    default:
      return <AlertTriangle className="h-4 w-4" />
  }
}

function getAlertColor(type: string) {
  switch (type) {
    case "DELAY":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
    case "CANCELLATION":
      return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
    case "GATE_CHANGE":
      return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
    case "PRICE_DROP":
      return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
  }
}

function getAlertLabel(type: string) {
  switch (type) {
    case "DELAY":
      return "Flight Delayed"
    case "CANCELLATION":
      return "Flight Cancelled"
    case "GATE_CHANGE":
      return "Gate Changed"
    case "PRICE_DROP":
      return "Price Drop"
    default:
      return "Alert"
  }
}

export function AlertCard({
  id,
  type,
  details,
  acknowledged,
  createdAt,
  tripName,
  onAcknowledge,
}: AlertCardProps) {
  const message = (details?.message as string) ?? getAlertLabel(type)

  return (
    <Card size="sm" className={acknowledged ? "opacity-60" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${getAlertColor(type)}`}>
            {getAlertIcon(type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-sm">{getAlertLabel(type)}</p>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatRelativeTime(createdAt)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{message}</p>
            {tripName && (
              <p className="text-xs text-muted-foreground mt-1">Trip: {tripName}</p>
            )}
            {!acknowledged && onAcknowledge && (
              <Button
                size="xs"
                variant="ghost"
                className="mt-2"
                onClick={() => onAcknowledge(id)}
              >
                <Check className="h-3 w-3" />
                Dismiss
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
