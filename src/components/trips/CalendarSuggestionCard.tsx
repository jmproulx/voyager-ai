"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Sparkles } from "lucide-react"
import { formatDate } from "@/lib/utils"
import Link from "next/link"

interface CalendarSuggestionCardProps {
  eventTitle: string
  eventDate: string
  location: string
  reason: string
  suggestedAction: string
}

export function CalendarSuggestionCard({
  eventTitle,
  eventDate,
  location,
  suggestedAction,
}: CalendarSuggestionCardProps) {
  return (
    <Card size="sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{eventTitle}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              {eventDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(eventDate)}
                </span>
              )}
              {location && location !== "Unknown" && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {location}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {suggestedAction}
            </p>
            <div className="mt-2">
              <Link href="/chat">
                <Button size="xs" variant="outline">
                  Plan Trip
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
