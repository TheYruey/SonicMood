import { useRef, useState, useEffect } from 'react';
import { PlayCircle, SpeakerHigh } from 'phosphor-react';

// Interfaz que define la estructura de una canción (Track) de Spotify
interface Track {
    id: string;
    name: string;
    uri: string;
    preview_url: string | null;
    album: {
        images: { url: string }[];
    };
    artists: { name: string }[];
}

interface TrackCardProps {
    track: Track;
}

/**
 * Componente de tarjeta para mostrar una canción.
 * - Muestra carátula, nombre y artista.
 * - Permite previsualizar el audio (si está disponible) al pasar el mouse.
 * - Abre la canción en Spotify al hacer click.
 */
export function TrackCard({ track }: TrackCardProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Boolean derived directly from prop, no need for state/effect
    const hasPreview = Boolean(track.preview_url);

    useEffect(() => {
        if (track.preview_url) {
            audioRef.current = new Audio(track.preview_url);
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [track.preview_url, track.name]);

    const handleMouseEnter = () => {
        if (!hasPreview) return;

        if (audioRef.current) {
            audioRef.current.volume = 0.5;
            const playPromise = audioRef.current.play();

            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        setIsPlaying(true);
                    })
                    .catch((e) => {
                        console.error("Audio play prevented/failed", e);
                        setIsPlaying(false);
                    });
            }
        }
    };

    const handleMouseLeave = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
        }
    };

    return (
        <div
            className="group relative flex flex-col cursor-pointer"
            onClick={() => window.open(track.uri, '_blank')}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="relative aspect-square overflow-hidden rounded-xl shadow-lg mb-3">
                <img
                    src={track.album.images[0]?.url}
                    alt={track.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {/* Default Hover Overlay (Play Icon) - Show if logic permits */}
                {!isPlaying && (
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <PlayCircle
                            size={48}
                            weight="fill"
                            className={`text-white drop-shadow-xl transform scale-75 group-hover:scale-100 transition-transform duration-300 ${!hasPreview ? 'opacity-50' : ''}`}
                        />
                    </div>
                )}

                {/* Audio Playing Overlay */}
                {isPlaying && hasPreview && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
                        <div className="flex flex-col items-center gap-2">
                            <SpeakerHigh size={40} weight="fill" className="text-green-400 animate-pulse drop-shadow-[0_0_10px_rgba(74,222,128,0.6)]" />
                            <span className="text-white/90 text-xs font-medium tracking-wider uppercase">Previewing</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="text-center">
                <div className={`font-bold text-white text-sm truncate transition-colors ${isPlaying ? 'text-green-300' : 'group-hover:text-green-300'}`}>
                    {track.name}
                </div>
                <div className="text-xs text-blue-100 truncate opacity-80">
                    {track.artists.map((a) => a.name).join(', ')}
                </div>
            </div>
        </div>
    );
}

