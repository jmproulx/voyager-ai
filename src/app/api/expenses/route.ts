import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod/v4"
import { categorizeExpense } from "@/lib/expenses/categorize"
import type { Prisma } from "@prisma/client"

const createExpenseSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default("USD"),
  category: z.enum(["FLIGHT", "HOTEL", "MEAL", "TRANSPORT", "OTHER"]).optional(),
  merchantName: z.string().optional(),
  date: z.string(),
  description: z.string().optional(),
  tripId: z.string().optional(),
  receiptUrl: z.string().optional(),
  receiptOcrData: z.record(z.string(), z.unknown()).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tripId = searchParams.get("tripId")
    const category = searchParams.get("category")
    const status = searchParams.get("status")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") ?? "1")
    const limit = parseInt(searchParams.get("limit") ?? "20")

    const where: Prisma.ExpenseWhereInput = {
      userId: session.user.id,
    }

    if (tripId) where.tripId = tripId
    if (category) where.category = category as Prisma.ExpenseWhereInput["category"]
    if (status) where.status = status as Prisma.ExpenseWhereInput["status"]
    if (dateFrom || dateTo) {
      where.date = {}
      if (dateFrom) where.date.gte = new Date(dateFrom)
      if (dateTo) where.date.lte = new Date(dateTo)
    }
    if (search) {
      where.OR = [
        { merchantName: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          approvedBy: { select: { id: true, name: true, email: true } },
          trip: { select: { id: true, name: true } },
        },
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ])

    return NextResponse.json({ expenses, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error("Error fetching expenses:", error)
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = createExpenseSchema.parse(body)

    const category =
      data.category ?? categorizeExpense(data.merchantName ?? "", data.description ?? "")

    const expense = await prisma.expense.create({
      data: {
        userId: session.user.id,
        amount: data.amount,
        currency: data.currency,
        category,
        merchantName: data.merchantName,
        date: new Date(data.date),
        description: data.description,
        tripId: data.tripId ?? null,
        receiptUrl: data.receiptUrl,
        receiptOcrData: data.receiptOcrData
          ? (data.receiptOcrData as Prisma.InputJsonValue)
          : undefined,
        status: "PENDING",
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        trip: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 })
    }
    console.error("Error creating expense:", error)
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 })
  }
}
