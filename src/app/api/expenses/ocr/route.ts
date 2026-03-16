import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { extractReceiptData, getMediaTypeFromFileName } from "@/lib/expenses/ocr"

const MAX_FILE_SIZE = 10 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("receipt") as File | null

    if (!file) {
      return NextResponse.json({ error: "No receipt file provided" }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 })
    }

    const mediaType = file.type || getMediaTypeFromFileName(file.name)
    const supportedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]

    if (!supportedTypes.includes(mediaType)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${mediaType}. Supported: JPEG, PNG, GIF, WebP` },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString("base64")
    const result = await extractReceiptData(base64, mediaType)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error processing receipt OCR:", error)
    return NextResponse.json({ error: "Failed to process receipt" }, { status: 500 })
  }
}
