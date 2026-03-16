const BASE_URL = "https://aeroapi.flightaware.com/aeroapi"

interface FlightAwareConfig {
  apiKey: string
}

function getConfig(): FlightAwareConfig | null {
  const apiKey = process.env.FLIGHTAWARE_API_KEY
  if (!apiKey) return null
  return { apiKey }
}

export function isFlightAwareConfigured(): boolean {
  return Boolean(process.env.FLIGHTAWARE_API_KEY)
}

async function fetchFlightAware(path: string): Promise<Response | null> {
  const config = getConfig()
  if (!config) return null

  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "x-apikey": config.apiKey,
      Accept: "application/json; charset=UTF-8",
    },
  })

  return response
}

export interface FlightPosition {
  latitude: number
  longitude: number
  altitude: number
  groundspeed: number
  heading: number
  timestamp: string
}

export interface FlightStatus {
  flightNumber: string
  ident: string
  status: string
  departureAirport: string
  arrivalAirport: string
  scheduledDeparture: string | null
  actualDeparture: string | null
  estimatedDeparture: string | null
  scheduledArrival: string | null
  actualArrival: string | null
  estimatedArrival: string | null
  departureGate: string | null
  arrivalGate: string | null
  departureTerminal: string | null
  arrivalTerminal: string | null
  aircraftType: string | null
  delayMinutes: number
  cancelled: boolean
  diverted: boolean
}

export async function getFlightStatus(
  flightNumber: string,
  date?: string
): Promise<FlightStatus | null> {
  const config = getConfig()
  if (!config) return null

  // Normalize flight number (remove spaces, uppercase)
  const normalized = flightNumber.replace(/\s+/g, "").toUpperCase()

  let path = `/flights/${normalized}`
  if (date) {
    // FlightAware uses start/end query params for date filtering
    const startDate = new Date(date)
    const endDate = new Date(date)
    endDate.setDate(endDate.getDate() + 1)
    path += `?start=${startDate.toISOString()}&end=${endDate.toISOString()}`
  }

  try {
    const response = await fetchFlightAware(path)
    if (!response || !response.ok) {
      console.error("FlightAware API error:", response?.status, response?.statusText)
      return null
    }

    const data = await response.json()
    const flights = data.flights

    if (!flights || flights.length === 0) return null

    // Get the most recent/relevant flight
    const flight = flights[0]

    const scheduledDep = flight.scheduled_off ?? flight.scheduled_out ?? null
    const actualDep = flight.actual_off ?? flight.actual_out ?? null
    const estimatedDep = flight.estimated_off ?? flight.estimated_out ?? null
    const scheduledArr = flight.scheduled_on ?? flight.scheduled_in ?? null
    const actualArr = flight.actual_on ?? flight.actual_in ?? null
    const estimatedArr = flight.estimated_on ?? flight.estimated_in ?? null

    let delayMinutes = 0
    if (scheduledDep && (actualDep || estimatedDep)) {
      const scheduledTime = new Date(scheduledDep).getTime()
      const actualTime = new Date((actualDep || estimatedDep)!).getTime()
      delayMinutes = Math.max(0, Math.round((actualTime - scheduledTime) / 60000))
    }

    let status = "Unknown"
    if (flight.cancelled) {
      status = "Cancelled"
    } else if (flight.diverted) {
      status = "Diverted"
    } else if (actualArr) {
      status = "Arrived"
    } else if (actualDep) {
      status = "In Air"
    } else if (delayMinutes > 15) {
      status = "Delayed"
    } else {
      status = "Scheduled"
    }

    return {
      flightNumber: normalized,
      ident: flight.ident ?? normalized,
      status,
      departureAirport: flight.origin?.code_iata ?? flight.origin?.code ?? "",
      arrivalAirport: flight.destination?.code_iata ?? flight.destination?.code ?? "",
      scheduledDeparture: scheduledDep,
      actualDeparture: actualDep,
      estimatedDeparture: estimatedDep,
      scheduledArrival: scheduledArr,
      actualArrival: actualArr,
      estimatedArrival: estimatedArr,
      departureGate: flight.gate_origin ?? null,
      arrivalGate: flight.gate_destination ?? null,
      departureTerminal: flight.terminal_origin ?? null,
      arrivalTerminal: flight.terminal_destination ?? null,
      aircraftType: flight.aircraft_type ?? null,
      delayMinutes,
      cancelled: flight.cancelled ?? false,
      diverted: flight.diverted ?? false,
    }
  } catch (error) {
    console.error("Failed to fetch flight status:", error)
    return null
  }
}

export async function getFlightTrack(
  flightId: string
): Promise<FlightPosition[]> {
  try {
    const response = await fetchFlightAware(`/flights/${flightId}/track`)
    if (!response || !response.ok) return []

    const data = await response.json()
    const positions = data.positions ?? []

    return positions.map(
      (pos: Record<string, number | string>) => ({
        latitude: pos.latitude ?? 0,
        longitude: pos.longitude ?? 0,
        altitude: pos.altitude ?? 0,
        groundspeed: pos.groundspeed ?? 0,
        heading: pos.heading ?? 0,
        timestamp: String(pos.timestamp ?? ""),
      })
    )
  } catch (error) {
    console.error("Failed to fetch flight track:", error)
    return []
  }
}

export interface FlightDisruption {
  bookingId: string
  flightNumber: string
  type: "DELAY" | "CANCELLATION" | "GATE_CHANGE"
  details: Record<string, unknown>
}

export async function checkForDisruptions(
  bookings: Array<{
    id: string
    type: string
    details: Record<string, string> | null
  }>
): Promise<FlightDisruption[]> {
  const disruptions: FlightDisruption[] = []

  const flightBookings = bookings.filter((b) => b.type === "FLIGHT" && b.details)

  for (const booking of flightBookings) {
    const details = booking.details
    if (!details) continue

    const flightNumber = details.flightNumber ?? details.flight_number
    const departureDate = details.departureTime ?? details.departure_time ?? details.date

    if (!flightNumber) continue

    const status = await getFlightStatus(
      flightNumber,
      departureDate ? new Date(departureDate).toISOString().split("T")[0] : undefined
    )

    if (!status) continue

    if (status.cancelled) {
      disruptions.push({
        bookingId: booking.id,
        flightNumber: status.flightNumber,
        type: "CANCELLATION",
        details: {
          message: `Flight ${status.flightNumber} has been cancelled`,
          originalDeparture: status.scheduledDeparture,
          departureAirport: status.departureAirport,
          arrivalAirport: status.arrivalAirport,
        },
      })
    } else if (status.delayMinutes > 15) {
      disruptions.push({
        bookingId: booking.id,
        flightNumber: status.flightNumber,
        type: "DELAY",
        details: {
          message: `Flight ${status.flightNumber} is delayed by ${status.delayMinutes} minutes`,
          scheduledDeparture: status.scheduledDeparture,
          estimatedDeparture: status.estimatedDeparture ?? status.actualDeparture,
          delayMinutes: status.delayMinutes,
          departureAirport: status.departureAirport,
          arrivalAirport: status.arrivalAirport,
        },
      })
    }

    // Check for gate changes
    const originalGate = details.gate ?? details.departureGate
    if (originalGate && status.departureGate && originalGate !== status.departureGate) {
      disruptions.push({
        bookingId: booking.id,
        flightNumber: status.flightNumber,
        type: "GATE_CHANGE",
        details: {
          message: `Gate changed from ${originalGate} to ${status.departureGate} for flight ${status.flightNumber}`,
          previousGate: originalGate,
          newGate: status.departureGate,
          departureAirport: status.departureAirport,
        },
      })
    }
  }

  return disruptions
}
