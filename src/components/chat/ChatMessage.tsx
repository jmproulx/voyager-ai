"use client"

import { useMemo } from "react"
import ReactMarkdown from "react-markdown"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Plane, Bot, User, Wrench, Loader2 } from "lucide-react"
import { FlightResultCard, type FlightResultData } from "./FlightResultCard"
import { HotelResultCard, type HotelResultData } from "./HotelResultCard"

export interface ToolCallInfo {
  toolName: string
  toolInput?: Record<string, unknown>
  result?: {
    success: boolean
    data?: unknown
    error?: string
  }
  isLoading?: boolean
}

interface ChatMessageProps {
  role: "user" | "assistant" | "tool_status"
  content: string
  toolCalls?: ToolCallInfo[]
  isStreaming?: boolean
  onBookFlight?: (flight: FlightResultData) => void
  onBookHotel?: (hotel: HotelResultData) => void
}

function extractFlightResults(toolCalls: ToolCallInfo[]): FlightResultData[] {
  const flights: FlightResultData[] = []
  for (const tc of toolCalls) {
    if (tc.toolName === "search_flights" && tc.result?.success && tc.result.data) {
      const data = tc.result.data as Record<string, unknown>
      const offers = (data.offers || data.flights || data.data || []) as Array<Record<string, unknown>>
      for (const offer of offers) {
        const segments = (offer.segments || []) as Array<Record<string, unknown>>
        const firstSegment = segments[0] || {}
        const lastSegment = segments[segments.length - 1] || firstSegment

        flights.push({
          id: (offer.id as string) || String(Math.random()),
          airline: (firstSegment.airline as string) || (offer.airline as string) || "Unknown",
          flightNumber: (firstSegment.flightNumber as string) || (offer.flightNumber as string) || "",
          departureAirport: (firstSegment.departureAirport as string) || (offer.origin as string) || "",
          arrivalAirport: (lastSegment.arrivalAirport as string) || (offer.destination as string) || "",
          departureTime: (firstSegment.departureTime as string) || (offer.departureTime as string) || "",
          arrivalTime: (lastSegment.arrivalTime as string) || (offer.arrivalTime as string) || "",
          duration: (offer.totalDuration as string) || (offer.duration as string) || "",
          stops: (offer.stops as number) ?? segments.length - 1,
          price: (offer.totalPrice as number) || (offer.price as number) || 0,
          currency: (offer.currency as string) || "USD",
          cabinClass: (offer.cabinClass as string) || (firstSegment.cabinClass as string) || "ECONOMY",
          carbonKg: offer.carbonKg as number | undefined,
          policyCompliant: offer.policyCompliant as boolean | undefined,
          policyViolationReason: offer.policyViolationReason as string | undefined,
          provider: offer.provider as string | undefined,
        })
      }
    }
  }
  return flights
}

function extractHotelResults(toolCalls: ToolCallInfo[]): HotelResultData[] {
  const hotels: HotelResultData[] = []
  for (const tc of toolCalls) {
    if (tc.toolName === "search_hotels" && tc.result?.success && tc.result.data) {
      const data = tc.result.data as Record<string, unknown>
      const offers = (data.offers || data.hotels || data.data || []) as Array<Record<string, unknown>>
      for (const offer of offers) {
        hotels.push({
          id: (offer.id as string) || String(Math.random()),
          hotelName: (offer.hotelName as string) || (offer.name as string) || "Unknown Hotel",
          starRating: offer.starRating as number | undefined,
          pricePerNight: (offer.pricePerNight as number) || (offer.price as number) || 0,
          totalPrice: (offer.totalPrice as number) || (offer.pricePerNight as number) || 0,
          currency: (offer.currency as string) || "USD",
          amenities: (offer.amenities as string[]) || [],
          address: offer.address as string | undefined,
          roomType: offer.roomType as string | undefined,
          checkIn: offer.checkIn as string | undefined,
          checkOut: offer.checkOut as string | undefined,
          policyCompliant: offer.policyCompliant as boolean | undefined,
          policyViolationReason: offer.policyViolationReason as string | undefined,
          provider: offer.provider as string | undefined,
        })
      }
    }
  }
  return hotels
}

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  search_flights: "Searching flights",
  search_hotels: "Searching hotels",
  create_trip: "Creating trip",
  add_booking_to_trip: "Adding booking",
  get_itinerary: "Loading itinerary",
  check_policy: "Checking policy",
  get_flight_status: "Checking flight status",
  calculate_carbon: "Calculating carbon footprint",
}

export function ChatMessage({
  role,
  content,
  toolCalls,
  isStreaming,
  onBookFlight,
  onBookHotel,
}: ChatMessageProps) {
  const flightResults = useMemo(
    () => (toolCalls ? extractFlightResults(toolCalls) : []),
    [toolCalls]
  )
  const hotelResults = useMemo(
    () => (toolCalls ? extractHotelResults(toolCalls) : []),
    [toolCalls]
  )

  if (role === "tool_status") {
    const loadingTools = toolCalls?.filter((tc) => tc.isLoading) || []
    if (loadingTools.length === 0) return null

    return (
      <div className="flex items-center gap-2 px-4 py-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {loadingTools
            .map((tc) => TOOL_DISPLAY_NAMES[tc.toolName] || tc.toolName)
            .join(", ")}
          ...
        </span>
      </div>
    )
  }

  const isUser = role === "user"

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <Avatar size="sm" className="mt-0.5 shrink-0">
        <AvatarFallback>
          {isUser ? (
            <User className="h-3.5 w-3.5" />
          ) : (
            <Plane className="h-3.5 w-3.5" />
          )}
        </AvatarFallback>
      </Avatar>

      {/* Message content */}
      <div
        className={cn(
          "max-w-[85%] space-y-2",
          isUser ? "items-end" : "items-start"
        )}
      >
        {/* Label */}
        <p className={cn("text-xs font-medium text-muted-foreground", isUser && "text-right")}>
          {isUser ? "You" : "Voyager"}
        </p>

        {/* Bubble */}
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted rounded-bl-md"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              <ReactMarkdown>{content}</ReactMarkdown>
              {isStreaming && (
                <span className="inline-block h-4 w-1.5 animate-pulse bg-foreground/60" />
              )}
            </div>
          )}
        </div>

        {/* Tool call status badges */}
        {toolCalls && toolCalls.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {toolCalls.map((tc, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {tc.isLoading ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : tc.result?.success ? (
                  <Wrench className="mr-1 h-3 w-3 text-green-600" />
                ) : tc.result ? (
                  <Wrench className="mr-1 h-3 w-3 text-destructive" />
                ) : (
                  <Bot className="mr-1 h-3 w-3" />
                )}
                {TOOL_DISPLAY_NAMES[tc.toolName] || tc.toolName}
              </Badge>
            ))}
          </div>
        )}

        {/* Flight result cards */}
        {flightResults.length > 0 && (
          <div className="space-y-1">
            {flightResults.map((flight) => (
              <FlightResultCard
                key={flight.id}
                flight={flight}
                onBook={onBookFlight}
              />
            ))}
          </div>
        )}

        {/* Hotel result cards */}
        {hotelResults.length > 0 && (
          <div className="space-y-1">
            {hotelResults.map((hotel) => (
              <HotelResultCard
                key={hotel.id}
                hotel={hotel}
                onBook={onBookHotel}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
