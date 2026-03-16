"use client"

import { useEffect, useState, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ApprovalCard } from "@/components/expenses/ApprovalCard"
import { Skeleton } from "@/components/ui/skeleton"
import { Inbox } from "lucide-react"

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

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState("pending")
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequestData[]>([])
  const [historyApprovals, setHistoryApprovals] = useState<ApprovalRequestData[]>([])
  const [loading, setLoading] = useState(true)

  const fetchApprovals = useCallback(async (tab: string) => {
    setLoading(true)
    try {
      const queryTab = tab === "pending" ? "pending" : "history"
      const response = await fetch(`/api/approvals?tab=${queryTab}`)
      if (!response.ok) throw new Error("Failed to fetch approvals")

      const data = await response.json()
      const approvals: ApprovalRequestData[] = data.approvals ?? []

      if (tab === "pending") {
        setPendingApprovals(approvals)
      } else {
        setHistoryApprovals(approvals)
      }
    } catch (err) {
      console.error("Error fetching approvals:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApprovals(activeTab)
  }, [activeTab, fetchApprovals])

  function handleProcessed() {
    fetchApprovals("pending")
    fetchApprovals("history")
  }

  const approvedList = historyApprovals.filter((a) => a.status === "APPROVED")
  const rejectedList = historyApprovals.filter((a) => a.status === "REJECTED")

  function EmptyState({ message }: { message: string }) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Inbox className="h-12 w-12 text-muted-foreground/50 mb-3" />
        <p className="text-lg font-medium text-muted-foreground">{message}</p>
      </div>
    )
  }

  function LoadingState() {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Approvals</h1>
        <p className="text-muted-foreground">
          Review and manage booking approval requests.
        </p>
      </div>

      <Tabs
        defaultValue="pending"
        onValueChange={(val) => setActiveTab(val as string)}
      >
        <TabsList>
          <TabsTrigger value="pending">
            Pending
            {pendingApprovals.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                {pendingApprovals.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {loading ? (
            <LoadingState />
          ) : pendingApprovals.length === 0 ? (
            <EmptyState message="No pending approval requests" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pendingApprovals.map((approval) => (
                <ApprovalCard
                  key={approval.id}
                  approval={approval}
                  showActions={true}
                  onProcessed={handleProcessed}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          {loading ? (
            <LoadingState />
          ) : approvedList.length === 0 ? (
            <EmptyState message="No approved requests yet" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {approvedList.map((approval) => (
                <ApprovalCard
                  key={approval.id}
                  approval={approval}
                  showActions={false}
                  onProcessed={handleProcessed}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          {loading ? (
            <LoadingState />
          ) : rejectedList.length === 0 ? (
            <EmptyState message="No rejected requests" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {rejectedList.map((approval) => (
                <ApprovalCard
                  key={approval.id}
                  approval={approval}
                  showActions={false}
                  onProcessed={handleProcessed}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
