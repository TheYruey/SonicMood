/**
 * Mapea las condiciones del clima y la hora del día a géneros musicales de Spotify.
 * @param condition Descripción del clima (ej: "Clear", "Rain")
 * @param timeOfDay 'day' o 'night'
 * @returns Cadena de géneros separados por comas para la API de Spotify
 */
export const getGenresByWeather = (condition: string, timeOfDay: 'day' | 'night'): string => {
    const weather = condition.toLowerCase()

    if (weather.includes('rain') || weather.includes('drizzle') || weather.includes('thunderstorm')) {
        return "acoustic,piano,chill"
    }

    if (weather.includes('clear')) {
        return timeOfDay === 'day' ? "pop,summer,road-trip" : "club,dance,synth-pop"
    }

    if (weather.includes('clouds') || weather.includes('atmosphere') || weather.includes('mist') || weather.includes('fog')) {
        return "indie,alt-rock"
    }

    if (weather.includes('snow')) {
        return "classical,holidays"
    }

    return "pop"
}
