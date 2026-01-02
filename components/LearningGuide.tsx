
import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { LessonGuide, Language, VocabularyItem } from '../types';

interface LearningGuideProps {
  guide: LessonGuide;
  language: Language;
  onWordMastered?: (word: VocabularyItem, score: number) => void;
}

interface PronunciationResult {
  score: number;
  feedback: string;
}

const LearningGuide: React.FC<LearningGuideProps> = ({ guide, language, onWordMastered }) => {
  const [recordingWord, setRecordingWord] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, PronunciationResult>>({});
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        resolve(base64String.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const playPronunciation = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      switch (language) {
        case Language.JAPANESE: utterance.lang = 'ja-JP'; break;
        case Language.CHINESE: utterance.lang = 'zh-CN'; break;
        default: utterance.lang = 'en-US'; break;
      }
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startRecording = async (word: string) => {
    try {
      setRecordingWord(word);
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (e) => e.data.size > 0 && audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        analyzePronunciation(word, audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
    } catch (err) {
      alert("Microphone error.");
      setRecordingWord(null);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop();
    setRecordingWord(null);
  };

  const analyzePronunciation = async (wordText: string, audioBlob: Blob) => {
    setIsAnalyzing(wordText);
    try {
      const apiKey = process.env.API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey });
      const base64Audio = await blobToBase64(audioBlob);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: [
            { text: `I am learning ${language}. Analyze my pronunciation of "${wordText}". Score 0-100. Return JSON { "score": number, "feedback": "string" }.` },
            { inlineData: { mimeType: 'audio/webm', data: base64Audio } }
          ]
        }],
        config: { responseMimeType: 'application/json' }
      });

      const result = JSON.parse(response.text) as PronunciationResult;
      setResults(prev => ({ ...prev, [wordText]: result }));

      // Auto-save if score is good
      if (result.score >= 70 && onWordMastered) {
        const vocabItem = guide.vocabulary.find(v => v.word === wordText);
        if (vocabItem) onWordMastered(vocabItem, result.score);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white/40">
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 shadow-sm">
        <h3 className="font-bold text-yellow-800 text-sm flex items-center gap-2 mb-1">💡 Quick Tip</h3>
        <p className="text-sm text-yellow-700">{guide.tips}</p>
      </div>

      <section>
        <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
          <span className="bg-blue-100 text-blue-600 p-1 rounded-md text-xs">VOCAB</span>
          Practice Vocabulary
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {guide.vocabulary.map((item, idx) => {
            const isRecording = recordingWord === item.word;
            const isAnalyzingThis = isAnalyzing === item.word;
            const result = results[item.word];

            return (
              <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-blue-600 text-lg">{item.word}</p>
                    <p className="text-xs text-gray-400 font-mono italic">{item.reading}</p>
                    <p className="text-sm text-gray-600 font-medium mt-1">{item.meaning}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => playPronunciation(item.word)} className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100"><svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06z"/></svg></button>
                    <button onClick={() => isRecording ? stopRecording() : startRecording(item.word)} className={`p-2 rounded-full ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {isRecording ? <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" /></svg> : <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" /><path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" /></svg>}
                    </button>
                  </div>
                </div>
                {isAnalyzingThis && <div className="mt-2 text-xs text-blue-500 flex items-center gap-2"><div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>Analyzing...</div>}
                {result && !isRecording && !isAnalyzingThis && (
                  <div className={`mt-3 p-2 rounded-lg text-xs ${result.score >= 70 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold">Score: {result.score}%</span>
                      {result.score >= 70 && <span className="text-[9px] bg-green-200 px-1 rounded uppercase font-bold">Saved!</span>}
                    </div>
                    <p>{result.feedback}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
          <span className="bg-green-100 text-green-600 p-1 rounded-md text-xs">START</span>
          Conversation Starters
        </h3>
        <div className="space-y-2">
          {guide.starters.map((starter, idx) => (
            <div key={idx} className="bg-green-50/50 p-3 rounded-xl border border-green-100 text-sm text-gray-700 italic relative group hover:bg-green-50 transition-colors cursor-pointer" onClick={() => playPronunciation(starter)}>
              "{starter}" <span className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50">🔊</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default LearningGuide;
