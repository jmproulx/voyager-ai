export interface Airport {
  code: string
  name: string
  city: string
  country: string
}

/**
 * Major world airports for the autocomplete component.
 * Amadeus test API works with these IATA codes.
 */
export const MAJOR_AIRPORTS: Airport[] = [
  { code: "JFK", name: "John F. Kennedy International", city: "New York", country: "US" },
  { code: "LAX", name: "Los Angeles International", city: "Los Angeles", country: "US" },
  { code: "ORD", name: "O'Hare International", city: "Chicago", country: "US" },
  { code: "ATL", name: "Hartsfield-Jackson International", city: "Atlanta", country: "US" },
  { code: "DFW", name: "Dallas/Fort Worth International", city: "Dallas", country: "US" },
  { code: "DEN", name: "Denver International", city: "Denver", country: "US" },
  { code: "SFO", name: "San Francisco International", city: "San Francisco", country: "US" },
  { code: "SEA", name: "Seattle-Tacoma International", city: "Seattle", country: "US" },
  { code: "MIA", name: "Miami International", city: "Miami", country: "US" },
  { code: "BOS", name: "Logan International", city: "Boston", country: "US" },
  { code: "EWR", name: "Newark Liberty International", city: "Newark", country: "US" },
  { code: "IAD", name: "Washington Dulles International", city: "Washington D.C.", country: "US" },
  { code: "DCA", name: "Ronald Reagan National", city: "Washington D.C.", country: "US" },
  { code: "IAH", name: "George Bush Intercontinental", city: "Houston", country: "US" },
  { code: "PHX", name: "Phoenix Sky Harbor International", city: "Phoenix", country: "US" },
  { code: "MSP", name: "Minneapolis-Saint Paul International", city: "Minneapolis", country: "US" },
  { code: "DTW", name: "Detroit Metropolitan", city: "Detroit", country: "US" },
  { code: "PHL", name: "Philadelphia International", city: "Philadelphia", country: "US" },
  { code: "CLT", name: "Charlotte Douglas International", city: "Charlotte", country: "US" },
  { code: "LGA", name: "LaGuardia", city: "New York", country: "US" },
  { code: "LHR", name: "Heathrow", city: "London", country: "GB" },
  { code: "LGW", name: "Gatwick", city: "London", country: "GB" },
  { code: "CDG", name: "Charles de Gaulle", city: "Paris", country: "FR" },
  { code: "ORY", name: "Orly", city: "Paris", country: "FR" },
  { code: "FRA", name: "Frankfurt", city: "Frankfurt", country: "DE" },
  { code: "MUC", name: "Munich", city: "Munich", country: "DE" },
  { code: "AMS", name: "Schiphol", city: "Amsterdam", country: "NL" },
  { code: "MAD", name: "Adolfo Suarez Madrid-Barajas", city: "Madrid", country: "ES" },
  { code: "BCN", name: "El Prat", city: "Barcelona", country: "ES" },
  { code: "FCO", name: "Leonardo da Vinci-Fiumicino", city: "Rome", country: "IT" },
  { code: "MXP", name: "Malpensa", city: "Milan", country: "IT" },
  { code: "ZRH", name: "Zurich", city: "Zurich", country: "CH" },
  { code: "IST", name: "Istanbul", city: "Istanbul", country: "TR" },
  { code: "DXB", name: "Dubai International", city: "Dubai", country: "AE" },
  { code: "DOH", name: "Hamad International", city: "Doha", country: "QA" },
  { code: "SIN", name: "Changi", city: "Singapore", country: "SG" },
  { code: "HKG", name: "Hong Kong International", city: "Hong Kong", country: "HK" },
  { code: "NRT", name: "Narita International", city: "Tokyo", country: "JP" },
  { code: "HND", name: "Haneda", city: "Tokyo", country: "JP" },
  { code: "ICN", name: "Incheon International", city: "Seoul", country: "KR" },
  { code: "SYD", name: "Kingsford Smith", city: "Sydney", country: "AU" },
  { code: "MEL", name: "Melbourne", city: "Melbourne", country: "AU" },
  { code: "YYZ", name: "Toronto Pearson International", city: "Toronto", country: "CA" },
  { code: "YVR", name: "Vancouver International", city: "Vancouver", country: "CA" },
  { code: "MEX", name: "Benito Juarez International", city: "Mexico City", country: "MX" },
  { code: "GRU", name: "Guarulhos International", city: "Sao Paulo", country: "BR" },
  { code: "EZE", name: "Ministro Pistarini International", city: "Buenos Aires", country: "AR" },
  { code: "JNB", name: "O.R. Tambo International", city: "Johannesburg", country: "ZA" },
  { code: "CPT", name: "Cape Town International", city: "Cape Town", country: "ZA" },
  { code: "BKK", name: "Suvarnabhumi", city: "Bangkok", country: "TH" },
]

/**
 * Search airports by query string matching code, name, or city.
 */
export function searchAirports(query: string): Airport[] {
  if (!query || query.length < 1) return []

  const normalizedQuery = query.toLowerCase().trim()

  return MAJOR_AIRPORTS.filter(
    (airport) =>
      airport.code.toLowerCase().includes(normalizedQuery) ||
      airport.name.toLowerCase().includes(normalizedQuery) ||
      airport.city.toLowerCase().includes(normalizedQuery)
  ).slice(0, 10)
}

/**
 * Major city codes for hotel search (IATA city codes).
 */
export const MAJOR_CITY_CODES: Record<string, string> = {
  "New York": "NYC",
  "Los Angeles": "LAX",
  "Chicago": "CHI",
  "San Francisco": "SFO",
  "Miami": "MIA",
  "Boston": "BOS",
  "Seattle": "SEA",
  "Washington D.C.": "WAS",
  "London": "LON",
  "Paris": "PAR",
  "Tokyo": "TYO",
  "Dubai": "DXB",
  "Singapore": "SIN",
  "Hong Kong": "HKG",
  "Sydney": "SYD",
  "Toronto": "YTO",
  "Frankfurt": "FRA",
  "Amsterdam": "AMS",
  "Madrid": "MAD",
  "Barcelona": "BCN",
  "Rome": "ROM",
  "Milan": "MIL",
  "Munich": "MUC",
  "Zurich": "ZRH",
  "Istanbul": "IST",
  "Bangkok": "BKK",
  "Seoul": "SEL",
  "Dallas": "DFW",
  "Atlanta": "ATL",
  "Denver": "DEN",
}

/**
 * Search city codes for hotel search.
 */
export function searchCityCodes(query: string): Array<{ city: string; code: string }> {
  if (!query || query.length < 1) return []

  const normalizedQuery = query.toLowerCase().trim()

  return Object.entries(MAJOR_CITY_CODES)
    .filter(
      ([city, code]) =>
        city.toLowerCase().includes(normalizedQuery) ||
        code.toLowerCase().includes(normalizedQuery)
    )
    .map(([city, code]) => ({ city, code }))
    .slice(0, 10)
}
