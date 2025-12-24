/**
 * Fondo animado con orbes de colores (blobs) que se mueven suavemente.
 * Utiliza CSS puro para las animaciones y filtros de desenfoque.
 */
export const AnimatedBackground = () => {
    return (
        <div className="fixed inset-0 w-full h-full overflow-hidden -z-10 pointer-events-none bg-slate-950">
            {/* Blob 1: Purple */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/30 rounded-full mix-blend-screen filter blur-[100px] animate-blob font-sans"></div>

            {/* Blob 2: Cyan */}
            <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-cyan-500/30 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000"></div>

            {/* Blob 3: Blue */}
            <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-blue-600/30 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-4000"></div>
        </div>
    );
};
