import axios from 'axios'

// Instancia de Axios para la API de Spotify
export const spotifyApi = axios.create({
    baseURL: 'https://api.spotify.com/v1',
})

// Instancia de Axios para la API de clima (OpenWeatherMap)
export const weatherApi = axios.create({
    baseURL: 'https://api.openweathermap.org/data/2.5',
})

/**
 * Obtiene el clima actual basado en coordenadas geográficas.
 * @param lat Latitud
 * @param lon Longitud
 * @returns Datos del clima en formato JSON
 */
export const getWeather = async (lat: number, lon: number) => {
    const response = await weatherApi.get(`/weather`, {
        params: {
            lat,
            lon,
            units: 'metric',
            appid: import.meta.env.VITE_WEATHER_API_KEY
        }
    })
    return response.data
}

/**
 * Obtiene el clima actual buscando por nombre de ciudad.
 * @param city Nombre de la ciudad
 * @returns Datos del clima
 */
export const getWeatherByCity = async (city: string) => {
    const response = await weatherApi.get(`/weather`, {
        params: {
            q: city,
            units: 'metric',
            appid: import.meta.env.VITE_WEATHER_API_KEY
        }
    })
    return response.data
}

/**
 * Busca ciudades por nombre y obtiene su clima actual.
 * Realiza dos pasos:
 * 1. Busca coordenadas usando Geo API.
 * 2. Obtiene el clima para cada ubicación encontrada.
 * @param query Nombre de la ciudad a buscar
 * @returns Lista de ciudades con su clima y coordenadas
 */
export const searchCitiesWithWeather = async (query: string) => {
    // 1. Fetch Locations from Geo API
    const geoResponse = await axios.get(`http://api.openweathermap.org/geo/1.0/direct`, {
        params: {
            q: query,
            limit: 5,
            appid: import.meta.env.VITE_WEATHER_API_KEY
        }
    });

    const locations = geoResponse.data;

    // 2. Fetch Weather for Each Location
    const results = await Promise.all(locations.map(async (loc: any) => {
        try {
            const weather = await getWeather(loc.lat, loc.lon);
            return {
                name: loc.name,
                country: loc.country,
                lat: loc.lat,
                lon: loc.lon,
                temp: weather.main.temp,
                iconCode: weather.weather[0].icon
            };
        } catch (e) {
            return null;
        }
    }));

    // Filter out failed requests
    return results.filter(item => item !== null);
}

/**
 * Obtiene los artistas más escuchados del usuario para usarlos como semillas.
 * @param token Token de acceso
 * @returns Lista de IDs de artistas
 */
/**
 * Obtiene los artistas más escuchados del usuario para usarlos como semillas.
 * @param token Token de acceso
 * @returns Lista de IDs de artistas (máximo 2)
 */
export const getTopArtists = async (token: string): Promise<string[]> => {
    try {
        const response = await fetch('https://api.spotify.com/v1/me/top/artists?limit=2', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        if (!response.ok) return [];
        const data = await response.json();
        return data.items.map((artist: any) => artist.id);
    } catch (e) {
        console.error("Failed to fetch top artists", e);
        return [];
    }
}

/**
 * Interfaz para los parámetros de recomendación de Spotify.
 * Permite definir semillas (artistas, géneros) y objetivos de atributos de audio (energía, valencia, etc.).
 */
interface RecommendationParams {
    seed_artists?: string;
    seed_genres?: string;
    min_energy?: number;
    target_energy?: number;
    target_valence?: number;
    target_acousticness?: number;
    limit?: number;
    market?: string;
    [key: string]: any;
}

/**
 * Obtiene recomendaciones de canciones usando la API oficial de recomendaciones.
 * @param params Parámetros para la recomendación (seeds, targets)
 * @param token Token de acceso de Spotify
 * @returns Lista de canciones (tracks)
 */
/**
 * Obtiene recomendaciones de canciones usan la API oficial.
 * VERSION ROBUSTA: URL Hardcoded + Fallback interno.
 */
/**
 * Obtiene recomendaciones de canciones usando la API oficial.
 * VERSIÓN ROBUSTA: Construye la URL manualmente y maneja fallos con un fallback de búsqueda.
 * 
 * 1. Prioriza `seed_artists` (Top Artists del usuario).
 * 2. Si falla o no hay artistas, usa `seed_genres` como respaldo.
 * 3. Si la API de recomendaciones falla (ej. 404), cambia a la API de búsqueda (`getRecommendationsFallback`).
 * 
 * @param params Parámetros de configuración (semillas y target features)
 * @param token Token de acceso
 * @returns Lista de canciones recomendadas
 */
export const getRecommendations = async (params: RecommendationParams, token: string) => {
    // 1. Validate Seeds
    const { seed_artists, seed_genres, target_valence, target_energy, limit } = params;

    // Fallback if no seeds at all
    if (!seed_artists && !seed_genres) {
        console.warn("getRecommendations: No seeds provided, falling back to search.");
        // Use a default genre for fallback if nothing provided
        return getRecommendationsFallback("pop", token);
    }

    // 2. Construct Params Explicitly
    const urlParams = new URLSearchParams({
        limit: (limit || 12).toString(),
        market: 'US', // Hardcoded market to prevent 404s
    });

    if (seed_artists) urlParams.append('seed_artists', seed_artists);
    // Only append seed_genres if we DON'T have artists (exclusive logic to avoid conflicts)
    // or if we really want to mix. For stability, let's prioritize artists.
    else if (seed_genres) urlParams.append('seed_genres', seed_genres);

    if (target_valence) urlParams.append('target_valence', target_valence.toString());
    if (target_energy) urlParams.append('target_energy', target_energy.toString());
    if (params.target_acousticness) urlParams.append('target_acousticness', params.target_acousticness.toString());

    // 3. HARDCODED URL
    const finalUrl = `https://api.spotify.com/v1/recommendations?${urlParams.toString()}`;
    console.log("Fetching Recommendations URL:", finalUrl);

    try {
        const response = await fetch(finalUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Recommendations API Failed: ${response.status}`, errorBody);

            // 4. Fallback Logic
            // If failed (404/403), trigger the Search API Fallback
            if (seed_genres || params.seed_genres) {
                console.warn("Triggering Fallback to Search API...");
                return getRecommendationsFallback(seed_genres || params.seed_genres || "pop", token);
            }
            return [];
        }

        const data = await response.json();
        return data.tracks || [];

    } catch (error) {
        console.error("Network error in getRecommendations:", error);
        // Fallback on network error too
        return getRecommendationsFallback(seed_genres || "pop", token);
    }
}

/**
 * Fallback: Obtiene canciones usando la API de búsqueda (Search API).
 * Se usa cuando la API de recomendaciones falla o no devuelve resultados.
 * Selecciona un género aleatorio de la lista de semillas y busca canciones de ese género.
 * 
 * @param seed_genres Géneros separados por comas
 * @param token Token de acceso
 * @returns Lista de canciones encontradas (mezcladas aleatoriamente)
 */
const getRecommendationsFallback = async (seed_genres: string, token: string) => {
    const genres = seed_genres.split(',');
    const selectedGenre = genres[Math.floor(Math.random() * genres.length)].trim();

    const params = new URLSearchParams({
        q: `genre:${selectedGenre}`,
        type: 'track',
        limit: '12'
    });

    const response = await fetch(`https://api.spotify.com/v1/search?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) return [];
    const data = await response.json();
    return (data.tracks?.items || []).sort(() => Math.random() - 0.5);
}

/**
 * Obtiene el perfil del usuario actual de Spotify.
 * @param token Token de acceso
 * @returns Objeto con datos del usuario
 */
export const getCurrentUserProfile = async (token: string) => {
    const response = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Failed to fetch user profile");
    return response.json();
}

/**
 * Crea una nueva playlist en la cuenta del usuario.
 * @param userId ID del usuario de Spotify
 * @param name Nombre de la playlist
 * @param token Token de acceso
 * @returns Datos de la playlist creada
 */
export const createPlaylist = async (userId: string, name: string, token: string) => {
    const response = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name,
            description: "Generated by SonicMood based on local weather.",
            public: false
        })
    });
    if (!response.ok) throw new Error("Failed to create playlist");
    return response.json();
}

/**
 * Agrega canciones a una playlist existente.
 * @param playlistId ID de la playlist
 * @param uris Lista de URIs de Spotify de las canciones (spotify:track:...)
 * @param token Token de acceso
 * @returns Respuesta de la API
 */
export const addTracksToPlaylist = async (playlistId: string, uris: string[], token: string) => {
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            uris
        })
    });
    if (!response.ok) throw new Error("Failed to add tracks to playlist");
    return response.json();
}