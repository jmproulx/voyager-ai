"use client"

import { useState, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ReceiptUploader } from "./ReceiptUploader"
import { ReceiptPreview } from "./ReceiptPreview"
import { Plus, Loader2 } from "lucide-react"
import type { ReceiptOcrResult } from "@/types/expense"

interface Trip {
  id: string
  name: string
}

interface AddExpenseDialogProps {
  trips: Trip[]
  onExpenseAdded: () => void
}

const CATEGORIES = [
  { value: "FLIGHT", label: "Flight" },
  { value: "HOTEL", label: "Hotel" },
  { value: "MEAL", label: "Meal" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "OTHER", label: "Other" },
]

export function AddExpenseDialog({ trips, onExpenseAdded }: AddExpenseDialogProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [ocrResult, setOcrResult] = useState<ReceiptOcrResult | null>(null)
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null)

  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [category, setCategory] = useState("")
  const [merchantName, setMerchantName] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [description, setDescription] = useState("")
  const [tripId, setTripId] = useState("")

  function resetForm() {
    setAmount("")
    setCurrency("USD")
    setCategory("")
    setMerchantName("")
    setDate(new Date().toISOString().split("T")[0])
    setDescription("")
    setTripId("")
    setOcrResult(null)
    setReceiptPreviewUrl(null)
  }

  const handleOcrResult = useCallback((result: ReceiptOcrResult, file: File) => {
    setOcrResult(result)

    const reader = new FileReader()
    reader.onload = () => setReceiptPreviewUrl(reader.result as string)
    reader.readAsDataURL(file)

    if (result.amount !== undefined) setAmount(String(result.amount))
    if (result.currency) setCurrency(result.currency)
    if (result.merchantName) setMerchantName(result.merchantName)
    if (result.date) setDate(result.date)
  }, [])

  async function handleSubmit() {
    if (!amount || !date) return

    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        amount: parseFloat(amount),
        currency,
        date,
        merchantName: merchantName || undefined,
        description: description || undefined,
        tripId: tripId || undefined,
      }

      if (category) {
        body.category = category
      }

      if (ocrResult) {
        body.receiptOcrData = ocrResult
      }

      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error("Failed to create expense")
      }

      resetForm()
      setOpen(false)
      onExpenseAdded()
    } catch (err) {
      console.error("Error creating expense:", err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) resetForm()
    }}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4 mr-1" />
        Add Expense
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="manual">
          <TabsList>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="scan">Scan Receipt</TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="space-y-4 mt-4">
            <ReceiptUploader onOcrResult={handleOcrResult} />
            {ocrResult && (
              <ReceiptPreview result={ocrResult} imageUrl={receiptPreviewUrl} />
            )}
          </TabsContent>

          <TabsContent value="manual" className="mt-4">
            <div />
          </TabsContent>
        </Tabs>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={(val) => setCurrency(val as string)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={(val) => setCategory(val as string)}>
                <SelectTrigger>
                  <SelectValue placeholder="Auto-detect" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="merchant">Merchant</Label>
            <Input
              id="merchant"
              placeholder="e.g., Starbucks, Hilton"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="trip">Trip</Label>
            <Select value={tripId} onValueChange={(val) => setTripId(val as string)}>
              <SelectTrigger>
                <SelectValue placeholder="No trip" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No trip</SelectItem>
                {trips.map((trip) => (
                  <SelectItem key={trip.id} value={trip.id}>
                    {trip.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!amount || !date || saving}
          >
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Save Expense
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
