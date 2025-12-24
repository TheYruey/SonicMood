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
 * Obtiene recomendaciones de canciones basadas en géneros.
 * NOTA: Usa el endpoint de búsqueda `search` como respaldo robusto ya que `recommendations` puede fallar.
 * @param seed_genres Géneros separados por comas
 * @param token Token de acceso de Spotify
 * @returns Lista de canciones (tracks)
 */
export const getRecommendations = async (seed_genres: string, token: string) => {
    if (!token) {
        throw new Error("No token provided");
    }

    // NOTE: The /recommendations endpoint is deprecated/returned 404 for this client.
    // We are switching to /search API using the genre filter as a robust fallback.

    const genres = seed_genres.split(',');
    // Pick one random genre to ensure valid search results (searching multiple genres with OR is tricky)
    // and to provide variety on each sync.
    const selectedGenre = genres[Math.floor(Math.random() * genres.length)].trim();

    console.log(`Using Search API Fallback for genre: ${selectedGenre}`);

    const params = new URLSearchParams({
        q: `genre:${selectedGenre}`,
        type: 'track',
        limit: '20' // Get more tracks to shuffle client-side if needed, though simple limit is fine
    });

    const url = `https://api.spotify.com/v1/search?${params.toString()}`;

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const text = await response.text();
        console.error("Search API Failed:", response.status, text);
        throw new Error(`Spotify Search Error ${response.status}: ${text}`);
    }

    const data = await response.json();

    // Search API returns { tracks: { items: [...] } }
    // We map it to match the expected format (array of tracks)
    // Also shuffling the results slightly to avoid always showing top 3 popular ones
    const items = data.tracks?.items || [];
    return items.sort(() => Math.random() - 0.5).slice(0, 12);
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