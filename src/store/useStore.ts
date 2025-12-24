import { create } from 'zustand'
import type { UserProfile, WeatherData, Track } from '../types'

/**
 * Define el estado global de la aplicación.
 */
interface StoreState {
    user: UserProfile | null
    weather: WeatherData | null
    token: string | null
    tracks: Track[] | null // Canciones recomendadas actuales
    isLoading: boolean
    setUser: (user: UserProfile | null) => void
    setWeather: (weather: WeatherData | null) => void
    setToken: (token: string | null) => void
    setTracks: (tracks: Track[] | null) => void
    setLoading: (loading: boolean) => void
    logout: () => void
}

import { persist } from 'zustand/middleware'

/**
 * Hook de Zustand para manejar el estado global.
 * Utiliza middleware 'persist' para guardar ciertos datos en localStorage.
 */
export const useStore = create<StoreState>()(
    persist(
        (set) => ({
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
            logout: () => set({
                user: null,
                weather: null,
                token: null,
                tracks: null,
                isLoading: false
            }),
        }),
        {
            name: 'sonicmood-storage',
            partialize: (state) => ({
                token: state.token,
                weather: state.weather,
                tracks: state.tracks
            })
        }
    )
)
