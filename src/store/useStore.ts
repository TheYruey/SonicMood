import { create } from 'zustand'
import type { UserProfile, WeatherData, Track } from '../types'

interface StoreState {
    user: UserProfile | null
    weather: WeatherData | null
    token: string | null
    tracks: Track[] | null
    isLoading: boolean
    setUser: (user: UserProfile | null) => void
    setWeather: (weather: WeatherData | null) => void
    setToken: (token: string | null) => void
    setTracks: (tracks: Track[] | null) => void
    setLoading: (loading: boolean) => void
}

export const useStore = create<StoreState>((set) => ({
    user: null,
    weather: null,
    token: null,
    tracks: null,
    isLoading: false,
    setUser: (user) => set({ user }),
    setWeather: (weather) => set({ weather }),
    setToken: (token) => set({ token }),
    setTracks: (tracks) => set({ tracks }),
    setLoading: (isLoading) => set({ isLoading }),
}))
