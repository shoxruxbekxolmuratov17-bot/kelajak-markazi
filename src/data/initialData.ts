import type {
  Circle,
  Student,
  Teacher,
  Payment,
  Project,
  ScheduleItem,
  Message,
  School,
} from '../types';
import { MONTHLY_FEE, CATEGORY_COLORS } from '../types';
import { officialCircles, officialCategoryStats, officialTotals } from './officialCircles';
import { officialStaff, staffByCategory, DIRECTOR_FULL_NAME } from './officialStaff';
import {
  buildLeaderTeachers,
  buildOfficialNetworkSchools,
  buildLeaderCircles,
} from './officialCircleLeaders';
import { officialStudents, studentImportMeta } from './officialStudents';

export { officialTotals, officialCategoryStats, officialStaff, DIRECTOR_FULL_NAME, studentImportMeta };

function toStudent(s: (typeof officialStudents)[number]): Student {
  const { externalId: _e, birthDate: _b, rosterSubject: _rs, rosterGroup: _rg, ...rest } = s;
  return rest;
}

export const centerInfo = {
  name: 'Kelajak Markazi',
  district: 'Qamashi tumani',
  region: 'Qashqadaryo viloyati',
  address: "Qamashi tumani, markaziy ko'cha",
  phone: '+998 (75) 123-45-67',
  email: 'kelajak.qamashi@edu.uz',
  director: DIRECTOR_FULL_NAME,
  workingHours: 'Dushanba — Juma, 08:00 — 18:00',
  seasonStart: '15-sentabr',
  seasonEnd: '25-may',
  ageRange: '6 — 18 yosh',
  group: 'II guruh',
  monthlyFee: MONTHLY_FEE,
  namedClubs: officialTotals.activeClubs,
  totalStudents: studentImportMeta.assigned,
  asOf: studentImportMeta.importedAt,
};

export const demoUsers: import('../types').AuthUser[] = [
  { id: 'u0', username: 'superadmin', fullName: 'Qashqadaryo viloyat admini', role: 'superadmin', regionId: 'r-qashqadaryo' },
  { id: 'u1', username: 'admin', fullName: DIRECTOR_FULL_NAME, role: 'district_admin', teacherId: 'st1', districtId: 'd-qamashi', regionId: 'r-qashqadaryo' },
  // Joriy to'garak rahbarlari (tl*) — o'quvchilar shu guruhlarga biriktirilgan
  { id: 'u2', username: 'shoira.b', fullName: 'Jabborova Muqaddas Baxriddinovna', role: 'teacher', teacherId: 'tl3', districtId: 'd-qamashi', regionId: 'r-qashqadaryo' },
  { id: 'u3', username: 'baxriddin.x', fullName: 'Rasulova Xursand Qurbonovna', role: 'teacher', teacherId: 'tl10', districtId: 'd-qamashi', regionId: 'r-qashqadaryo' },
];

export const demoPasswords: Record<string, string> = {
  superadmin: 'super123',
  admin: 'admin123',
  'shoira.b': 'teacher123',
  'baxriddin.x': 'teacher123',
};

export const initialCircles: Circle[] = officialCircles.map((c) => {
  const enrolledMap = studentImportMeta.enrolledByCircle as Record<string, number>;
  const enrolledFromRoster = enrolledMap[c.id];
  const base =
    enrolledFromRoster != null
      ? {
          ...c,
          enrolled: enrolledFromRoster,
          capacity: Math.max(c.capacity, enrolledFromRoster, 20),
          status: enrolledFromRoster >= Math.max(c.capacity, enrolledFromRoster) ? ('full' as const) : ('active' as const),
          progress: Math.min(95, Math.round((enrolledFromRoster / Math.max(c.capacity, enrolledFromRoster, 1)) * 100)),
        }
      : c;
  // To'garak rahbarlari jadvalidan — o'qituvchini saqlash
  if (base.teacherId?.startsWith('tl')) return base;
  if (base.status === 'planned' || base.enrolled === 0) {
    return { ...base, teacher: 'Tayinlanmagan', teacherId: '' };
  }
  const t = staffByCategory[base.category];
  return t ? { ...base, teacher: t.name, teacherId: t.id } : base;
});

export const initialTeachers: Teacher[] = [...officialStaff, ...buildLeaderTeachers()];

/** Bolalar boshqaruvi.xlsx — barcha o'quvchilar (ism-sharif, telefon, to'garak) */
export const initialStudents: Student[] = officialStudents.map(toStudent).map((s, i) =>
  i === 0
    ? { ...s, parentPhone: '+998 90 111 22 33', parentName: `${s.lastName} oilasi (demo)` }
    : s
);

const PAYMENT_MONTH = '2026-06';
const circleNameById = new Map(
  [...buildLeaderCircles(), ...officialCircles].map((c) => [c.id, c.name] as const)
);

export const initialPayments: Payment[] = initialStudents.flatMap((s, i) =>
  s.circleIds.map((circleId, j) => ({
    id: `p-${s.id}-${j}`,
    studentId: s.id,
    studentName: `${s.firstName} ${s.lastName}`.trim(),
    circleId,
    circleName: circleNameById.get(circleId) || 'To‘garak',
    amount: MONTHLY_FEE,
    month: PAYMENT_MONTH,
    status: (i + j) % 5 === 0 ? 'paid' : (i + j) % 11 === 0 ? 'overdue' : 'pending',
    paidAt: (i + j) % 5 === 0 ? '2026-06-05' : undefined,
  }))
);

const s0 = initialStudents[0];
const s1 = initialStudents[1];
const s2 = initialStudents[2];

export const initialProjects: Project[] = [
  {
    id: 'pr1',
    title: 'Namuna loyiha',
    studentId: s0?.id || 'rs0001',
    studentName: s0 ? `${s0.firstName} ${s0.lastName}` : '',
    circleId: s0?.circleIds[0] || 'cl-17-15-maktab',
    category: 'Import',
    status: 'idea',
    description: 'Bolalar boshqaruvi.xlsx dan',
    createdAt: '2026-06-01',
  },
  {
    id: 'pr2',
    title: 'Guruh ishi',
    studentId: s1?.id || 'rs0002',
    studentName: s1 ? `${s1.firstName} ${s1.lastName}` : '',
    circleId: s1?.circleIds[0] || 'cl-17-15-maktab',
    category: 'Import',
    status: 'development',
    description: 'Joriy o‘quvchi bilan bog‘langan',
    createdAt: '2026-06-10',
  },
  {
    id: 'pr3',
    title: 'Mustaqil ish',
    studentId: s2?.id || 'rs0003',
    studentName: s2 ? `${s2.firstName} ${s2.lastName}` : '',
    circleId: s2?.circleIds[0] || 'cl-17-15-maktab',
    category: 'Import',
    status: 'completed',
    description: 'Ro‘yxatdagi o‘quvchi',
    createdAt: '2026-06-15',
  },
];

const leaderCircles = buildLeaderCircles();
export const initialSchedule: ScheduleItem[] = leaderCircles.slice(0, 12).map((c, i) => ({
  id: `sch${i + 1}`,
  circleId: c.id,
  circleName: c.name,
  teacher: c.teacher,
  day: ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba'][i % 4],
  startTime: '14:00',
  endTime: '16:00',
  room: c.location,
}));

export const initialMessages: Message[] = [
  { id: 'm1', title: "Yangi o'quv yili boshlanishi", content: "2026-2027 o'quv yili 15-sentabrdan boshlanadi. Ro'yxatdan o'tish 1-avgustdan ochiladi.", type: 'info', date: '2026-03-01', read: false, toAudience: 'all', fromName: 'Kelajak Markazi' },
  { id: 'm2', title: 'Tuman robototexnika tanlovi', content: "15-aprelda tuman miqyosidagi robototexnika tanlovi bo'lib o'tadi. Barcha ishtirokchilar ro'yxatdan o'ting.", type: 'event', date: '2026-03-10', read: false, toAudience: 'all', fromName: 'Kelajak Markazi' },
  { id: 'm3', title: "Iyun oyi to'lovi", content: "Iyun oyi uchun badal to'lovi amalga oshirilishi kerak.", type: 'warning', date: '2026-06-05', read: true, toAudience: 'parents', fromName: 'Bosh buxgalteriya' },
  { id: 'm4', title: "O'quvchilar ro'yxati", content: `Bolalar boshqaruvi.xlsx dan ${studentImportMeta.assigned} o'quvchi joriy to'garaklarga biriktirildi.`, type: 'success', date: '2026-06-30', read: false, toAudience: 'staff', fromName: "Nurmatova Nargiza To'ra qizi" },
];

export const initialSchools: School[] = buildOfficialNetworkSchools();

export const initialEnrollmentRequests = [
  {
    id: 'er1', firstName: 'Alisher', lastName: 'Valiyev', age: 13, school: '4-son UM', grade: 7,
    parentName: 'Valiyev Olim', parentPhone: '+998 90 555 12 34', circleId: 'cl-03-76-maktab', circleName: 'Yosh dasturchi',
    status: 'pending' as const, submittedAt: '2026-06-14',
  },
  {
    id: 'er2', firstName: 'Zarina', lastName: 'Karimova', age: 11, school: '2-son UM', grade: 5,
    parentName: 'Karimova Dilnoza', parentPhone: '+998 91 666 23 45', circleId: 'cl-28-67-maktab', circleName: 'Ingliz tili',
    status: 'pending' as const, submittedAt: '2026-06-15',
  },
];

export const initialAttendance: import('../types').AttendanceRecord[] = initialStudents
  .slice(0, 40)
  .flatMap((s, i) =>
    s.circleIds.slice(0, 1).map((circleId, j) => ({
      id: `a-${s.id}-${j}`,
      studentId: s.id,
      circleId,
      date: `2026-06-${String(10 + (i % 5)).padStart(2, '0')}`,
      present: i % 7 !== 0,
      note: i % 7 === 0 ? 'Sababsiz' : undefined,
    }))
  );

export const initialLabEquipment: import('../types').LabEquipment[] = [
  { id: 'le1', name: 'Arduino Uno R3', type: 'arduino', model: 'Uno R3', quantity: 25, available: 18, status: 'available', location: 'IT laboratoriyasi', lastMaintenance: '2026-02-01' },
  { id: 'le2', name: 'Arduino Mega 2560', type: 'arduino', model: 'Mega 2560', quantity: 10, available: 7, status: 'available', location: 'IT laboratoriyasi', lastMaintenance: '2026-02-01' },
  { id: 'le3', name: 'Raspberry Pi 4', type: 'raspberry', model: '4B 8GB', quantity: 12, available: 8, status: 'available', location: 'IT laboratoriyasi', lastMaintenance: '2026-01-15' },
  { id: 'le4', name: 'Raspberry Pi 3', type: 'raspberry', model: '3B+', quantity: 8, available: 5, status: 'in_use', location: 'IT laboratoriyasi' },
  { id: 'le5', name: 'Creality Ender 3', type: '3d_printer', model: 'Ender 3 V2', quantity: 3, available: 2, status: 'available', location: '3D chop xonasi', lastMaintenance: '2026-03-01' },
  { id: 'le6', name: 'Anycubic i3 Mega', type: '3d_printer', model: 'i3 Mega S', quantity: 2, available: 1, status: 'maintenance', location: '3D chop xonasi', lastMaintenance: '2026-03-10' },
  { id: 'le7', name: 'Ultrasonik sensor', type: 'sensor', model: 'HC-SR04', quantity: 30, available: 22, status: 'available', location: 'Sensorlar javoni' },
  { id: 'le8', name: 'PIR harakat sensori', type: 'sensor', model: 'HC-SR501', quantity: 20, available: 15, status: 'available', location: 'Sensorlar javoni' },
  { id: 'le9', name: 'Servo motorlar', type: 'other', model: 'SG90', quantity: 40, available: 28, status: 'available', location: 'Komponentlar javoni' },
  { id: 'le10', name: 'LED va rezistorlar to\'plami', type: 'other', model: 'Starter Kit', quantity: 15, available: 10, status: 'available', location: 'Komponentlar javoni' },
];

export const initialPartnerships: import('../types').Partnership[] = [
  {
    id: 'pt1', organization: 'Yoshlar innovatsiya markazi', country: 'O\'zbekiston', type: 'Tajriba almashish',
    description: 'Robototexnika va AI yo\'nalishlarida o\'qituvchilar malakasini oshirish, o\'quvchilarni tanlovlarga tayyorlash',
    startDate: '2025-09-01', status: 'active', contactPerson: 'Ballieva Shoira Ergashevna', events: 4,
  },
  {
    id: 'pt2', organization: 'International Inclusive Hub', country: 'O\'zbekiston', type: 'Inklyuziv ta\'lim',
    description: 'Inklyuziv to\'garaklar uchun metodik yordam va maxsus o\'quv dasturlari',
    startDate: '2026-01-15', status: 'active', contactPerson: 'Ibodatova Lobar Olimjon qizi', events: 2,
  },
  {
    id: 'pt3', organization: 'Iqtidor Academy', country: 'O\'zbekiston', type: 'Onlayn kurslar',
    description: '3D modellashtirish va robototexnika bo\'yicha onlayn master-klasslar',
    startDate: '2026-02-01', status: 'active', contactPerson: 'Xushanov Baxriddin Saydullaevich', events: 3,
  },
  {
    id: 'pt4', organization: 'FIRST Global Challenge', country: 'Xalqaro', type: 'Robototexnika tanlovi',
    description: 'Xalqaro robototexnika olimpiadasida ishtirok etish imkoniyati',
    startDate: '2026-04-01', endDate: '2026-10-01', status: 'planned', contactPerson: 'Xushmurodov Urozbek Turayevich', events: 0,
  },
  {
    id: 'pt5', organization: 'STEM Alliance', country: 'Yevropa Ittifoqi', type: 'Grant loyihasi',
    description: 'STEAM laboratoriyasi jihozlari uchun grant dasturi',
    startDate: '2026-06-01', status: 'planned', contactPerson: "Nurmatova Nargiza To'ra qizi", events: 0,
  },
];

export const monthlyEnrollmentData = [
  { month: 'Sen', students: 1200 },
  { month: 'Okt', students: 1400 },
  { month: 'Noy', students: 1550 },
  { month: 'Dek', students: 1680 },
  { month: 'Yan', students: 1750 },
  { month: 'Fev', students: 1850 },
  { month: 'Mar', students: studentImportMeta.assigned },
];

export const categoryDistribution = officialCategoryStats.map((s) => ({
  name: s.name.split(' ')[0],
  value: s.students,
  color: CATEGORY_COLORS[s.key],
}));

export const attendanceData = [
  { week: '1-hafta', rate: 92 },
  { week: '2-hafta', rate: 88 },
  { week: '3-hafta', rate: 94 },
  { week: '4-hafta', rate: 91 },
];
