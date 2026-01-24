
import React, { useState, useEffect } from 'react';

interface TutorAvatarProps {
  url: string;
  name: string;
  isTalking: boolean;
}

export default function TutorAvatar({ url, name, isTalking }: TutorAvatarProps) {
  const [imgSrc, setImgSrc] = useState(url);

  useEffect(() => {
    setImgSrc(url);
  }, [url]);

  const handleImgError = () => {
    // Fallback to a high-quality robot avatar generator if the main image fails
    setImgSrc(`https://api.dicebear.com/7.x/bottts/svg?seed=${name}&backgroundColor=transparent`);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 transition-all duration-500 perspective-container">
      <div 
        className={`relative w-48 h-48 md:w-60 md:h-60 rounded-full transition-all duration-300 avatar-3d group ${
        isTalking ? 'scale-110' : 'hover:scale-105'
      }`}>
        {/* Glow behind the avatar */}
        <div className={`absolute -inset-4 rounded-full bg-blue-500/20 blur-xl transition-all duration-500 ${isTalking ? 'bg-blue-500/40 scale-110' : ''}`}></div>
        
        {/* The Avatar Image */}
        <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white/50 ring-2 ring-blue-400/30 shadow-2xl z-10 bg-gray-900">
            <img 
              src={imgSrc} 
              alt={name} 
              onError={handleImgError}
              className={`w-full h-full object-cover transition-transform duration-700 ${isTalking ? 'scale-110' : 'scale-100 group-hover:scale-110'}`}
            />
            {/* Subtle reflection shine */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none"></div>
        </div>
        
        {/* Active Talking Rings */}
        {isTalking && (
          <>
            <div className="absolute -inset-1 border border-blue-400/60 rounded-full animate-ping-slow z-0"></div>
            <div className="absolute -inset-8 border border-blue-400/20 rounded-full animate-ping-slower z-0"></div>
          </>
        )}
      </div>

      <div className="mt-8 text-center relative z-20">
        <div className="absolute -inset-4 bg-white/60 blur-xl rounded-full -z-10"></div>
        <h3 className="text-xl font-black text-gray-800 tracking-tight drop-shadow-sm">{name}</h3>
        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center justify-center gap-2 mt-1">
          {isTalking ? (
            <>
              <span className="flex gap-1 items-end h-4">
                <span className="w-1 h-2 bg-blue-600 animate-music-1 rounded-full"></span>
                <span className="w-1 h-4 bg-blue-600 animate-music-2 rounded-full"></span>
                <span className="w-1 h-3 bg-blue-600 animate-music-3 rounded-full"></span>
              </span>
              Speaking
            </>
          ) : 'Ready'}
        </p>
      </div>
      
      <style>{`
        .perspective-container {
          perspective: 1000px;
        }
        .avatar-3d {
          transform-style: preserve-3d;
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.3);
        }
        
        @keyframes music { 0%, 100% { height: 20%; } 50% { height: 100%; } }
        .animate-music-1 { animation: music 0.5s ease-in-out infinite; }
        .animate-music-2 { animation: music 0.5s ease-in-out infinite 0.1s; }
        .animate-music-3 { animation: music 0.5s ease-in-out infinite 0.2s; }
        .animate-ping-slow { animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; }
        .animate-ping-slower { animation: ping 3s cubic-bezier(0, 0, 0.2, 1) infinite; }
      `}</style>
    </div>
  );
}
