"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function FlightResultsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <Skeleton className="mb-1 h-6 w-16" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                  <div className="flex flex-1 flex-col items-center gap-1">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-px w-full" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <div className="text-center">
                    <Skeleton className="mb-1 h-6 w-16" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-14" />
                <Skeleton className="mt-1 h-7 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
