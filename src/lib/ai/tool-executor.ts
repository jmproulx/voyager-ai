import type { ToolName } from "./tools"

const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

interface ToolInput {
  [key: string]: unknown
}

interface ToolResult {
  success: boolean
  data?: unknown
  error?: string
}

async function callInternalApi(
  path: string,
  options: {
    method?: string
    body?: unknown
    params?: Record<string, string>
  } = {}
): Promise<ToolResult> {
  const { method = "GET", body, params } = options

  let url = `${APP_BASE_URL}${path}`
  if (params) {
    const searchParams = new URLSearchParams(params)
    url += `?${searchParams.toString()}`
  }

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: (errorData as Record<string, string>).message || `API returned ${response.status}: ${response.statusText}`,
      }
    }

    const data: unknown = await response.json()
    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to call API",
    }
  }
}

async function executeSearchFlights(input: ToolInput): Promise<ToolResult> {
  return callInternalApi("/api/travel/flights", {
    params: {
      origin: input.origin as string,
      destination: input.destination as string,
      departureDate: input.departureDate as string,
      ...(input.returnDate ? { returnDate: input.returnDate as string } : {}),
      passengers: String(input.passengers || 1),
      cabinClass: (input.cabinClass as string) || "ECONOMY",
    },
  })
}

async function executeSearchHotels(input: ToolInput): Promise<ToolResult> {
  return callInternalApi("/api/travel/hotels", {
    params: {
      cityCode: input.cityCode as string,
      checkInDate: input.checkInDate as string,
      checkOutDate: input.checkOutDate as string,
      guests: String(input.guests || 1),
      ...(input.maxPrice ? { maxPrice: String(input.maxPrice) } : {}),
    },
  })
}

async function executeCreateTrip(input: ToolInput): Promise<ToolResult> {
  return callInternalApi("/api/trips", {
    method: "POST",
    body: {
      name: input.name,
      destination: input.destination,
      startDate: input.startDate,
      endDate: input.endDate,
    },
  })
}

async function executeAddBookingToTrip(input: ToolInput): Promise<ToolResult> {
  const tripId = input.tripId as string
  const bookingDetails = input.bookingDetails as Record<string, unknown>

  return callInternalApi(`/api/trips/${tripId}/bookings`, {
    method: "POST",
    body: {
      type: input.bookingType,
      provider: bookingDetails.provider,
      providerOfferId: bookingDetails.providerOfferId,
      price: bookingDetails.price,
      currency: bookingDetails.currency || "USD",
      details: bookingDetails.details || {},
    },
  })
}

async function executeGetItinerary(input: ToolInput): Promise<ToolResult> {
  const tripId = input.tripId as string
  return callInternalApi(`/api/trips/${tripId}`)
}

async function executeCheckPolicy(input: ToolInput): Promise<ToolResult> {
  return callInternalApi("/api/policy/check", {
    method: "POST",
    body: {
      bookingType: input.bookingType,
      price: input.price,
      details: input.details || {},
    },
  })
}

async function executeGetFlightStatus(input: ToolInput): Promise<ToolResult> {
  return callInternalApi("/api/alerts/flight-status", {
    params: {
      flightNumber: input.flightNumber as string,
      date: input.date as string,
    },
  })
}

async function executeCalculateCarbon(input: ToolInput): Promise<ToolResult> {
  return callInternalApi("/api/travel/carbon", {
    params: {
      origin: input.origin as string,
      destination: input.destination as string,
      ...(input.cabinClass
        ? { cabinClass: input.cabinClass as string }
        : {}),
    },
  })
}

const TOOL_EXECUTORS: Record<ToolName, (input: ToolInput) => Promise<ToolResult>> = {
  search_flights: executeSearchFlights,
  search_hotels: executeSearchHotels,
  create_trip: executeCreateTrip,
  add_booking_to_trip: executeAddBookingToTrip,
  get_itinerary: executeGetItinerary,
  check_policy: executeCheckPolicy,
  get_flight_status: executeGetFlightStatus,
  calculate_carbon: executeCalculateCarbon,
}

export async function executeTool(
  toolName: string,
  input: ToolInput
): Promise<ToolResult> {
  const executor = TOOL_EXECUTORS[toolName as ToolName]
  if (!executor) {
    return {
      success: false,
      error: `Unknown tool: ${toolName}`,
    }
  }

  try {
    return await executor(input)
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Tool execution failed",
    }
  }
}
