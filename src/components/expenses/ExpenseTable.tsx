"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowUpDown, Trash2 } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

interface ExpenseRow {
  id: string
  date: string
  merchantName: string | null
  category: string
  amount: number
  currency: string
  status: string
  description: string | null
  trip: { id: string; name: string } | null
}

interface ExpenseTableProps {
  expenses: ExpenseRow[]
  loading: boolean
  onDelete: (id: string) => void
}

type SortField = "date" | "amount" | "merchantName" | "category" | "status"
type SortDirection = "asc" | "desc"

function getCategoryVariant(category: string): "default" | "secondary" | "destructive" | "outline" {
  switch (category) {
    case "FLIGHT":
      return "default"
    case "HOTEL":
      return "secondary"
    case "MEAL":
      return "outline"
    case "TRANSPORT":
      return "default"
    default:
      return "outline"
  }
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

export function ExpenseTable({ expenses, loading, onDelete }: ExpenseTableProps) {
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const sorted = [...expenses].sort((a, b) => {
    const multiplier = sortDirection === "asc" ? 1 : -1
    switch (sortField) {
      case "date":
        return multiplier * (new Date(a.date).getTime() - new Date(b.date).getTime())
      case "amount":
        return multiplier * (a.amount - b.amount)
      case "merchantName":
        return multiplier * (a.merchantName ?? "").localeCompare(b.merchantName ?? "")
      case "category":
        return multiplier * a.category.localeCompare(b.category)
      case "status":
        return multiplier * a.status.localeCompare(b.status)
      default:
        return 0
    }
  })

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-medium text-muted-foreground">No expenses found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Add an expense to get started tracking your spending.
        </p>
      </div>
    )
  }

  function SortButton({ field, children }: { field: SortField; children: React.ReactNode }) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8"
        onClick={() => toggleSort(field)}
      >
        {children}
        <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <SortButton field="date">Date</SortButton>
          </TableHead>
          <TableHead>
            <SortButton field="merchantName">Merchant</SortButton>
          </TableHead>
          <TableHead>
            <SortButton field="category">Category</SortButton>
          </TableHead>
          <TableHead className="text-right">
            <SortButton field="amount">Amount</SortButton>
          </TableHead>
          <TableHead>Trip</TableHead>
          <TableHead>
            <SortButton field="status">Status</SortButton>
          </TableHead>
          <TableHead className="w-[60px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((expense) => (
          <TableRow key={expense.id}>
            <TableCell>{formatDate(expense.date)}</TableCell>
            <TableCell className="font-medium">
              {expense.merchantName ?? "Unknown"}
            </TableCell>
            <TableCell>
              <Badge variant={getCategoryVariant(expense.category)}>
                {expense.category}
              </Badge>
            </TableCell>
            <TableCell className="text-right font-mono">
              {formatCurrency(expense.amount, expense.currency)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {expense.trip?.name ?? "--"}
            </TableCell>
            <TableCell>
              <Badge variant={getStatusVariant(expense.status)}>
                {expense.status}
              </Badge>
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onDelete(expense.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
