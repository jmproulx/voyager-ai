"use client"

import { useEffect, useState, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2, RotateCcw, Save } from "lucide-react"
import { toast } from "sonner"

interface PolicyRuleDefinition {
  id: string
  name: string
  type: string
  condition: Record<string, unknown>
  action: string
  message: string
  enabled: boolean
}

export default function SettingsPage() {
  const [defaults, setDefaults] = useState<PolicyRuleDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [maxFlightPrice, setMaxFlightPrice] = useState("")
  const [maxHotelPrice, setMaxHotelPrice] = useState("")
  const [preferredAirlines, setPreferredAirlines] = useState("")
  const [requireApprovalAbove, setRequireApprovalAbove] = useState("")
  const [advanceBookingDays, setAdvanceBookingDays] = useState("")
  const [allowBusinessClass, setAllowBusinessClass] = useState(false)
  const [internationalRequiresApproval, setInternationalRequiresApproval] = useState(true)
  const [mealDailyLimit, setMealDailyLimit] = useState("")
  const [customRules, setCustomRules] = useState<PolicyRuleDefinition[]>([])

  const fetchPolicy = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/policy")
      if (!response.ok) throw new Error("Failed to fetch policy")

      const data = await response.json()
      const p = data.policy
      const d: PolicyRuleDefinition[] = data.defaults ?? []
      setDefaults(d)

      if (p) {
        setMaxFlightPrice(p.maxFlightPrice ? String(p.maxFlightPrice) : "")
        setMaxHotelPrice(p.maxHotelPrice ? String(p.maxHotelPrice) : "")
        setPreferredAirlines(
          Array.isArray(p.preferredAirlines) ? p.preferredAirlines.join(", ") : ""
        )
        setRequireApprovalAbove(
          p.requireApprovalAbove ? String(p.requireApprovalAbove) : ""
        )
        setAdvanceBookingDays(
          p.advanceBookingDays ? String(p.advanceBookingDays) : ""
        )
        setAllowBusinessClass(p.allowBusinessClass ?? false)
        setInternationalRequiresApproval(p.internationalRequiresApproval ?? true)

        const rules: PolicyRuleDefinition[] = Array.isArray(p.rules) ? p.rules : []
        setCustomRules(rules.length > 0 ? rules : d)

        const mealRule = rules.find((r: PolicyRuleDefinition) => r.type === "MEAL_LIMIT")
          ?? d.find((r) => r.type === "MEAL_LIMIT")
        if (mealRule) {
          const maxDaily = mealRule.condition.maxDaily as number | undefined
          setMealDailyLimit(maxDaily ? String(maxDaily) : "")
        }
      } else {
        setCustomRules(d)
        const mealRule = d.find((r) => r.type === "MEAL_LIMIT")
        if (mealRule) {
          const maxDaily = mealRule.condition.maxDaily as number | undefined
          setMealDailyLimit(maxDaily ? String(maxDaily) : "")
        }
      }
    } catch (err) {
      console.error("Error fetching policy:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPolicy()
  }, [fetchPolicy])

  function toggleRule(ruleId: string) {
    setCustomRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    )
  }

  async function handleSave() {
    setSaving(true)
    try {
      const updatedRules = customRules.map((rule) => {
        if (rule.type === "MEAL_LIMIT" && mealDailyLimit) {
          return { ...rule, condition: { ...rule.condition, maxDaily: parseFloat(mealDailyLimit) } }
        }
        return rule
      })

      const body: Record<string, unknown> = {
        maxFlightPrice: maxFlightPrice ? parseFloat(maxFlightPrice) : null,
        maxHotelPrice: maxHotelPrice ? parseFloat(maxHotelPrice) : null,
        preferredAirlines: preferredAirlines
          ? preferredAirlines.split(",").map((a) => a.trim()).filter(Boolean)
          : [],
        requireApprovalAbove: requireApprovalAbove
          ? parseFloat(requireApprovalAbove)
          : null,
        advanceBookingDays: advanceBookingDays
          ? parseInt(advanceBookingDays)
          : null,
        allowBusinessClass,
        internationalRequiresApproval,
        rules: updatedRules,
      }

      const response = await fetch("/api/policy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error ?? "Failed to save policy")
      }

      toast.success("Policy saved successfully")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save policy"
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    setMaxFlightPrice("")
    setMaxHotelPrice("")
    setPreferredAirlines("")
    setRequireApprovalAbove("")
    setAdvanceBookingDays("")
    setAllowBusinessClass(false)
    setInternationalRequiresApproval(true)
    setMealDailyLimit("75")
    setCustomRules(defaults)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and organization settings.
          </p>
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and organization settings.
        </p>
      </div>

      <Tabs defaultValue="policy">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="policy">Travel Policy</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Manage your personal information and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">
                Profile settings will be available after sign-in integration is complete.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organization" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Settings</CardTitle>
              <CardDescription>
                Manage your organization details and team members.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">
                Organization settings will be available after sign-in integration is complete.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policy" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Price Limits</CardTitle>
              <CardDescription>
                Set maximum allowed prices for different booking types.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxFlightPrice">Max Flight Price ($)</Label>
                  <Input
                    id="maxFlightPrice"
                    type="number"
                    placeholder="e.g., 2000"
                    value={maxFlightPrice}
                    onChange={(e) => setMaxFlightPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxHotelPrice">Max Hotel Nightly Rate ($)</Label>
                  <Input
                    id="maxHotelPrice"
                    type="number"
                    placeholder="e.g., 300"
                    value={maxHotelPrice}
                    onChange={(e) => setMaxHotelPrice(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="requireApprovalAbove">
                    Require Approval Above ($)
                  </Label>
                  <Input
                    id="requireApprovalAbove"
                    type="number"
                    placeholder="e.g., 1000"
                    value={requireApprovalAbove}
                    onChange={(e) => setRequireApprovalAbove(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mealLimit">Daily Meal Limit ($)</Label>
                  <Input
                    id="mealLimit"
                    type="number"
                    placeholder="e.g., 75"
                    value={mealDailyLimit}
                    onChange={(e) => setMealDailyLimit(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preferred Vendors</CardTitle>
              <CardDescription>
                Airlines and hotel chains preferred by your organization.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="airlines">
                  Preferred Airlines (comma-separated)
                </Label>
                <Input
                  id="airlines"
                  placeholder="e.g., Delta, United, American"
                  value={preferredAirlines}
                  onChange={(e) => setPreferredAirlines(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Booking Rules</CardTitle>
              <CardDescription>
                Configure booking restrictions and approval requirements.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="advanceBookingDays">
                  Minimum Advance Booking (days)
                </Label>
                <Input
                  id="advanceBookingDays"
                  type="number"
                  placeholder="e.g., 7"
                  value={advanceBookingDays}
                  onChange={(e) => setAdvanceBookingDays(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Allow Business Class</p>
                  <p className="text-xs text-muted-foreground">
                    When disabled, business/first class requires approval
                  </p>
                </div>
                <Switch
                  checked={allowBusinessClass}
                  onCheckedChange={setAllowBusinessClass}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">
                    International Travel Requires Approval
                  </p>
                  <p className="text-xs text-muted-foreground">
                    All international bookings require manager approval
                  </p>
                </div>
                <Switch
                  checked={internationalRequiresApproval}
                  onCheckedChange={setInternationalRequiresApproval}
                />
              </div>
            </CardContent>
          </Card>

          {customRules.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Policy Rules</CardTitle>
                <CardDescription>
                  Enable or disable individual policy rules.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {customRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{rule.name}</p>
                      <p className="text-xs text-muted-foreground">{rule.message}</p>
                    </div>
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={() => toggleRule(rule.id)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset to Defaults
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Save Changes
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
