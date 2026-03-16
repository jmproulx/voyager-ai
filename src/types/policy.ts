export interface PolicyRule {
  id: string
  type: "MAX_PRICE" | "PREFERRED_VENDOR" | "ADVANCE_BOOKING" | "CLASS_RESTRICTION" | "APPROVAL_REQUIRED" | "CUSTOM"
  field: string
  operator: "EQUALS" | "NOT_EQUALS" | "GREATER_THAN" | "LESS_THAN" | "IN" | "NOT_IN" | "BETWEEN"
  value: string | number | string[]
  message: string
  severity: "WARNING" | "BLOCKING"
}

export interface PolicyCheckResult {
  compliant: boolean
  violations: PolicyViolation[]
  requiresApproval: boolean
}

export interface PolicyViolation {
  ruleId: string
  ruleType: PolicyRule["type"]
  message: string
  severity: "WARNING" | "BLOCKING"
  actualValue: string | number
  expectedValue: string | number | string[]
}

export interface PolicySummary {
  organizationId: string
  maxFlightPrice: number | null
  maxHotelPrice: number | null
  preferredAirlines: string[]
  preferredHotelChains: string[]
  requireApprovalAbove: number | null
  advanceBookingDays: number | null
  allowBusinessClass: boolean
  internationalRequiresApproval: boolean
  customRules: PolicyRule[]
}
