
import React from 'react';

interface LiveCaptionsProps {
  text: string;
}

const LiveCaptions: React.FC<LiveCaptionsProps> = ({ text }) => {
  if (!text) return null;

  return (
    <div className="absolute bottom-4 left-0 right-0 px-6 flex justify-center z-30 pointer-events-none">
      <div className="bg-black/60 backdrop-blur-sm text-white px-6 py-3 rounded-2xl shadow-xl max-w-lg text-center transform transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-4">
        <p className="text-lg font-medium leading-relaxed tracking-wide drop-shadow-md">
          {text}
          <span className="inline-block w-1.5 h-4 ml-1 bg-blue-400 animate-pulse align-middle"></span>
        </p>
      </div>
    </div>
  );
};

export default LiveCaptions;
