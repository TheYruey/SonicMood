import React from 'react';

export const AuroraBackground = () => {
    return (
        <div className="fixed inset-0 w-full h-full bg-slate-950 overflow-hidden -z-10">
            {/* Orb 1: Purple - Top Left */}
            <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob"></div>

            {/* Orb 2: Cyan - Top Right (Delayed) */}
            <div className="absolute top-0 -right-4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

            {/* Orb 3: Emerald - Bottom Left (Delayed) */}
            <div className="absolute -bottom-8 left-20 w-96 h-96 bg-emerald-500 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>
    );
};
