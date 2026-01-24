
import React, { useEffect, useRef } from 'react';
import { Message } from '../types';

interface ChatHistoryProps {
  messages: Message[];
  streamingRole: 'user' | 'ai' | null;
  streamingText: string;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ messages, streamingRole, streamingText }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 space-y-5 no-scrollbar">
      
      {messages.length === 0 && !streamingText ? (
        <div className="h-full flex flex-col items-center justify-center text-slate-300">
          <svg className="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="text-sm font-bold opacity-50 uppercase tracking-tighter">Waiting for dialogue...</p>
        </div>
      ) : (
        <div className="flex flex-col space-y-5 pb-10">
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}
            >
              <div className="flex items-center gap-2 mb-1.5 px-1">
                 <span className={`text-[9px] font-black uppercase tracking-wider ${msg.role === 'user' ? 'text-blue-600' : 'text-slate-500'}`}>
                   {msg.role === 'user' ? 'You' : 'Tutor'}
                 </span>
                 <span className="text-[8px] text-slate-300 font-mono">
                   {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                 </span>
              </div>
              
              <div 
                className={`max-w-[92%] sm:max-w-[85%] rounded-2xl px-4 py-3 text-[13px] sm:text-sm leading-relaxed shadow-sm border ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none' 
                    : 'bg-white border-slate-200 text-slate-800 rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* Real-time Streaming Bubble */}
          {streamingRole && streamingText && (
            <div className={`flex flex-col ${streamingRole === 'user' ? 'items-end' : 'items-start'} transition-all duration-300`}>
               <div className="flex items-center gap-2 mb-1.5 px-1">
                 <span className={`text-[9px] font-black uppercase tracking-widest ${streamingRole === 'user' ? 'text-blue-500' : 'text-emerald-500'}`}>
                   {streamingRole === 'user' ? 'Translating...' : 'AI Speaking...'}
                 </span>
              </div>
              <div 
                className={`max-w-[92%] sm:max-w-[85%] rounded-2xl px-4 py-3 text-[13px] sm:text-sm leading-relaxed shadow-md border-2 border-dashed ${
                  streamingRole === 'user' 
                    ? 'bg-blue-50 border-blue-200 text-blue-900 rounded-tr-none' 
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900 rounded-tl-none'
                }`}
              >
                {streamingText}
                <span className="inline-block w-1.5 h-3.5 ml-1 bg-current opacity-40 animate-pulse align-middle"/>
              </div>
            </div>
          )}
        </div>
      )}
      <div ref={bottomRef} className="h-2" />
    </div>
  );
};

export default ChatHistory;
