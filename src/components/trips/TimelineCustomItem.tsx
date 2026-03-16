"use client"

import { CalendarDays, MapPin, Coffee, Utensils, Car, MoreHorizontal } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { format } from "date-fns"

interface TimelineCustomItemProps {
  title: string
  description?: string | null
  startTime: string | Date
  endTime?: string | Date | null
  location?: string | null
  type: string
}

function getTypeIcon(type: string) {
  switch (type) {
    case "meeting":
      return <CalendarDays className="h-4 w-4" />
    case "dinner":
      return <Utensils className="h-4 w-4" />
    case "transport":
      return <Car className="h-4 w-4" />
    case "event":
      return <Coffee className="h-4 w-4" />
    default:
      return <MoreHorizontal className="h-4 w-4" />
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case "meeting":
      return "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
    case "dinner":
      return "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
    case "transport":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
    case "event":
      return "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
  }
}

export function TimelineCustomItem({
  title,
  description,
  startTime,
  endTime,
  location,
  type,
}: TimelineCustomItemProps) {
  const start = typeof startTime === "string" ? new Date(startTime) : startTime
  const end = endTime ? (typeof endTime === "string" ? new Date(endTime) : endTime) : null

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${getTypeColor(type)}`}>
            {getTypeIcon(type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">{title}</p>
              <p className="text-sm text-muted-foreground shrink-0">
                {format(start, "h:mm a")}
                {end ? ` - ${format(end, "h:mm a")}` : ""}
              </p>
            </div>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
            {location && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{location}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
