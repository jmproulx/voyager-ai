import { google } from "googleapis"
import { prisma } from "@/lib/prisma"
import type { CalendarSuggestion } from "@/types/trip"

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
]

const TRAVEL_KEYWORDS = [
  "flight",
  "travel",
  "trip",
  "airport",
  "hotel",
  "conference",
  "summit",
  "offsite",
  "on-site",
  "client visit",
  "business trip",
  "meeting",
]

function getOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/calendar/callback`

  if (!clientId || !clientSecret) {
    return null
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri)
}

export function isCalendarConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
}

export function getAuthUrl(userId: string): string | null {
  const oauth2Client = getOAuth2Client()
  if (!oauth2Client) return null

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    state: userId,
    prompt: "consent",
  })

  return url
}

export async function handleCallback(code: string, userId: string): Promise<boolean> {
  const oauth2Client = getOAuth2Client()
  if (!oauth2Client) return false

  try {
    const { tokens } = await oauth2Client.getToken(code)

    // Store tokens in the Account table linked to the user
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: "google-calendar",
          providerAccountId: userId,
        },
      },
      update: {
        access_token: tokens.access_token ?? undefined,
        refresh_token: tokens.refresh_token ?? undefined,
        expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : undefined,
        token_type: tokens.token_type ?? undefined,
        scope: tokens.scope ?? undefined,
      },
      create: {
        userId,
        type: "oauth",
        provider: "google-calendar",
        providerAccountId: userId,
        access_token: tokens.access_token ?? undefined,
        refresh_token: tokens.refresh_token ?? undefined,
        expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : undefined,
        token_type: tokens.token_type ?? undefined,
        scope: tokens.scope ?? undefined,
      },
    })

    return true
  } catch (error) {
    console.error("Failed to handle Google Calendar callback:", error)
    return false
  }
}

async function getAuthenticatedClient(userId: string) {
  const oauth2Client = getOAuth2Client()
  if (!oauth2Client) return null

  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: "google-calendar",
    },
  })

  if (!account?.access_token) return null

  oauth2Client.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token ?? undefined,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  })

  // Handle token refresh
  oauth2Client.on("tokens", async (tokens) => {
    await prisma.account.update({
      where: { id: account.id },
      data: {
        access_token: tokens.access_token ?? undefined,
        refresh_token: tokens.refresh_token ?? account.refresh_token ?? undefined,
        expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : undefined,
      },
    })
  })

  return oauth2Client
}

export async function isUserConnected(userId: string): Promise<boolean> {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: "google-calendar",
    },
  })
  return Boolean(account?.access_token)
}

export interface CalendarEvent {
  id: string
  summary: string
  description?: string
  location?: string
  start: string
  end: string
  htmlLink?: string
}

export async function getUpcomingEvents(
  userId: string,
  days: number = 30
): Promise<CalendarEvent[]> {
  const auth = await getAuthenticatedClient(userId)
  if (!auth) return []

  const calendar = google.calendar({ version: "v3", auth })

  const now = new Date()
  const future = new Date()
  future.setDate(future.getDate() + days)

  try {
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: now.toISOString(),
      timeMax: future.toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: "startTime",
    })

    const events = response.data.items ?? []

    return events.map((event) => ({
      id: event.id ?? "",
      summary: event.summary ?? "Untitled",
      description: event.description ?? undefined,
      location: event.location ?? undefined,
      start: event.start?.dateTime ?? event.start?.date ?? "",
      end: event.end?.dateTime ?? event.end?.date ?? "",
      htmlLink: event.htmlLink ?? undefined,
    }))
  } catch (error) {
    console.error("Failed to fetch calendar events:", error)
    return []
  }
}

export function detectTravelNeeds(events: CalendarEvent[]): CalendarSuggestion[] {
  const suggestions: CalendarSuggestion[] = []

  for (const event of events) {
    const text = `${event.summary} ${event.description ?? ""} ${event.location ?? ""}`.toLowerCase()

    const matchedKeyword = TRAVEL_KEYWORDS.find((keyword) => text.includes(keyword))

    // Check if event has a different-city location
    const hasRemoteLocation = event.location && event.location.length > 10

    if (matchedKeyword || hasRemoteLocation) {
      let reason = ""
      let suggestedAction = ""

      if (matchedKeyword) {
        reason = `Event mentions "${matchedKeyword}"`
        suggestedAction = `Consider booking travel for "${event.summary}"`
      }

      if (hasRemoteLocation) {
        reason = `Event is at ${event.location}`
        suggestedAction = `You may need travel to ${event.location} for "${event.summary}"`
      }

      suggestions.push({
        eventId: event.id,
        eventTitle: event.summary,
        eventDate: event.start,
        location: event.location ?? "Unknown",
        reason,
        suggestedAction,
      })
    }
  }

  return suggestions
}

export async function createCalendarEvent(
  userId: string,
  tripDetails: {
    name: string
    destination?: string | null
    startDate: Date
    endDate: Date
    description?: string
  }
): Promise<string | null> {
  const auth = await getAuthenticatedClient(userId)
  if (!auth) return null

  const calendar = google.calendar({ version: "v3", auth })

  try {
    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: tripDetails.name,
        description: tripDetails.description ?? `Business trip to ${tripDetails.destination ?? "TBD"}`,
        location: tripDetails.destination ?? undefined,
        start: {
          dateTime: tripDetails.startDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: tripDetails.endDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      },
    })

    return response.data.id ?? null
  } catch (error) {
    console.error("Failed to create calendar event:", error)
    return null
  }
}

export async function syncTripToCalendar(tripId: string, userId: string): Promise<number> {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      bookings: true,
      itineraryItems: true,
    },
  })

  if (!trip) return 0

  const auth = await getAuthenticatedClient(userId)
  if (!auth) return 0

  const calendar = google.calendar({ version: "v3", auth })
  let eventsCreated = 0

  try {
    // Create main trip event
    if (trip.startDate && trip.endDate) {
      await calendar.events.insert({
        calendarId: "primary",
        requestBody: {
          summary: `Trip: ${trip.name}`,
          description: `Business trip to ${trip.destination ?? "TBD"}`,
          location: trip.destination ?? undefined,
          start: {
            dateTime: trip.startDate.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          end: {
            dateTime: trip.endDate.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        },
      })
      eventsCreated++
    }

    // Create events for each booking
    for (const booking of trip.bookings) {
      const details = booking.details as Record<string, string> | null

      if (booking.type === "FLIGHT" && details) {
        const departureTime = details.departureTime ?? details.departure_time
        const arrivalTime = details.arrivalTime ?? details.arrival_time
        const flightNumber = details.flightNumber ?? details.flight_number ?? "Flight"
        const airline = details.airline ?? ""

        if (departureTime && arrivalTime) {
          await calendar.events.insert({
            calendarId: "primary",
            requestBody: {
              summary: `${airline} ${flightNumber}`.trim(),
              description: `${details.departureAirport ?? ""} -> ${details.arrivalAirport ?? ""}`,
              start: {
                dateTime: new Date(departureTime).toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              },
              end: {
                dateTime: new Date(arrivalTime).toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              },
            },
          })
          eventsCreated++
        }
      } else if (booking.type === "HOTEL" && details) {
        const checkIn = details.checkIn ?? details.check_in
        const checkOut = details.checkOut ?? details.check_out
        const hotelName = details.hotelName ?? details.hotel_name ?? "Hotel"

        if (checkIn && checkOut) {
          await calendar.events.insert({
            calendarId: "primary",
            requestBody: {
              summary: `Stay: ${hotelName}`,
              description: details.address ?? "",
              location: details.address ?? undefined,
              start: {
                date: new Date(checkIn).toISOString().split("T")[0],
              },
              end: {
                date: new Date(checkOut).toISOString().split("T")[0],
              },
            },
          })
          eventsCreated++
        }
      }
    }

    // Create events for custom itinerary items
    for (const item of trip.itineraryItems) {
      await calendar.events.insert({
        calendarId: "primary",
        requestBody: {
          summary: item.title,
          description: item.description ?? undefined,
          location: item.location ?? undefined,
          start: {
            dateTime: item.startTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          end: {
            dateTime: (item.endTime ?? item.startTime).toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        },
      })
      eventsCreated++
    }

    return eventsCreated
  } catch (error) {
    console.error("Failed to sync trip to calendar:", error)
    return eventsCreated
  }
}
