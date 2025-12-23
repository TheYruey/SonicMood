import axios from 'axios'

export const authEndpoint = "https://accounts.spotify.com/authorize"
const redirectUri = "http://localhost:5173/"
const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID

const scopes = [
    "user-read-private",
    "user-read-email",
    "playlist-read-private",
]

export const loginUrl = `${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join(
    "%20"
)}&response_type=token&show_dialog=true`

export const getTokenFromUrl = () => {
    return window.location.hash
        .substring(1)
        .split("&")
        .reduce((initial: any, item) => {
            let parts = item.split("=")
            initial[parts[0]] = decodeURIComponent(parts[1])
            return initial
        }, {})
}

export const spotifyApi = axios.create({
    baseURL: 'https://api.spotify.com/v1',
})

export const weatherApi = axios.create({
    baseURL: 'https://api.openweathermap.org/data/2.5',
})
