import type { Expense, User } from "@prisma/client"

export interface ExpenseWithReceipt extends Expense {
  user: Pick<User, "id" | "name" | "email">
  approvedBy?: Pick<User, "id" | "name" | "email"> | null
}

export interface ExpenseReport {
  id: string
  tripId: string
  tripName: string
  userId: string
  userName: string
  expenses: ExpenseWithReceipt[]
  totalAmount: number
  currency: string
  generatedAt: Date
}

export interface ExpenseFilters {
  tripId?: string
  category?: Expense["category"]
  status?: Expense["status"]
  dateFrom?: string
  dateTo?: string
}

export interface ReceiptOcrResult {
  merchantName?: string
  amount?: number
  currency?: string
  date?: string
  items?: Array<{
    description: string
    amount: number
  }>
  rawText: string
  confidence: number
}
