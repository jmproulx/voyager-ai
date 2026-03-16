import { create } from "zustand"
import type { TripSummary, FlightAlertInfo } from "@/types/trip"

interface TripStore {
  trips: TripSummary[]
  activeTripId: string | null
  isLoading: boolean
  alerts: FlightAlertInfo[]
  unreadAlertCount: number

  setTrips: (trips: TripSummary[]) => void
  addTrip: (trip: TripSummary) => void
  updateTrip: (id: string, updates: Partial<TripSummary>) => void
  removeTrip: (id: string) => void
  setActiveTrip: (id: string | null) => void
  setIsLoading: (loading: boolean) => void
  setAlerts: (alerts: FlightAlertInfo[]) => void
  acknowledgeAlert: (id: string) => void
  reset: () => void
}

export const useTripStore = create<TripStore>((set) => ({
  trips: [],
  activeTripId: null,
  isLoading: false,
  alerts: [],
  unreadAlertCount: 0,

  setTrips: (trips) => set({ trips }),
  addTrip: (trip) => set((state) => ({ trips: [...state.trips, trip] })),
  updateTrip: (id, updates) =>
    set((state) => ({
      trips: state.trips.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  removeTrip: (id) =>
    set((state) => ({
      trips: state.trips.filter((t) => t.id !== id),
    })),
  setActiveTrip: (id) => set({ activeTripId: id }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setAlerts: (alerts) =>
    set({
      alerts,
      unreadAlertCount: alerts.filter((a) => !a.acknowledged).length,
    }),
  acknowledgeAlert: (id) =>
    set((state) => {
      const updated = state.alerts.map((a) =>
        a.id === id ? { ...a, acknowledged: true } : a
      )
      return {
        alerts: updated,
        unreadAlertCount: updated.filter((a) => !a.acknowledged).length,
      }
    }),
  reset: () =>
    set({
      trips: [],
      activeTripId: null,
      isLoading: false,
      alerts: [],
      unreadAlertCount: 0,
    }),
}))
