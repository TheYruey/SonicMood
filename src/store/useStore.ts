import { create } from 'zustand'
import type { UserProfile, WeatherData } from '../types'

interface StoreState {
    user: UserProfile | null
    weather: WeatherData | null
    token: string | null
    setUser: (user: UserProfile | null) => void
    setWeather: (weather: WeatherData | null) => void
    setToken: (token: string | null) => void
}

export const useStore = create<StoreState>((set) => ({
    user: null,
    weather: null,
    token: null,
    setUser: (user) => set({ user }),
    setWeather: (weather) => set({ weather }),
    setToken: (token) => set({ token }),
}))
