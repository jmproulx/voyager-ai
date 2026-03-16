"use client"

import { useCallback, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, Loader2, FileImage } from "lucide-react"
import type { ReceiptOcrResult } from "@/types/expense"

interface ReceiptUploaderProps {
  onOcrResult: (result: ReceiptOcrResult, file: File) => void
  disabled?: boolean
}

export function ReceiptUploader({ onOcrResult, disabled }: ReceiptUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const processFile = useCallback(
    async (file: File) => {
      const supportedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
      if (!supportedTypes.includes(file.type)) {
        setError("Unsupported file type. Please upload JPEG, PNG, or WebP.")
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        setError("File size exceeds 10MB limit.")
        return
      }

      setError(null)
      setProcessing(true)

      const reader = new FileReader()
      reader.onload = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      try {
        const formData = new FormData()
        formData.append("receipt", file)

        const response = await fetch("/api/expenses/ocr", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const errData = await response.json()
          throw new Error(errData.error ?? "OCR processing failed")
        }

        const result: ReceiptOcrResult = await response.json()
        onOcrResult(result, file)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to process receipt")
      } finally {
        setProcessing(false)
      }
    },
    [onOcrResult]
  )

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave() {
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      processFile(file)
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  return (
    <div className="space-y-4">
      <Card
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-8">
          {processing ? (
            <>
              <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
              <p className="text-sm font-medium">Processing receipt...</p>
              <p className="text-xs text-muted-foreground mt-1">
                Extracting data with Claude Vision
              </p>
            </>
          ) : preview ? (
            <>
              <FileImage className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Receipt uploaded</p>
              <p className="text-xs text-muted-foreground mt-1">
                Drop another file or click to replace
              </p>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">
                Drop your receipt here or click to upload
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JPEG, PNG, or WebP (max 10MB)
              </p>
            </>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={processing || disabled}
          />
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {preview && !processing && (
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Receipt preview"
            className="max-h-48 rounded-lg border object-contain"
          />
        </div>
      )}
    </div>
  )
}
