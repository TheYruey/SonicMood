export interface WeatherData {
    temperature: number
    condition: string
    city: string
}

export interface UserProfile {
    id: string
    display_name: string
    images: { url: string }[]
}
