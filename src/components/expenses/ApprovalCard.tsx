"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ApprovalActions } from "./ApprovalActions"
import { formatCurrency, formatRelativeTime } from "@/lib/utils"

interface ApprovalRequestData {
  id: string
  status: string
  reason: string | null
  responseNote: string | null
  createdAt: string
  respondedAt: string | null
  requester: {
    id: string
    name: string | null
    email: string
  }
  booking: {
    id: string
    type: string
    price: number
    currency: string
    details: Record<string, unknown> | null
    policyViolationReason: string | null
    trip: {
      id: string
      name: string
      destination: string | null
    } | null
  }
}

interface ApprovalCardProps {
  approval: ApprovalRequestData
  showActions: boolean
  onProcessed: () => void
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "APPROVED":
      return "default"
    case "PENDING":
      return "secondary"
    case "REJECTED":
      return "destructive"
    default:
      return "outline"
  }
}

export function ApprovalCard({ approval, showActions, onProcessed }: ApprovalCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm">
              {approval.requester.name ?? approval.requester.email}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {approval.requester.email}
            </p>
          </div>
          <Badge variant={getStatusVariant(approval.status)}>
            {approval.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Booking Type</p>
            <p className="font-medium">{approval.booking.type}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Amount</p>
            <p className="font-medium font-mono">
              {formatCurrency(approval.booking.price, approval.booking.currency)}
            </p>
          </div>
          {approval.booking.trip && (
            <>
              <div>
                <p className="text-xs text-muted-foreground">Trip</p>
                <p className="font-medium">{approval.booking.trip.name}</p>
              </div>
              {approval.booking.trip.destination && (
                <div>
                  <p className="text-xs text-muted-foreground">Destination</p>
                  <p className="font-medium">{approval.booking.trip.destination}</p>
                </div>
              )}
            </>
          )}
        </div>

        {approval.reason && (
          <div className="rounded-md bg-muted/50 p-2 text-sm">
            <p className="text-xs text-muted-foreground mb-0.5">Policy Violation</p>
            <p>{approval.reason}</p>
          </div>
        )}

        {approval.responseNote && (
          <div className="rounded-md bg-muted/50 p-2 text-sm">
            <p className="text-xs text-muted-foreground mb-0.5">Response Note</p>
            <p>{approval.responseNote}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            Requested {formatRelativeTime(approval.createdAt)}
          </p>
          {showActions && approval.status === "PENDING" && (
            <ApprovalActions
              approvalId={approval.id}
              onProcessed={onProcessed}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
