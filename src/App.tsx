import { useEffect } from 'react'
import { GlassCard } from './components/ui/GlassCard'
import { useStore } from './store/useStore'
import { getTokenFromUrl, loginUrl } from './services/api'
import { SpotifyLogo } from 'phosphor-react'

function App() {
  const { weather, token, setToken } = useStore()

  useEffect(() => {
    const hash = getTokenFromUrl()
    const _token = hash.access_token

    if (_token) {
      setToken(_token)
      window.location.hash = ""
    }
  }, [setToken])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        <GlassCard>
          <h1 className="text-3xl font-bold mb-4">SonicMood</h1>
          <p className="text-gray-200">
            Music discovery driven by your local weather.
          </p>
        </GlassCard>

        <GlassCard className="flex flex-col items-center justify-center space-y-4">
          <div className="text-xl">Authentication</div>
          {!token ? (
            <a
              href={loginUrl}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full font-medium transition-colors flex items-center gap-2"
            >
              <SpotifyLogo size={24} weight="fill" />
              Connect Spotify
            </a>
          ) : (
            <div className="text-green-400 font-medium flex items-center gap-2">
              <SpotifyLogo size={24} weight="fill" />
              Connected to Spotify
            </div>
          )}
        </GlassCard>

        {weather && (
          <GlassCard className="col-span-1 md:col-span-2">
            <h2 className="text-2xl font-bold">Current Weather</h2>
            {/* Weather display */}
          </GlassCard>
        )}
      </div>
    </div>
  )
}

export default App
