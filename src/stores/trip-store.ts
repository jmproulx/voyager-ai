import { create } from "zustand"
import type { TripSummary } from "@/types/trip"

interface TripStore {
  trips: TripSummary[]
  activeTripId: string | null
  isLoading: boolean

  setTrips: (trips: TripSummary[]) => void
  addTrip: (trip: TripSummary) => void
  updateTrip: (id: string, updates: Partial<TripSummary>) => void
  removeTrip: (id: string) => void
  setActiveTrip: (id: string | null) => void
  setIsLoading: (loading: boolean) => void
  reset: () => void
}

export const useTripStore = create<TripStore>((set) => ({
  trips: [],
  activeTripId: null,
  isLoading: false,

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
  reset: () => set({ trips: [], activeTripId: null, isLoading: false }),
}))
