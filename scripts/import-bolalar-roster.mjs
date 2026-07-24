/**
 * Bolalar boshqaruvi.xlsx → joriy to'garak rahbarlari guruhlariga biriktirish
 * Eski o'qituvchi ismi e'tiborsiz — faqat fan/to'garak nomi.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { buildLeaderCircles, formatSchoolName } from '../src/data/officialCircleLeaders.ts';
import { officialCircles } from '../src/data/officialCircles.ts';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const xlsxPath = path.join(root, 'src/data/Bolalar-boshqaruvi.xlsx');

function titleCaseUz(s) {
  return s
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function norm(s) {
  return String(s || '')
    .toLowerCase()
    // Kirill lookalike → lotin (OCR / aralash yozuv)
    .replace(/[а]/g, 'a')
    .replace(/[е]/g, 'e')
    .replace(/[о]/g, 'o')
    .replace(/[р]/g, 'p')
    .replace(/[с]/g, 'c')
    .replace(/[у]/g, 'y')
    .replace(/[х]/g, 'x')
    .replace(/[м]/g, 'm')
    .replace(/[т]/g, 't')
    .replace(/[к]/g, 'k')
    .replace(/[в]/g, 'b')
    .replace(/[н]/g, 'h')
    .replace(/[и]/g, 'i')
    .replace(/ё/g, 'е')
    .replace(/тикиш|бичиш/gi, 'tikish')
    .replace(/квиллинг|квилинг/gi, 'kvilling')
    .replace(/[ʼ'`‘’`´]/g, "'")
    .replace(/[ʹʻʼ]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** Guruh satridan fan nomini ajratish (o'qituvchi F.I.SH ni olib tashlash) */
function extractSubject(groupRaw) {
  let g = String(groupRaw || '').trim();
  if (!g) return '';

  if (/maktabga\s*tayyorlov/i.test(g) || /maktbga\s*tayyorlov/i.test(g)) return 'Maktabga tayyorlov';
  if (/turizm\s*va\s*ekologiya/i.test(g)) return 'Turizm va ekologiya';

  // Avval butun satrdan fan kalitini top (chiziqcha buzmasin)
  const labeled = matchSubjectLabel(g);
  if (labeled) return labeled;

  // "O'QITUVCHI - fan" — faqat birinchi ajratgich
  const m = g.match(/^(.+?)\s+[-–—]\s+(.+)$/);
  if (m) {
    const labeled2 = matchSubjectLabel(m[2]);
    if (labeled2) return labeled2;
    return m[2].trim();
  }

  const words = g.split(/\s+/);
  if (words.length >= 4) return words.slice(-2).join(' ');
  return g;
}

function matchSubjectLabel(g) {
  const keys = [
    [/yosh\s*dasturchi/i, 'Yosh dasturchi'],
    [/komp['']?yuter\s*dizayn/i, 'Kompyuter dizayn'],
    [/komp['']?yuter\s*muxandis/i, 'Kompyuter muhandisi'],
    [/mental\s*ar[iyf]+metika|мental\s*ar/i, 'Mental arifmetika'],
    [/mayda\s*pl/i, 'Mayda plastika'],
    [/kvill?ing|kivll|квиллинг|квилинг/i, 'Kvilling'],
    [/to['']?quvchilik/i, "To'quvchilik"],
    [/bichish\s*-?\s*tikish|tikish\s*-?\s*bichish|бичиш|тикиш/i, 'Tikish-bichish'],
    [/oila\s*x?amshir|оила\s*хамшир/i, 'Oila hamshirasi'],
    [/tasviriy|тасвирий/i, "Tasviriy san'at"],
    [/shaxmat|шахмат/i, 'Shaxmat-shashka'],
    [/ingliz|ingiliz/i, 'Ingliz tili'],
    [/rus\s*tili/i, 'Rus tili'],
    [/mat[ei]matika|математика|qiziqarli\s*matem/i, 'Matematika'],
    [/kimyo|кимё/i, 'Kimyo'],
    [/tarix|tartix|тарих/i, 'Tarix'],
    [/biologiya/i, 'Biologiya'],
    [/geograf/i, 'Geografiya'],
    [/floristika|флористика/i, 'Floristika va fauna'],
    [/yosh\s*pazanda|ёш\s*пазанда|pishiriq/i, 'Yosh pazanda'],
    [/ona\s*tili/i, 'Ona tili'],
    [/folklor/i, 'Folklor'],
    [/kurash/i, 'Kurash'],
    [/gim[nk]astika|gimknastika/i, 'Gimnastika'],
    [/avtomodel/i, 'Avtomodel'],
    [/landshaft/i, 'Landshaft dizayn'],
    [/ekodizayn|ekodizayin/i, 'Ekodizayn'],
    [/qul\s*mexnat|qo['']?l\s*mehnat/i, "Qo'l mehnati"],
    [/maktabga\s*tayyorlov|maktbga/i, 'Maktabga tayyorlov'],
  ];
  for (const [re, label] of keys) {
    if (re.test(g)) return label;
  }
  return null;
}

function subjectKey(name) {
  const n = norm(name)
    .replace(/san'?at/g, "san'at")
    .replace(/plstika|plastikia|plastika/g, 'plastika')
    .replace(/arfmiteka|arifmetika/g, 'arifmetika')
    .replace(/matimatika|matemateka/g, 'matematika')
    .replace(/ingiliz/g, 'ingliz')
    .replace(/xamshir/g, 'hamshir')
    .replace(/kvil+ing/g, 'kvilling')
    .replace(/bichish\s*-?\s*tikish|tikish\s*-?\s*bichish/g, 'tikish-bichish')
    .replace(/ш/g, 'sh');

  const aliases = [
    ['yosh dasturchi', ['dasturchi']],
    ['kompyuter dizayn', ['dizayn', "komp'yuter dizayn"]],
    ['mental arifmetika', ['mental']],
    ['mayda plastika', ['plastika']],
    ['kvilling', ['kvill', 'kivll', 'quilling']],
    ["to'quvchilik", ['toquv', "to'quv"]],
    ['tikish-bichish', ['tikish', 'bichish']],
    ['oila hamshirasi', ['hamshir', 'oila']],
    ["tasviriy san'at", ['tasviriy']],
    ['shaxmat-shashka', ['shaxmat', 'shashka']],
    ['ingliz tili', ['ingliz', 'english']],
    ['rus tili', ['rus tili', 'russian']],
    ['matematika', ['matematika', 'math']],
    ['kimyo', ['kimyo', 'chemistry']],
    ['tarix', ['tarix', 'history']],
    ['geografiya', ['geograf']],
    ['maktabga tayyorlov', ['tayyorlov', 'maktabga']],
    ['biologiya', ['biolog']],
    ['floristika va fauna', ['florist', 'fauna']],
    ['avtomodel', ['avtomodel']],
    ['landshaft dizayn', ['landshaft']],
    ['ekodizayn va interyer', ['ekodizayn', 'enternen', 'interner', 'interyer']],
    ['yosh pazanda', ['pazanda', 'pishiriq', 'qandolatchi']],
    ['yosh pazanda va yosh qandolatchi', ['pazanda', 'pishiriq']],
    ["qo'l mehnati", ['mehnat', 'mexnat', 'qul mexnat']],
    ['yosh duradgor, yog\'och o\'ymakorligi', ['duradgor', 'mexnat', 'mehnat']],
    ['gimnastika', ['gimknast']],
    ['badiiy gimnastika', ['gimnast', 'gimknast']],
    ['milliy kurash', ['kurash']],
    ['ona tili', ['ona tili']],
    ['ona tili va adabiyot', ['adabiyot']],
    ['folklor', ['folklor']],
    ['kompyuter muhandisi', ['muxandis', 'muhandis']],
    ['bichish-tikish', ['bichish']],
    ['shaxmat va shashka', ['shashka']],
    ['kompyuter dizayn va grafikasi', ['grafik']],
    ['turizm va ekologiya', ['turizm', 'ekolog']],
  ];

  for (const [canon, list] of aliases) {
    if (n === canon || n.includes(canon) || list.some((a) => n.includes(a))) return canon;
  }
  return n;
}

function excelDate(serial) {
  if (serial == null || serial === '') return undefined;
  if (typeof serial === 'string' && /\d{4}/.test(serial)) return serial;
  const n = Number(serial);
  if (!Number.isFinite(n) || n < 20000) return undefined;
  const utc = Math.round((n - 25569) * 86400 * 1000);
  const d = new Date(utc);
  if (Number.isNaN(d.getTime())) return undefined;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${day}.${m}.${y}`;
}

function ageFromBirth(birth) {
  if (!birth) return 12;
  const m = birth.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (!m) return 12;
  const year = Number(m[3]);
  const age = 2026 - year;
  return age >= 4 && age <= 20 ? age : 12;
}

function gradeFromAge(age) {
  return Math.min(11, Math.max(1, age - 6));
}

function splitName(full) {
  const cleaned = titleCaseUz(
    String(full)
      .replace(/[`] /g, "'")
      .replace(/`/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
  );
  const parts = cleaned.split(' ').filter(Boolean);
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  const lastName = parts[parts.length - 1];
  const firstName = parts.slice(0, -1).join(' ');
  return { firstName, lastName };
}

function formatPhone(raw, i) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length >= 9) {
    const d = digits.startsWith('998') ? digits.slice(0, 12) : `998${digits.slice(-9)}`;
    return `+${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10, 12)}`.trim();
  }
  const n = String(910000000 + (i % 8999999)).padStart(9, '0');
  return `+998 ${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5, 7)} ${n.slice(7, 9)}`;
}

function parentName(lastName, firstName) {
  const given = firstName.split(' ')[0] || lastName;
  return `${lastName} oilasi (${given})`;
}

const leaders = buildLeaderCircles();
/** Avval joriy rahbarlar, keyin katalog (ketgan o'qituvchi fanlari uchun) */
const assignable = [
  ...leaders,
  ...officialCircles.filter((c) => !c.id.startsWith('cl-')),
];
const bySubject = new Map();
for (const c of assignable) {
  const k = subjectKey(c.name);
  if (!bySubject.has(k)) bySubject.set(k, []);
  const list = bySubject.get(k);
  // Bir xil id takrorlanmasin
  if (!list.some((x) => x.id === c.id)) list.push(c);
}

function pickPool(sk) {
  const fallback = {
    "qo'l mehnati": 'mayda plastika',
    pishiriqlar: 'yosh pazanda',
    gimnastika: 'badiiy gimnastika',
    kurash: 'milliy kurash',
    ekodizayn: 'ekodizayn va interyer',
    kviling: 'kvilling',
  };
  const keys = [sk, fallback[sk]].filter(Boolean);
  // Bir xil ma'noli kalitlarni ham tekshir
  if (sk.includes('pazanda') || sk.includes('pishiriq')) keys.push('yosh pazanda', 'yosh pazanda va yosh qandolatchi');
  if (sk.includes('ona tili') || sk.includes('adabiyot')) keys.push('ona tili', 'ona tili va adabiyot');
  if (sk.includes('shaxmat')) keys.push('shaxmat-shashka', 'shaxmat va shashka');
  if (sk.includes('dizayn') && sk.includes('kompyuter')) keys.push('kompyuter dizayn', 'kompyuter dizayn va grafikasi');
  if (sk.includes('tikish') || sk.includes('bichish')) keys.push('tikish-bichish', 'bichish-tikish');
  if (sk.includes('gimnast')) keys.push('badiiy gimnastika', 'gimnastika');
  if (sk.includes('kurash')) keys.push('milliy kurash');

  let pool = [];
  for (const k of keys) {
    const hit = bySubject.get(k);
    if (hit?.length) pool = pool.concat(hit);
  }
  // unique
  const seen = new Set();
  pool = pool.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)));
  const leaderPool = pool.filter((c) => c.id.startsWith('cl-'));
  return leaderPool.length > 0 ? leaderPool : pool;
}

const wb = XLSX.readFile(xlsxPath);
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' });

const students = [];
const unmatched = [];
const rr = new Map(); // subject -> next index
const assignedByCircle = new Map();

for (let i = 4; i < rows.length; i++) {
  const r = rows[i];
  const fullName = String(r[3] || '').trim();
  const group = String(r[5] || r[9] || '').trim();
  const phone = r[11];
  const birth = excelDate(r[12]);
  const externalId = r[2];
  if (!fullName) continue;

  const subject = extractSubject(group);
  const sk = subjectKey(subject);
  const pool = pickPool(sk);

  if (!pool || pool.length === 0) {
    unmatched.push({ fullName, group, subject, sk });
    continue;
  }

  const idx = rr.get(sk) || 0;
  const circle = pool[idx % pool.length];
  rr.set(sk, idx + 1);
  assignedByCircle.set(circle.id, (assignedByCircle.get(circle.id) || 0) + 1);

  const { firstName, lastName } = splitName(fullName);
  const age = ageFromBirth(birth);
  const school = circle.isNetwork
    ? circle.school && circle.school !== 'Tuman maktablari'
      ? circle.school
      : 'Tuman maktablari'
    : 'Kelajak Markazi';

  students.push({
    id: `rs${String(students.length + 1).padStart(4, '0')}`,
    externalId: externalId ? String(externalId) : undefined,
    firstName,
    lastName,
    age,
    school,
    grade: gradeFromAge(age),
    parentName: parentName(lastName, firstName),
    parentPhone: formatPhone(phone, students.length),
    circleIds: [circle.id],
    status: 'active',
    enrolledAt: '2025-09-15',
    achievements: 0,
    districtId: 'd-qamashi',
    birthDate: birth,
    rosterSubject: subject,
    rosterGroup: group,
  });
}

// enrolled yangilash uchun map
const enrolledPatch = Object.fromEntries(assignedByCircle);

const outTs = `/**
 * Avto-generatsiya: scripts/import-bolalar-roster.mjs
 * Manba: Bolalar boshqaruvi.xlsx
 * Eski o'qituvchilar e'tiborsiz — joriy to'garak rahbarlari guruhlariga biriktirilgan.
 */
import type { Student } from '../types';

export type ImportedStudent = Student & {
  externalId?: string;
  birthDate?: string;
  rosterSubject?: string;
  rosterGroup?: string;
};

export const officialStudents: ImportedStudent[] = ${JSON.stringify(students, null, 2)};

export const studentImportMeta = {
  source: 'Bolalar boshqaruvi.xlsx',
  importedAt: ${JSON.stringify(new Date().toISOString().slice(0, 10))},
  totalRows: ${students.length + unmatched.length},
  assigned: ${students.length},
  unmatched: ${unmatched.length},
  enrolledByCircle: ${JSON.stringify(enrolledPatch, null, 2)},
  unmatchedSubjects: ${JSON.stringify(
    [...unmatched.reduce((m, u) => m.set(u.sk || u.subject, (m.get(u.sk || u.subject) || 0) + 1), new Map())].sort(
      (a, b) => b[1] - a[1]
    ),
    null,
    2
  )},
};
`;

const outPath = path.join(root, 'src/data/officialStudents.ts');
fs.writeFileSync(outPath, outTs, 'utf8');

const reportPath = path.join(root, 'src/data/student-import-report.json');
fs.writeFileSync(
  reportPath,
  JSON.stringify(
    {
      assigned: students.length,
      unmatched: unmatched.length,
      byCircle: Object.fromEntries(
        [...assignedByCircle.entries()].map(([id, n]) => {
          const c = assignable.find((x) => x.id === id);
          return [id, { n, name: c?.name, teacher: c?.teacher, school: c?.school || c?.location }];
        })
      ),
      unmatchedSample: unmatched.slice(0, 30),
      unmatchedBySubject: [...unmatched.reduce((m, u) => m.set(u.subject, (m.get(u.subject) || 0) + 1), new Map())].sort(
        (a, b) => b[1] - a[1]
      ),
    },
    null,
    2
  ),
  'utf8'
);

console.log('Assigned', students.length);
console.log('Unmatched', unmatched.length);
console.log('Wrote', outPath);
console.log('Unmatched subjects:');
[...unmatched.reduce((m, u) => m.set(u.subject, (m.get(u.subject) || 0) + 1), new Map())]
  .sort((a, b) => b[1] - a[1])
  .forEach(([s, n]) => console.log(n, s));
