/**
 * Determina el gradiente de fondo basado en el clima y la hora del día.
 * @param condition Descripción del clima
 * @param isDay true si es de día, false si es de noche
 * @returns Clases de Tailwind CSS para el gradiente
 */
export const getGradientByWeather = (condition: string, isDay: boolean): string => {
    const lowerCondition = condition.toLowerCase();

    // Clear Sky handling (Day vs Night)
    if (lowerCondition.includes('clear')) {
        return isDay
            ? "bg-gradient-to-br from-orange-400 via-red-500 to-purple-600"
            : "bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900";
    }

    // Rain / Drizzle / Thunderstorm
    if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle') || lowerCondition.includes('thunderstorm')) {
        return "bg-gradient-to-br from-slate-800 via-blue-900 to-slate-900";
    }

    // Clouds / Atmosphere
    if (lowerCondition.includes('clouds') || lowerCondition.includes('mist') || lowerCondition.includes('fog') || lowerCondition.includes('haze')) {
        return "bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800";
    }

    // Snow
    if (lowerCondition.includes('snow')) {
        return "bg-gradient-to-br from-blue-100 via-blue-300 to-slate-400";
    }

    // Default Fallback
    return "bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900";
}
