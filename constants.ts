
import { Topic, Language } from './types';

export const TOPICS: Topic[] = [
  { id: 'free_talk', title: 'Free Talk', description: 'Chat about anything', icon: '💬' },
  { id: 'intro', title: 'Self Introduction', description: 'Introduce yourself', icon: '👋' },
  { id: 'travel', title: 'Travel', description: 'Airports & Hotels', icon: '✈️' },
  { id: 'food', title: 'Food & Dining', description: 'Ordering food', icon: '🍜' },
  { id: 'business', title: 'Business', description: 'Work & Meetings', icon: '💼' },
  { id: 'daily', title: 'Daily Life', description: 'Everyday routines', icon: '🏠' },
];

export const LANGUAGE_CONFIGS = {
  [Language.ENGLISH]: {
    systemInstruction: "You are Alex, a friendly English tutor. The user wants to talk about: {topic}. Engage in a natural, spoken conversation. Keep responses concise (1-3 sentences).",
    voice: 'Zephyr',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=c0aede',
    tutorName: 'Alex'
  },
  [Language.JAPANESE]: {
    systemInstruction: "You are Hana, a helpful Japanese tutor. The user wants to talk about: {topic}. Speak in polite but natural Japanese. Keep responses short.",
    voice: 'Kore',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hana&backgroundColor=ffdfbf',
    tutorName: 'Hana'
  },
  [Language.CHINESE]: {
    systemInstruction: "You are Teacher Li, a Chinese tutor. The user wants to talk about: {topic}. Speak standard Mandarin. Keep responses concise.",
    voice: 'Puck',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Li&backgroundColor=b6e3f4',
    tutorName: 'Li'
  }
};
