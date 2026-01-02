
export enum Language {
  ENGLISH = 'English',
  JAPANESE = 'Japanese',
  CHINESE = 'Chinese'
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface Message {
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
}

export interface VoiceConfig {
  voiceName: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
}

export interface VocabularyItem {
  word: string;
  reading: string; // IPA for English, Romaji for JP, Pinyin for CN
  meaning: string;
}

export interface LearnedWord extends VocabularyItem {
  language: Language;
  dateAdded: number;
  lastScore: number;
}

export interface LessonGuide {
  vocabulary: VocabularyItem[];
  starters: string[]; // Conversation starter sentences
  tips: string;
}
