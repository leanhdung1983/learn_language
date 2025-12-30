
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Language, Topic, Message } from './types';
import { TOPICS, LANGUAGE_CONFIGS } from './constants';
import { decode, decodeAudioData, createBlob } from './services/audioUtils';
import Visualizer from './components/Visualizer';
import ChatHistory from './components/ChatHistory';
import TutorAvatar from './components/TutorAvatar';

const App: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(Language.ENGLISH);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAiTalking, setIsAiTalking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
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
  // Fix: Replaced NodeJS.Timeout with any to avoid 'Cannot find namespace NodeJS' error in browser environment
  const aiTalkingTimeoutRef = useRef<any>(null);

  const stopSession = useCallback(() => {
    setIsSessionActive(false);
    setIsConnecting(false);
    setIsAiTalking(false);
    
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();
    
    if (audioContextInRef.current) audioContextInRef.current.close();
    if (audioContextOutRef.current) audioContextOutRef.current.close();
    
    audioContextInRef.current = null;
    audioContextOutRef.current = null;
  }, [stream]);

  const startSession = async () => {
    if (!selectedTopic) return;
    
    setIsConnecting(true);
    setError(null);
    setMessages([]);

    try {
      const audioIn = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const audioOut = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const outputNode = audioOut.createGain();
      outputNode.connect(audioOut.destination);
      
      audioContextInRef.current = audioIn;
      audioContextOutRef.current = audioOut;
      outputNodeRef.current = outputNode;

      const userStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(userStream);

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const config = LANGUAGE_CONFIGS[selectedLanguage];
      const systemInstruction = config.systemInstruction.replace('{topic}', selectedTopic.title);

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: config.voice as any } },
          },
          systemInstruction,
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
              const inputData = event.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(audioIn.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Audio Playback
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioContextOutRef.current && outputNodeRef.current) {
              const ctx = audioContextOutRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNodeRef.current);
              
              setIsAiTalking(true);
              if (aiTalkingTimeoutRef.current) clearTimeout(aiTalkingTimeoutRef.current);
              
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) {
                  setIsAiTalking(false);
                }
              });
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            // Handle Interruptions
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsAiTalking(false);
            }

            // Handle Transcriptions
            if (message.serverContent?.inputTranscription) {
              currentInputTranscription.current += message.serverContent.inputTranscription.text;
            } else if (message.serverContent?.outputTranscription) {
              currentOutputTranscription.current += message.serverContent.outputTranscription.text;
            }

            if (message.serverContent?.turnComplete) {
              const userInput = currentInputTranscription.current.trim();
              const aiOutput = currentOutputTranscription.current.trim();
              
              if (userInput) {
                setMessages(prev => [...prev, { role: 'user', text: userInput, timestamp: Date.now() }]);
              }
              if (aiOutput) {
                setMessages(prev => [...prev, { role: 'ai', text: aiOutput, timestamp: Date.now() }]);
              }
              
              currentInputTranscription.current = '';
              currentOutputTranscription.current = '';
            }
          },
          onerror: (e) => {
            console.error("Gemini Session Error:", e);
            setError("Connection error. Please try again.");
            stopSession();
          },
          onclose: () => {
            stopSession();
          }
        }
      });

      sessionRef.current = await sessionPromise;

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to start session. Check your microphone permissions.");
      setIsConnecting(false);
    }
  };

  const currentConfig = LANGUAGE_CONFIGS[selectedLanguage];

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4 md:p-8">
      <div className="max-w-6xl w-full glass rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[92vh]">
        
        {/* Header */}
        <header className="p-6 border-b border-gray-200 flex justify-between items-center bg-white/70">
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">LinguaFlow AI</h1>
            <p className="text-sm text-gray-500 font-medium">Smart Language Learning Platform</p>
          </div>
          <div className="flex items-center gap-4">
             {isSessionActive && (
               <div className="hidden md:flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                 <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                 <span className="text-xs font-bold text-green-700">LIVE SESSION</span>
               </div>
             )}
             {isSessionActive && (
               <button 
                 onClick={stopSession}
                 className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-full text-sm font-bold transition-all shadow-lg hover:shadow-red-200"
               >
                 Exit Lesson
               </button>
             )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col">
          {!isSessionActive && !isConnecting ? (
            <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto w-full py-4">
              {/* Language Selection */}
              <section>
                <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                  <span className="bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">1</span>
                  Choose Language
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  {Object.values(Language).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLanguage(lang)}
                      className={`py-6 rounded-2xl border-2 transition-all group relative overflow-hidden ${
                        selectedLanguage === lang 
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md' 
                        : 'border-white bg-white/50 text-gray-600 hover:border-blue-200'
                      }`}
                    >
                      <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">
                        {lang === Language.ENGLISH ? '🇺🇸' : lang === Language.JAPANESE ? '🇯🇵' : '🇨🇳'}
                      </div>
                      <span className="font-bold text-lg">{lang}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Topic Selection */}
              <section>
                <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                  <span className="bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">2</span>
                  Select Lesson Topic
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {TOPICS.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => setSelectedTopic(topic)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
                        selectedTopic?.id === topic.id 
                        ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-100 shadow-lg' 
                        : 'border-white bg-white/50 hover:bg-white hover:shadow-md'
                      }`}
                    >
                      <div className="text-3xl mb-3">{topic.icon}</div>
                      <h3 className="font-bold text-gray-800 text-sm mb-1">{topic.title}</h3>
                      <p className="text-[10px] text-gray-500 leading-tight line-clamp-2">{topic.description}</p>
                    </button>
                  ))}
                </div>
              </section>

              <button
                disabled={!selectedTopic}
                onClick={startSession}
                className={`w-full py-6 rounded-2xl font-black text-xl shadow-xl transition-all transform ${
                  selectedTopic 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:scale-[1.02] active:scale-[0.98] hover:shadow-blue-200' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                START LEARNING NOW
              </button>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-center text-sm font-bold">
                  ⚠️ {error}
                </div>
              )}
            </div>
          ) : isConnecting ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-8">
              <div className="relative">
                <div className="w-24 h-24 border-8 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-full animate-ping opacity-20"></div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-gray-800 animate-pulse">Initializing AI Tutor...</p>
                <p className="text-gray-500 mt-2">Preparing the {selectedTopic?.title} scenario for you.</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0">
              {/* Left Column: Avatar & Feedback */}
              <div className="lg:col-span-5 flex flex-col h-full space-y-4">
                <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 p-4 flex-1 flex flex-col justify-center items-center">
                   <TutorAvatar 
                     url={currentConfig.avatarUrl} 
                     name={currentConfig.tutorName} 
                     isTalking={isAiTalking} 
                   />
                   
                   <div className="w-full mt-auto space-y-4">
                     <div className="bg-blue-600/10 p-4 rounded-2xl border border-blue-200">
                        <div className="flex items-center gap-3 mb-2">
                           <span className="text-2xl">{selectedTopic?.icon}</span>
                           <h4 className="font-bold text-blue-900">{selectedTopic?.title}</h4>
                        </div>
                        <p className="text-xs text-blue-700 leading-relaxed italic">
                          "I'm here to help! Speak naturally and I'll catch any mistakes in your {selectedLanguage}."
                        </p>
                     </div>
                     
                     <div className="p-3 bg-gray-900 rounded-2xl shadow-xl">
                        <div className="flex items-center justify-between mb-2 px-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Voice Monitor</span>
                          <div className={`w-2 h-2 rounded-full ${isAiTalking ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></div>
                        </div>
                        <Visualizer isActive={isSessionActive} stream={stream} />
                     </div>
                   </div>
                </div>
              </div>

              {/* Right Column: Chat History */}
              <div className="lg:col-span-7 flex flex-col h-full bg-white/50 backdrop-blur-sm rounded-3xl border border-white/60 overflow-hidden shadow-inner">
                 <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white/80">
                    <span className="font-bold text-gray-700 text-sm">Transcription History</span>
                    <span className="text-[10px] text-gray-400 uppercase">Real-time update</span>
                 </div>
                 <ChatHistory messages={messages} />
                 <div className="p-4 bg-gray-50/50 text-center">
                    <p className="text-[10px] text-gray-500 font-medium">
                      Pro Tip: Your speech is converted to text automatically for review.
                    </p>
                 </div>
              </div>
            </div>
          )}
        </main>

        <footer className="px-6 py-3 bg-white/80 border-t border-gray-100 flex justify-between items-center text-[10px] text-gray-400 font-medium">
          <div>&copy; 2024 LinguaFlow AI - Professional Language Coaching</div>
          <div className="flex gap-4">
            <span>Powered by Gemini 2.5 Flash Native Audio</span>
            <span className="text-blue-500">Multimodal Experience Enabled</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;