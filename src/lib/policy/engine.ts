import type { PolicyCheckResult, PolicyViolation } from "@/types/policy"
import type { TravelPolicy } from "@prisma/client"

export interface BookingInput {
  type: "FLIGHT" | "HOTEL" | "CAR_RENTAL"
  price: number
  currency: string
  cabinClass?: string
  airline?: string
  hotelChain?: string
  isInternational?: boolean
  departureDate?: string
  bookingDate?: string
  nightlyRate?: number
}

export interface PolicyRuleDefinition {
  id: string
  name: string
  type:
    | "MAX_PRICE"
    | "PREFERRED_VENDOR"
    | "ADVANCE_BOOKING"
    | "CABIN_CLASS"
    | "REQUIRES_APPROVAL"
    | "INTERNATIONAL"
    | "DAILY_HOTEL_RATE"
    | "MEAL_LIMIT"
  condition: Record<string, unknown>
  action: "BLOCK" | "WARN" | "REQUIRE_APPROVAL"
  message: string
  enabled: boolean
}

export function getDefaultPolicyRules(): PolicyRuleDefinition[] {
  return [
    {
      id: "max-flight-economy",
      name: "Max Economy Flight Price",
      type: "MAX_PRICE",
      condition: { maxAmount: 2000, bookingType: "FLIGHT", cabinClass: "ECONOMY" },
      action: "BLOCK",
      message: "Economy flight exceeds maximum price of $2,000",
      enabled: true,
    },
    {
      id: "max-flight-business",
      name: "Max Business Flight Price",
      type: "MAX_PRICE",
      condition: { maxAmount: 5000, bookingType: "FLIGHT", cabinClass: "BUSINESS" },
      action: "REQUIRE_APPROVAL",
      message: "Business class flight exceeds maximum price of $5,000",
      enabled: true,
    },
    {
      id: "max-hotel-rate",
      name: "Max Hotel Nightly Rate",
      type: "DAILY_HOTEL_RATE",
      condition: { maxRate: 300 },
      action: "WARN",
      message: "Hotel nightly rate exceeds $300/night limit",
      enabled: true,
    },
    {
      id: "advance-booking",
      name: "Advance Booking Requirement",
      type: "ADVANCE_BOOKING",
      condition: { minimumDays: 7 },
      action: "WARN",
      message: "Booking should be made at least 7 days in advance",
      enabled: true,
    },
    {
      id: "business-class-approval",
      name: "Business Class Requires Approval",
      type: "CABIN_CLASS",
      condition: { restrictedClasses: ["BUSINESS", "FIRST"] },
      action: "REQUIRE_APPROVAL",
      message: "Business/First class travel requires manager approval",
      enabled: true,
    },
    {
      id: "international-approval",
      name: "International Travel Approval",
      type: "INTERNATIONAL",
      condition: {},
      action: "REQUIRE_APPROVAL",
      message: "International travel requires manager approval",
      enabled: true,
    },
    {
      id: "meal-limit",
      name: "Daily Meal Limit",
      type: "MEAL_LIMIT",
      condition: { maxDaily: 75 },
      action: "WARN",
      message: "Daily meal expenses should not exceed $75",
      enabled: true,
    },
  ]
}

export function evaluateRule(
  rule: PolicyRuleDefinition,
  booking: BookingInput
): boolean {
  if (!rule.enabled) return false
  const condition = rule.condition

  switch (rule.type) {
    case "MAX_PRICE": {
      const maxAmount = condition.maxAmount as number
      const bookingType = condition.bookingType as string | undefined
      const cabinClass = condition.cabinClass as string | undefined
      if (bookingType && booking.type !== bookingType) return false
      if (cabinClass && booking.cabinClass?.toUpperCase() !== cabinClass) return false
      return booking.price > maxAmount
    }
    case "DAILY_HOTEL_RATE": {
      if (booking.type !== "HOTEL") return false
      const maxRate = condition.maxRate as number
      return (booking.nightlyRate ?? booking.price) > maxRate
    }
    case "ADVANCE_BOOKING": {
      const minimumDays = condition.minimumDays as number
      if (!booking.departureDate) return false
      const bookDate = booking.bookingDate ? new Date(booking.bookingDate) : new Date()
      const departure = new Date(booking.departureDate)
      const daysDiff = Math.floor(
        (departure.getTime() - bookDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      return daysDiff < minimumDays
    }
    case "CABIN_CLASS": {
      if (booking.type !== "FLIGHT") return false
      const restricted = condition.restrictedClasses as string[]
      return restricted.includes(booking.cabinClass?.toUpperCase() ?? "")
    }
    case "INTERNATIONAL":
      return booking.isInternational === true
    case "PREFERRED_VENDOR": {
      const vendors = condition.preferredVendors as string[]
      const vendor = booking.type === "FLIGHT" ? booking.airline : booking.hotelChain
      if (!vendor || vendors.length === 0) return false
      return !vendors.some((v) => v.toLowerCase() === vendor.toLowerCase())
    }
    case "MEAL_LIMIT":
      return false
    default:
      return false
  }
}

export function checkBookingPolicy(
  booking: BookingInput,
  policy: TravelPolicy | null
): PolicyCheckResult {
  if (!policy) {
    return { compliant: true, violations: [], requiresApproval: false }
  }

  const violations: PolicyViolation[] = []
  let requiresApproval = false

  if (booking.type === "FLIGHT" && policy.maxFlightPrice) {
    if (booking.price > policy.maxFlightPrice) {
      violations.push({
        ruleId: "builtin-max-flight",
        ruleType: "MAX_PRICE",
        message: `Flight price $${booking.price} exceeds maximum of $${policy.maxFlightPrice}`,
        severity: "BLOCKING",
        actualValue: booking.price,
        expectedValue: policy.maxFlightPrice,
      })
    }
  }

  if (booking.type === "HOTEL" && policy.maxHotelPrice) {
    const rate = booking.nightlyRate ?? booking.price
    if (rate > policy.maxHotelPrice) {
      violations.push({
        ruleId: "builtin-max-hotel",
        ruleType: "MAX_PRICE",
        message: `Hotel rate $${rate}/night exceeds maximum of $${policy.maxHotelPrice}/night`,
        severity: "WARNING",
        actualValue: rate,
        expectedValue: policy.maxHotelPrice,
      })
    }
  }

  if (
    booking.type === "FLIGHT" &&
    !policy.allowBusinessClass &&
    (booking.cabinClass?.toUpperCase() === "BUSINESS" ||
      booking.cabinClass?.toUpperCase() === "FIRST")
  ) {
    violations.push({
      ruleId: "builtin-business-class",
      ruleType: "CLASS_RESTRICTION",
      message: "Business/First class is not allowed by policy",
      severity: "BLOCKING",
      actualValue: booking.cabinClass ?? "",
      expectedValue: "ECONOMY",
    })
    requiresApproval = true
  }

  if (policy.internationalRequiresApproval && booking.isInternational) {
    violations.push({
      ruleId: "builtin-international",
      ruleType: "APPROVAL_REQUIRED",
      message: "International travel requires approval",
      severity: "WARNING",
      actualValue: "international",
      expectedValue: "domestic",
    })
    requiresApproval = true
  }

  if (policy.requireApprovalAbove && booking.price > policy.requireApprovalAbove) {
    requiresApproval = true
    violations.push({
      ruleId: "builtin-approval-threshold",
      ruleType: "APPROVAL_REQUIRED",
      message: `Booking price $${booking.price} exceeds approval threshold of $${policy.requireApprovalAbove}`,
      severity: "WARNING",
      actualValue: booking.price,
      expectedValue: policy.requireApprovalAbove,
    })
  }

  if (policy.advanceBookingDays && booking.departureDate) {
    const bookDate = booking.bookingDate ? new Date(booking.bookingDate) : new Date()
    const departure = new Date(booking.departureDate)
    const daysDiff = Math.floor(
      (departure.getTime() - bookDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysDiff < policy.advanceBookingDays) {
      violations.push({
        ruleId: "builtin-advance-booking",
        ruleType: "ADVANCE_BOOKING",
        message: `Booking is ${daysDiff} days before departure (minimum ${policy.advanceBookingDays} days required)`,
        severity: "WARNING",
        actualValue: daysDiff,
        expectedValue: policy.advanceBookingDays,
      })
    }
  }

  const customRules = (policy.rules ?? []) as unknown as PolicyRuleDefinition[]
  if (Array.isArray(customRules)) {
    for (const rule of customRules) {
      if (evaluateRule(rule, booking)) {
        const severity = rule.action === "BLOCK" ? "BLOCKING" : "WARNING"
        violations.push({
          ruleId: rule.id,
          ruleType: rule.type === "DAILY_HOTEL_RATE" || rule.type === "MEAL_LIMIT"
            ? "MAX_PRICE"
            : rule.type === "CABIN_CLASS"
              ? "CLASS_RESTRICTION"
              : rule.type === "INTERNATIONAL" || rule.type === "REQUIRES_APPROVAL"
                ? "APPROVAL_REQUIRED"
                : rule.type as PolicyViolation["ruleType"],
          message: rule.message,
          severity,
          actualValue: booking.price,
          expectedValue: JSON.stringify(rule.condition),
        })
        if (rule.action === "REQUIRE_APPROVAL") {
          requiresApproval = true
        }
      }
    }
  }

  const hasBlockingViolation = violations.some((v) => v.severity === "BLOCKING")

  return {
    compliant: violations.length === 0,
    violations,
    requiresApproval: requiresApproval || hasBlockingViolation,
  }
}
