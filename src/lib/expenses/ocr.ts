import Anthropic from "@anthropic-ai/sdk"
import type { ReceiptOcrResult } from "@/types/expense"

const anthropic = new Anthropic()

export function getMediaTypeFromFileName(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase()
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg"
    case "png":
      return "image/png"
    case "gif":
      return "image/gif"
    case "webp":
      return "image/webp"
    default:
      return "application/octet-stream"
  }
}

export async function extractReceiptData(
  base64Image: string,
  mediaType: string
): Promise<ReceiptOcrResult> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: base64Image,
            },
          },
          {
            type: "text",
            text: `Analyze this receipt image and extract the following information in JSON format:
{
  "merchantName": "name of the merchant/store",
  "amount": total amount as a number,
  "currency": "3-letter currency code (e.g., USD)",
  "date": "YYYY-MM-DD format",
  "items": [{"description": "item name", "amount": item price as number}],
  "rawText": "all text visible on the receipt",
  "confidence": confidence score from 0 to 1
}

If you cannot determine a field, omit it or set it to null. The confidence score should reflect how confident you are in the overall extraction accuracy.

Return ONLY the JSON object, no other text.`,
          },
        ],
      },
    ],
  })

  const textContent = response.content.find((c) => c.type === "text")
  if (!textContent || textContent.type !== "text") {
    return { rawText: "", confidence: 0 }
  }

  try {
    const parsed = JSON.parse(textContent.text) as Record<string, unknown>
    return {
      merchantName: parsed.merchantName as string | undefined,
      amount: typeof parsed.amount === "number" ? parsed.amount : undefined,
      currency: parsed.currency as string | undefined,
      date: parsed.date as string | undefined,
      items: Array.isArray(parsed.items)
        ? parsed.items.map((item: Record<string, unknown>) => ({
            description: String(item.description ?? ""),
            amount: Number(item.amount ?? 0),
          }))
        : undefined,
      rawText: String(parsed.rawText ?? ""),
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
    }
  } catch {
    return {
      rawText: textContent.text,
      confidence: 0.1,
    }
  }
}
