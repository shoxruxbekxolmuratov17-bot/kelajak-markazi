import type { Circle, CircleCategory } from '../types.js';
import { MONTHLY_FEE } from '../types.js';
import {
  buildLeaderCircles,
  circleLeaderTotals,
  officialCircleLeaderRows,
} from './officialCircleLeaders.js';

/**
 * Qamashi tuman «Kelajak» markazi — katalog to'garaklar + iyun 2026 rahbarlar guruhlari
 * Manba katalog: 15.02.2025 · Manba guruhlar: oylik to'lov jadvali (iyun 2026)
 */

type Stats = {
  clubs: number;
  groups: number;
  students: number;
  girls: number;
  networkClubs: number;
  networkStudents: number;
};

function makeCircle(
  id: string,
  name: string,
  category: CircleCategory,
  stats: Stats | null,
  opts?: { description?: string; ageRange?: string }
): Circle {
  const enrolled = stats?.students ?? 0;
  const groups = stats?.groups ?? 0;
  const capacity = Math.max(enrolled, groups * 10, 20);
  const network = (stats?.networkClubs ?? 0) > 0;
  const hasStudents = enrolled > 0;
  // Markaz to'garaklari — o'quvchi 0 bo'lsa ham ochiq (ota-onalar yozilishi mumkin)
  const status = enrolled >= capacity ? 'full' : 'active';

  return {
    id,
    name,
    category,
    teacher: hasStudents ? 'Markaz murabbiysi' : 'Tayinlanmagan',
    teacherId: hasStudents ? 't1' : '',
    capacity,
    enrolled,
    schedule: hasStudents ? 'Haftalik jadval bo\'yicha' : 'Rejalashtirilgan',
    location: network ? 'Tarmoq / maktab' : 'Kelajak Markazi',
    fee: MONTHLY_FEE,
    status,
    description:
      opts?.description ||
      (stats
        ? `${stats.groups} guruh · ${stats.students} o'quvchi` +
          (stats.girls ? ` (qizlar: ${stats.girls})` : '') +
          (stats.networkClubs
            ? ` · tarmoq: ${stats.networkClubs} to'garak, ${stats.networkStudents} o'quvchi`
            : '')
        : 'Hozircha o\'quvchilar ro\'yxatga olinmagan — yo\'nalish ochiq'),
    isNetwork: network,
    school: network ? 'Tuman maktablari' : undefined,
    ageRange: opts?.ageRange || '6 — 18 yosh',
    progress: hasStudents ? Math.min(95, Math.round((enrolled / capacity) * 100)) : 0,
  };
}

/** Madaniyat va san'at */
const culture: Circle[] = [
  makeCircle('c-cul-01', 'Folklor', 'art', { clubs: 2, groups: 4, students: 40, girls: 25, networkClubs: 2, networkStudents: 40 }),
  makeCircle('c-cul-02', 'Yosh doirachilar', 'art', null),
  makeCircle('c-cul-03', 'Milliy va jahon raqslari', 'art', null),
  makeCircle('c-cul-04', 'Fortepiano ijrochisi', 'art', null),
  makeCircle('c-cul-05', 'Estrada-vokal', 'art', null),
  makeCircle('c-cul-06', "Qo'g'irchoq teatri", 'art', null),
  makeCircle('c-cul-07', 'Rejissorlik, jurnalistika va notiqlik', 'art', null),
  makeCircle('c-cul-08', 'Teatr olamiga sayohat', 'art', null),
  makeCircle('c-cul-09', "Tasviriy san'at", 'art', { clubs: 4, groups: 8, students: 80, girls: 45, networkClubs: 3, networkStudents: 60 }),
  makeCircle('c-cul-10', 'Liboslar dizayni', 'art', null),
  makeCircle('c-cul-11', 'Yosh baxshilar', 'art', null),
  makeCircle('c-cul-12', "Yosh qalamkash (nazm, nasr, dramaturgiya)", 'art', null),
  makeCircle('c-cul-13', "O'zbek milliy va jahon musiqa asboblarini chalish", 'art', null),
];

/** Texnika, konstruktorlik va modellashtirish */
const tech: Circle[] = [
  makeCircle('c-tech-01', 'Konstruksiya (LEGO)', 'it', null),
  makeCircle('c-tech-02', 'Avtomodel', 'it', null),
  makeCircle('c-tech-03', 'Kubik rubik', 'it', null),
  makeCircle('c-tech-04', 'Aviamodel', 'it', null),
  makeCircle('c-tech-05', 'Radiotehnika, elektronika va aloqa', 'it', null),
  makeCircle('c-tech-06', 'Robototehnika va konstruktorlik', 'it', null),
  makeCircle('c-tech-07', 'Robototehnika, Lego Mindstorms', 'it', null),
  makeCircle('c-tech-08', 'Yosh dasturchi (Scratch, Python)', 'it', null),
  makeCircle('c-tech-09', 'Yosh dasturchi (Java, Unity 3D modellash)', 'it', null),
  makeCircle('c-tech-10', 'Kompyuter muhandisi', 'it', null),
  makeCircle('c-tech-11', 'Kompyuter dizayn va grafikasi', 'it', {
    clubs: 1, groups: 3, students: 30, girls: 22, networkClubs: 1, networkStudents: 30,
  }),
  makeCircle('c-tech-12', 'Kompyuter laboratoriyasi', 'it', null),
  makeCircle('c-tech-13', 'Yosh fotohavaskor', 'it', null),
  makeCircle('c-tech-14', 'Yosh arxitektor', 'it', null),
  makeCircle('c-tech-15', 'Kibersport', 'it', null),
  makeCircle('c-tech-16', 'Yosh dasturchi (Frontend-Backend)', 'it', {
    clubs: 2, groups: 6, students: 60, girls: 35, networkClubs: 2, networkStudents: 60,
  }),
  makeCircle('c-tech-17', 'Yosh dasturchi (C++, C#)', 'it', null),
  makeCircle('c-tech-18', 'Yosh kino-videohavaskor', 'it', null),
  makeCircle('c-tech-19', 'Raketamodel', 'it', null),
  makeCircle('c-tech-20', 'Kemasozlik', 'it', null),
];

/** Jismoniy tarbiya va sport */
const sport: Circle[] = [
  makeCircle('c-sp-01', 'Shaxmat va shashka', 'sport', {
    clubs: 4, groups: 10, students: 100, girls: 45, networkClubs: 4, networkStudents: 100,
  }),
  makeCircle('c-sp-02', 'Badiiy gimnastika', 'sport', null),
  makeCircle('c-sp-03', 'Stol tennisi', 'sport', null),
  makeCircle('c-sp-04', 'Taekvondo', 'sport', null),
  makeCircle('c-sp-05', 'Karate', 'sport', null),
  makeCircle('c-sp-06', 'Milliy kurash', 'sport', null),
  makeCircle('c-sp-07', 'Boks', 'sport', null),
  makeCircle('c-sp-08', 'Mini futbol', 'sport', null),
  makeCircle('c-sp-09', 'Voleybol', 'sport', null),
  makeCircle('c-sp-10', 'Badminton', 'sport', null),
];

/** Hunarmandchilik va qo'l mehnati */
const craft: Circle[] = [
  makeCircle('c-cr-01', 'Kulolchilik', 'career', null),
  makeCircle('c-cr-02', 'Mayda plastika', 'career', {
    clubs: 4, groups: 11, students: 110, girls: 70, networkClubs: 4, networkStudents: 110,
  }),
  makeCircle('c-cr-03', "Yosh duradgor, yog'och o'ymakorligi", 'career', null),
  makeCircle('c-cr-04', 'Kvilling', 'career', {
    clubs: 4, groups: 10, students: 100, girls: 55, networkClubs: 3, networkStudents: 60,
  }),
  makeCircle('c-cr-05', 'Bichish-tikish', 'career', {
    clubs: 1, groups: 2, students: 20, girls: 20, networkClubs: 0, networkStudents: 0,
  }),
  makeCircle('c-cr-05b', 'Tikish-bichish', 'career', {
    clubs: 2, groups: 2, students: 40, girls: 40, networkClubs: 0, networkStudents: 0,
  }),
  makeCircle('c-cr-06', "Yumshoq o'yinchoqlar, to'qish, kashtachilik", 'career', {
    clubs: 3, groups: 6, students: 60, girls: 60, networkClubs: 3, networkStudents: 60,
  }),
  makeCircle('c-cr-06b', "To'quvchilik", 'career', {
    clubs: 1, groups: 1, students: 20, girls: 20, networkClubs: 1, networkStudents: 20,
  }),
  makeCircle('c-cr-07', 'Munchoqli bezak', 'career', null),
  makeCircle('c-cr-08', "Gilamdo'zlik, zardo'zlik, do'ppido'zlik", 'career', null),
  makeCircle('c-cr-09', 'Yosh pazanda va yosh qandolatchi', 'career', {
    clubs: 3, groups: 8, students: 80, girls: 70, networkClubs: 3, networkStudents: 80,
  }),
  makeCircle('c-cr-10', 'Zargarlik', 'career', null),
  makeCircle('c-cr-11', "Sartaroshlik san'ati", 'career', null),
  makeCircle('c-cr-12', 'Charm buyumlar tikish', 'career', null),
  makeCircle('c-cr-13', 'Elektr payvandlovchi', 'career', null),
  makeCircle('c-cr-14', 'Santexnik', 'career', null),
  makeCircle('c-cr-15', 'Mashina ustasi', 'career', null),
];

/** Turizm va ekologiya */
const tourism: Circle[] = [
  makeCircle('c-tou-01', "Yosh o'lkashunos va sayyoh, yosh ekskursavod", 'science', null),
  makeCircle('c-tou-02', 'Yosh ekolog va tabiatshunos', 'science', null),
  makeCircle('c-tou-03', 'Oila hamshirasi', 'science', {
    clubs: 3, groups: 9, students: 90, girls: 80, networkClubs: 3, networkStudents: 90,
  }),
  makeCircle('c-tou-04', 'Floristika va fauna', 'science', {
    clubs: 1, groups: 4, students: 40, girls: 20, networkClubs: 0, networkStudents: 0,
  }),
  makeCircle('c-tou-05', 'Karving', 'science', null),
  makeCircle('c-tou-06', 'Landshaft dizayn', 'science', {
    clubs: 1, groups: 3, students: 30, girls: 0, networkClubs: 1, networkStudents: 30,
  }),
  makeCircle('c-tou-07', 'Ekodizayn va interyer', 'science', {
    clubs: 2, groups: 6, students: 60, girls: 35, networkClubs: 2, networkStudents: 60,
  }),
  makeCircle('c-tou-08', 'Asalarichilik', 'science', null),
  makeCircle('c-tou-09', 'Issiqxonachilik', 'science', null),
];

/** Oliy ta'lim va maktabga tayyorlov */
const prep: Circle[] = [
  makeCircle('c-pr-01', 'Ona tili va adabiyot', 'reading', {
    clubs: 4, groups: 10, students: 100, girls: 45, networkClubs: 3, networkStudents: 80,
  }),
  makeCircle('c-pr-02', 'Biologiya', 'reading', {
    clubs: 1, groups: 2, students: 20, girls: 10, networkClubs: 0, networkStudents: 0,
  }),
  makeCircle('c-pr-03', 'Kimyo', 'reading', {
    clubs: 4, groups: 9, students: 90, girls: 40, networkClubs: 1, networkStudents: 20,
  }),
  makeCircle('c-pr-04', 'Fizika', 'reading', null),
  makeCircle('c-pr-05', 'Matematika', 'reading', {
    clubs: 4, groups: 13, students: 130, girls: 40, networkClubs: 4, networkStudents: 130,
  }),
  makeCircle('c-pr-06', 'Davlat huquq asoslari', 'reading', null),
  makeCircle('c-pr-07', 'Tarix', 'reading', {
    clubs: 3, groups: 7, students: 70, girls: 40, networkClubs: 3, networkStudents: 70,
  }),
  makeCircle('c-pr-08', 'Mental arifmetika', 'reading', {
    clubs: 1, groups: 4, students: 40, girls: 20, networkClubs: 1, networkStudents: 40,
  }),
  makeCircle('c-pr-09', "Logika, o'yinli matematika, husnixat, o'qish, tasviriy san'at, teatr va raqs", 'reading', {
    clubs: 1, groups: 2, students: 20, girls: 13, networkClubs: 1, networkStudents: 20,
  }),
  makeCircle('c-pr-09b', 'Maktabga tayyorlov', 'reading', {
    clubs: 1, groups: 1, students: 20, girls: 10, networkClubs: 1, networkStudents: 20,
  }),
  makeCircle('c-pr-10', 'Geografiya', 'reading', {
    clubs: 2, groups: 2, students: 30, girls: 15, networkClubs: 2, networkStudents: 30,
  }),
];

/** Xorijiy tillar */
const languages: Circle[] = [
  makeCircle('c-lang-01', 'Ingliz tili', 'language', {
    clubs: 1, groups: 4, students: 40, girls: 15, networkClubs: 0, networkStudents: 0,
  }),
  makeCircle('c-lang-02', 'Rus tili', 'language', {
    clubs: 1, groups: 1, students: 20, girls: 10, networkClubs: 1, networkStudents: 20,
  }),
  makeCircle('c-lang-03', 'Chet tillari', 'language', null),
];

/** Katalog yo'nalishlari + iyun 2026 to'garak rahbarlari guruhlari */
const catalogCircles = [
  ...culture,
  ...tech,
  ...sport,
  ...craft,
  ...tourism,
  ...prep,
  ...languages,
];

/** Rahbarlar jadvalidagi faol guruhlar — ustuvor (haqiqiy o'qituvchi + maktab) */
const leaderGroups = buildLeaderCircles();

/** Katalogdagi yo'nalishlar — jadvalda guruh borlari dublikat sifatida yashirinadi */
const leaderCatalogIds = new Set(officialCircleLeaderRows.map((r) => r.catalogId));

export const officialCircles: Circle[] = [
  ...leaderGroups,
  ...catalogCircles.filter((c) => !(leaderCatalogIds.has(c.id) && c.enrolled > 0)),
].sort((a, b) => {
  if ((b.enrolled > 0) !== (a.enrolled > 0)) return b.enrolled > 0 ? 1 : -1;
  if (b.enrolled !== a.enrolled) return b.enrolled - a.enrolled;
  return a.name.localeCompare(b.name, 'uz');
});

/** Jadvaldagi umumiy ko'rsatkichlar (tekshiruv) */
export const officialTotals = {
  namedClubs: catalogCircles.length,
  activeClubs: leaderGroups.length,
  groups: leaderGroups.length,
  students: circleLeaderTotals.students,
  girls: 0,
  networkClubs: leaderGroups.filter((c) => c.isNetwork).length,
  networkStudents: leaderGroups.filter((c) => c.isNetwork).reduce((s, c) => s + c.enrolled, 0),
  asOf: circleLeaderTotals.asOf,
  source: circleLeaderTotals.source,
  catalogAsOf: '2025-02-15',
};

export const officialCategoryStats = [
  { key: 'art' as CircleCategory, name: "Madaniyat va san'at", clubs: 6, students: 120 },
  { key: 'it' as CircleCategory, name: 'Texnika va modellashtirish', clubs: 3, students: 90 },
  { key: 'sport' as CircleCategory, name: 'Jismoniy tarbiya va sport', clubs: 4, students: 100 },
  { key: 'career' as CircleCategory, name: "Hunarmandchilik va qo'l mehnati", clubs: 15, students: 370 },
  { key: 'science' as CircleCategory, name: 'Turizm va ekologiya', clubs: 7, students: 220 },
  { key: 'reading' as CircleCategory, name: "OTM va maktabga tayyorlov", clubs: 18, students: 470 },
  { key: 'language' as CircleCategory, name: 'Xorijiy tillar', clubs: 1, students: 40 },
];
