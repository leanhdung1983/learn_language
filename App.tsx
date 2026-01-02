
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Language, Topic, Message, LearnedWord, VocabularyItem } from './types';
import { TOPICS, LANGUAGE_CONFIGS, getLessonGuide, LESSON_DATA } from './constants';
import { decode, decodeAudioData, createBlob } from './services/audioUtils';
import Visualizer from './components/Visualizer';
import ChatHistory from './components/ChatHistory';
import TutorAvatar from './components/TutorAvatar';
import LearningGuide from './components/LearningGuide';
import ReviewSection from './components/ReviewSection';

const STORAGE_KEY = 'linguaflow_learned_words';

const App: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(Language.ENGLISH);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAiTalking, setIsAiTalking] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'guide' | 'review'>('guide');
  const [isConnectionLost, setIsConnectionLost] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  // Learned Words Persistence
  const [learnedWords, setLearnedWords] = useState<LearnedWord[]>([]);

  const nextStartTimeRef = useRef<number>(0);
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  
  const currentInputTranscription = useRef('');
  const currentOutputTranscription = useRef('');

  // Initial Load
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setLearnedWords(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved words");
      }
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  // Persistence Sync
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(learnedWords));
  }, [learnedWords]);

  const handleWordMastered = (item: VocabularyItem, score: number) => {
    setLearnedWords(prev => {
      const existing = prev.find(w => w.word === item.word && w.language === selectedLanguage);
      if (existing) {
        return prev.map(w => w.word === item.word && w.language === selectedLanguage 
          ? { ...w, lastScore: Math.max(w.lastScore, score), dateAdded: Date.now() } 
          : w
        );
      }
      return [...prev, { ...item, language: selectedLanguage, dateAdded: Date.now(), lastScore: score }];
    });
  };

  const handleRemoveWord = (word: string) => {
    setLearnedWords(prev => prev.filter(w => !(w.word === word && w.language === selectedLanguage)));
  };

  const playPronunciation = (text: string, lang: Language) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      switch (lang) {
        case Language.JAPANESE: utterance.lang = 'ja-JP'; break;
        case Language.CHINESE: utterance.lang = 'zh-CN'; break;
        default: utterance.lang = 'en-US'; break;
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleRandomPractice = () => {
    const allVocabForLang = Object.values(LESSON_DATA[selectedLanguage] || {}).flatMap(g => g.vocabulary);
    if (allVocabForLang.length === 0) return;
    
    // Pick 5 random
    const shuffled = [...allVocabForLang].sort(() => 0.5 - Math.random());
    const randomTopic: Topic = {
      id: 'random_discovery',
      title: 'Khám phá ngẫu nhiên',
      description: 'Học các từ vựng ngẫu nhiên từ thư viện.',
      icon: '🎲'
    };
    
    // Override lesson data for this session
    const randomGuide = {
      vocabulary: shuffled.slice(0, 5),
      starters: ["Can you explain these random words?", "Let's practice some variety!"],
      tips: "Học ngẫu nhiên giúp bộ não nhạy bén hơn!"
    };

    setSelectedTopic(randomTopic);
    // Start session with custom guide
    startSession(false, randomGuide);
  };

  const stopSession = useCallback((isError = false) => {
    setIsSessionActive(false);
    setIsConnecting(false);
    setIsAiTalking(false);
    if (sessionRef.current) { try { sessionRef.current.close(); } catch (e) {} sessionRef.current = null; }
    if (stream) { stream.getTracks().forEach(track => track.stop()); setStream(null); }
    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();
    if (audioContextInRef.current?.state !== 'closed') audioContextInRef.current?.close();
    if (audioContextOutRef.current?.state !== 'closed') audioContextOutRef.current?.close();
    audioContextInRef.current = null;
    audioContextOutRef.current = null;
    setIsConnectionLost(isError);
  }, [stream]);

  const startSession = async (resume = false, customGuide?: any) => {
    if (!selectedTopic && !customGuide) return;
    setIsConnecting(true);
    setError(null);
    setIsConnectionLost(false);
    if (!resume) { setMessages([]); setActiveTab('guide'); }
    else { setActiveTab('chat'); }

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

      const apiKey = process.env.API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey });
      const config = LANGUAGE_CONFIGS[selectedLanguage];
      
      let systemInstructionText = config.systemInstruction.replace('{topic}', selectedTopic?.title || customGuide.title);
      if (showSubtitles && selectedLanguage !== Language.ENGLISH) {
        systemInstructionText += " IMPORTANT: After speaking each response, provide translations in English and Vietnamese: [Original] (EN: ... | VN: ...)";
      }

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: config.voice as any } } },
          systemInstruction: { parts: [{ text: systemInstructionText }] },
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
              sessionPromise.then(session => session?.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioIn.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioContextOutRef.current && outputNodeRef.current) {
              const ctx = audioContextOutRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNodeRef.current);
              setIsAiTalking(true);
              source.onended = () => { sourcesRef.current.delete(source); if (sourcesRef.current.size === 0) setIsAiTalking(false); };
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsAiTalking(false);
            }
            if (message.serverContent?.inputTranscription) currentInputTranscription.current += message.serverContent.inputTranscription.text;
            else if (message.serverContent?.outputTranscription) currentOutputTranscription.current += message.serverContent.outputTranscription.text;
            if (message.serverContent?.turnComplete) {
              const u = currentInputTranscription.current.trim();
              const a = currentOutputTranscription.current.trim();
              if (u) setMessages(prev => [...prev, { role: 'user', text: u, timestamp: Date.now() }]);
              if (a) setMessages(prev => [...prev, { role: 'ai', text: a, timestamp: Date.now() }]);
              currentInputTranscription.current = '';
              currentOutputTranscription.current = '';
            }
          },
          onerror: () => stopSession(true),
          onclose: () => isSessionActive && stopSession(true)
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      setError(err.message);
      setIsConnecting(false);
      stopSession(false);
    }
  };

  const currentConfig = LANGUAGE_CONFIGS[selectedLanguage];
  const currentGuide = selectedTopic?.id === 'random_discovery' 
    ? {
        vocabulary: [...Object.values(LESSON_DATA[selectedLanguage] || {}).flatMap(g => g.vocabulary)].sort(() => 0.5 - Math.random()).slice(0, 5),
        starters: ["Hi! Let's practice some random words today.", "Ready for a surprise lesson?"],
        tips: "Học ngẫu nhiên giúp bạn ghi nhớ từ vựng trong nhiều ngữ cảnh khác nhau."
      }
    : (selectedTopic ? getLessonGuide(selectedLanguage, selectedTopic.id) : null);

  return (
    <div className="min-h-screen flex flex-col safe-area-pt safe-area-pb overflow-hidden">
      <div className="flex-1 max-w-6xl w-full mx-auto md:p-4 flex flex-col h-full">
        
        <header className="p-4 md:p-6 glass md:rounded-3xl shadow-sm flex justify-between items-center mb-0 md:mb-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">L</div>
             <div className="hidden sm:block">
               <h1 className="text-xl font-extrabold text-blue-900 leading-tight">LinguaFlow</h1>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Premium AI Tutor</p>
             </div>
          </div>
          <div className="flex items-center gap-2">
             {deferredPrompt && (
               <button onClick={() => { deferredPrompt.prompt(); setDeferredPrompt(null); }} className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-200">Cài đặt App</button>
             )}
             {isSessionActive && (
               <button onClick={() => stopSession(false)} className="bg-red-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-md">Rời đi</button>
             )}
          </div>
        </header>

        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {!isSessionActive && !isConnecting && !isConnectionLost ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-6 animate-fadeIn">
              
              <section className="bg-white/50 p-6 rounded-3xl border border-white">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px]">1</span>
                    Chọn ngôn ngữ
                  </h2>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {Object.values(Language).map((lang) => (
                    <button key={lang} onClick={() => setSelectedLanguage(lang)} className={`flex flex-col items-center py-4 rounded-2xl border-2 transition-all ${selectedLanguage === lang ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-white bg-white/40 text-gray-500'}`}>
                      <span className="text-3xl mb-1">{lang === Language.ENGLISH ? '🇺🇸' : lang === Language.JAPANESE ? '🇯🇵' : '🇨🇳'}</span>
                      <span className="text-xs font-bold">{lang}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleRandomPractice}
                  className="bg-orange-500 text-white p-4 rounded-3xl flex flex-col items-center justify-center shadow-lg active:scale-95 transition-transform"
                >
                  <span className="text-2xl mb-1">🎲</span>
                  <span className="font-bold text-xs uppercase tracking-tight">Học Ngẫu Nhiên</span>
                </button>
                <button 
                  onClick={() => setShowSubtitles(!showSubtitles)}
                  className={`p-4 rounded-3xl flex flex-col items-center justify-center shadow-lg active:scale-95 transition-all border ${showSubtitles ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-100'}`}
                >
                  <span className="text-2xl mb-1">{showSubtitles ? '👁️' : '🙈'}</span>
                  <span className="font-bold text-xs uppercase tracking-tight">Dịch Anh/Việt</span>
                </button>
              </div>

              <section className="bg-white/50 p-6 rounded-3xl border border-white">
                <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px]">2</span>
                  Chọn chủ đề bài học
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {TOPICS.map((topic) => (
                    <button key={topic.id} onClick={() => setSelectedTopic(topic)} className={`p-4 rounded-2xl border-2 text-left transition-all ${selectedTopic?.id === topic.id ? 'border-blue-600 bg-blue-50 shadow-md' : 'border-white bg-white/40'}`}>
                      <div className="text-2xl mb-2">{topic.icon}</div>
                      <h3 className="font-bold text-gray-800 text-[11px] leading-tight">{topic.title}</h3>
                    </button>
                  ))}
                </div>
              </section>

              <div className="pb-8">
                <button disabled={!selectedTopic} onClick={() => startSession(false)} className={`w-full py-5 rounded-3xl font-black text-lg shadow-xl ${selectedTopic ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500'}`}>
                  BẮT ĐẦU LUYỆN TẬP
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col lg:flex-row gap-4 p-2 md:p-0 h-full overflow-hidden relative">
              {(isConnectionLost || isConnecting) && (
                <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-md flex items-center justify-center md:rounded-3xl">
                  {isConnecting ? <div className="text-center"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p className="font-bold text-blue-900">Đang kết nối AI Tutor...</p></div>
                  : <div className="max-w-xs text-center p-8 bg-white rounded-3xl shadow-2xl border border-red-50"><div className="text-4xl mb-4">🔌</div><h3 className="font-bold text-lg mb-2">Mất kết nối</h3><button onClick={() => startSession(true)} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold">Thử lại ngay</button></div>}
                </div>
              )}

              <div className="flex-none lg:flex-1 lg:max-w-md flex flex-col gap-4">
                 <div className="bg-white/60 p-4 rounded-3xl border border-white flex flex-col items-center justify-center flex-1 min-h-[250px] relative">
                    <TutorAvatar url={currentConfig.avatarUrl} name={currentConfig.tutorName} isTalking={isAiTalking} />
                    <div className="w-full mt-auto p-3 bg-blue-50 border border-blue-100 rounded-2xl">
                       <p className="text-[10px] font-bold text-blue-800 uppercase text-center mb-1">Âm lượng giọng nói</p>
                       <Visualizer isActive={isSessionActive} stream={stream} />
                    </div>
                 </div>
              </div>

              <div className="flex-1 flex flex-col glass md:rounded-3xl border border-white overflow-hidden">
                <div className="flex bg-white/40 border-b border-gray-100">
                  <button onClick={() => setActiveTab('guide')} className={`flex-1 py-4 text-[10px] font-black tracking-widest ${activeTab === 'guide' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-400'}`}>TÀI LIỆU</button>
                  <button onClick={() => setActiveTab('review')} className={`flex-1 py-4 text-[10px] font-black tracking-widest ${activeTab === 'review' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-400'}`}>ÔN TẬP ({learnedWords.filter(w => w.language === selectedLanguage).length})</button>
                  <button onClick={() => setActiveTab('chat')} className={`flex-1 py-4 text-[10px] font-black tracking-widest ${activeTab === 'chat' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-400'}`}>HỘI THOẠI</button>
                </div>
                <div className="flex-1 overflow-hidden flex flex-col">
                  {activeTab === 'chat' ? <ChatHistory messages={messages} /> 
                  : activeTab === 'review' ? <ReviewSection words={learnedWords} currentLanguage={selectedLanguage} onRemove={handleRemoveWord} playPronunciation={playPronunciation} onPractice={() => setActiveTab('guide')} />
                  : <LearningGuide guide={currentGuide!} language={selectedLanguage} onWordMastered={handleWordMastered} />}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
