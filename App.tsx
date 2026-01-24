
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Language, Topic, Message } from './types';
import { TOPICS, LANGUAGE_CONFIGS } from './constants';
import { decode, decodeAudioData, createBlob } from './services/audioUtils';
import Visualizer from './components/Visualizer';
import ChatHistory from './components/ChatHistory';
import TutorAvatar from './components/TutorAvatar';

const App: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(Language.ENGLISH);
  const [selectedTopic, setSelectedTopic] = useState<Topic>(TOPICS[0]);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAiTalking, setIsAiTalking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingRole, setStreamingRole] = useState<'user' | 'ai' | null>(null);
  const [streamingText, setStreamingText] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const nextStartTimeRef = useRef<number>(0);
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  
  const currentInputTranscription = useRef('');
  const currentOutputTranscription = useRef('');

  // iOS/Safari fix: Resume AudioContext on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        audioContextInRef.current?.resume();
        audioContextOutRef.current?.resume();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const stopSession = useCallback(() => {
    setIsSessionActive(false);
    setIsConnecting(false);
    setIsAiTalking(false);
    setStreamingRole(null);
    setStreamingText('');
    
    if (sessionRef.current) { 
      try { sessionRef.current.close(); } catch (e) {} 
      sessionRef.current = null; 
    }
    
    if (stream) { 
      stream.getTracks().forEach(track => track.stop()); 
      setStream(null); 
    }
    
    sourcesRef.current.forEach(source => { try { source.stop(); } catch(e) {} });
    sourcesRef.current.clear();
    
    audioContextInRef.current?.close();
    audioContextOutRef.current?.close();
    audioContextInRef.current = null;
    audioContextOutRef.current = null;
  }, [stream]);

  const startSession = async () => {
    if (isSessionActive) {
      stopSession();
      return;
    }

    setIsConnecting(true);
    setError(null);
    setStreamingText('');
    setStreamingRole(null);
    
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioIn = new AudioContextClass({ sampleRate: 16000 });
      const audioOut = new AudioContextClass({ sampleRate: 24000 });
      
      // Crucial for mobile/iPad: audio context must start on user gesture
      await audioIn.resume();
      await audioOut.resume();

      const outputNode = audioOut.createGain();
      outputNode.connect(audioOut.destination);
      
      audioContextInRef.current = audioIn;
      audioContextOutRef.current = audioOut;
      outputNodeRef.current = outputNode;

      const userStream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
      });
      setStream(userStream);

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const config = LANGUAGE_CONFIGS[selectedLanguage];
      const systemInstructionText = `${config.systemInstruction.replace('{topic}', selectedTopic.title)}. Important: Provide real-time transcription.`;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: config.voice as any } } },
          systemInstruction: systemInstructionText,
          outputAudioTranscription: {}, 
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsSessionActive(true);
            
            const source = audioIn.createMediaStreamSource(userStream);
            const scriptProcessor = audioIn.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (event) => {
              if (audioIn.state === 'closed') return;
              const pcmBlob = createBlob(event.inputBuffer.getChannelData(0));
              sessionPromise.then(session => {
                try { session.sendRealtimeInput({ media: pcmBlob }); } catch (e) { console.debug("Send error", e); }
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioIn.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioContextOutRef.current && outputNodeRef.current) {
              const ctx = audioContextOutRef.current;
              if (nextStartTimeRef.current < ctx.currentTime) nextStartTimeRef.current = ctx.currentTime;
              
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNodeRef.current);
              setIsAiTalking(true);
              source.onended = () => { 
                sourcesRef.current.delete(source); 
                if (sourcesRef.current.size === 0) setIsAiTalking(false); 
              };
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsAiTalking(false);
            }

            if (message.serverContent?.inputTranscription) {
              currentInputTranscription.current += message.serverContent.inputTranscription.text;
              setStreamingRole('user');
              setStreamingText(currentInputTranscription.current);
            } else if (message.serverContent?.outputTranscription) {
              currentOutputTranscription.current += message.serverContent.outputTranscription.text;
              setStreamingRole('ai');
              setStreamingText(currentOutputTranscription.current);
            }

            if (message.serverContent?.turnComplete) {
              const userText = currentInputTranscription.current.trim();
              const aiText = currentOutputTranscription.current.trim();
              if (userText) setMessages(prev => [...prev, { role: 'user', text: userText, timestamp: Date.now() }]);
              if (aiText) setMessages(prev => [...prev, { role: 'ai', text: aiText, timestamp: Date.now() }]);
              currentInputTranscription.current = '';
              currentOutputTranscription.current = '';
              setStreamingRole(null);
              setStreamingText('');
            }
          },
          onerror: (err) => {
            console.error(err);
            setError("Connection unstable. Trying to keep up...");
            setTimeout(() => setError(null), 5000);
          },
          onclose: () => stopSession()
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      setError(err.message || "Microphone access required");
      setIsConnecting(false);
      stopSession();
    }
  };

  const currentConfig = LANGUAGE_CONFIGS[selectedLanguage];

  return (
    <div className="flex flex-col h-full bg-slate-50 safe-area-pt">
      
      {/* HEADER: Sticky & Compact */}
      <header className="flex-none bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between z-40 shadow-sm">
        <div className="flex items-center gap-2">
           <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">L</div>
           <span className="font-extrabold text-slate-800 tracking-tight hidden xs:block">LinguaFlow</span>
        </div>

        <div className="flex gap-1.5 sm:gap-3">
          <select 
             value={selectedLanguage}
             onChange={(e) => { stopSession(); setSelectedLanguage(e.target.value as Language); }}
             className="bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm py-2 px-3 rounded-xl border-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.values(Language).map(lang => <option key={lang} value={lang}>{lang}</option>)}
          </select>
          <select 
             value={selectedTopic.id}
             onChange={(e) => {
               stopSession();
               const topic = TOPICS.find(t => t.id === e.target.value);
               if (topic) setSelectedTopic(topic);
             }}
             className="bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm py-2 px-3 rounded-xl border-none focus:ring-2 focus:ring-blue-500 w-28 sm:w-40"
          >
            {TOPICS.map(topic => <option key={topic.id} value={topic.id}>{topic.icon} {topic.title}</option>)}
          </select>
        </div>
      </header>

      {/* MAIN: Responsive Split */}
      <main className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        
        {/* LEFT PANEL: Visuals (Higher priority on desktop, Top on mobile) */}
        <section className="flex-none lg:w-[40%] bg-white flex flex-col items-center justify-center p-6 border-b lg:border-b-0 lg:border-r border-slate-200 relative">
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
               <div className="scale-90 sm:scale-100 transition-transform mb-8">
                  <TutorAvatar url={currentConfig.avatarUrl} name={currentConfig.tutorName} isTalking={isAiTalking} />
               </div>

               <div className="w-full space-y-4 max-w-[280px]">
                  <div className="h-12 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center overflow-hidden shadow-inner">
                    <Visualizer isActive={isSessionActive} stream={stream} />
                  </div>

                  <button 
                    onClick={startSession}
                    disabled={isConnecting}
                    className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3
                      ${isSessionActive ? 'bg-rose-500 text-white shadow-rose-200' : 'bg-blue-600 text-white shadow-blue-200'}
                      ${isConnecting ? 'opacity-50' : ''}`}
                  >
                    {isSessionActive ? 'End Call' : isConnecting ? 'Connecting...' : 'Start Talk'}
                  </button>
                  {error && <p className="text-[10px] text-center text-rose-500 font-bold animate-pulse">{error}</p>}
               </div>
            </div>
        </section>

        {/* RIGHT PANEL: Transcript (The "Study Box") */}
        <section className="flex-1 flex flex-col bg-slate-50 relative min-h-0">
          <div className="px-5 py-3 border-b border-slate-200 bg-white/50 backdrop-blur flex items-center justify-between">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isSessionActive ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
                Real-time Transcript
             </span>
             {isSessionActive && <span className="text-[9px] font-mono text-rose-400 animate-pulse">LIVE ●</span>}
          </div>
          
          <div className="flex-1 overflow-hidden relative">
             <ChatHistory 
                messages={messages} 
                streamingRole={streamingRole}
                streamingText={streamingText}
              />
          </div>
          <div className="safe-area-pb"></div>
        </section>

      </main>
    </div>
  );
};

export default App;
