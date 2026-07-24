import type { Circle, CircleCategory, Teacher, School } from '../types.js';
import { MONTHLY_FEE } from '../types.js';

/**
 * Qamashi tuman «Kelajak» markazi — to'garak rahbarlari (oylik to'lov jadvali)
 * Manba: Iyun 2026 — o'qituvchi, to'garak, maktab, stavka, soat, o'quvchi soni
 */

export type CircleLeaderRow = {
  school: string;
  fullName: string;
  education: 'Oliy' | "O'rta maxsus";
  /** Jadvaldagi to'garak nomi */
  circleName: string;
  /** Katalogdagi asosiy yo'nalish id */
  catalogId: string;
  category: CircleCategory;
  stavka: number;
  hours: number;
  students: number;
};

/** Jadval qatorlari (OCR + qo'lda tekshiruv) */
export const officialCircleLeaderRows: CircleLeaderRow[] = [
  { school: 'markaz', fullName: 'Ergasheva Maxsuda Saydullayevna', education: 'Oliy', circleName: 'Tikish-bichish', catalogId: 'c-cr-05b', category: 'career', stavka: 0.5, hours: 12, students: 20 },
  { school: 'markaz', fullName: 'Eshmatova Zamira Numardjanovna', education: 'Oliy', circleName: 'Kimyo', catalogId: 'c-pr-03', category: 'reading', stavka: 1, hours: 12, students: 20 },
  { school: '76-maktab', fullName: 'Jabborova Muqaddas Baxriddinovna', education: "O'rta maxsus", circleName: 'Yosh dasturchi', catalogId: 'c-tech-08', category: 'it', stavka: 1, hours: 24, students: 40 },
  { school: 'markaz', fullName: "Kenjayev Elyor Shavkat o'g'li", education: 'Oliy', circleName: 'Kimyo', catalogId: 'c-pr-03', category: 'reading', stavka: 0.75, hours: 12, students: 20 },
  { school: '18-maktab', fullName: 'Lugmonova Norjamol Muxtarxonovna', education: "O'rta maxsus", circleName: "To'quvchilik", catalogId: 'c-cr-06b', category: 'career', stavka: 0.5, hours: 12, students: 20 },
  { school: '47-maktab', fullName: 'Nematova Muxlisa Nortojyevna', education: "O'rta maxsus", circleName: 'Oila hamshirasi', catalogId: 'c-tou-03', category: 'science', stavka: 0.5, hours: 12, students: 20 },
  { school: 'markaz', fullName: "O'runova Elyora Ramisovna", education: "O'rta maxsus", circleName: 'Kvilling', catalogId: 'c-cr-04', category: 'career', stavka: 0.5, hours: 24, students: 40 },
  { school: '18-maktab', fullName: "Qo'ziyeva Sanobar Suyunovna", education: "O'rta maxsus", circleName: "Tasviriy san'at", catalogId: 'c-cul-09', category: 'art', stavka: 0.5, hours: 12, students: 20 },
  { school: '89-maktab', fullName: 'Qayimova Dildora Baxtiyor qizi', education: "O'rta maxsus", circleName: 'Oila hamshirasi', catalogId: 'c-tou-03', category: 'science', stavka: 0.5, hours: 12, students: 20 },
  { school: '16-maktab', fullName: 'Rasulova Xursand Qurbonovna', education: "O'rta maxsus", circleName: 'Mayda plastika', catalogId: 'c-cr-02', category: 'career', stavka: 0.5, hours: 12, students: 20 },
  { school: '54-maktab', fullName: "Ro'zimurodova Xadicha Qulmamat qizi", education: 'Oliy', circleName: 'Kvilling', catalogId: 'c-cr-04', category: 'career', stavka: 0.5, hours: 12, students: 20 },
  { school: 'markaz', fullName: "Razzoqova Sanobar Yo'ldoshevna", education: "O'rta maxsus", circleName: "Tasviriy san'at", catalogId: 'c-cul-09', category: 'art', stavka: 0.5, hours: 12, students: 20 },
  { school: '4-maktab', fullName: 'Xushvaqtova Surayyo Saidjon qizi', education: "O'rta maxsus", circleName: 'Mental arifmetika', catalogId: 'c-pr-08', category: 'reading', stavka: 1, hours: 24, students: 40 },
  { school: '16-maktab', fullName: 'Xushvaqtova Komila Xushvaqt qizi', education: 'Oliy', circleName: 'Matematika', catalogId: 'c-pr-05', category: 'reading', stavka: 0.75, hours: 18, students: 30 },
  { school: 'markaz', fullName: 'Obidova Luiza Abduraxmonovna', education: "O'rta maxsus", circleName: 'Tikish-bichish', catalogId: 'c-cr-05b', category: 'career', stavka: 0.5, hours: 12, students: 20 },
  { school: 'markaz', fullName: "Tursunov Anvarjon Rustam o'g'li", education: 'Oliy', circleName: 'Kompyuter dizayn', catalogId: 'c-tech-11', category: 'it', stavka: 0.25, hours: 6, students: 10 },
  { school: '15-maktab', fullName: 'Raxmonova Zuhra Xolmurodovna', education: "O'rta maxsus", circleName: 'Maktabga tayyorlov', catalogId: 'c-pr-09b', category: 'reading', stavka: 0.5, hours: 12, students: 20 },
  { school: 'markaz', fullName: "Nortojiyev Mirjalol Farhod o'g'li", education: 'Oliy', circleName: 'Matematika', catalogId: 'c-pr-05', category: 'reading', stavka: 0.5, hours: 12, students: 20 },
  { school: '65-maktab', fullName: 'Avazova Ozoda Tuxtayevna', education: "O'rta maxsus", circleName: 'Mayda plastika', catalogId: 'c-cr-02', category: 'career', stavka: 0.5, hours: 12, students: 20 },
  { school: '65-maktab', fullName: "Mosheva Ra'no Bekmurodovna", education: "O'rta maxsus", circleName: 'Mayda plastika', catalogId: 'c-cr-02', category: 'career', stavka: 0.5, hours: 12, students: 20 },
  { school: 'markaz', fullName: 'Zulfikarova Oydin Xudayberdiyevna', education: 'Oliy', circleName: 'Mental arifmetika', catalogId: 'c-pr-08', category: 'reading', stavka: 0.5, hours: 12, students: 20 },
  { school: '65-maktab', fullName: "Jumanova Gavhar Ro'zimurodovna", education: "O'rta maxsus", circleName: 'Oila hamshirasi', catalogId: 'c-tou-03', category: 'science', stavka: 0.5, hours: 12, students: 20 },
  { school: '41-maktab', fullName: "Xushvaqtov Normo'min Xushvaqt o'g'li", education: 'Oliy', circleName: 'Geografiya', catalogId: 'c-pr-10', category: 'reading', stavka: 0.5, hours: 12, students: 20 },
  { school: '36-maktab', fullName: 'Abdiyaytova Marvarid Dilshod qizi', education: 'Oliy', circleName: 'Matematika', catalogId: 'c-pr-05', category: 'reading', stavka: 0.5, hours: 12, students: 20 },
  { school: '12-maktab', fullName: "G'afforova Shoira Zokir qizi", education: 'Oliy', circleName: 'Geografiya', catalogId: 'c-pr-10', category: 'reading', stavka: 0.25, hours: 6, students: 10 },
  { school: '58-maktab', fullName: "Xoliyorov Sirojiddin G'ulomovich", education: "O'rta maxsus", circleName: 'Shaxmat-shashka', catalogId: 'c-sp-01', category: 'sport', stavka: 0.5, hours: 12, students: 20 },
  { school: '68-maktab', fullName: 'Baymurodova Hulkar Qahhor qizi', education: "O'rta maxsus", circleName: 'Ingliz tili', catalogId: 'c-lang-01', category: 'language', stavka: 0.5, hours: 12, students: 20 },
  { school: '67-maktab', fullName: 'Shozamonova Guzal Yaxshiboyevna', education: "O'rta maxsus", circleName: 'Ingliz tili', catalogId: 'c-lang-01', category: 'language', stavka: 1, hours: 24, students: 40 },
  { school: '33-maktab', fullName: 'Xoliqova Iroda Solih qizi', education: "O'rta maxsus", circleName: 'Ingliz tili', catalogId: 'c-lang-01', category: 'language', stavka: 0.25, hours: 6, students: 10 },
  { school: '95-maktab', fullName: "Norqulov Nodirbek Alisher o'g'li", education: 'Oliy', circleName: 'Tarix', catalogId: 'c-pr-07', category: 'reading', stavka: 0.25, hours: 6, students: 10 },
  { school: '95-maktab', fullName: "Eshniyazov Elyor Bekmamat o'g'li", education: 'Oliy', circleName: 'Tarix', catalogId: 'c-pr-07', category: 'reading', stavka: 0.25, hours: 6, students: 10 },
  { school: '61-maktab', fullName: 'Kenjayeva Xursand Shavkat qizi', education: 'Oliy', circleName: 'Rus tili', catalogId: 'c-lang-02', category: 'language', stavka: 0.5, hours: 12, students: 20 },
  { school: '83-maktab', fullName: 'Sodiqov Abdukarim Yusufaliyevich', education: 'Oliy', circleName: 'Ingliz tili', catalogId: 'c-lang-01', category: 'language', stavka: 0.25, hours: 6, students: 10 },
];

export const DEPT_CIRCLE_LEADERS = "To'garak rahbarlari";

/** Jadvaldagi kalit → ko‘rinadigan maktab nomi (bir xil format) */
export function formatSchoolName(schoolKey: string): string {
  if (schoolKey === 'markaz') return 'Kelajak Markazi';
  const m = schoolKey.match(/^(\d+)-maktab$/i);
  if (m) return `${m[1]}-son umumta'lim maktabi`;
  return schoolKey;
}

/** Maktab kaliti (76-maktab) — id uchun */
export function schoolKeyFromName(name: string): string | null {
  if (name === 'Kelajak Markazi' || name.toLowerCase() === 'markaz') return 'markaz';
  const m = name.match(/^(\d+)-son/i) || name.match(/^(\d+)-maktab/i);
  return m ? `${m[1]}-maktab` : null;
}

function scheduleFromHours(hours: number, stavka: number) {
  if (hours >= 24 || stavka >= 1) return "Haftada 6 kun · jadval bo'yicha";
  if (hours >= 18) return "Haftada 4–5 kun · jadval bo'yicha";
  if (hours >= 12) return "Haftada 3 kun · jadval bo'yicha";
  return "Haftada 1–2 kun · jadval bo'yicha";
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  const lastName = parts[0] || '';
  const firstName = parts.slice(1).join(' ') || fullName;
  return { lastName, firstName };
}

function slugSchool(school: string) {
  return school.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
}

/** Har bir jadval qatori — alohida guruh (to'garak instansiyasi) */
export function buildLeaderCircles(): Circle[] {
  return officialCircleLeaderRows.map((row, i) => {
    const atCenter = row.school === 'markaz';
    const schoolName = formatSchoolName(row.school);
    const id = `cl-${String(i + 1).padStart(2, '0')}-${slugSchool(row.school)}`;
    const enrolled = row.students;
    const capacity = Math.max(enrolled, Math.round(24 * row.stavka) || 20);
    return {
      id,
      name: row.circleName,
      category: row.category,
      teacher: row.fullName,
      teacherId: `tl${i + 1}`,
      capacity,
      enrolled,
      schedule: scheduleFromHours(row.hours, row.stavka),
      location: schoolName,
      fee: MONTHLY_FEE,
      status: enrolled >= capacity ? 'full' : 'active',
      description: atCenter
        ? `Markazda · ${row.education} · stavka ${row.stavka} · ${row.hours} soat`
        : `Tarmoq · ${schoolName} · ${row.education} · stavka ${row.stavka} · ${row.hours} soat`,
      isNetwork: !atCenter,
      school: atCenter ? undefined : schoolName,
      ageRange: row.circleName === 'Maktabga tayyorlov' ? '5 — 7 yosh' : '6 — 18 yosh',
      progress: Math.min(95, Math.round((enrolled / capacity) * 100)),
    };
  });
}

/** To'garak rahbarlari — o'qituvchi kartochkalari */
export function buildLeaderTeachers(): Teacher[] {
  return officialCircleLeaderRows.map((row, i) => {
    const { lastName, firstName } = splitName(row.fullName);
    const circleId = `cl-${String(i + 1).padStart(2, '0')}-${slugSchool(row.school)}`;
    return {
      id: `tl${i + 1}`,
      fullName: row.fullName,
      firstName,
      lastName,
      specialty: `${row.circleName} rahbari`,
      department: DEPT_CIRCLE_LEADERS,
      orderInfo: `Stavka ${row.stavka} · ${row.hours} soat · ${row.education} · ${formatSchoolName(row.school)}`,
      phone: '—',
      email: '—',
      circleIds: [circleId],
      experience: 0,
      rating: 5,
      isInclusive: false,
      education: row.education,
      stavka: row.stavka,
      weeklyHours: row.hours,
    };
  });
}

/** Faqat tarmoq (maktab) qatorlari */
export function networkLeaderRows() {
  return officialCircleLeaderRows.filter((r) => r.school !== 'markaz');
}

/** Markazdagi qatorlar */
export function centerLeaderRows() {
  return officialCircleLeaderRows.filter((r) => r.school === 'markaz');
}

/**
 * Jadvaldan maktablar ro‘yxati — har bir maktabda nechta to‘garak/o‘quvchi
 * Id: sch-76, sch-18, ...
 */
export function buildOfficialNetworkSchools(districtId = 'd-qamashi'): School[] {
  const map = new Map<string, { networkCircles: number; students: number }>();
  for (const row of networkLeaderRows()) {
    const name = formatSchoolName(row.school);
    const prev = map.get(name) || { networkCircles: 0, students: 0 };
    map.set(name, {
      networkCircles: prev.networkCircles + 1,
      students: prev.students + row.students,
    });
  }
  return [...map.entries()]
    .sort((a, b) => {
      const na = Number(a[0].match(/^(\d+)/)?.[1] || 0);
      const nb = Number(b[0].match(/^(\d+)/)?.[1] || 0);
      return na - nb || a[0].localeCompare(b[0], 'uz');
    })
    .map(([name, s]) => {
      const num = name.match(/^(\d+)/)?.[1] || slugSchool(name);
      return {
        id: `sch-${num}`,
        name,
        address: `Qamashi tumani, ${name}`,
        networkCircles: s.networkCircles,
        students: s.students,
        districtId,
      };
    });
}

/** Jadvaldagi noyob maktab nomlari */
export function leaderSchoolNames(): string[] {
  return buildOfficialNetworkSchools().map((s) => s.name);
}

export const circleLeaderTotals = {
  leaders: officialCircleLeaderRows.length,
  centerGroups: centerLeaderRows().length,
  networkGroups: networkLeaderRows().length,
  students: officialCircleLeaderRows.reduce((s, r) => s + r.students, 0),
  networkStudents: networkLeaderRows().reduce((s, r) => s + r.students, 0),
  centerStudents: centerLeaderRows().reduce((s, r) => s + r.students, 0),
  stavkaSum: officialCircleLeaderRows.reduce((s, r) => s + r.stavka, 0),
  hoursSum: officialCircleLeaderRows.reduce((s, r) => s + r.hours, 0),
  schools: networkLeaderRows().reduce((set, r) => set.add(r.school), new Set<string>()).size,
  asOf: '2026-06',
  source: "Qamashi tumani «Kelajak» markazi to'garak rahbarlari oylik to'lovlari jadvali (iyun 2026)",
};
