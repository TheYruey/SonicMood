export interface WeatherData {
    temperature: number
    condition: string
    city: string
    isDay: boolean
}

export interface UserProfile {
    id: string
    display_name: string
    images: { url: string }[]
}

export interface Track {
    id: string
    name: string
    artists: { name: string }[]
    album: {
        images: { url: string }[]
    }
    uri: string
}
