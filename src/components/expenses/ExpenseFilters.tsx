"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X, Search } from "lucide-react"

interface ExpenseFiltersState {
  category: string
  status: string
  dateFrom: string
  dateTo: string
  tripId: string
  search: string
}

interface Trip {
  id: string
  name: string
}

interface ExpenseFiltersProps {
  filters: ExpenseFiltersState
  trips: Trip[]
  onFiltersChange: (filters: ExpenseFiltersState) => void
}

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "FLIGHT", label: "Flight" },
  { value: "HOTEL", label: "Hotel" },
  { value: "MEAL", label: "Meal" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "OTHER", label: "Other" },
]

const STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
]

const defaultFilters: ExpenseFiltersState = {
  category: "",
  status: "",
  dateFrom: "",
  dateTo: "",
  tripId: "",
  search: "",
}

export function ExpenseFilters({
  filters,
  trips,
  onFiltersChange,
}: ExpenseFiltersProps) {
  const hasActiveFilters = Object.values(filters).some((v) => v !== "")

  function updateFilter(key: keyof ExpenseFiltersState, value: string) {
    onFiltersChange({ ...filters, [key]: value })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search merchant or description..."
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
          className="pl-8"
        />
      </div>

      <Select
        value={filters.category}
        onValueChange={(val) => updateFilter("category", val as string)}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          {CATEGORIES.map((cat) => (
            <SelectItem key={cat.value || "all-cat"} value={cat.value}>
              {cat.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.status}
        onValueChange={(val) => updateFilter("status", val as string)}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map((st) => (
            <SelectItem key={st.value || "all-status"} value={st.value}>
              {st.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.tripId}
        onValueChange={(val) => updateFilter("tripId", val as string)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Trip" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Trips</SelectItem>
          {trips.map((trip) => (
            <SelectItem key={trip.id} value={trip.id}>
              {trip.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="date"
        placeholder="From"
        value={filters.dateFrom}
        onChange={(e) => updateFilter("dateFrom", e.target.value)}
        className="w-[140px]"
      />

      <Input
        type="date"
        placeholder="To"
        value={filters.dateTo}
        onChange={(e) => updateFilter("dateTo", e.target.value)}
        className="w-[140px]"
      />

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onFiltersChange(defaultFilters)}
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  )
}

export type { ExpenseFiltersState }
