import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

interface DateRange {
  start: Date
  end: Date
}

function getDateRange(period: string): DateRange {
  const end = new Date()
  const start = new Date()

  switch (period) {
    case "7d":
      start.setDate(start.getDate() - 7)
      break
    case "30d":
      start.setDate(start.getDate() - 30)
      break
    case "90d":
      start.setDate(start.getDate() - 90)
      break
    case "1y":
      start.setFullYear(start.getFullYear() - 1)
      break
    default:
      start.setDate(start.getDate() - 30)
  }

  return { start, end }
}

export interface SpendingOverTimePoint {
  month: string
  amount: number
}

export async function getSpendingOverTime(
  userId: string,
  period: string
): Promise<SpendingOverTimePoint[]> {
  const { start, end } = getDateRange(period)

  const expenses = await prisma.expense.findMany({
    where: { userId, date: { gte: start, lte: end } },
    select: { date: true, amount: true },
    orderBy: { date: "asc" },
  })

  const monthly = new Map<string, number>()
  for (const exp of expenses) {
    const key = `${exp.date.getFullYear()}-${String(exp.date.getMonth() + 1).padStart(2, "0")}`
    monthly.set(key, (monthly.get(key) ?? 0) + exp.amount)
  }

  return Array.from(monthly.entries()).map(([month, amount]) => ({
    month,
    amount: Math.round(amount * 100) / 100,
  }))
}

export interface CategorySpend {
  category: string
  amount: number
  count: number
}

export async function getSpendByCategory(
  userId: string,
  period: string
): Promise<CategorySpend[]> {
  const { start, end } = getDateRange(period)

  const expenses = await prisma.expense.findMany({
    where: { userId, date: { gte: start, lte: end } },
    select: { category: true, amount: true },
  })

  const categories = new Map<string, { amount: number; count: number }>()
  for (const exp of expenses) {
    const existing = categories.get(exp.category) ?? { amount: 0, count: 0 }
    categories.set(exp.category, {
      amount: existing.amount + exp.amount,
      count: existing.count + 1,
    })
  }

  return Array.from(categories.entries())
    .map(([category, data]) => ({
      category,
      amount: Math.round(data.amount * 100) / 100,
      count: data.count,
    }))
    .sort((a, b) => b.amount - a.amount)
}

export interface DestinationSpend {
  destination: string
  amount: number
  tripCount: number
}

export async function getTopDestinations(
  userId: string,
  period: string
): Promise<DestinationSpend[]> {
  const { start, end } = getDateRange(period)

  const trips = await prisma.trip.findMany({
    where: {
      userId,
      startDate: { gte: start, lte: end },
      destination: { not: null },
    },
    include: { expenses: { select: { amount: true } } },
  })

  const destinations = new Map<string, { amount: number; tripCount: number }>()
  for (const trip of trips) {
    const dest = trip.destination ?? "Unknown"
    const tripTotal = trip.expenses.reduce((sum, e) => sum + e.amount, 0)
    const existing = destinations.get(dest) ?? { amount: 0, tripCount: 0 }
    destinations.set(dest, {
      amount: existing.amount + tripTotal,
      tripCount: existing.tripCount + 1,
    })
  }

  return Array.from(destinations.entries())
    .map(([destination, data]) => ({
      destination,
      amount: Math.round(data.amount * 100) / 100,
      tripCount: data.tripCount,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)
}

export async function getPolicyComplianceRate(
  userId: string,
  period: string
): Promise<{ compliant: number; total: number; rate: number }> {
  const { start, end } = getDateRange(period)

  const where: Prisma.BookingWhereInput = {
    trip: { userId, startDate: { gte: start, lte: end } },
  }

  const total = await prisma.booking.count({ where })
  const compliant = await prisma.booking.count({
    where: { ...where, policyCompliant: true },
  })

  return {
    compliant,
    total,
    rate: total > 0 ? Math.round((compliant / total) * 100) : 100,
  }
}

export async function getAverageBookingLeadTime(userId: string): Promise<number> {
  const bookings = await prisma.booking.findMany({
    where: { trip: { userId }, status: "CONFIRMED" },
    include: { trip: { select: { startDate: true } } },
  })

  if (bookings.length === 0) return 0

  let totalDays = 0
  let count = 0

  for (const booking of bookings) {
    if (booking.trip.startDate) {
      const leadTime = Math.floor(
        (booking.trip.startDate.getTime() - booking.createdAt.getTime()) /
          (1000 * 60 * 60 * 24)
      )
      if (leadTime >= 0) {
        totalDays += leadTime
        count++
      }
    }
  }

  return count > 0 ? Math.round(totalDays / count) : 0
}

export async function getCarbonFootprint(
  userId: string,
  period: string
): Promise<{ totalKg: number; monthly: Array<{ month: string; kg: number }> }> {
  const { start, end } = getDateRange(period)

  const bookings = await prisma.booking.findMany({
    where: {
      trip: { userId, startDate: { gte: start, lte: end } },
      carbonKg: { not: null },
    },
    select: { carbonKg: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  })

  const totalKg = bookings.reduce((sum, b) => sum + (b.carbonKg ?? 0), 0)

  const monthly = new Map<string, number>()
  for (const b of bookings) {
    const key = `${b.createdAt.getFullYear()}-${String(b.createdAt.getMonth() + 1).padStart(2, "0")}`
    monthly.set(key, (monthly.get(key) ?? 0) + (b.carbonKg ?? 0))
  }

  return {
    totalKg: Math.round(totalKg),
    monthly: Array.from(monthly.entries()).map(([month, kg]) => ({
      month,
      kg: Math.round(kg),
    })),
  }
}

export interface AnalyticsSummary {
  totalSpend: number
  tripCount: number
  averageTripCost: number
  complianceRate: number
  totalCarbonKg: number
  expenseCount: number
}

export async function getAnalyticsSummary(
  userId: string,
  period: string
): Promise<AnalyticsSummary> {
  const { start, end } = getDateRange(period)

  const [expenses, trips, compliance, carbon] = await Promise.all([
    prisma.expense.findMany({
      where: { userId, date: { gte: start, lte: end } },
      select: { amount: true },
    }),
    prisma.trip.findMany({
      where: { userId, startDate: { gte: start, lte: end } },
      include: { expenses: { select: { amount: true } } },
    }),
    getPolicyComplianceRate(userId, period),
    getCarbonFootprint(userId, period),
  ])

  const totalSpend = expenses.reduce((sum, e) => sum + e.amount, 0)
  const tripCount = trips.length
  const averageTripCost =
    tripCount > 0
      ? trips.reduce(
          (sum, t) => sum + t.expenses.reduce((s, e) => s + e.amount, 0),
          0
        ) / tripCount
      : 0

  return {
    totalSpend: Math.round(totalSpend * 100) / 100,
    tripCount,
    averageTripCost: Math.round(averageTripCost * 100) / 100,
    complianceRate: compliance.rate,
    totalCarbonKg: carbon.totalKg,
    expenseCount: expenses.length,
  }
}
