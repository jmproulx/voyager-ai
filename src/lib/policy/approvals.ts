import { prisma } from "@/lib/prisma"
import type { ApprovalRequest } from "@prisma/client"

interface ApprovalRequestInput {
  bookingId: string
  requesterId: string
  reason: string
}

export async function createApprovalRequest(
  input: ApprovalRequestInput
): Promise<ApprovalRequest> {
  const requester = await prisma.user.findUnique({
    where: { id: input.requesterId },
    select: { organizationId: true },
  })

  if (!requester?.organizationId) {
    throw new Error("User must belong to an organization to request approvals")
  }

  const approver = await prisma.user.findFirst({
    where: {
      organizationId: requester.organizationId,
      role: { in: ["MANAGER", "ADMIN"] },
      id: { not: input.requesterId },
    },
    select: { id: true },
  })

  if (!approver) {
    throw new Error("No manager or admin found in the organization to approve this request")
  }

  return prisma.approvalRequest.create({
    data: {
      bookingId: input.bookingId,
      requesterId: input.requesterId,
      approverId: approver.id,
      reason: input.reason,
      status: "PENDING",
    },
  })
}

export async function processApproval(
  approvalId: string,
  approverId: string,
  decision: "APPROVED" | "REJECTED",
  responseNote?: string
): Promise<ApprovalRequest> {
  const approval = await prisma.approvalRequest.findUnique({
    where: { id: approvalId },
    include: { booking: true },
  })

  if (!approval) throw new Error("Approval request not found")
  if (approval.approverId !== approverId) {
    throw new Error("Only the assigned approver can process this request")
  }
  if (approval.status !== "PENDING") {
    throw new Error("This approval request has already been processed")
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.approvalRequest.update({
      where: { id: approvalId },
      data: {
        status: decision,
        responseNote: responseNote ?? null,
        respondedAt: new Date(),
      },
    })

    if (decision === "APPROVED") {
      await tx.booking.update({
        where: { id: approval.bookingId },
        data: { status: "CONFIRMED" },
      })
    } else if (decision === "REJECTED") {
      await tx.booking.update({
        where: { id: approval.bookingId },
        data: { status: "CANCELLED" },
      })
    }

    return updated
  })
}

export async function getPendingApprovals(approverId: string) {
  return prisma.approvalRequest.findMany({
    where: { approverId, status: "PENDING" },
    include: {
      booking: {
        include: {
          trip: { select: { id: true, name: true, destination: true } },
        },
      },
      requester: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getApprovalHistory(approverId: string) {
  return prisma.approvalRequest.findMany({
    where: {
      approverId,
      status: { in: ["APPROVED", "REJECTED"] },
    },
    include: {
      booking: {
        include: {
          trip: { select: { id: true, name: true, destination: true } },
        },
      },
      requester: { select: { id: true, name: true, email: true } },
    },
    orderBy: { respondedAt: "desc" },
    take: 50,
  })
}
