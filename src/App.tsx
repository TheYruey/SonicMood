import { useRef, useEffect, useState } from 'react'
import { GlassCard } from './components/ui/GlassCard'
import { useStore } from './store/useStore'
import { getWeather, getWeatherByCity, getRecommendations, getCurrentUserProfile, createPlaylist, addTracksToPlaylist, searchCitiesWithWeather } from './services/api'
import { redirectToAuthCodeFlow, getAccessToken } from './utils/auth'
import { AuroraBackground } from './components/ui/AuroraBackground'
import { getGenresByWeather } from './utils/moodMap'
import { getWeatherEmoji } from './utils/iconHelpers'
import { SpotifyLogo, MusicNotes, Playlist, MagnifyingGlass, PlayCircle, CloudFog, SignOut, X } from 'phosphor-react'

// Load clientId from environment variables for security
const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;

if (!clientId) {
  throw new Error("Missing VITE_SPOTIFY_CLIENT_ID in .env file");
}

function App() {
  const { weather, token, setToken, setWeather, setTracks, setLoading, isLoading, tracks, logout } = useStore()
  const effectRan = useRef(false)
  const [cityInput, setCityInput] = useState("")
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const isSelecting = useRef(false)



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

  // Debounce Search Logic
  // Debounce Search Logic
  useEffect(() => {
    // If input change is due to selection, don't search
    if (isSelecting.current) {
      isSelecting.current = false;
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      if (cityInput.length > 2) {
        try {
          const results = await searchCitiesWithWeather(cityInput);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.error("Auto-search failed", error);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [cityInput]);

  const handleSelectSuggestion = async (data: any) => {
    isSelecting.current = true;
    setCityInput(`${data.name}, ${data.country}`);
    setSuggestions([]);
    setShowSuggestions(false);

    setLoading(true);
    try {
      // 1. Get Weather directly from coordinates
      const weatherData = await getWeather(data.lat, data.lon);
      const condition = weatherData.weather[0].main;
      const isDay = weatherData.dt > weatherData.sys.sunrise && weatherData.dt < weatherData.sys.sunset;

      setWeather({
        temperature: weatherData.main.temp,
        condition: condition,
        city: data.name,
        country: data.country,
        iconCode: data.iconCode,
        isDay: isDay
      });

      // 2. Determine Mood
      const seedGenres = getGenresByWeather(condition, isDay ? 'day' : 'night');

      // 3. Get Recommendations
      const recTracks = await getRecommendations(seedGenres, token || "");
      setTracks(recTracks);

    } catch (error) {
      console.error("Error selecting city:", error);
      alert("Failed to load weather data.");
    } finally {
      setLoading(false);
    }
  }

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
        country: weatherData.sys.country,
        iconCode: weatherData.weather[0].icon,
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
          country: weatherData.sys.country,
          iconCode: weatherData.weather[0].icon,
          isDay: isDay
        })

        setCityInput('') // Clear search input when syncing GPS

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
          <GlassCard className="col-span-1 md:col-span-2 text-center relative z-50 overflow-visible">
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
              {/* Search Bar Wrapper */}
              <div className="relative z-50 w-full max-w-md mx-auto">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 shadow-xl rounded-full px-5 py-3 w-full hover:bg-white/15 transition-all relative">
                  <input
                    type="text"
                    placeholder="Or type a city (e.g. Tokyo)..."
                    className="bg-transparent border-none outline-none text-white placeholder-blue-200/70 flex-1 font-medium pr-24"
                    value={cityInput}
                    onChange={(e) => {
                      setCityInput(e.target.value);
                    }}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                  />
                  <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center">
                    {cityInput && (
                      <button
                        onClick={() => {
                          setCityInput('');
                          setSuggestions([]);
                        }}
                        className="p-1 text-white/50 hover:text-white transition-colors"
                      >
                        <X size={16} weight="bold" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={handleManualSearch}
                    disabled={isLoading || !cityInput.trim()}
                    className="text-white hover:text-green-300 transition-colors disabled:opacity-50"
                  >
                    <MagnifyingGlass size={22} weight="bold" />
                  </button>
                </div>

                {/* Smart Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 w-full mt-2 z-[100] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                    {suggestions.map((item, index) => (
                      <div
                        key={`${item.lat}-${item.lon}-${index}`}
                        onClick={() => handleSelectSuggestion(item)}
                        className="p-3 cursor-pointer hover:bg-white/10 transition-colors flex items-center justify-between text-white group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium group-hover:text-green-300 transition-colors">{item.name}</span>
                          <img src={`https://flagcdn.com/w20/${item.country.toLowerCase()}.png`} alt={item.country} className="w-5 h-auto rounded-sm object-cover" />
                        </div>
                        <span className="flex items-center gap-2">
                          <span className="text-gray-300 text-sm font-light">{Math.round(item.temp)}°C</span>
                          <span className="text-xl filter drop-shadow-md">{getWeatherEmoji(item.iconCode)}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative w-full max-w-md"></div>

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
            <GlassCard className="col-span-1 md:col-span-2 relative z-0">

              <div className="flex flex-col md:flex-row items-end md:items-center justify-between gap-6 mb-8">
                {/* Left: Location & Date */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-purple-300 tracking-wider uppercase">Current Vibe</span>
                  </div>
                  <h2 className="text-4xl font-bold text-white leading-tight flex items-center gap-3">
                    {weather.city}, <span className="text-white/50">{weather.country}</span>
                    {weather.country && (
                      <img
                        src={`https://flagcdn.com/w40/${weather.country.toLowerCase()}.png`}
                        alt={weather.country}
                        className="h-6 w-auto rounded shadow-sm"
                      />
                    )}
                  </h2>
                  <p className="text-white/60 mt-1">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                </div>

                {/* Center/Right: Weather Stats */}
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-5xl font-light text-white tracking-tighter">
                      {Math.round(weather.temperature)}°
                    </div>
                    <div className="text-purple-200 capitalize font-medium">
                      {weather.condition}
                    </div>
                  </div>

                  {/* Weather Icon (Dynamic based on condition if possible, or generic) */}
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner">
                    <span className="text-4xl filter drop-shadow-md">
                      {getWeatherEmoji(weather.iconCode || '01d')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Bar (Save / Clear) */}
              <div className="flex items-center justify-end border-t border-white/10 pt-6">
                {tracks && (
                  <button
                    onClick={handleSavePlaylist}
                    className="text-xs bg-[#1DB954] hover:bg-[#1ed760] text-white px-4 py-2 rounded-full font-bold transition-all shadow-lg shadow-green-900/20 flex items-center gap-2"
                  >
                    <Playlist size={18} weight="bold" />
                    Save Playlist
                  </button>
                )}
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
