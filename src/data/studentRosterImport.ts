import type { Circle, Student } from '../types';
import { formatSchoolName, networkLeaderRows, officialCircleLeaderRows } from './officialCircleLeaders';

/**
 * Yil boshidagi o'quvchilar ro'yxati → joriy to'garak rahbarlari guruhlariga biriktirish.
 * Eski (ketgan) o'qituvchi ismi e'tiborga olinmaydi — faqat to'garak nomi (+ ixtiyoriy maktab).
 *
 * Manba fayl: src/data/studentRoster.csv
 * Ustunlar: fullName, birthDate, gender, school, grade, circleName, teacherOld, phone
 */

export type RosterRow = {
  fullName: string;
  birthDate?: string;
  gender?: string;
  school?: string;
  grade?: string | number;
  circleName: string;
  /** Jadvaldagi eski rahbar — moslashtirishda ishlatilmaydi */
  teacherOld?: string;
  phone?: string;
};

const CIRCLE_ALIASES: Record<string, string[]> = {
  'yosh dasturchi': ['dasturchi', 'programming', 'frontend', 'backend'],
  'kompyuter dizayn': ['dizayn', 'design', 'kompyuter dizayni'],
  'mental arifmetika': ['mental', 'arifmetika'],
  "tasviriy san'at": ['tasviriy', 'sanat', "san'at"],
  'mayda plastika': ['plastika'],
  "to'quvchilik": ['toquv', "to'quv"],
  'tikish-bichish': ['tikish', 'bichish'],
  'oila hamshirasi': ['hamshira', 'oila'],
  'maktabga tayyorlov': ['tayyorlov', 'maktabga'],
  'shaxmat-shashka': ['shaxmat', 'shashka'],
  'ingliz tili': ['ingliz', 'english'],
  'rus tili': ['rus', 'russian'],
  geografiya: ['geograf'],
  matematika: ['math'],
  kimyo: ['chemistry'],
  tarix: ['history'],
  kvilling: ['quilling'],
};

function norm(s: string) {
  return s
    .toLowerCase()
    .replace(/[ʼ'`‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function circleKey(name: string) {
  const n = norm(name);
  for (const [canon, aliases] of Object.entries(CIRCLE_ALIASES)) {
    if (n === canon || n.includes(canon) || aliases.some((a) => n.includes(a))) return canon;
  }
  return n;
}

function parseSchoolKey(raw?: string): string | null {
  if (!raw) return null;
  const t = norm(raw);
  if (t.includes('markaz')) return 'markaz';
  const m = t.match(/(\d+)/);
  return m ? `${m[1]}-maktab` : null;
}

function ageFromBirth(birthDate?: string, fallbackGrade?: number): number {
  if (birthDate) {
    const m = birthDate.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/) || birthDate.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
    if (m) {
      const year = m[1].length === 4 ? Number(m[1]) : Number(m[3]);
      if (year > 1990 && year < 2025) {
        const age = 2026 - year;
        if (age >= 5 && age <= 20) return age;
      }
    }
  }
  if (fallbackGrade && fallbackGrade >= 1 && fallbackGrade <= 11) return fallbackGrade + 6;
  return 12;
}

function splitFullName(fullName: string): { lastName: string; firstName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { lastName: 'Noma’lum', firstName: 'O‘quvchi' };
  if (parts.length === 1) return { lastName: parts[0], firstName: parts[0] };
  return { lastName: parts[0], firstName: parts.slice(1).join(' ') };
}

function parentFromStudent(lastName: string, firstName: string, gender?: string) {
  const g = norm(gender || '');
  const isGirl = g.startsWith('q') || g.includes('ayol') || g.includes('qiz');
  const parentName = isGirl ? `${lastName} otasi/onasi` : `${lastName} ota-onasi`;
  return parentName.replace('ota-onasi', firstName ? `${lastName} ota-onasi` : 'Ota-ona');
}

function formatPhone(raw?: string, index = 0): string {
  const digits = (raw || '').replace(/\D/g, '');
  if (digits.length >= 9) {
    const d = digits.startsWith('998') ? digits.slice(0, 12) : `998${digits.slice(-9)}`;
    return `+${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10, 12)}`.trim();
  }
  // Jadvalda telefon bo‘lmasa — unique placeholder (login uchun keyin yangilanadi)
  const n = String(900000000 + (index % 89999999)).padStart(9, '0');
  return `+998 ${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5, 7)} ${n.slice(7, 9)}`;
}

function parseGrade(raw?: string | number): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) return Math.min(11, Math.max(1, raw));
  if (!raw) return 6;
  const m = String(raw).match(/(\d+)/);
  return m ? Math.min(11, Math.max(1, Number(m[1]))) : 6;
}

/** Joriy leader guruhlariga moslash: eski o'qituvchi e'tiborsiz */
export function matchRosterToCircle(
  row: RosterRow,
  leaderCircles: Circle[]
): Circle | undefined {
  const wantKey = circleKey(row.circleName);
  const schoolKey = parseSchoolKey(row.school);

  const sameName = leaderCircles.filter((c) => circleKey(c.name) === wantKey);
  if (sameName.length === 0) {
    // yumshoq: katalog nomiga qisman mos
    const soft = leaderCircles.filter((c) => {
      const ck = circleKey(c.name);
      return ck.includes(wantKey) || wantKey.includes(ck);
    });
    if (soft.length === 1) return soft[0];
    if (soft.length === 0) return undefined;
    return pickBySchool(soft, schoolKey);
  }
  if (sameName.length === 1) return sameName[0];
  return pickBySchool(sameName, schoolKey);
}

function pickBySchool(candidates: Circle[], schoolKey: string | null): Circle {
  if (!schoolKey) {
    // Markazni afzal ko‘ramiz, yo‘q bo‘lsa eng kam to‘lgan
    const center = candidates.find((c) => !c.isNetwork);
    return center || candidates[0];
  }
  if (schoolKey === 'markaz') {
    return candidates.find((c) => !c.isNetwork) || candidates[0];
  }
  const label = formatSchoolName(schoolKey);
  const hit =
    candidates.find((c) => c.school === label || c.location === label) ||
    candidates.find((c) => (c.school || c.location || '').includes(schoolKey.replace('-maktab', '')));
  return hit || candidates.find((c) => c.isNetwork) || candidates[0];
}

/** Roster qatorlaridan Student[] — faqat joriy guruhlarga tushganlari */
export function buildStudentsFromRoster(
  rows: RosterRow[],
  leaderCircles: Circle[],
  districtId = 'd-qamashi'
): { students: Student[]; unmatched: RosterRow[]; assignedByCircle: Record<string, number> } {
  const students: Student[] = [];
  const unmatched: RosterRow[] = [];
  const assignedByCircle: Record<string, number> = {};
  const seats = new Map(leaderCircles.map((c) => [c.id, c.enrolled || c.capacity || 20]));

  rows.forEach((row, i) => {
    if (!row.fullName?.trim() || !row.circleName?.trim()) {
      unmatched.push(row);
      return;
    }
    const circle = matchRosterToCircle(row, leaderCircles);
    if (!circle) {
      unmatched.push(row);
      return;
    }
    const left = seats.get(circle.id) ?? 20;
    // Sig‘imdan oshsa ham biriktiramiz (yil boshidan ro‘yxat), lekin sanaymiz
    seats.set(circle.id, left - 1);
    assignedByCircle[circle.id] = (assignedByCircle[circle.id] || 0) + 1;

    const { lastName, firstName } = splitFullName(row.fullName);
    const grade = parseGrade(row.grade);
    const age = ageFromBirth(row.birthDate, grade);
    const schoolLabel =
      parseSchoolKey(row.school) === 'markaz'
        ? 'Kelajak Markazi'
        : row.school
          ? formatSchoolName(parseSchoolKey(row.school) || row.school)
          : circle.school || circle.location || '—';

    students.push({
      id: `rs${String(i + 1).padStart(4, '0')}`,
      firstName,
      lastName,
      age,
      school: schoolLabel,
      grade,
      parentName: parentFromStudent(lastName, firstName, row.gender),
      parentPhone: formatPhone(row.phone, i),
      circleIds: [circle.id],
      status: 'active',
      enrolledAt: '2025-09-15',
      achievements: 0,
      districtId,
    });
  });

  return { students, unmatched, assignedByCircle };
}

/** CSV parse (vergul yoki nuqta-vergul) */
export function parseRosterCsv(text: string): RosterRow[] {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const sep = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(sep).map((h) => norm(h).replace(/\s/g, ''));

  const idx = (...names: string[]) => {
    for (const n of names) {
      const i = headers.findIndex((h) => h.includes(n));
      if (i >= 0) return i;
    }
    return -1;
  };

  const iName = idx('fullname', 'fio', 'fish', "to'liqism", 'ism');
  const iBirth = idx('tug', 'birth', 'yil');
  const iGender = idx('jins', 'gender');
  const iSchool = idx('maktab', 'school');
  const iGrade = idx('sinf', 'grade');
  const iCircle = idx("to'garak", 'togarak', 'circle', 'fan');
  const iTeacher = idx('rahbar', 'teacher', "o'qituv");
  const iPhone = idx('telefon', 'phone', 'tel');

  const col = (cols: string[], i: number) => (i >= 0 ? (cols[i] || '').trim() : '');

  return lines.slice(1).map((line) => {
    const cols = line.split(sep).map((c) => c.replace(/^"|"$/g, '').trim());
    return {
      fullName: col(cols, iName),
      birthDate: col(cols, iBirth) || undefined,
      gender: col(cols, iGender) || undefined,
      school: col(cols, iSchool) || undefined,
      grade: col(cols, iGrade) || undefined,
      circleName: col(cols, iCircle),
      teacherOld: col(cols, iTeacher) || undefined,
      phone: col(cols, iPhone) || undefined,
    };
  });
}

/** Jadval bo‘yicha faol guruhlarning o‘quvchi kvotalari (tekshiruv) */
export function expectedSeatsFromLeaders() {
  return officialCircleLeaderRows.map((r, i) => ({
    index: i + 1,
    school: formatSchoolName(r.school),
    circle: r.circleName,
    teacher: r.fullName,
    seats: r.students,
  }));
}

export function networkSchoolKeys() {
  return [...new Set(networkLeaderRows().map((r) => r.school))];
}
