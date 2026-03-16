type ExpenseCategory = "FLIGHT" | "HOTEL" | "MEAL" | "TRANSPORT" | "OTHER"

interface CategoryKeywords {
  category: ExpenseCategory
  keywords: string[]
}

const CATEGORY_RULES: CategoryKeywords[] = [
  {
    category: "FLIGHT",
    keywords: [
      "airline", "airlines", "air", "airways", "aviation",
      "delta", "united", "american airlines", "southwest", "jetblue",
      "british airways", "lufthansa", "emirates", "qatar",
      "flight", "boarding", "airport",
    ],
  },
  {
    category: "HOTEL",
    keywords: [
      "hotel", "hotels", "inn", "suites", "resort", "motel",
      "marriott", "hilton", "hyatt", "sheraton", "westin",
      "courtyard", "hampton", "holiday inn", "radisson",
      "airbnb", "vrbo", "lodging", "accommodation",
    ],
  },
  {
    category: "MEAL",
    keywords: [
      "restaurant", "cafe", "coffee", "starbucks", "mcdonald",
      "burger", "pizza", "sushi", "diner", "bistro", "grill",
      "bar", "pub", "bakery", "deli", "food", "catering",
      "doordash", "grubhub", "uber eats", "postmates",
      "chipotle", "subway", "panera", "chick-fil-a",
      "breakfast", "lunch", "dinner", "meal",
    ],
  },
  {
    category: "TRANSPORT",
    keywords: [
      "uber", "lyft", "taxi", "cab", "rideshare",
      "rental", "hertz", "avis", "enterprise", "budget",
      "national", "alamo", "car rental",
      "parking", "garage", "toll", "gas", "fuel", "petrol",
      "train", "amtrak", "rail", "metro", "subway", "bus",
      "transit", "transportation",
    ],
  },
]

export function categorizeExpense(
  merchantName: string,
  description: string
): ExpenseCategory {
  const searchText = `${merchantName} ${description}`.toLowerCase()

  for (const rule of CATEGORY_RULES) {
    for (const keyword of rule.keywords) {
      if (searchText.includes(keyword)) {
        return rule.category
      }
    }
  }

  return "OTHER"
}
