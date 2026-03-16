"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Check, X } from "lucide-react"

interface ApprovalActionsProps {
  approvalId: string
  onProcessed: () => void
}

export function ApprovalActions({ approvalId, onProcessed }: ApprovalActionsProps) {
  const [processing, setProcessing] = useState(false)
  const [showRejectNote, setShowRejectNote] = useState(false)
  const [rejectNote, setRejectNote] = useState("")

  async function handleDecision(decision: "APPROVED" | "REJECTED") {
    setProcessing(true)
    try {
      const response = await fetch(`/api/approvals/${approvalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: decision,
          responseNote: decision === "REJECTED" ? rejectNote : undefined,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to process approval")
      }

      onProcessed()
    } catch (err) {
      console.error("Error processing approval:", err)
    } finally {
      setProcessing(false)
    }
  }

  if (showRejectNote) {
    return (
      <div className="space-y-2">
        <Textarea
          placeholder="Reason for rejection (optional)..."
          value={rejectNote}
          onChange={(e) => setRejectNote(e.target.value)}
          rows={2}
        />
        <div className="flex gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDecision("REJECTED")}
            disabled={processing}
          >
            {processing && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
            Confirm Reject
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRejectNote(false)}
            disabled={processing}
          >
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        onClick={() => handleDecision("APPROVED")}
        disabled={processing}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        {processing ? (
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        ) : (
          <Check className="h-3 w-3 mr-1" />
        )}
        Approve
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setShowRejectNote(true)}
        disabled={processing}
      >
        <X className="h-3 w-3 mr-1" />
        Reject
      </Button>
    </div>
  )
}
