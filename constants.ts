
import { Topic, Language, LessonGuide } from './types';

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
  { id: 'routine', title: 'Daily Routine', description: 'Discuss your daily schedule, habits, and productivity.', icon: '🕒' },
  { id: 'education', title: 'Education', description: 'Talk about school, university, and lifelong learning.', icon: '🎓' },
  { id: 'sports', title: 'Sports & Fitness', description: 'Discuss your favorite sports and staying healthy.', icon: '⚽' },
  { id: 'environment', title: 'Environment', description: 'Talk about nature, climate change, and sustainability.', icon: '🌍' },
  { id: 'transport', title: 'Transportation', description: 'Navigate public transport, taxis, and commuting.', icon: '🚌' },
  { id: 'media', title: 'Media & News', description: 'Discuss movies, TV shows, and current global events.', icon: '🎬' },
  { id: 'fashion', title: 'Fashion & Style', description: 'Talk about clothing styles, trends, and personal look.', icon: '👗' },
  { id: 'plans', title: 'Future Plans', description: 'Share your dreams, professional goals, and travel plans.', icon: '🚀' },
  { id: 'feelings', title: 'Emotions', description: 'Learn to express how you feel and describe personalities.', icon: '😊' },
  { id: 'festivals', title: 'Festivals', description: 'Explore traditional holidays and modern celebrations.', icon: '🎆' },
];

export const LANGUAGE_CONFIGS = {
  [Language.ENGLISH]: {
    systemInstruction: "You are a friendly male English tutor named Alex. Use a natural American accent. Start by introducing the topic: {topic}. If the user makes pronunciation or grammar errors, provide brief, helpful corrections after their sentence. Be encouraging.",
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

export const LESSON_DATA: Record<string, Record<string, LessonGuide>> = {
  [Language.ENGLISH]: {
    'intro': {
      vocabulary: [
        { word: 'Hobby', reading: '/ˈhɒbi/', meaning: 'Sở thích' },
        { word: 'Engineer', reading: '/ˌendʒɪˈnɪər/', meaning: 'Kỹ sư' },
        { word: 'Student', reading: '/ˈstjuːdənt/', meaning: 'Sinh viên' },
        { word: 'Hometown', reading: '/ˈhəʊmtaʊn/', meaning: 'Quê hương' },
      ],
      starters: ["Hi, my name is Alex. Nice to meet you.", "I live in New York.", "I love playing guitar."],
      tips: "Keep it simple and smile!"
    },
    'routine': {
      vocabulary: [
        { word: 'Schedule', reading: '/ˈʃedjuːl/', meaning: 'Lịch trình' },
        { word: 'Habit', reading: '/ˈhæbɪt/', meaning: 'Thói quen' },
        { word: 'Productive', reading: '/prəˈdʌktɪv/', meaning: 'Năng suất' },
        { word: 'Breakfast', reading: '/ˈbrekfəst/', meaning: 'Bữa sáng' },
      ],
      starters: ["What is your morning routine?", "I usually wake up at 7 AM.", "I try to exercise daily."],
      tips: "Use frequency adverbs like 'usually', 'often', and 'sometimes'."
    },
    'sports': {
      vocabulary: [
        { word: 'Athlete', reading: '/ˈæθliːt/', meaning: 'Vận động viên' },
        { word: 'Tournament', reading: '/ˈtʊənəmənt/', meaning: 'Giải đấu' },
        { word: 'Gym', reading: '/dʒɪm/', meaning: 'Phòng tập' },
        { word: 'Healthy', reading: '/ˈhelθi/', meaning: 'Khỏe mạnh' },
      ],
      starters: ["Do you play any sports?", "I'm a big fan of football.", "I go to the gym twice a week."],
      tips: "Talk about your favorite teams to keep the conversation flowing."
    }
  },
  [Language.JAPANESE]: {
    'intro': {
      vocabulary: [
        { word: 'はじめまして', reading: 'Hajimemashite', meaning: 'Rất vui được gặp' },
        { word: '趣味', reading: 'Shumi', meaning: 'Sở thích' },
        { word: '会社員', reading: 'Kaishain', meaning: 'Nhân viên công ty' },
        { word: '出身', reading: 'Shusshin', meaning: 'Xuất thân' },
      ],
      starters: ["はじめまして、田中です。", "趣味は読書です。", "よろしくお願いします。"],
      tips: "Use 'Desu' and 'Masu' for politeness."
    },
    'routine': {
      vocabulary: [
        { word: '朝ご飯', reading: 'Asagohan', meaning: 'Bữa sáng' },
        { word: '起きる', reading: 'Okiru', meaning: 'Thức dậy' },
        { word: '仕事', reading: 'Shigoto', meaning: 'Công việc' },
        { word: '毎日', reading: 'Mainichi', meaning: 'Mỗi ngày' },
      ],
      starters: ["毎朝、何時に起きますか？", "コーヒーを飲みます。", "七時に家を出ます。"],
      tips: "Time particles like 'ni' are important for routines."
    }
  },
  [Language.CHINESE]: {
    'intro': {
      vocabulary: [
        { word: '名字', reading: 'Míngzì', meaning: 'Tên' },
        { word: '高兴', reading: 'Gāoxìng', meaning: 'Vui vẻ' },
        { word: '来自', reading: 'Láizì', meaning: 'Đến từ' },
        { word: '工作', reading: 'Gōngzuò', meaning: 'Công việc' },
      ],
      starters: ["你好，我叫李华。", "很高兴认识你。", "我是一名学生。"],
      tips: "Tones are essential in Chinese pronunciation."
    },
    'routine': {
      vocabulary: [
        { word: '起床', reading: 'Qǐchuáng', meaning: 'Thức dậy' },
        { word: '刷牙', reading: 'Shuāyá', meaning: 'Đánh răng' },
        { word: '忙', reading: 'Máng', meaning: 'Bận rộn' },
        { word: '习惯', reading: 'Xíguàn', meaning: 'Thói quen' },
      ],
      starters: ["你每天几点起床？", "我通常八点吃早饭。", "我今天很忙。"],
      tips: "Use 'Yào' to express future actions in your routine."
    }
  }
};

export const getLessonGuide = (lang: Language, topicId: string): LessonGuide => {
  const defaultGuide: LessonGuide = {
    vocabulary: [
      { word: 'Hello', reading: '---', meaning: 'Xin chào' },
      { word: 'Thank you', reading: '---', meaning: 'Cảm ơn' },
      { word: 'Goodbye', reading: '---', meaning: 'Tạm biệt' },
    ],
    starters: ["Hello, can you help me practice?", "I am learning this language."],
    tips: "Relax and try to speak naturally!"
  };

  return LESSON_DATA[lang]?.[topicId] || defaultGuide;
};
