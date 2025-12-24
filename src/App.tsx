import { useRef, useEffect, useState } from 'react'
import { GlassCard } from './components/ui/GlassCard'
import { Footer } from './components/ui/Footer'
import { useStore } from './store/useStore'
import { getWeather, getWeatherByCity, getRecommendations, getTopArtists, getCurrentUserProfile, createPlaylist, addTracksToPlaylist, searchCitiesWithWeather } from './services/api'
import { redirectToAuthCodeFlow, getAccessToken } from './utils/auth'
import { AnimatedBackground } from './components/ui/AnimatedBackground'
import { TypewriterText } from './components/ui/TypewriterText'
import { TypewriterTagline } from './components/ui/TypewriterTagline'


import { getGenresByWeather } from './utils/moodMap'
import { getWeatherEmoji } from './utils/iconHelpers'
import { SpotifyLogo, MusicNotes, Playlist, MagnifyingGlass, CloudFog, SignOut, X, CaretDown, ArrowsClockwise } from 'phosphor-react'
import { TrackCard } from './components/ui/TrackCard'

// Load clientId from environment variables for security
const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;

if (!clientId) {
  throw new Error("Missing VITE_SPOTIFY_CLIENT_ID in .env file");
}


// Interfaz para el perfil de usuario de Spotify
interface UserProfile {
  display_name: string;
  images: { url: string }[];
  id: string;
  external_urls: { spotify: string };
  country?: string;
}

// Componente principal de la aplicación
function App() {

  const { weather, token, setToken, setWeather, setTracks, setLoading, isLoading, tracks, logout } = useStore()
  const effectRan = useRef(false)
  const [cityInput, setCityInput] = useState("")
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const isSelecting = useRef(false)
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  // Cierra el menú desplegable al hacer clic fuera de él
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);



  // Efecto para manejar el intercambio de código de autenticación de Spotify
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

  // Fetch User Profile when token is available
  useEffect(() => {
    if (token) {
      getCurrentUserProfile(token)
        .then(setUser)
        .catch((e) => {
          console.error("Failed to fetch user profile", e);
          // Optional: clear token if invalid? 
          // setToken(null); 
        });
    }
  }, [token]);

  // Lógica de búsqueda con Debounce (espera a que el usuario termine de escribir)
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

  /**
   * Helper para mapear el clima a atributos de audio objetivos de Spotify.
   * Define qué tan enérgica, feliz (valence) o acústica debe ser la música.
   */
  const getAudioFeatures = (condition: string, isDay: boolean) => {
    let targets: any = {};
    const lowerCondition = condition.toLowerCase();

    if (lowerCondition.includes('clear') || lowerCondition.includes('sun')) {
      targets = { target_valence: 0.8, target_energy: 0.7 };
    } else if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) {
      targets = { target_valence: 0.3, target_energy: 0.4, target_acousticness: 0.7 };
    } else if (lowerCondition.includes('cloud')) {
      targets = { target_valence: 0.5, target_energy: 0.5 };
    } else if (lowerCondition.includes('snow')) {
      targets = { target_valence: 0.6, target_energy: 0.3 };
    } else if (lowerCondition.includes('thunder')) {
      targets = { target_valence: 0.2, target_energy: 0.8 };
    } else {
      // Default / Mist / Fog etc
      targets = { target_valence: 0.5, target_energy: 0.5 };
    }

    // Night time adjustment: lower energy
    if (!isDay) {
      targets.target_energy = Math.max(0.1, (targets.target_energy || 0.5) - 0.2);
    }

    return targets;
  }

  /**
   * Lógica centralizada para obtener canciones.
   * 1. Obtiene semillas (Top Artists) si están disponibles.
   * 2. Calcula los atributos de audio objetivos (Targets) según el clima.
   * 3. Llama a la API de recomendaciones con los parámetros calculados.
   */
  const fetchTracks = async (condition: string, isDay: boolean) => {
    if (!token) return;

    try {
      // 1. Get Seeds (Top Artists)
      const topArtistIds = await getTopArtists(token);

      // 2. Define Targets
      const targets = getAudioFeatures(condition, isDay);

      // 3. Fallback Genres if no artists or just safely mix them in if needed, 
      // but API usually takes one or the other or both. 
      // Requirement: "If user has no top artists... fallback to generic seed_genres"

      // We always get a fallback genre just in case
      const fallbackGenres = getGenresByWeather(condition, isDay ? 'day' : 'night'); // Returns comma separated string

      let params: any = {
        ...targets,
        seed_genres: fallbackGenres, // Always include for fallback support
        market: user?.country || 'US'
      };

      if (topArtistIds.length > 0) {
        params.seed_artists = topArtistIds.join(',');
      }

      console.log("Fetching recommendations with:", params);

      const recTracks = await getRecommendations(params, token);
      setTracks(recTracks);

    } catch (error) {
      console.error("Error fetching tracks:", error);
      alert("Could not fetch recommendations.");
    }
  }

  /**
   * Maneja la selección de una sugerencia de ciudad.
   * 1. Obtiene el clima de las coordenadas seleccionadas.
   * 2. Determina el estado de ánimo (mood) basado en el clima.
   * 3. Obtiene recomendaciones de Spotify.
   */
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

      // 2. Fetch Tracks
      await fetchTracks(condition, isDay);

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

  /**
   * Maneja la búsqueda manual por texto (Enter o clic en lupa).
   * Similar a handleSelectSuggestion pero busca primero el clima por el nombre de ciudad.
   */
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

      // 2. Fetch Tracks
      await fetchTracks(condition, isDay);

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

  /**
   * Sincroniza la "vibra" usando la ubicación GPS del dispositivo.
   */
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

        // 2. Fetch Tracks
        await fetchTracks(condition, isDay);

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

  /**
   * "Baraja" (Shuffle) las canciones manteniendo el mismo "vibe".
   * Simplemente vuelve a llamar a la API con los mismos parámetros para obtener resultados nuevos.
   */
  const handleShuffle = async () => {
    if (!token || !weather) return;
    setLoading(true);
    try {
      // Just re-fetching with the same params usually yields different results from Spotify
      // especially with our random sorting in fallback and dynamic seeds if we were rotating them (we aren't yet but API is random enough)
      await fetchTracks(weather.condition, weather.isDay);
    } catch (e) {
      console.error("Shuffle failed", e);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Guarda las canciones recomendadas actuales en una nueva playlist de Spotify.
   */
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
    <div className="relative z-10 min-h-screen flex flex-col text-white font-sans selection:bg-cyan-500/30">
      <div className="fixed inset-0 w-full h-full -z-20">
        <AnimatedBackground />
      </div>
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">

        {!token ? (
          // Unified Login View
          <div className="w-full max-w-md relative">
            <GlassCard className="flex flex-col items-center justify-center py-12 px-12 text-center space-y-8 relative overflow-hidden bg-slate-900/30 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>

              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <CloudFog size={40} weight="duotone" className="text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                  <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white drop-shadow-sm">
                    SonicMood
                  </h1>
                </div>
                <div className="text-xl text-gray-300 font-light h-16 md:h-auto flex flex-col md:block items-center justify-center">
                  <span>Discover music for </span>
                  <TypewriterTagline
                    phrases={[
                      "rainy days 🌧️",
                      "late night drives 🌃",
                      "sunny mornings ☀️",
                      "your atmosphere 🎧"
                    ]}
                  />
                </div>
              </div>

              <button
                onClick={handleLogin}
                className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-white px-10 py-4 rounded-full font-bold text-lg tracking-wide transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-green-500/20 hover:shadow-green-500/40 duration-300 flex items-center justify-center gap-3"
              >
                <SpotifyLogo size={28} weight="fill" />
                Connect Spotify
              </button>
            </GlassCard>
          </div>
        ) : (
          // Dashboard View
          <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 relative">
            <GlassCard className="col-span-1 md:col-span-2 text-center relative z-50 overflow-visible bg-slate-900/30 backdrop-blur-xl border-white/10">
              <div className="absolute top-3 right-3 md:top-6 md:right-6 flex items-center gap-3 md:gap-4 z-[100]" ref={menuRef}>
                {user ? (
                  <div className="relative">
                    <button
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className="flex items-center gap-3 px-1 py-1 md:px-3 md:py-2 rounded-full hover:bg-white/10 transition-all border border-transparent hover:border-white/5 group"
                    >
                      <img
                        src={user.images?.[0]?.url || 'https://ui-avatars.com/api/?name=' + user.display_name}
                        alt={user.display_name}
                        className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white/20 shadow-lg object-cover ring-2 ring-transparent group-hover:ring-green-400 transition-all"
                      />
                      <span className="hidden md:block text-white font-medium text-sm tracking-wide shadow-black drop-shadow-md">
                        {user.display_name}
                      </span>
                      <CaretDown size={16} className={`text-white/70 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isMenuOpen && (
                      <div className="absolute top-full right-0 mt-2 w-56 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100] transform origin-top-right animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5">

                        {/* Option 1: Spotify Profile */}
                        <a
                          href={user.external_urls?.spotify || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="group flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-slate-200 hover:text-white hover:bg-[#1DB954]/10 transition-all duration-200"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <SpotifyLogo
                            size={20}
                            weight="duotone"
                            className="text-[#1DB954] group-hover:scale-110 group-hover:drop-shadow-[0_0_5px_rgba(29,185,84,0.5)] transition-transform duration-300"
                          />
                          <span>Open in Spotify</span>
                        </a>

                        {/* Elegant Separator */}
                        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mx-2 my-1"></div>

                        {/* Option 2: Logout */}
                        <button
                          onClick={handleLogout}
                          className="group flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 w-full text-left"
                        >
                          <SignOut
                            size={20}
                            weight="bold"
                            className="group-hover:-translate-x-1 transition-transform duration-300"
                          />
                          <span>Log Out</span>
                        </button>

                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={handleLogout}
                    className="text-white/70 hover:text-red-400 hover:bg-white/10 p-2 rounded-full transition-all"
                    title="Sign Out"
                  >
                    <SignOut size={24} />
                  </button>
                )}
              </div>

              <div className="flex flex-col items-center justify-center mb-8 mt-16 md:mt-0">
                <div className="flex items-center gap-3 mb-2">
                  <CloudFog size={48} weight="duotone" className="text-white/90" />
                  <h1 className="text-6xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/60 drop-shadow-sm">
                    SonicMood
                  </h1>
                </div>
                <TypewriterText
                  phrases={[
                    "tuned to local weather.",
                    "driven by your atmosphere.",
                    "curated for right now.",
                    "vibe check: active."
                  ]}
                />
              </div>

              <div className="flex flex-col items-center gap-4 w-full">
                {/* Search Bar */}
                {/* Search Bar Wrapper */}
                <div className="relative z-50 w-full max-w-2xl mx-auto">
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
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 text-xl pointer-events-none"
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

                <span className="text-white/50 text-sm py-1">- or -</span>

                <button
                  onClick={handleSync}
                  disabled={isLoading}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-3 rounded-full font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto w-full md:w-auto whitespace-nowrap"
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
              <GlassCard className="col-span-1 md:col-span-2 relative z-0 bg-slate-900/40 backdrop-blur-md border-white/10">

                <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-8">
                  {/* Left: Location & Date */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-purple-300 tracking-wider uppercase">Current Vibe</span>
                      {tracks && (
                        <button
                          onClick={handleShuffle}
                          disabled={isLoading}
                          className="group relative p-3 md:px-5 md:py-2.5 rounded-full bg-gradient-to-br from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 backdrop-blur-xl border border-white/20 hover:border-cyan-300/50 shadow-lg hover:shadow-cyan-500/20 active:scale-95 transition-all duration-300 ease-out flex items-center gap-3 disabled:opacity-50 disabled:pointer-events-none ml-4"
                          title="Shuffle Vibe"
                        >
                          <ArrowsClockwise
                            size={20}
                            weight="duotone"
                            className={`text-white/80 group-hover:text-cyan-300 transition-colors ${isLoading ? 'animate-spin' : ''}`}
                          />
                          {/* Text Label - Visible only on Desktop */}
                          <span className="hidden md:block text-sm font-semibold text-white/90 group-hover:text-white tracking-wide">
                            Shuffle Vibe
                          </span>

                          {/* Subtle internal shine effect */}
                          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        </button>
                      )}
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
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 md:gap-6 mt-6 md:mt-0">
                  {tracks && (
                    <button
                      onClick={handleSavePlaylist}
                      className="text-xs bg-[#1DB954] hover:bg-[#1ed760] text-white px-4 py-2 rounded-full font-bold transition-all shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 w-full md:w-auto"
                    >
                      <Playlist size={18} weight="bold" />
                      Save Playlist
                    </button>
                  )}
                </div>

                {tracks && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-8">
                    {tracks.map(track => (
                      <TrackCard key={track.id} track={track} />
                    ))}
                  </div>
                )}
              </GlassCard>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

export default App
