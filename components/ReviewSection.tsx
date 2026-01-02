
import React from 'react';
import { LearnedWord, Language } from '../types';

interface ReviewSectionProps {
  words: LearnedWord[];
  currentLanguage: Language;
  onRemove: (word: string) => void;
  onPractice: (word: string) => void;
  playPronunciation: (text: string, lang: Language) => void;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ words, currentLanguage, onRemove, playPronunciation }) => {
  const filteredWords = words.filter(w => w.language === currentLanguage);

  if (filteredWords.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
        <div className="text-5xl mb-4">📚</div>
        <p className="font-medium">Chưa có từ vựng nào được lưu.</p>
        <p className="text-xs mt-2">Hãy đạt điểm phát âm trên 70% trong phần Tài Liệu để tự động lưu từ vào đây!</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/40">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-gray-700 flex items-center gap-2 text-sm uppercase tracking-wider">
          <span className="bg-orange-100 text-orange-600 p-1 rounded-md text-[10px]">REVIEW</span>
          Từ vựng đã học ({filteredWords.length})
        </h3>
      </div>
      
      <div className="grid grid-cols-1 gap-3 pb-8">
        {filteredWords.sort((a, b) => b.dateAdded - a.dateAdded).map((item, idx) => (
          <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center group">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-bold text-gray-800 text-base">{item.word}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  item.lastScore >= 85 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                }`}>
                  {item.lastScore}%
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-mono italic">{item.reading}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.meaning}</p>
            </div>
            
            <div className="flex gap-1">
              <button 
                onClick={() => playPronunciation(item.word, item.language)}
                className="p-2 rounded-full hover:bg-blue-50 text-blue-500 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06z" />
                </svg>
              </button>
              <button 
                onClick={() => onRemove(item.word)}
                className="p-2 rounded-full hover:bg-red-50 text-red-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                title="Xóa khỏi danh sách học"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewSection;
