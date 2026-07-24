/** Ota-ona portali: yangiliklar, faoliyat, uy vazifa, adabiyot, o'yinlar */

export interface CenterNewsItem {
  id: string;
  title: string;
  summary: string;
  /** To'liq matn — oynada o'qiladi */
  content: string;
  date: string;
  tag: string;
}

export interface CenterActivity {
  id: string;
  title: string;
  description: string;
  /** To'liq tavsif */
  details: string;
  date: string;
  time?: string;
  place: string;
  audience: string;
}

export interface HomeworkItem {
  id: string;
  circleId: string;
  circleName: string;
  subject: string;
  title: string;
  description: string;
  dueDate: string;
  ageMin: number;
  ageMax: number;
}

export interface LiteratureItem {
  id: string;
  circleId?: string;
  subject: string;
  title: string;
  author: string;
  level: string;
  ageMin: number;
  ageMax: number;
  note: string;
  /** To'liq matn / parchalar */
  content: string;
}

export type GameCategory = 'math' | 'attention' | 'language' | 'logic';
export type GameDifficulty = 'easy' | 'medium' | 'hard';
export type GameAgeBand = '6-8' | '9-11' | '12-14' | '15-18';

export interface LearningGame {
  id: string;
  category: GameCategory;
  title: string;
  description: string;
  ageBand: GameAgeBand;
  difficulty: GameDifficulty;
  durationMin: number;
  /** O'yin mexanikasi turi */
  mechanic: 'quiz' | 'memory' | 'odd-one' | 'match' | 'sudoku' | 'merge2048' | 'color-seq';
  /** Zamonaviy grafikali o'yin belgisi */
  graphical?: boolean;
}

export const GAME_CATEGORY_LABELS: Record<GameCategory, string> = {
  math: 'Matematik savodxonlik',
  attention: 'Diqqatni oshirish',
  language: "Tillarni o'rgatish",
  logic: 'Mantiq va boshqotirmalar',
};

export const GAME_DIFFICULTY_LABELS: Record<GameDifficulty, string> = {
  easy: 'Oson',
  medium: "O'rta",
  hard: 'Qiyin',
};

export const centerNews: CenterNewsItem[] = [
  {
    id: 'n1',
    title: 'Yangi mavsum ochildi',
    summary: "2025–2026 o'quv mavsumida 79 ta to'garak bo'yicha qabul davom etmoqda. Ota-onalar onlayn yozilishi mumkin.",
    content:
      "Hurmatli ota-onalar!\n\n" +
      "Kelajak Markazi 2025–2026 o‘quv mavsumini rasman ochdi. Markazda 79 nomdagi to‘garaklar bo‘yicha qabul davom etmoqda.\n\n" +
      "Siz ota-ona kabinetidan:\n" +
      "• bolangizning to‘garaklarini ko‘rishingiz;\n" +
      "• yangi to‘garakka onlayn ariza yuborishingiz;\n" +
      "• oylik badalni Click yoki Payme orqali to‘lashingiz mumkin.\n\n" +
      "Savollar bo‘yicha markaz administratsiyasi bilan bog‘laning. Xush kelibsiz!",
    date: '2026-01-10',
    tag: 'Yangilik',
  },
  {
    id: 'n2',
    title: 'Robototexnika tanlovi',
    summary: "Markaz o'quvchilari tuman bosqichida 1-o'rinni egalladi. Keyingi bosqich — viloyat.",
    content:
      "Faxrli yangilik!\n\n" +
      "Kelajak Markazi robototexnika jamoasi Qamashi tuman bosqichida 1-o‘rinni egalladi. O‘quvchilarimiz Arduino va LEGO asosidagi loyihalari bilan hakamlar hay’atini hayratga soldi.\n\n" +
      "Keyingi bosqich — Qashqadaryo viloyat tanlovi. Tayyorgarlik mashg‘ulotlari har Du–Chor 16:00–18:00 oralig‘ida IT laboratoriyasida o‘tkaziladi.\n\n" +
      "Ota-onalarni qo‘llab-quvvatlashlari uchun minnatdormiz!",
    date: '2026-03-02',
    tag: 'Yutuq',
  },
  {
    id: 'n3',
    title: "Oylik badal eslatmasi",
    summary: "Mart oyi to'lovlari 25-martgacha amalga oshiriladi. Onlayn to'lov ota-ona kabinetidan qulay.",
    content:
      "Hurmatli ota-onalar!\n\n" +
      "Mart oyi uchun oylik badal miqdori 61 800 so‘m (BHMning 15%). To‘lov muddati — 25-martgacha.\n\n" +
      "To‘lovni ota-ona kabinetidagi «Onlayn to‘lov» bo‘limidan Click yoki Payme orqali amalga oshirishingiz mumkin. To‘lov muvaffaqiyatli bo‘lgach, lichkangizga habarnoma keladi.\n\n" +
      "Muddati o‘tgan to‘lovlar uchun qo‘shimcha eslatma yuboriladi.",
    date: '2026-03-05',
    tag: "To'lov",
  },
  {
    id: 'n4',
    title: "Ochiq dars kuni",
    summary: "Har oy oxirgi shanba — ota-onalar uchun ochiq dars. Bolangizning to'garagiga tashrif buyuring.",
    content:
      "Ochiq dars kuni!\n\n" +
      "Har oyning oxirgi shanbasida soat 10:00–13:00 oralig‘ida ota-onalar uchun ochiq darslar o‘tkaziladi.\n\n" +
      "Siz bolangizning mashg‘ulotini jonli ko‘rishingiz, murabbiy bilan suhbatlashishingiz va markaz sharoitlari bilan tanishishingiz mumkin.\n\n" +
      "Ro‘yxatdan o‘tish shart emas — shunchaki tashrif buyuring. Manzil: Qamashi tumani, Kelajak Markazi.",
    date: '2026-02-28',
    tag: 'Tadbir',
  },
];

export const centerActivities: CenterActivity[] = [
  {
    id: 'a1',
    title: 'Sport bayrami',
    description: "Futbol, shaxmat va gimnastika yo'nalishlari bo'yicha do'stona musobaqa.",
    details:
      "Sport bayramida bolalar futbol, shaxmat va gimnastika bo‘yicha do‘stona musobaqalarda ishtirok etadi.\n\n" +
      "Dastur:\n• 09:30 — yig‘ilish va ochilish\n• 10:00 — futbol o‘yinlari\n• 11:30 — shaxmat turniri\n• 13:00 — gimnastika namoyishi va yopilish\n\n" +
      "Ota-onalar tomoshabin sifatida taklif etiladi. Sport kiyimi majburiy. Yutuqlilar uchun diplom va sovg‘alar.",
    date: '2026-03-22',
    time: '09:30–14:00',
    place: 'Sport zali',
    audience: '9–16 yosh',
  },
  {
    id: 'a2',
    title: "San'at ko'rgazmasi",
    description: "O'quvchilarning chizma, kashta va kulolchilik ishlari namoyishi.",
    details:
      "Madaniyat zalida o‘quvchilarning eng yaxshi ijodiy ishlari namoyish etiladi: tasviriy san’at, kashta, kulolchilik va dizayn.\n\n" +
      "Ko‘rgazma ochiq — barcha ota-onalar va mehmonlar taklif etiladi. Mualliflar bilan suhbat va fotozona tashkil etiladi.\n\n" +
      "Eng yaxshi ishlar viloyat ko‘rgazmasiga tavsiya etiladi.",
    date: '2026-04-05',
    time: '11:00–17:00',
    place: "Madaniyat zali",
    audience: 'Barcha yoshlar',
  },
  {
    id: 'a3',
    title: 'STEM laboratoriyasi ochiq kuni',
    description: 'Arduino va LEGO laboratoriyasida amaliy mashg‘ulotlar namoyishi.',
    details:
      "IT laboratoriyasida Arduino, Raspberry Pi va LEGO Mindstorms bo‘yicha amaliy namoyishlar.\n\n" +
      "Bolalar robot yig‘ish, sensorlar bilan ishlash va oddiy dasturlashni jonli ko‘radi. Ota-onalar ham qisqa master-klassda ishtirok etishi mumkin.\n\n" +
      "Joylar cheklangan — oldindan xabarlar bo‘limidan yozing.",
    date: '2026-03-29',
    time: '14:00–17:00',
    place: 'IT laboratoriya',
    audience: '10–18 yosh',
  },
  {
    id: 'a4',
    title: "Kitobxonlar kechasi",
    description: "O'qish to'garagi a'zolari sevimli asarlaridan parchalar o'qiydi.",
    details:
      "Kutubxonada kechki adabiy kecha: o‘quvchilar sevimli kitoblaridan parchalar o‘qiydi, muhokama va mini-viktorina bo‘ladi.\n\n" +
      "Choy-coffee zona va kitob almashish stoli tashkil etiladi. Oila a’zolari hamrohligida kelish mumkin.",
    date: '2026-04-12',
    time: '17:00–19:00',
    place: 'Kutubxona',
    audience: '8–14 yosh',
  },
];

export const homeworkCatalog: HomeworkItem[] = [
  {
    id: 'hw1',
    circleId: 'oc1',
    circleName: 'Scratch dasturlash',
    subject: 'Dasturlash',
    title: 'Scratch: oddiy animatsiya',
    description: "Qahramonni harakatlantiruvchi 20 sekundlik animatsiya yasang. Loyihani USB yoki screenshot bilan olib keling.",
    dueDate: '2026-03-25',
    ageMin: 8,
    ageMax: 12,
  },
  {
    id: 'hw2',
    circleId: 'oc10',
    circleName: 'Ingliz tili',
    subject: 'Ingliz tili',
    title: 'Daily routine — 8 ta jumla',
    description: "O'zingizning kun tartibingiz haqida 8 ta oddiy inglizcha jumla yozing.",
    dueDate: '2026-03-24',
    ageMin: 9,
    ageMax: 14,
  },
  {
    id: 'hw3',
    circleId: 'oc20',
    circleName: 'Matematika',
    subject: 'Matematika',
    title: "Ko'paytirish jadvali (7–9)",
    description: "7, 8, 9 ko'paytirish jadvallarini yoddan yozib keling. 10 ta misol yeching.",
    dueDate: '2026-03-23',
    ageMin: 7,
    ageMax: 10,
  },
  {
    id: 'hw4',
    circleId: 'oc5',
    circleName: 'Robototexnika',
    subject: 'Robototexnika',
    title: 'Sensorlar sxemasi',
    description: "Darsda ko'rilgan sensorlardan birining ishlash tartibini chizib keling.",
    dueDate: '2026-03-26',
    ageMin: 11,
    ageMax: 16,
  },
  {
    id: 'hw5',
    circleId: 'oc15',
    circleName: "Tasviriy san'at",
    subject: "San'at",
    title: 'Tabiat etyudi',
    description: "Uy atrofidagi daraxt yoki gulni A4 formatda bo'yoq yoki qalamda chizing.",
    dueDate: '2026-03-27',
    ageMin: 6,
    ageMax: 14,
  },
];

export const literatureCatalog: LiteratureItem[] = [
  {
    id: 'lit1',
    subject: 'Matematika',
    title: "Bolalar uchun qiziqarli matematika",
    author: "Ya. I. Perelman (moslashtirilgan)",
    level: "Boshlang'ich",
    ageMin: 8,
    ageMax: 12,
    note: "Mantiqiy masalalar va o'yinlar to'plami.",
    content:
      "1-bob. Sonlar o‘yini\n\n" +
      "Masala 1. Ikki qo‘shni sonning yig‘indisi 25. Bu sonlar qaysilar?\n" +
      "Javob: 12 va 13.\n\n" +
      "Masala 2. Bir dasturxon atrofida 4 bola o‘tiribdi. Har biri 3 ta olma oldi. Jami nechta olma?\n" +
      "Javob: 12.\n\n" +
      "Masala 3. Soat 3 da boshlangan dars 45 daqiqa davom etdi. Dars qachon tugadi?\n" +
      "Javob: 15:45.\n\n" +
      "Uyga: o‘zingiz 3 ta o‘xshash masala tuzing va yeching.",
  },
  {
    id: 'lit2',
    subject: 'Ingliz tili',
    title: 'English for Kids — Word Book',
    author: 'Kelajak Markazi metodikasi',
    level: 'A1',
    ageMin: 6,
    ageMax: 10,
    note: "Kunlik so'zlar, rasmlar bilan.",
    content:
      "Unit 1 — My day\n\n" +
      "morning — ertalab\n" +
      "afternoon — kunduzi\n" +
      "evening — kechqurun\n" +
      "school — maktab\n" +
      "friend — do‘st\n" +
      "book — kitob\n" +
      "water — suv\n" +
      "apple — olma\n\n" +
      "Practice: Write 5 sentences about your morning.\n" +
      "Example: I wake up at 7 o’clock.",
  },
  {
    id: 'lit3',
    subject: 'Robototexnika',
    title: 'Arduino boshlovchilar uchun',
    author: 'Markaz IT bo‘limi',
    level: "O'rta",
    ageMin: 11,
    ageMax: 16,
    note: "Sxemalar va amaliy mashqlar.",
    content:
      "1. Arduino nima?\n" +
      "Arduino — elektronika va dasturlashni o‘rganish uchun ochiq platforma.\n\n" +
      "2. Asosiy qismlar\n" +
      "• Platа (Uno)\n• USB kabel\n• Breadboard\n• LED, rezistor, senzorlar\n\n" +
      "3. Birinchi dastur — LED miltillashi\n" +
      "digitalWrite(13, HIGH); delay(500);\n" +
      "digitalWrite(13, LOW); delay(500);\n\n" +
      "Uyga: LED ni 1 soniya yonib-o‘chirish kodini yozib keling.",
  },
  {
    id: 'lit4',
    subject: "O'zbek adabiyoti",
    title: "Oltin voqealar",
    author: "Xalq ertaklari to'plami",
    level: "Boshlang'ich",
    ageMin: 6,
    ageMax: 10,
    note: "O'qish va tahlil uchun qisqa hikoyalar.",
    content:
      "Zumrad va Qimmat (qisqa parchа)\n\n" +
      "Bir zamonlar bir kampirning ikki qizi bor edi: Zumrad va Qimmat. Zumrad mehnatkash, Qimmat esa dangasa edi...\n\n" +
      "Savollar:\n" +
      "1. Zumrad qanday xislatli qiz edi?\n" +
      "2. Sizga qaysi qahramon yoqdi? Nima uchun?\n\n" +
      "Uyga: ertakning davomini o‘qing va 5 gapda qayta hikoya qiling.",
  },
  {
    id: 'lit5',
    subject: 'Diqqat va mantiq',
    title: "Miya mashqlari",
    author: "Pedagogika markazi",
    level: "Turli",
    ageMin: 7,
    ageMax: 14,
    note: "Kundalik 10 daqiqalik mashqlar.",
    content:
      "Kunlik mashq (10 daqiqa)\n\n" +
      "1. Qatorni davom ettiring: 2, 4, 8, 16, …\n" +
      "2. Farqni toping: 🔵🔵🔵🟢🔵\n" +
      "3. So‘zni orqaga o‘qing: MARKAZ → ?\n" +
      "4. 7×8=?  9×6=?  12−5=?\n\n" +
      "Maslahat: har kuni bittadan mashqni bajarib boring.",
  },
  {
    id: 'lit6',
    subject: 'Ingliz tili',
    title: 'Grammar Practice A2',
    author: 'Kelajak Markazi',
    level: 'A2',
    ageMin: 12,
    ageMax: 16,
    note: "Uy vazifasi uchun qo'shimcha mashqlar.",
    content:
      "Present Simple vs Present Continuous\n\n" +
      "1. She usually ___ (go) to school by bus.\n" +
      "2. Look! They ___ (play) football now.\n" +
      "3. I ___ (not / like) coffee.\n\n" +
      "Answers: 1) goes  2) are playing  3) don’t like\n\n" +
      "Write 6 sentences about your weekly routine.",
  },
];

export const learningGames: LearningGame[] = [
  // Math
  {
    id: 'g-math-1',
    category: 'math',
    title: "Sonlar qo'shish",
    description: "1–20 oralig'ida qo'shish misollari.",
    ageBand: '6-8',
    difficulty: 'easy',
    durationMin: 5,
    mechanic: 'quiz',
  },
  {
    id: 'g-math-2',
    category: 'math',
    title: "Ko'paytirish jadvallari",
    description: "2–9 jadvali bo'yicha tez javob.",
    ageBand: '9-11',
    difficulty: 'medium',
    durationMin: 7,
    mechanic: 'quiz',
  },
  {
    id: 'g-math-3',
    category: 'math',
    title: 'Foizlar va ulushlar',
    description: 'Foiz hisoblash va oddiy ulushlar.',
    ageBand: '12-14',
    difficulty: 'hard',
    durationMin: 10,
    mechanic: 'quiz',
  },
  {
    id: 'g-math-4',
    category: 'math',
    title: 'Algebraik ifodalar',
    description: "Oddiy tenglamalarni yechish.",
    ageBand: '15-18',
    difficulty: 'hard',
    durationMin: 12,
    mechanic: 'quiz',
  },
  // Attention
  {
    id: 'g-att-1',
    category: 'attention',
    title: 'Farqni top',
    description: "Bir xil emas bo'lgan belgini toping.",
    ageBand: '6-8',
    difficulty: 'easy',
    durationMin: 4,
    mechanic: 'odd-one',
  },
  {
    id: 'g-att-2',
    category: 'attention',
    title: 'Xotira kartochkalari',
    description: "Juftlarni eslab qoling va oching.",
    ageBand: '9-11',
    difficulty: 'medium',
    durationMin: 8,
    mechanic: 'memory',
  },
  {
    id: 'g-att-3',
    category: 'attention',
    title: 'Tezkor diqqat',
    description: "Ketma-ketlikdagi o'zgarishni aniqlang.",
    ageBand: '12-14',
    difficulty: 'hard',
    durationMin: 6,
    mechanic: 'odd-one',
  },
  {
    id: 'g-att-4',
    category: 'attention',
    title: 'Murakkab xotira',
    description: "8 juft kartochka — vaqt cheklovi bilan.",
    ageBand: '15-18',
    difficulty: 'hard',
    durationMin: 10,
    mechanic: 'memory',
  },
  // Language
  {
    id: 'g-lang-1',
    category: 'language',
    title: "So'z va rasm",
    description: "Inglizcha so'zni rasmga moslang.",
    ageBand: '6-8',
    difficulty: 'easy',
    durationMin: 5,
    mechanic: 'match',
  },
  {
    id: 'g-lang-2',
    category: 'language',
    title: 'Daily words',
    description: "Kunlik so'zlar tarjimasi — test.",
    ageBand: '9-11',
    difficulty: 'medium',
    durationMin: 7,
    mechanic: 'quiz',
  },
  {
    id: 'g-lang-3',
    category: 'language',
    title: 'Gapni to‘ldir',
    description: "Inglizcha gapdagi bo'sh joyni to'ldiring.",
    ageBand: '12-14',
    difficulty: 'medium',
    durationMin: 8,
    mechanic: 'quiz',
  },
  {
    id: 'g-lang-4',
    category: 'language',
    title: 'Sinonımlar',
    description: "Murakkabroq lug'at — mos juftliklar.",
    ageBand: '15-18',
    difficulty: 'hard',
    durationMin: 10,
    mechanic: 'match',
  },
  // Logic / graphical
  {
    id: 'g-sudoku-1',
    category: 'logic',
    title: 'Sudoku Mini 4×4',
    description: "Rangli kataklar — boshlang'ich Sudoku. Har qator, ustun va blokda raqamlar takrorlanmasin.",
    ageBand: '6-8',
    difficulty: 'easy',
    durationMin: 8,
    mechanic: 'sudoku',
    graphical: true,
  },
  {
    id: 'g-sudoku-2',
    category: 'logic',
    title: 'Sudoku 6×6',
    description: "O'rta daraja — mantiqiy fikrlashni rivojlantiradi.",
    ageBand: '9-11',
    difficulty: 'medium',
    durationMin: 12,
    mechanic: 'sudoku',
    graphical: true,
  },
  {
    id: 'g-sudoku-3',
    category: 'logic',
    title: 'Sudoku Klassik 9×9',
    description: 'To‘liq Sudoku — diqqat va sabr mashqi.',
    ageBand: '12-14',
    difficulty: 'hard',
    durationMin: 20,
    mechanic: 'sudoku',
    graphical: true,
  },
  {
    id: 'g-sudoku-4',
    category: 'logic',
    title: 'Sudoku Pro 9×9',
    description: 'Qiyin variant — ko‘proq bo‘sh kataklar.',
    ageBand: '15-18',
    difficulty: 'hard',
    durationMin: 25,
    mechanic: 'sudoku',
    graphical: true,
  },
  {
    id: 'g-2048-1',
    category: 'logic',
    title: '2048 Kids',
    description: "Rangli plitkalarni birlashtiring — 128 gacha yeting.",
    ageBand: '6-8',
    difficulty: 'easy',
    durationMin: 8,
    mechanic: 'merge2048',
    graphical: true,
  },
  {
    id: 'g-2048-2',
    category: 'math',
    title: '2048 Classic',
    description: "Mashhur 2048 — 2-ning darajalarini birlashtiring.",
    ageBand: '9-11',
    difficulty: 'medium',
    durationMin: 12,
    mechanic: 'merge2048',
    graphical: true,
  },
  {
    id: 'g-2048-3',
    category: 'math',
    title: '2048 Challenge',
    description: 'Maqsad: 2048 plitkasiga erishish.',
    ageBand: '12-14',
    difficulty: 'hard',
    durationMin: 15,
    mechanic: 'merge2048',
    graphical: true,
  },
  {
    id: 'g-color-1',
    category: 'attention',
    title: 'Rang ketma-ketligi',
    description: "Yorqin ranglar ketma-ketligini eslab takrorlang (Simon).",
    ageBand: '6-8',
    difficulty: 'easy',
    durationMin: 5,
    mechanic: 'color-seq',
    graphical: true,
  },
  {
    id: 'g-color-2',
    category: 'attention',
    title: 'Rang master',
    description: "Uzunroq ketma-ketlik — diqqatni kuchaytiradi.",
    ageBand: '9-11',
    difficulty: 'medium',
    durationMin: 7,
    mechanic: 'color-seq',
    graphical: true,
  },
  {
    id: 'g-color-3',
    category: 'attention',
    title: 'Neon Memory',
    description: '6 rang, tez tempo — zamonaviy diqqat o‘yini.',
    ageBand: '12-14',
    difficulty: 'hard',
    durationMin: 8,
    mechanic: 'color-seq',
    graphical: true,
  },
];

export function ageToBand(age: number): GameAgeBand {
  if (age <= 8) return '6-8';
  if (age <= 11) return '9-11';
  if (age <= 14) return '12-14';
  return '15-18';
}

export function gamesForAge(age: number, category?: GameCategory) {
  const band = ageToBand(age);
  return learningGames.filter(
    (g) => g.ageBand === band && (!category || g.category === category)
  );
}

/** Quiz savollari — o'yin id bo'yicha */
export function getQuizQuestions(gameId: string): { q: string; options: string[]; answer: number }[] {
  const bank: Record<string, { q: string; options: string[]; answer: number }[]> = {
    'g-math-1': [
      { q: '3 + 5 = ?', options: ['7', '8', '9', '6'], answer: 1 },
      { q: '10 + 4 = ?', options: ['12', '13', '14', '15'], answer: 2 },
      { q: '7 + 2 = ?', options: ['8', '9', '10', '7'], answer: 1 },
      { q: '6 + 6 = ?', options: ['10', '11', '12', '13'], answer: 2 },
    ],
    'g-math-2': [
      { q: '7 × 8 = ?', options: ['54', '56', '58', '64'], answer: 1 },
      { q: '9 × 6 = ?', options: ['54', '56', '63', '45'], answer: 0 },
      { q: '4 × 9 = ?', options: ['32', '36', '40', '28'], answer: 1 },
      { q: '8 × 8 = ?', options: ['56', '64', '72', '48'], answer: 1 },
    ],
    'g-math-3': [
      { q: '50 ning 20% i necha?', options: ['5', '10', '15', '20'], answer: 1 },
      { q: '200 ning 25% i?', options: ['25', '40', '50', '75'], answer: 2 },
      { q: '1/4 qismi 20 bo‘lsa, butun necha?', options: ['60', '80', '100', '40'], answer: 1 },
    ],
    'g-math-4': [
      { q: 'x + 5 = 12, x = ?', options: ['5', '6', '7', '8'], answer: 2 },
      { q: '2x = 18, x = ?', options: ['7', '8', '9', '10'], answer: 2 },
      { q: 'x − 4 = 11, x = ?', options: ['14', '15', '16', '17'], answer: 1 },
    ],
    'g-lang-2': [
      { q: '"Apple" tarjimasi?', options: ['Banan', 'Olma', 'Uzum', 'Nok'], answer: 1 },
      { q: '"Book" tarjimasi?', options: ['Daftar', 'Qalam', 'Kitob', 'Sumka'], answer: 2 },
      { q: '"Water" tarjimasi?', options: ['Suv', 'Non', 'Choy', 'Sut'], answer: 0 },
      { q: '"School" tarjimasi?', options: ['Uy', 'Maktab', 'Bog‘', 'Do‘kon'], answer: 1 },
    ],
    'g-lang-3': [
      { q: 'I ___ to school every day.', options: ['go', 'goes', 'going', 'went'], answer: 0 },
      { q: 'She ___ a book now.', options: ['read', 'reads', 'is reading', 'reading'], answer: 2 },
      { q: 'They ___ football yesterday.', options: ['play', 'played', 'plays', 'playing'], answer: 1 },
    ],
  };
  return bank[gameId] || bank['g-math-1'];
}

export function getOddOneRound(difficulty: GameDifficulty): { items: string[]; oddIndex: number } {
  const sets =
    difficulty === 'easy'
      ? [
          { items: ['🍎', '🍎', '🍌', '🍎'], oddIndex: 2 },
          { items: ['⭐', '⭐', '⭐', '🌙'], oddIndex: 3 },
          { items: ['🐱', '🐶', '🐱', '🐱'], oddIndex: 1 },
        ]
      : difficulty === 'medium'
        ? [
            { items: ['▲', '▲', '△', '▲'], oddIndex: 2 },
            { items: ['12', '12', '21', '12'], oddIndex: 2 },
            { items: ['🔵', '🔵', '🔵', '🟢'], oddIndex: 3 },
          ]
        : [
            { items: ['bdp', 'bdp', 'dbp', 'bdp'], oddIndex: 2 },
            { items: ['VII', 'VII', 'VIII', 'VII'], oddIndex: 2 },
            { items: ['q', 'p', 'q', 'q'], oddIndex: 1 },
          ];
  return sets[Math.floor(Math.random() * sets.length)];
}

export function getMemoryPairs(difficulty: GameDifficulty): string[] {
  const easy = ['🐶', '🐱', '🐰', '🦊'];
  const medium = ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼'];
  const hard = ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁'];
  const base = difficulty === 'easy' ? easy : difficulty === 'medium' ? medium : hard;
  return [...base, ...base];
}

export function getMatchPairs(difficulty: GameDifficulty): { left: string; right: string }[] {
  if (difficulty === 'easy') {
    return [
      { left: 'Cat', right: 'Mushuk' },
      { left: 'Dog', right: 'It' },
      { left: 'Sun', right: 'Quyosh' },
      { left: 'Moon', right: 'Oy' },
    ];
  }
  if (difficulty === 'medium') {
    return [
      { left: 'Happy', right: 'Baxtli' },
      { left: 'Strong', right: 'Kuchli' },
      { left: 'Fast', right: 'Tez' },
      { left: 'Smart', right: 'Aqlli' },
      { left: 'Kind', right: 'Mehribon' },
    ];
  }
  return [
    { left: 'Courage', right: 'Jasorat' },
    { left: 'Knowledge', right: 'Bilim' },
    { left: 'Freedom', right: 'Erkinlik' },
    { left: 'Patience', right: 'Sabr' },
    { left: 'Wisdom', right: 'Donolik' },
    { left: 'Success', right: 'Muvaffaqiyat' },
  ];
}
