import React from 'react';

export const ThemedBanner: React.FC = () => {
    return (
        <div className="absolute inset-0 z-0 overflow-hidden bg-sky-700">
            <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
                <defs>
                    <filter id="fabric-texture">
                        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="1" result="turbulence"/>
                        <feDiffuseLighting in="turbulence" lightingColor="#fff" surfaceScale="2" result="diffuse">
                            <feDistantLight azimuth="45" elevation="60" />
                        </feDiffuseLighting>
                        <feComposite in="diffuse" in2="SourceAlpha" operator="in" />
                        <feBlend in="SourceGraphic" in2="SourceGraphic" mode="multiply" />
                    </filter>
                    <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
                        <stop offset="50%" style={{ stopColor: '#F0C400', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#D4AF37', stopOpacity: 1 }} />
                    </linearGradient>
                    <radialGradient id="wood-gradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" style={{ stopColor: '#8B4513' }} />
                        <stop offset="100%" style={{ stopColor: '#5C2E0D' }} />
                    </radialGradient>
                     <filter id="crest-shadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="10" dy="15" stdDeviation="10" floodColor="#000000" floodOpacity="0.5"/>
                    </filter>
                     <radialGradient id="crest-background" cx="50%" cy="50%" r="80%">
                        <stop offset="0%" stopColor="#0ea5e9" /> 
                        <stop offset="60%" stopColor="#0369a1" /> 
                        <stop offset="100%" stopColor="#082f49" /> 
                    </radialGradient>
                </defs>

                {/* New Background */}
                <rect width="100%" height="100%" fill="url(#crest-background)" />

                {/* Fabric texture over the new background */}
                <rect x="0" y="0" width="100%" height="100%" filter="url(#fabric-texture)" opacity="0.15" />
                
            </svg>
             <div className="absolute inset-0 bg-gradient-to-t from-sky-950/50 via-sky-900/20 to-transparent"></div>
        </div>
    );
};
