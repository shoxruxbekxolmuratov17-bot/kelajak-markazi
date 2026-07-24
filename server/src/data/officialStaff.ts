import type { Teacher } from '../types.js';

/**
 * Qamashi tuman «Kelajak» markazi — boshqaruv va boshqa xodimlar ro'yxati
 * Manba: Markaz shtatlar ro'yxati (Excel)
 */

function staff(opts: {
  id: string;
  fullName: string;
  lastName: string;
  firstName: string;
  specialty: string;
  department: string;
  phone: string;
  email: string;
  orderInfo?: string;
  circleIds?: string[];
  isVacant?: boolean;
}): Teacher {
  return {
    id: opts.id,
    fullName: opts.fullName,
    firstName: opts.firstName,
    lastName: opts.lastName,
    specialty: opts.specialty,
    department: opts.department,
    orderInfo: opts.orderInfo,
    phone: opts.phone,
    email: opts.email,
    circleIds: opts.circleIds ?? [],
    experience: 0,
    rating: 0,
    isInclusive: false,
    isVacant: opts.isVacant ?? false,
  };
}

const DEPT_MANAGEMENT = 'Boshqaruv';
const DEPT_CIRCLES = "To'garaklar faoliyatini tashkil etish va monitoring qilish bo'limi";
const DEPT_ENROLL = "O'quvchilarni qo'shimcha ta'limga jalb qilish bo'limi";

export const DIRECTOR_FULL_NAME = "Nurmatova Nargiza To'ra qizi";

export const officialStaff: Teacher[] = [
  staff({
    id: 'st1',
    fullName: DIRECTOR_FULL_NAME,
    lastName: 'Nurmatova',
    firstName: "Nargiza To'ra qizi",
    specialty: 'Direktor',
    department: DEPT_MANAGEMENT,
    phone: '+998 90 874 87 84',
    email: 'nargiza.nurmatova@kelajak.uz',
    orderInfo: '2026-yil 6-yanvar, 1-K-sonli',
  }),
  staff({
    id: 'st2',
    fullName: '—',
    lastName: '',
    firstName: '',
    specialty: "Direktor o'rinbosari",
    department: DEPT_MANAGEMENT,
    phone: '—',
    email: '—',
    isVacant: true,
  }),
  staff({
    id: 'st3',
    fullName: 'Jurayev Akmal Aliyevich',
    lastName: 'Jurayev',
    firstName: 'Akmal Aliyevich',
    specialty: 'Bosh buxgalter',
    department: DEPT_MANAGEMENT,
    phone: '+998 99 666 72 90',
    email: 'akmal.jurayev@kelajak.uz',
    orderInfo: '2026-yil 1-iyun, №Sht 18',
  }),
  staff({
    id: 'st4',
    fullName: "Xayitov O'ktam Shodmanovich",
    lastName: 'Xayitov',
    firstName: "O'ktam Shodmanovich",
    specialty: "Inson resurslari rivojlantirish va boshqarish bo'yicha yetakchi mutaxassis",
    department: DEPT_MANAGEMENT,
    phone: '+998 91 597 23 84',
    email: 'uktam.xayitov@kelajak.uz',
    orderInfo: '2026-yil 1-iyun, №Sht 19',
  }),
  staff({
    id: 'st5',
    fullName: 'Karimov Abdulla Xolmuradovich',
    lastName: 'Karimov',
    firstName: 'Abdulla Xolmuradovich',
    specialty: "Maktab maslahatchilari faoliyatini muvofiqlashtirish bo'yicha bosh mutaxassis",
    department: DEPT_MANAGEMENT,
    phone: '+998 88 677 69 77',
    email: 'abdulla.karimov@kelajak.uz',
    orderInfo: '2026-yil 2-mart, №Sht 6',
  }),
  staff({
    id: 'st6',
    fullName: 'Ballieva Shoira Ergashevna',
    lastName: 'Ballieva',
    firstName: 'Shoira Ergashevna',
    specialty: "Bo'lim boshlig'i",
    department: DEPT_CIRCLES,
    phone: '+998 91 962 46 83',
    email: 'shoira.ballieva@kelajak.uz',
    orderInfo: '2026-yil 6-yanvar, №Sht 2',
    circleIds: ['c-cul-01', 'c-cul-09', 'c-tech-11', 'c-tech-16', 'c-sp-01'],
  }),
  staff({
    id: 'st7',
    fullName: 'Xushanov Baxriddin Saydullaevich',
    lastName: 'Xushanov',
    firstName: 'Baxriddin Saydullaevich',
    specialty: 'Uslubchi',
    department: DEPT_CIRCLES,
    phone: '+998 88 871 73 35',
    email: 'baxriddin.xushanov@kelajak.uz',
    orderInfo: '2026-yil 6-yanvar, №Sht 2',
    circleIds: ['c-cr-02', 'c-cr-04', 'c-cr-05', 'c-cr-06', 'c-cr-09', 'c-tou-03', 'c-tou-04', 'c-tou-06', 'c-tou-07'],
  }),
  staff({
    id: 'st8',
    fullName: 'Xushmurodov Urozbek Turayevich',
    lastName: 'Xushmurodov',
    firstName: 'Urozbek Turayevich',
    specialty: 'Uslubchi',
    department: DEPT_CIRCLES,
    phone: '+998 90 722 18 61',
    email: 'urozbek.xushmurodov@kelajak.uz',
    orderInfo: '2026-yil 6-yanvar, №Sht 2',
    circleIds: ['c-pr-01', 'c-pr-02', 'c-pr-03', 'c-pr-05', 'c-pr-07', 'c-pr-08', 'c-pr-09', 'c-lang-01'],
  }),
  staff({
    id: 'st9',
    fullName: 'Ibodatova Lobar Olimjon qizi',
    lastName: 'Ibodatova',
    firstName: 'Lobar Olimjon qizi',
    specialty: 'Bosh mutaxassis',
    department: DEPT_ENROLL,
    phone: '+998 77 390 92 94',
    email: 'lobar.ibodatova@kelajak.uz',
    orderInfo: '2026-yil 6-yanvar, №Sht 1',
  }),
  staff({
    id: 'st10',
    fullName: 'Azizova Adolat Ikromovna',
    lastName: 'Azizova',
    firstName: 'Adolat Ikromovna',
    specialty: 'Uslubchi',
    department: DEPT_ENROLL,
    phone: '+998 91 459 42 72',
    email: 'adolat.azizova@kelajak.uz',
    orderInfo: '2026-yil 6-yanvar, №Sht 1',
  }),
];

/** Faol to'garaklar uchun mas'ul xodim (bo'lim / uslubchi) */
export const staffByCategory: Record<string, { id: string; name: string }> = {
  art: { id: 'st6', name: 'Ballieva Shoira Ergashevna' },
  it: { id: 'st6', name: 'Ballieva Shoira Ergashevna' },
  sport: { id: 'st6', name: 'Ballieva Shoira Ergashevna' },
  career: { id: 'st7', name: 'Xushanov Baxriddin Saydullaevich' },
  science: { id: 'st7', name: 'Xushanov Baxriddin Saydullaevich' },
  reading: { id: 'st8', name: 'Xushmurodov Urozbek Turayevich' },
  language: { id: 'st8', name: 'Xushmurodov Urozbek Turayevich' },
};
