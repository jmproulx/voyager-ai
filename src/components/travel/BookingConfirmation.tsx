"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { CheckCircle, Plane, Building2 } from "lucide-react"

interface BookingConfirmationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: {
    id: string
    type: "FLIGHT" | "HOTEL"
    provider: string
    providerBookingId: string | null
    price: number
    currency: string
  } | null
}

export function BookingConfirmation({
  open,
  onOpenChange,
  booking,
}: BookingConfirmationProps) {
  if (!booking) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <DialogTitle className="text-center">Booking Confirmed</DialogTitle>
          <DialogDescription className="text-center">
            Your {booking.type.toLowerCase()} has been successfully booked.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {booking.type === "FLIGHT" ? (
                <Plane className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Building2 className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm font-medium">{booking.type}</span>
            </div>
            <Badge variant="secondary">{booking.provider}</Badge>
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Booking ID</span>
              <span className="font-mono text-xs">{booking.id}</span>
            </div>
            {booking.providerBookingId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Provider Ref</span>
                <span className="font-mono text-xs">
                  {booking.providerBookingId}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Price</span>
              <span className="font-semibold">
                {formatCurrency(booking.price, booking.currency)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
