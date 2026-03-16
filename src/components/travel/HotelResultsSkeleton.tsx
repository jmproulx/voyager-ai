"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function HotelResultsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="flex gap-0.5">
                  <Skeleton className="h-3.5 w-3.5" />
                  <Skeleton className="h-3.5 w-3.5" />
                  <Skeleton className="h-3.5 w-3.5" />
                </div>
              </div>
              <Skeleton className="h-3 w-52" />
              <Skeleton className="h-4 w-28" />
              <div className="flex gap-1">
                <Skeleton className="h-5 w-14" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="flex items-end justify-between border-t pt-3">
                <div className="space-y-1">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-7 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
