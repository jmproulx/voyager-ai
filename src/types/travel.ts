export interface FlightSegment {
  departureAirport: string
  arrivalAirport: string
  departureTime: string
  arrivalTime: string
  flightNumber: string
  airline: string
  airlineLogo?: string
  duration: string
  cabinClass: string
  aircraft?: string
}

export interface FlightOffer {
  id: string
  provider: "AMADEUS" | "DUFFEL"
  providerOfferId: string
  segments: FlightSegment[]
  totalPrice: number
  currency: string
  stops: number
  totalDuration: string
  cabinClass: string
  baggageIncluded: boolean
  carbonKg?: number
  policyCompliant?: boolean
  policyViolationReason?: string
}

export interface HotelOffer {
  id: string
  provider: "AMADEUS"
  providerOfferId: string
  hotelName: string
  hotelChain?: string
  address: string
  latitude?: number
  longitude?: number
  starRating?: number
  guestRating?: number
  photos: string[]
  amenities: string[]
  roomType: string
  pricePerNight: number
  totalPrice: number
  currency: string
  checkIn: string
  checkOut: string
  cancellationPolicy?: string
  policyCompliant?: boolean
  policyViolationReason?: string
}

export interface FlightSearchParams {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  passengers: number
  cabinClass?: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST"
  maxStops?: number
  maxPrice?: number
  preferredAirlines?: string[]
}

export interface HotelSearchParams {
  location: string
  latitude?: number
  longitude?: number
  checkIn: string
  checkOut: string
  guests: number
  rooms?: number
  maxPrice?: number
  starRating?: number
  amenities?: string[]
}

export interface BookingDetails {
  type: "FLIGHT" | "HOTEL" | "CAR_RENTAL"
  provider: "AMADEUS" | "DUFFEL"
  providerOfferId: string
  price: number
  currency: string
  details: Record<string, unknown>
  policyCompliant: boolean
  policyViolationReason?: string
  carbonKg?: number
}
