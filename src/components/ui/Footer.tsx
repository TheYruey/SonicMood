
import { GithubLogo, LinkedinLogo, Heart, SpotifyLogo, CloudSun } from 'phosphor-react';

/**
 * Pie de página de la aplicación.
 * Muestra créditos, enlaces a redes sociales y atribuciones a las APIs usadas.
 */
export const Footer = () => {
    return (
        <footer className="w-full py-8 mt-auto border-t border-white/10 bg-black/40 backdrop-blur-2xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)] z-50">
            <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-slate-400 text-sm font-light tracking-wide">

                {/* Left: Copyright */}
                <div className="flex items-center gap-2 order-3 md:order-1 hover:opacity-100 transition-opacity opacity-80">
                    <a
                        href="https://github.com/TheYruey/SonicMood"
                        target="_blank"
                        rel="noreferrer"
                        className="bg-gradient-to-r from-purple-200 to-cyan-200 bg-clip-text text-transparent font-semibold hover:tracking-widest transition-all duration-300"
                    >
                        © {new Date().getFullYear()} SonicMood
                    </a>

                    {/* Separator */}
                    <span className="hidden md:inline text-white/10 mx-2">•</span>

                    {/* Version Tag */}
                    <span className="text-white/20 text-xs font-mono tracking-wider hover:text-white/40 transition-colors cursor-default" title="Current Build Version">
                        v1.0.0
                    </span>
                </div>

                {/* Center: "Powered by" + Brands Pill */}
                <div className="order-2 flex flex-col sm:flex-row items-center gap-3">
                    <span className="text-white/40 text-xs uppercase tracking-widest font-semibold">Powered by</span>

                    <div className="flex items-center gap-6 px-6 py-2 rounded-full border border-white/5 bg-white/5 hover:bg-white/10 transition-colors duration-300 backdrop-blur-md">
                        <a
                            href="https://openweathermap.org/"
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 hover:text-orange-300 transition-colors group"
                            title="Weather data provider"
                        >
                            <CloudSun size={20} weight="duotone" className="group-hover:animate-bounce" />
                            <span className="hidden sm:inline font-medium">OpenWeather</span>
                        </a>
                        <span className="w-px h-4 bg-white/10"></span>
                        <a
                            href="https://developer.spotify.com/"
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 hover:text-green-400 transition-colors group"
                            title="Music data provider"
                        >
                            <SpotifyLogo size={20} weight="duotone" className="group-hover:animate-spin-slow" />
                            <span className="hidden sm:inline font-medium">Spotify</span>
                        </a>
                    </div>
                </div>

                {/* Right: Author & distinct Social Icons */}
                <div className="flex items-center gap-6 order-1 md:order-3">
                    <span className="flex items-center gap-2 group cursor-default">
                        <span>Desarrollado con</span>
                        <Heart
                            weight="fill"
                            className="text-rose-500 animate-pulse drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]"
                            size={16}
                        />
                        <span>por</span>
                        <a
                            href="https://github.com/TheYruey"
                            target="_blank"
                            rel="noreferrer"
                            className="text-white font-medium hover:text-purple-400 transition-colors relative"
                        >
                            TheYruey
                            <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-purple-400 transition-all duration-300 group-hover:w-full"></span>
                        </a>
                    </span>

                    <div className="flex items-center gap-4 pl-4 border-l border-white/10">
                        <a
                            href="https://github.com/TheYruey/SonicMood"
                            target="_blank"
                            rel="noreferrer"
                            className="text-white/60 hover:text-white hover:scale-110 transition-all duration-300"
                            aria-label="GitHub Repository"
                        >
                            {/* Using 'duotone' weight for a more detailed/premium icon style */}
                            <GithubLogo size={26} weight="duotone" />
                        </a>
                        <a
                            href="https://www.linkedin.com/in/yeury-amarante-8693b4345"
                            target="_blank"
                            rel="noreferrer"
                            className="text-white/60 hover:text-[#0A66C2] hover:scale-110 transition-all duration-300"
                            aria-label="LinkedIn Profile"
                        >
                            {/* Using 'duotone' weight for a more detailed/premium icon style */}
                            <LinkedinLogo size={26} weight="duotone" />
                        </a>
                    </div>
                </div>

            </div>
        </footer>
    );
};
