
import React from 'react';

interface TutorAvatarProps {
  url: string;
  name: string;
  isTalking: boolean;
}

const TutorAvatar: React.FC<TutorAvatarProps> = ({ url, name, isTalking }) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 transition-all duration-500">
      <div className={`relative w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-8 transition-all duration-300 ${
        isTalking ? 'border-blue-400 scale-105 shadow-[0_0_50px_rgba(59,130,246,0.5)]' : 'border-white shadow-xl'
      }`}>
        <img 
          src={url} 
          alt={name} 
          className={`w-full h-full object-cover transition-transform duration-300 ${isTalking ? 'animate-bounce' : ''}`}
          style={{ animationDuration: '2s' }}
        />
        {isTalking && (
          <div className="absolute inset-0 bg-blue-400/10 animate-pulse"></div>
        )}
      </div>
      <div className="mt-4 text-center">
        <h3 className="text-xl font-bold text-gray-800">{name}</h3>
        <p className="text-sm font-medium text-blue-600 uppercase tracking-widest flex items-center gap-2">
          {isTalking ? (
            <>
              <span className="flex gap-1">
                <span className="w-1 h-3 bg-blue-600 animate-grow-1"></span>
                <span className="w-1 h-5 bg-blue-600 animate-grow-2"></span>
                <span className="w-1 h-3 bg-blue-600 animate-grow-3"></span>
              </span>
              Speaking...
            </>
          ) : 'Listening...'}
        </p>
      </div>
      
      <style>{`
        @keyframes grow {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1); }
        }
        .animate-grow-1 { animation: grow 0.8s ease-in-out infinite; }
        .animate-grow-2 { animation: grow 0.8s ease-in-out infinite 0.2s; }
        .animate-grow-3 { animation: grow 0.8s ease-in-out infinite 0.4s; }
      `}</style>
    </div>
  );
};

export default TutorAvatar;
