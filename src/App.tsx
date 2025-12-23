import { useRef, useEffect } from 'react'
import { GlassCard } from './components/ui/GlassCard'
import { useStore } from './store/useStore'
import { getWeather, getRecommendations } from './services/api'
import { redirectToAuthCodeFlow, getAccessToken } from './utils/auth'
import { getGenresByWeather } from './utils/moodMap'
import { SpotifyLogo, MusicNotes } from 'phosphor-react'

// Load clientId from environment variables for security
const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;

if (!clientId) {
  throw new Error("Missing VITE_SPOTIFY_CLIENT_ID in .env file");
}

function App() {
  const { weather, token, setToken, setWeather, setTracks, setLoading, isLoading, tracks } = useStore()
  const effectRan = useRef(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code && !token) {
      const fetchToken = async () => {
        try {
          const accessToken = await getAccessToken(clientId, code);
          setToken(accessToken);
        } catch (e) {
          console.error("Token exchange failed", e);
          setToken(null); // Force re-login if exchange fails
        } finally {
          window.history.replaceState({}, document.title, "/");
        }
      }
      fetchToken();
    }
  }, [setToken, token])

  const handleLogin = () => {
    redirectToAuthCodeFlow(clientId);
  }


  const handleSync = () => {
    if (!token) return
    setLoading(true)

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser")
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords

        // 1. Get Weather
        const weatherData = await getWeather(latitude, longitude)
        const condition = weatherData.weather[0].main
        const isDay = weatherData.dt > weatherData.sys.sunrise && weatherData.dt < weatherData.sys.sunset

        setWeather({
          temperature: weatherData.main.temp,
          condition: condition,
          city: weatherData.name
        })

        // 2. Determine Mood
        const seedGenres = getGenresByWeather(condition, isDay ? 'day' : 'night')

        // 3. Get Recommendations
        const recTracks = await getRecommendations(seedGenres, token)
        setTracks(recTracks)

      } catch (error) {
        console.error("Error syncing vibe:", error)
        alert("Failed to sync vibe. Please try again.")
      } finally {
        setLoading(false)
      }
    }, (error) => {
      console.error("Geolocation error:", error)
      alert("Unable to retrieve location.")
      setLoading(false)
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        <GlassCard className="col-span-1 md:col-span-2 text-center">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">SonicMood</h1>
          <p className="text-gray-200 mb-6">
            Music discovery driven by your local weather.
          </p>

          {token && (
            <button
              onClick={handleSync}
              disabled={isLoading}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-3 rounded-full font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
            >
              {isLoading ? (
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
              ) : (
                <MusicNotes size={24} weight="fill" className="text-purple-400" />
              )}
              {isLoading ? 'Syncing...' : 'Sincronizar Vibe'}
            </button>
          )}
        </GlassCard>

        {/* Auth status (only show if not logged in or purely informational ?) 
            User requested: "User logs in -> Clicks button". 
            Let's keep the discrete auth card if not logged in, or hide it if logged in to focus on Vibe. 
            Actually, let's keep it compact.
        */}
        {!token && (
          <GlassCard className="col-span-1 md:col-span-2 flex flex-col items-center justify-center space-y-4 py-12">
            <div className="text-xl">Authentication</div>
            <button
              onClick={handleLogin}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full font-medium transition-colors flex items-center gap-2 cursor-pointer"
            >
              <SpotifyLogo size={24} weight="fill" />
              Connect Spotify
            </button>
          </GlassCard>
        )}

        {weather && (
          <GlassCard className="col-span-1 md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">{weather.city}</h2>
                <div className="text-4xl font-light">{Math.round(weather.temperature)}°C</div>
              </div>
              <div className="text-right">
                <div className="text-xl capitalize">{weather.condition}</div>
              </div>
            </div>

            {tracks && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {tracks.map(track => (
                  <div key={track.id} className="flex items-center gap-3 bg-white/5 p-3 rounded-lg hover:bg-white/10 transition-colors group cursor-pointer" onClick={() => window.open(track.uri, '_blank')}>
                    <img src={track.album.images[0]?.url} alt={track.name} className="w-12 h-12 rounded object-cover" />
                    <div className="overflow-hidden">
                      <div className="font-medium truncate text-sm text-white group-hover:text-green-400 transition-colors">{track.name}</div>
                      <div className="text-xs text-gray-400 truncate">{track.artists.map(a => a.name).join(', ')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        )}
      </div>
    </div>
  )
}

export default App
