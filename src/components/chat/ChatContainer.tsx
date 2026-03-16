"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plane, MessageSquare } from "lucide-react"
import { ChatMessage, type ToolCallInfo } from "./ChatMessage"
import { ChatInput } from "./ChatInput"
import type { FlightResultData } from "./FlightResultCard"
import type { HotelResultData } from "./HotelResultCard"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  toolCalls?: ToolCallInfo[]
  isStreaming?: boolean
}

interface StreamEvent {
  type: "text" | "tool_use_start" | "tool_result" | "done" | "error"
  text?: string
  toolName?: string
  toolInput?: Record<string, unknown>
  result?: {
    success: boolean
    data?: unknown
    error?: string
  }
  conversationId?: string
  error?: string
}

interface ChatContainerProps {
  conversationId: string | null
  onConversationCreated: (id: string) => void
  initialMessages?: Array<{
    id: string
    role: string
    content: string
    toolCalls?: unknown
    toolResults?: unknown
  }>
}

export function ChatContainer({
  conversationId,
  onConversationCreated,
  initialMessages,
}: ChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeToolCalls, setActiveToolCalls] = useState<ToolCallInfo[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const currentConversationIdRef = useRef(conversationId)

  // Load initial messages when conversation changes
  useEffect(() => {
    currentConversationIdRef.current = conversationId

    if (initialMessages && initialMessages.length > 0) {
      const parsed: Message[] = []
      for (const msg of initialMessages) {
        if (msg.role === "USER") {
          parsed.push({
            id: msg.id,
            role: "user",
            content: msg.content,
          })
        } else if (msg.role === "ASSISTANT" && msg.content) {
          const toolCallInfos: ToolCallInfo[] = []
          if (msg.toolCalls && Array.isArray(msg.toolCalls)) {
            for (const tc of msg.toolCalls as Array<{
              id: string
              name: string
              input: Record<string, unknown>
            }>) {
              toolCallInfos.push({
                toolName: tc.name,
                toolInput: tc.input,
              })
            }
          }
          parsed.push({
            id: msg.id,
            role: "assistant",
            content: msg.content,
            toolCalls: toolCallInfos.length > 0 ? toolCallInfos : undefined,
          })
        }
        // Skip TOOL messages — their results are shown via the assistant message's toolCalls
      }
      setMessages(parsed)
    } else {
      setMessages([])
    }
  }, [conversationId, initialMessages])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, activeToolCalls])

  const handleSend = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return

      const userMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "user",
        content,
      }

      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)
      setActiveToolCalls([])

      // Create streaming assistant message
      const assistantMessageId = `msg-${Date.now()}-assistant`
      const streamingMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        isStreaming: true,
      }
      setMessages((prev) => [...prev, streamingMessage])

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content }],
            conversationId: currentConversationIdRef.current,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(
            (errorData as Record<string, string>).error || `HTTP ${response.status}`
          )
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error("No response body")

        const decoder = new TextDecoder()
        let buffer = ""
        let fullText = ""
        const allToolCalls: ToolCallInfo[] = []

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue
            const jsonStr = line.slice(6).trim()
            if (!jsonStr) continue

            try {
              const event = JSON.parse(jsonStr) as StreamEvent

              switch (event.type) {
                case "text":
                  fullText += event.text || ""
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMessageId
                        ? { ...m, content: fullText, isStreaming: true }
                        : m
                    )
                  )
                  break

                case "tool_use_start": {
                  const newToolCall: ToolCallInfo = {
                    toolName: event.toolName || "",
                    isLoading: true,
                  }
                  allToolCalls.push(newToolCall)
                  setActiveToolCalls([...allToolCalls])
                  break
                }

                case "tool_result": {
                  // Find the matching tool call and update it
                  const matchingTc = allToolCalls.find(
                    (tc) =>
                      tc.toolName === event.toolName && tc.isLoading
                  )
                  if (matchingTc) {
                    matchingTc.isLoading = false
                    matchingTc.toolInput = event.toolInput
                    matchingTc.result = event.result
                  }
                  setActiveToolCalls([...allToolCalls])

                  // Reset the streaming message for a fresh response after tool calls
                  fullText = ""
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMessageId
                        ? {
                            ...m,
                            content: "",
                            toolCalls: [...allToolCalls],
                            isStreaming: true,
                          }
                        : m
                    )
                  )
                  break
                }

                case "done":
                  // Finalize the message
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMessageId
                        ? {
                            ...m,
                            content: fullText,
                            isStreaming: false,
                            toolCalls:
                              allToolCalls.length > 0
                                ? [...allToolCalls]
                                : undefined,
                          }
                        : m
                    )
                  )
                  setActiveToolCalls([])

                  if (
                    event.conversationId &&
                    !currentConversationIdRef.current
                  ) {
                    currentConversationIdRef.current = event.conversationId
                    onConversationCreated(event.conversationId)
                  }
                  break

                case "error":
                  throw new Error(event.error || "Stream error")
              }
            } catch (parseError) {
              // Skip malformed events
              if (parseError instanceof Error && parseError.message !== "Stream error") {
                continue
              }
              throw parseError
            }
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to send message"

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? {
                  ...m,
                  content: `I'm sorry, I encountered an error: ${errorMessage}. Please try again.`,
                  isStreaming: false,
                }
              : m
          )
        )
      } finally {
        setIsLoading(false)
        setActiveToolCalls([])
      }
    },
    [isLoading, onConversationCreated]
  )

  const handleBookFlight = useCallback(
    (flight: FlightResultData) => {
      handleSend(
        `I'd like to book this flight: ${flight.airline} ${flight.flightNumber} from ${flight.departureAirport} to ${flight.arrivalAirport} at ${flight.price} ${flight.currency}.`
      )
    },
    [handleSend]
  )

  const handleBookHotel = useCallback(
    (hotel: HotelResultData) => {
      handleSend(
        `I'd like to book: ${hotel.hotelName} at ${hotel.pricePerNight} ${hotel.currency}/night.`
      )
    },
    [handleSend]
  )

  const isNewConversation = messages.length === 0

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div className="flex-1 overflow-hidden">
        {isNewConversation && !isLoading ? (
          <div className="flex h-full flex-col items-center justify-center px-6">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Plane className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">
              Welcome to Voyager
            </h2>
            <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">
              Your AI-powered travel assistant. Ask me to search flights, find
              hotels, plan trips, check travel policy, or track flight status.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Powered by Claude with real travel APIs</span>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div ref={scrollRef} className="flex flex-col py-4">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  toolCalls={message.toolCalls}
                  isStreaming={message.isStreaming}
                  onBookFlight={handleBookFlight}
                  onBookHotel={handleBookHotel}
                />
              ))}
              {/* Active tool calls indicator */}
              {activeToolCalls.some((tc) => tc.isLoading) && (
                <ChatMessage
                  role="tool_status"
                  content=""
                  toolCalls={activeToolCalls}
                />
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Input area */}
      <ChatInput
        onSend={handleSend}
        isLoading={isLoading}
        isNewConversation={isNewConversation}
      />
    </div>
  )
}
