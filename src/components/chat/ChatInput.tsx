"use client"

import { useRef, useCallback, type KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Loader2 } from "lucide-react"

interface ChatInputProps {
  onSend: (message: string) => void
  isLoading: boolean
  isNewConversation?: boolean
}

const SUGGESTED_PROMPTS = [
  "Find me a flight from NYC to San Francisco next Tuesday",
  "Search for hotels in London for a 3-night business trip",
  "Help me plan a trip to the Chicago conference in April",
  "Check the status of flight AA1234",
  "What's our company travel policy for business class?",
  "Calculate the carbon footprint for a flight from LAX to LHR",
]

export function ChatInput({ onSend, isLoading, isNewConversation }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = useCallback(() => {
    const value = textareaRef.current?.value.trim()
    if (!value || isLoading) return
    onSend(value)
    if (textareaRef.current) {
      textareaRef.current.value = ""
    }
  }, [onSend, isLoading])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const handleSuggestedPrompt = useCallback(
    (prompt: string) => {
      if (isLoading) return
      onSend(prompt)
    },
    [onSend, isLoading]
  )

  return (
    <div className="border-t bg-background px-4 pb-4 pt-3">
      {isNewConversation && (
        <div className="mb-3 flex flex-wrap gap-2">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSuggestedPrompt(prompt)}
              disabled={isLoading}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          placeholder="Ask Voyager anything about travel..."
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          className="min-h-10 max-h-32 resize-none"
          rows={1}
        />
        <Button
          onClick={handleSend}
          disabled={isLoading}
          size="icon"
          className="shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
      <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
        Voyager uses real travel APIs. Press Enter to send, Shift+Enter for new line.
      </p>
    </div>
  )
}
