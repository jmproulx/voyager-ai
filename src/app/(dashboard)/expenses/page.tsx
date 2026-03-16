"use client"

import { useEffect, useState, useCallback } from "react"
import { ExpenseSummary } from "@/components/expenses/ExpenseSummary"
import { ExpenseFilters, type ExpenseFiltersState } from "@/components/expenses/ExpenseFilters"
import { ExpenseTable } from "@/components/expenses/ExpenseTable"
import { AddExpenseDialog } from "@/components/expenses/AddExpenseDialog"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

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

interface Trip {
  id: string
  name: string
}

interface SummaryData {
  totalAmount: number
  averageAmount: number
  pendingCount: number
  approvedTotal: number
}

const defaultFilters: ExpenseFiltersState = {
  category: "",
  status: "",
  dateFrom: "",
  dateTo: "",
  tripId: "",
  search: "",
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseRow[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [filters, setFilters] = useState<ExpenseFiltersState>(defaultFilters)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.category) params.set("category", filters.category)
      if (filters.status) params.set("status", filters.status)
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom)
      if (filters.dateTo) params.set("dateTo", filters.dateTo)
      if (filters.tripId) params.set("tripId", filters.tripId)
      if (filters.search) params.set("search", filters.search)
      params.set("limit", "100")

      const response = await fetch(`/api/expenses?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch expenses")

      const data = await response.json()
      const allExpenses: ExpenseRow[] = data.expenses ?? []
      setExpenses(allExpenses)

      const total = allExpenses.reduce((sum: number, e: ExpenseRow) => sum + e.amount, 0)
      const pending = allExpenses.filter((e: ExpenseRow) => e.status === "PENDING")
      const approved = allExpenses.filter((e: ExpenseRow) => e.status === "APPROVED")
      const approvedTotal = approved.reduce((sum: number, e: ExpenseRow) => sum + e.amount, 0)

      setSummary({
        totalAmount: total,
        averageAmount: allExpenses.length > 0 ? total / allExpenses.length : 0,
        pendingCount: pending.length,
        approvedTotal,
      })
    } catch (err) {
      console.error("Error fetching expenses:", err)
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  const fetchTrips = useCallback(async () => {
    try {
      const response = await fetch("/api/trips")
      if (response.ok) {
        const data = await response.json()
        const tripList = Array.isArray(data) ? data : data.trips ?? []
        setTrips(tripList.map((t: { id: string; name: string }) => ({ id: t.id, name: t.name })))
      }
    } catch {
      // trips endpoint may not exist yet on this branch
    }
  }, [])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  useEffect(() => {
    fetchTrips()
  }, [fetchTrips])

  async function handleDelete(id: string) {
    try {
      const response = await fetch(`/api/expenses/${id}`, { method: "DELETE" })
      if (response.ok) {
        fetchExpenses()
      }
    } catch (err) {
      console.error("Error deleting expense:", err)
    }
  }

  async function handleExportCsv() {
    setExporting(true)
    try {
      const body: Record<string, string> = { format: "csv" }
      if (filters.category) body.category = filters.category
      if (filters.status) body.status = filters.status
      if (filters.dateFrom) body.dateFrom = filters.dateFrom
      if (filters.dateTo) body.dateTo = filters.dateTo
      if (filters.tripId) body.tripId = filters.tripId

      const response = await fetch("/api/expenses/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) throw new Error("Export failed")

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `expenses-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Error exporting:", err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">
            Track and manage your business travel expenses.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportCsv}
            disabled={exporting || expenses.length === 0}
          >
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
          <AddExpenseDialog trips={trips} onExpenseAdded={fetchExpenses} />
        </div>
      </div>

      <ExpenseSummary data={summary} loading={loading} />

      <ExpenseFilters
        filters={filters}
        trips={trips}
        onFiltersChange={setFilters}
      />

      <ExpenseTable
        expenses={expenses}
        loading={loading}
        onDelete={handleDelete}
      />
    </div>
  )
}
