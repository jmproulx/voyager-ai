import type Anthropic from "@anthropic-ai/sdk"

export const AI_TOOLS: Anthropic.Tool[] = [
  {
    name: "search_flights",
    description:
      "Search for available flights between two airports. Searches across multiple providers (Amadeus, Duffel, and Kiwi.com) for real live flight data with pricing, schedules, and details. Use IATA airport codes (e.g., JFK, LAX, LHR).",
    input_schema: {
      type: "object" as const,
      properties: {
        origin: {
          type: "string",
          description:
            "Origin airport IATA code (e.g., JFK, LAX, ORD, LHR)",
        },
        destination: {
          type: "string",
          description:
            "Destination airport IATA code (e.g., SFO, CDG, NRT, SIN)",
        },
        departureDate: {
          type: "string",
          description: "Departure date in YYYY-MM-DD format",
        },
        returnDate: {
          type: "string",
          description:
            "Return date in YYYY-MM-DD format (optional, omit for one-way)",
        },
        passengers: {
          type: "number",
          description: "Number of passengers (default: 1)",
        },
        cabinClass: {
          type: "string",
          enum: ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"],
          description: "Preferred cabin class (default: ECONOMY)",
        },
      },
      required: ["origin", "destination", "departureDate"],
    },
  },
  {
    name: "search_hotels",
    description:
      "Search for available hotels in a city. Returns a list of hotel offers with pricing, ratings, and amenities. Use IATA city codes (e.g., NYC, LON, PAR) or city names.",
    input_schema: {
      type: "object" as const,
      properties: {
        cityCode: {
          type: "string",
          description:
            "City IATA code (e.g., NYC, LON, PAR) or city name",
        },
        checkInDate: {
          type: "string",
          description: "Check-in date in YYYY-MM-DD format",
        },
        checkOutDate: {
          type: "string",
          description: "Check-out date in YYYY-MM-DD format",
        },
        guests: {
          type: "number",
          description: "Number of guests (default: 1)",
        },
        maxPrice: {
          type: "number",
          description:
            "Maximum price per night in USD (optional)",
        },
      },
      required: ["cityCode", "checkInDate", "checkOutDate"],
    },
  },
  {
    name: "create_trip",
    description:
      "Create a new trip in the system. Use this when a user wants to plan a new business trip. Returns the created trip details.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description:
            "Name for the trip (e.g., 'NYC Client Meeting', 'London Conference 2026')",
        },
        destination: {
          type: "string",
          description: "Trip destination city or region",
        },
        startDate: {
          type: "string",
          description: "Trip start date in YYYY-MM-DD format",
        },
        endDate: {
          type: "string",
          description: "Trip end date in YYYY-MM-DD format",
        },
      },
      required: ["name", "destination", "startDate", "endDate"],
    },
  },
  {
    name: "add_booking_to_trip",
    description:
      "Add a confirmed booking (flight, hotel, or car rental) to an existing trip. Use this after the user confirms they want to book a selected option.",
    input_schema: {
      type: "object" as const,
      properties: {
        tripId: {
          type: "string",
          description: "The ID of the trip to add the booking to",
        },
        bookingType: {
          type: "string",
          enum: ["FLIGHT", "HOTEL", "CAR_RENTAL"],
          description: "Type of booking",
        },
        bookingDetails: {
          type: "object",
          description:
            "Full booking details including provider, offerId, price, and specifics",
          properties: {
            provider: {
              type: "string",
              enum: ["AMADEUS", "DUFFEL", "KIWI"],
              description: "Booking provider",
            },
            providerOfferId: {
              type: "string",
              description: "Provider-specific offer ID",
            },
            price: {
              type: "number",
              description: "Total price of the booking",
            },
            currency: {
              type: "string",
              description: "Currency code (e.g., USD, EUR)",
            },
            details: {
              type: "object",
              description:
                "Additional booking-specific details (flight info, hotel info, etc.)",
            },
          },
          required: ["provider", "providerOfferId", "price", "currency"],
        },
      },
      required: ["tripId", "bookingType", "bookingDetails"],
    },
  },
  {
    name: "get_itinerary",
    description:
      "Get the full itinerary for a trip, including all bookings, events, and timeline. Use this when the user asks about their trip plan or schedule.",
    input_schema: {
      type: "object" as const,
      properties: {
        tripId: {
          type: "string",
          description: "The ID of the trip to get the itinerary for",
        },
      },
      required: ["tripId"],
    },
  },
  {
    name: "check_policy",
    description:
      "Check if a proposed booking complies with the organization's corporate travel policy. Always use this before recommending a booking to ensure policy compliance.",
    input_schema: {
      type: "object" as const,
      properties: {
        bookingType: {
          type: "string",
          enum: ["FLIGHT", "HOTEL", "CAR_RENTAL"],
          description: "Type of booking to check",
        },
        price: {
          type: "number",
          description: "Total price of the proposed booking",
        },
        details: {
          type: "object",
          description:
            "Additional details for policy checking (cabin class, hotel star rating, advance booking days, etc.)",
          properties: {
            cabinClass: {
              type: "string",
              description: "Flight cabin class",
            },
            starRating: {
              type: "number",
              description: "Hotel star rating",
            },
            airline: {
              type: "string",
              description: "Airline code or name",
            },
            hotelChain: {
              type: "string",
              description: "Hotel chain name",
            },
            advanceBookingDays: {
              type: "number",
              description: "Number of days in advance",
            },
            international: {
              type: "boolean",
              description: "Whether this is an international trip",
            },
          },
        },
      },
      required: ["bookingType", "price"],
    },
  },
  {
    name: "get_flight_status",
    description:
      "Get the real-time status of a flight including delays, gate changes, and cancellations. Use the airline's IATA code and flight number (e.g., AA100, UA789).",
    input_schema: {
      type: "object" as const,
      properties: {
        flightNumber: {
          type: "string",
          description:
            "Flight number including airline code (e.g., AA100, UA789, BA175)",
        },
        date: {
          type: "string",
          description: "Flight date in YYYY-MM-DD format",
        },
      },
      required: ["flightNumber", "date"],
    },
  },
  {
    name: "calculate_carbon",
    description:
      "Calculate the estimated CO2 emissions for a flight route. Returns carbon footprint in kg CO2 equivalent.",
    input_schema: {
      type: "object" as const,
      properties: {
        origin: {
          type: "string",
          description: "Origin airport IATA code",
        },
        destination: {
          type: "string",
          description: "Destination airport IATA code",
        },
        cabinClass: {
          type: "string",
          enum: ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"],
          description: "Cabin class (affects carbon calculation due to space per passenger)",
        },
      },
      required: ["origin", "destination"],
    },
  },
]

export type ToolName =
  | "search_flights"
  | "search_hotels"
  | "create_trip"
  | "add_booking_to_trip"
  | "get_itinerary"
  | "check_policy"
  | "get_flight_status"
  | "calculate_carbon"
