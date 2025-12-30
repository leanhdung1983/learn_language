
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
