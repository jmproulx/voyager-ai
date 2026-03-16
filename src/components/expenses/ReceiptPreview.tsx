"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import type { ReceiptOcrResult } from "@/types/expense"

interface ReceiptPreviewProps {
  result: ReceiptOcrResult
  imageUrl?: string | null
}

export function ReceiptPreview({ result, imageUrl }: ReceiptPreviewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {imageUrl && (
        <div className="flex items-center justify-center rounded-lg border bg-muted/30 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Receipt"
            className="max-h-64 rounded object-contain"
          />
        </div>
      )}

      <Card className={imageUrl ? "" : "md:col-span-2"}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Extracted Data</CardTitle>
            <Badge variant={result.confidence > 0.7 ? "default" : "secondary"}>
              {Math.round(result.confidence * 100)}% confidence
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.merchantName && (
            <div>
              <p className="text-xs text-muted-foreground">Merchant</p>
              <p className="font-medium">{result.merchantName}</p>
            </div>
          )}

          {result.amount !== undefined && (
            <div>
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="font-medium">
                {formatCurrency(result.amount, result.currency ?? "USD")}
              </p>
            </div>
          )}

          {result.date && (
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="font-medium">{result.date}</p>
            </div>
          )}

          {result.items && result.items.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Items</p>
              <div className="space-y-1">
                {result.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between text-sm border-b border-dashed pb-1 last:border-0"
                  >
                    <span>{item.description}</span>
                    <span className="font-mono">
                      {formatCurrency(item.amount, result.currency ?? "USD")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
