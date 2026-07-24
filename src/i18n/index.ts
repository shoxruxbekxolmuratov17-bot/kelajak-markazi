/** Minimal i18n — login / enrollment / parent / pay */
export type Locale = 'uz' | 'ru';

const dict = {
  uz: {
    login: 'Tizimga kirish',
    parentTab: 'Ota-ona',
    staffTab: 'Xodim',
    enroll: "Ro'yxatdan o'tish",
    phone: 'Telefon',
    pin: 'PIN kod',
    socialRegistry: 'Ijtimoiy reestr farzandi',
    pay: "To'lov",
    paySuccess: "To'lov qabul qilindi",
    cancel: 'Bekor',
    save: 'Saqlash',
    districtAll: 'Barcha tumanlar',
    loading: 'Yuklanmoqda...',
    errorGeneric: 'Xatolik yuz berdi',
  },
  ru: {
    login: 'Вход',
    parentTab: 'Родитель',
    staffTab: 'Сотрудник',
    enroll: 'Регистрация',
    phone: 'Телефон',
    pin: 'PIN-код',
    socialRegistry: 'Ребёнок из соцреестра',
    pay: 'Оплата',
    paySuccess: 'Оплата принята',
    cancel: 'Отмена',
    save: 'Сохранить',
    districtAll: 'Все районы',
    loading: 'Загрузка...',
    errorGeneric: 'Произошла ошибка',
  },
} as const;

let current: Locale = 'uz';

export function setLocale(l: Locale) {
  current = l;
  try {
    localStorage.setItem('kelajak-locale', l);
  } catch {
    // ignore
  }
}

export function getLocale(): Locale {
  try {
    const v = localStorage.getItem('kelajak-locale');
    if (v === 'ru' || v === 'uz') current = v;
  } catch {
    // ignore
  }
  return current;
}

export function t(key: keyof (typeof dict)['uz']): string {
  return dict[getLocale()][key];
}
