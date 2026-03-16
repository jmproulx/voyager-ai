"use client"

import type { FlightOffer } from "@/types/travel"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"

interface PriceComparisonProps {
  offers: FlightOffer[]
}

/**
 * Shows side-by-side prices from different providers for the same or similar flights.
 * Groups by flight number(s) and shows each provider's price.
 */
export function PriceComparison({ offers }: PriceComparisonProps) {
  // Group offers by their flight numbers
  const grouped = new Map<
    string,
    Array<{ provider: string; price: number; currency: string }>
  >()

  for (const offer of offers) {
    const key = offer.segments
      .map((s) => s.flightNumber)
      .sort()
      .join(",")

    const existing = grouped.get(key) || []
    existing.push({
      provider: offer.provider,
      price: offer.totalPrice,
      currency: offer.currency,
    })
    grouped.set(key, existing)
  }

  // Only show groups that have prices from multiple providers
  const multiProviderGroups = Array.from(grouped.entries()).filter(
    ([, prices]) => prices.length > 1
  )

  if (multiProviderGroups.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Price Comparison</h3>
      <div className="space-y-2">
        {multiProviderGroups.slice(0, 5).map(([flightNums, prices]) => (
          <div
            key={flightNums}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <span className="text-sm font-medium">{flightNums}</span>
            <div className="flex items-center gap-3">
              {prices
                .sort((a, b) => a.price - b.price)
                .map((p, idx) => {
                  const isCheapest = idx === 0 && prices.length > 1
                  return (
                    <div key={p.provider} className="flex items-center gap-1.5">
                      <Badge
                        variant={
                          p.provider === "AMADEUS" ? "secondary" : "outline"
                        }
                        className="text-[10px]"
                      >
                        {p.provider}
                      </Badge>
                      <span
                        className={`text-sm font-medium ${
                          isCheapest
                            ? "text-green-600 dark:text-green-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatCurrency(p.price, p.currency)}
                      </span>
                    </div>
                  )
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
