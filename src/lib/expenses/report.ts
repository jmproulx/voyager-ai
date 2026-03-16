import { prisma } from "@/lib/prisma"
import type { ExpenseFilters, ExpenseReport, ExpenseWithReceipt } from "@/types/expense"
import type { Prisma } from "@prisma/client"

export async function generateExpenseReport(
  userId: string,
  filters: ExpenseFilters
): Promise<ExpenseReport> {
  const where: Prisma.ExpenseWhereInput = { userId }

  if (filters.tripId) where.tripId = filters.tripId
  if (filters.category) where.category = filters.category
  if (filters.status) where.status = filters.status
  if (filters.dateFrom || filters.dateTo) {
    where.date = {}
    if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom)
    if (filters.dateTo) where.date.lte = new Date(filters.dateTo)
  }

  const expenses = await prisma.expense.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true, email: true } },
      trip: { select: { id: true, name: true } },
    },
    orderBy: { date: "desc" },
  })

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  })

  const trip = filters.tripId
    ? await prisma.trip.findUnique({
        where: { id: filters.tripId },
        select: { name: true },
      })
    : null

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0)
  const currencies = [...new Set(expenses.map((e) => e.currency))]

  return {
    id: crypto.randomUUID(),
    tripId: filters.tripId ?? "all",
    tripName: trip?.name ?? "All Trips",
    userId,
    userName: user?.name ?? "Unknown",
    expenses: expenses as ExpenseWithReceipt[],
    totalAmount: Math.round(totalAmount * 100) / 100,
    currency: currencies.length === 1 ? currencies[0] : "USD",
    generatedAt: new Date(),
  }
}

export function exportToCsv(expenses: ExpenseWithReceipt[]): string {
  const headers = [
    "Date",
    "Merchant",
    "Category",
    "Amount",
    "Currency",
    "Status",
    "Description",
  ]

  const rows = expenses.map((e) => [
    e.date instanceof Date ? e.date.toISOString().split("T")[0] : String(e.date),
    e.merchantName ?? "",
    e.category,
    String(e.amount),
    e.currency,
    e.status,
    e.description ?? "",
  ])

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n")

  return csvContent
}
