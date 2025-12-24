
/**
 * Convierte un código de país (ISO 3166-1 alpha-2) en un emoji de bandera.
 * @param countryCode Código del país (ej: "US", "AR")
 * @returns Emoji de la bandera
 */
export function getCountryFlag(countryCode: string) {
    if (!countryCode) return '';
    return countryCode.toUpperCase().replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
}

/**
 * Mapea el código de icono de OpenWeatherMap a un emoji representativo.
 * @param iconCode Código del icono (ej: "01d", "10n")
 * @returns Emoji del clima
 */
export function getWeatherEmoji(iconCode: string) {
    const map: Record<string, string> = {
        '01d': '☀️', '01n': '🌙',
        '02d': '⛅', '02n': '⛅',
        '03d': '☁️', '03n': '☁️',
        '04d': '☁️', '04n': '☁️',
        '09d': '🌧️', '09n': '🌧️',
        '10d': '🌦️', '10n': '🌦️',
        '11d': '⛈️', '11n': '⛈️',
        '13d': '❄️', '13n': '❄️',
        '50d': '🌫️', '50n': '🌫️'
    };
    return map[iconCode] || '🌡️';
}
