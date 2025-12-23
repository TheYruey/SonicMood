import { useRef, useEffect, useState } from 'react'
import { GlassCard } from './components/ui/GlassCard'
import { useStore } from './store/useStore'
import { getWeather, getWeatherByCity, getRecommendations, getCurrentUserProfile, createPlaylist, addTracksToPlaylist } from './services/api'
import { redirectToAuthCodeFlow, getAccessToken } from './utils/auth'
import { AuroraBackground } from './components/ui/AuroraBackground'
import { getGenresByWeather } from './utils/moodMap'
import { SpotifyLogo, MusicNotes, Playlist, MagnifyingGlass, PlayCircle, CloudFog, SignOut } from 'phosphor-react'

// Load clientId from environment variables for security
const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;

if (!clientId) {
  throw new Error("Missing VITE_SPOTIFY_CLIENT_ID in .env file");
}

function App() {
  const { weather, token, setToken, setWeather, setTracks, setLoading, isLoading, tracks, logout } = useStore()
  const effectRan = useRef(false)
  const [cityInput, setCityInput] = useState("")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code && !token) {
      if (effectRan.current) return; // Prevent double execution in Strict Mode
      effectRan.current = true;

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

  const handleManualSearch = async () => {
    if (!token || !cityInput.trim()) return
    setLoading(true)

    try {
      // 1. Get Weather by City
      const weatherData = await getWeatherByCity(cityInput)
      const condition = weatherData.weather[0].main
      const isDay = weatherData.dt > weatherData.sys.sunrise && weatherData.dt < weatherData.sys.sunset

      setWeather({
        temperature: weatherData.main.temp,
        condition: condition,
        city: weatherData.name,
        isDay: isDay
      })

      // 2. Determine Mood
      const seedGenres = getGenresByWeather(condition, isDay ? 'day' : 'night')

      // 3. Get Recommendations
      const recTracks = await getRecommendations(seedGenres, token)
      setTracks(recTracks)

      // Clear input on success
      setCityInput("")

    } catch (error) {
      console.error("Error searching city:", error)
      alert("City not found or error fetching data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Allow pressing Enter to search
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualSearch();
    }
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
          city: weatherData.name,
          isDay: isDay
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

  const handleSavePlaylist = async () => {
    if (!token || !tracks || !weather) return;

    if (!confirm("Create a new playlist in your Spotify account with these tracks?")) return;

    try {
      setLoading(true);
      // 1. Get User ID
      const user = await getCurrentUserProfile(token);

      // 2. Create Playlist
      const playlistName = `SonicMood - ${weather.city} ${weather.condition}`;
      const playlist = await createPlaylist(user.id, playlistName, token);

      // 3. Add Tracks
      const uris = tracks.map(t => t.uri);
      await addTracksToPlaylist(playlist.id, uris, token);

      alert(`Playlist "${playlistName}" created successfully!`);
    } catch (error) {
      console.error("Failed to save playlist:", error);
      alert("Failed to save playlist. You may need to log out and log in again to grant permissions.");
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = () => {
    logout();
    window.location.reload();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AuroraBackground />

      {!token ? (
        // Unified Login View
        <div className="w-full max-w-md">
          <GlassCard className="flex flex-col items-center justify-center py-16 px-8 text-center space-y-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>

            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <CloudFog size={40} weight="duotone" className="text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                <h1 className="text-5xl font-extrabold tracking-tight text-white drop-shadow-sm">
                  SonicMood
                </h1>
              </div>
              <p className="text-xl text-gray-300 font-medium">
                Discover music that matches your atmosphere.
              </p>
            </div>

            <button
              onClick={handleLogin}
              className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-white px-10 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-green-500/30 flex items-center justify-center gap-3"
            >
              <SpotifyLogo size={28} weight="fill" />
              Connect Spotify
            </button>
          </GlassCard>
        </div>
      ) : (
        // Dashboard View
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 relative">
          <GlassCard className="col-span-1 md:col-span-2 text-center relative">
            <div className="absolute top-6 right-6 z-10">
              <button
                onClick={handleLogout}
                className="text-white/70 hover:text-red-400 hover:bg-white/10 p-2 rounded-full transition-all"
                title="Sign Out"
              >
                <SignOut size={24} />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center mb-8">
              <div className="flex items-center gap-3 mb-2">
                <CloudFog size={48} weight="duotone" className="text-white/90" />
                <h1 className="text-6xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/60 drop-shadow-sm">
                  SonicMood
                </h1>
              </div>
              <p className="text-lg font-light text-white/70 tracking-wide">
                Music discovery driven by your atmosphere.
              </p>
            </div>

            <div className="flex flex-col items-center gap-4">
              {/* Search Bar */}
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 shadow-xl rounded-full px-5 py-3 w-full max-w-md hover:bg-white/15 transition-all">
                <input
                  type="text"
                  placeholder="Or type a city (e.g. Tokyo)..."
                  className="bg-transparent border-none outline-none text-white placeholder-blue-200/70 flex-1 font-medium"
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                />
                <button
                  onClick={handleManualSearch}
                  disabled={isLoading || !cityInput.trim()}
                  className="text-white hover:text-green-300 transition-colors disabled:opacity-50"
                >
                  <MagnifyingGlass size={22} weight="bold" />
                </button>
              </div>

              <div className="text-gray-400 text-sm">- or -</div>

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
                {isLoading ? 'Syncing...' : 'Use My GPS Location'}
              </button>
            </div>
          </GlassCard>

          {weather && (
            <GlassCard className="col-span-1 md:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{weather.city}</h2>
                  <div className="text-4xl font-light">{Math.round(weather.temperature)}°C</div>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <div className="text-xl capitalize">{weather.condition}</div>
                  {tracks && (
                    <button
                      onClick={handleSavePlaylist}
                      className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-full flex items-center gap-1 transition-colors"
                    >
                      <Playlist size={16} weight="bold" />
                      Save to Spotify
                    </button>
                  )}
                </div>
              </div>

              {tracks && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
                  {tracks.map(track => (
                    <div key={track.id} className="group relative flex flex-col cursor-pointer" onClick={() => window.open(track.uri, '_blank')}>
                      <div className="relative aspect-square overflow-hidden rounded-xl shadow-lg mb-3">
                        <img src={track.album.images[0]?.url} alt={track.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                          <PlayCircle size={48} weight="fill" className="text-white drop-shadow-xl transform scale-75 group-hover:scale-100 transition-transform duration-300" />
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-white text-sm truncate group-hover:text-green-300 transition-colors">{track.name}</div>
                        <div className="text-xs text-blue-100 truncate opacity-80">{track.artists.map(a => a.name).join(', ')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          )}
        </div>
      )}
    </div>
  )
}

export default App
