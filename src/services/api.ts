import axios from 'axios'

export const spotifyApi = axios.create({
    baseURL: 'https://api.spotify.com/v1',
})

export const weatherApi = axios.create({
    baseURL: 'https://api.openweathermap.org/data/2.5',
})

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