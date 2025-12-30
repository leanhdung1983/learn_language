
import { Topic, Language } from './types';

export const TOPICS: Topic[] = [
  { id: 'intro', title: 'Self Introduction', description: 'Practice introducing yourself to new people.', icon: '👋' },
  { id: 'travel', title: 'Travel & Tourism', description: 'Book a hotel or ask for directions in a new city.', icon: '✈️' },
  { id: 'dining', title: 'Dining Out', description: 'Order food and talk about your dietary preferences.', icon: '🍜' },
  { id: 'business', title: 'Business Meeting', description: 'Professional conversation and negotiation practice.', icon: '💼' },
  { id: 'hobbies', title: 'Hobbies & Interests', description: 'Talk about what you love doing in your free time.', icon: '🎸' },
  { id: 'shopping', title: 'Shopping', description: 'Ask for prices, sizes, and negotiate at a local market.', icon: '🛍️' },
  { id: 'interview', title: 'Job Interview', description: 'Prepare for your dream career with professional Q&A.', icon: '👔' },
  { id: 'medical', title: 'At the Doctor', description: 'Learn how to describe symptoms and understand medical advice.', icon: '🏥' },
  { id: 'tech', title: 'Technology & AI', description: 'Discuss the latest innovations and digital trends.', icon: '🤖' },
  { id: 'weather', title: 'Weather & Nature', description: 'Talk about seasons, climate, and outdoor activities.', icon: '🌦️' },
  { id: 'family', title: 'Family & Home', description: 'Describe your family members and daily home life.', icon: '🏠' },
  { id: 'culture', title: 'Arts & Culture', description: 'Discuss films, music, traditions, and exhibitions.', icon: '🎨' },
];

export const LANGUAGE_CONFIGS = {
  [Language.ENGLISH]: {
    systemInstruction: "You are a friendly male English tutor named Alex. Use a natural American accent. Start by introducing the topic: {topic}. If the user makes pronunciation or grammar errors, provide brief, helpful corrections after their sentence. Be encouraging and use 3D-related metaphors if appropriate.",
    voice: 'Zephyr',
    gender: 'male',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=b6e3f4&mood[]=happy',
    tutorName: 'Alex'
  },
  [Language.JAPANESE]: {
    systemInstruction: "あなたは『ハナ』という名前の親切な女性の日本語教師です。トピック『{topic}』について会話を始めましょう。ユーザーの日本語に誤りがあれば、優しく訂正してください。日本の文化に触れながら、丁寧な言葉遣いで話してください。",
    voice: 'Kore',
    gender: 'female',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hana&backgroundColor=ffdfbf&mood[]=happy',
    tutorName: 'Hana (ハナ)'
  },
  [Language.CHINESE]: {
    systemInstruction: "你是一位名叫『张老师』的专业中文导师（男）。让我们开始讨论主题：{topic}。请使用标准的普通话。如果用户发音不准或语法有误，请在他们说完后给予纠正。语气要随和、有耐心。",
    voice: 'Puck',
    gender: 'male',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Li&backgroundColor=c0aede&mood[]=happy',
    tutorName: 'Teacher Li (李老师)'
  }
};
