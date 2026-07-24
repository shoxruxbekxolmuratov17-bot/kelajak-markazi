import {
  buildStaffAccounts,
} from './users.js';
import bcrypt from 'bcryptjs';
import { ensureDataDir, initDb, seedToBackend, dbPath, flushDb } from './db.js';
import {
  DEFAULT_DISTRICT_ID,
  DEFAULT_REGION_ID,
  DEFAULT_REGION_NAME,
  MONTHLY_FEE,
  emptyCenterInfo,
  type CenterInfo,
  type DbData,
  type District,
} from './types.js';
import {
  officialCircles,
  officialTotals,
} from '../../src/data/officialCircles.ts';
import {
  officialStaff,
  staffByCategory,
  DIRECTOR_FULL_NAME,
} from '../../src/data/officialStaff.ts';
import {
  buildLeaderTeachers,
  buildOfficialNetworkSchools,
} from '../../src/data/officialCircleLeaders.ts';
import {
  officialStudents,
  studentImportMeta,
} from '../../src/data/officialStudents.ts';

const REGION_DISTRICTS: Array<{ id: string; name: string; code: string }> = [
  { id: 'd-qarshi-city', name: 'Qarshi shahri', code: 'qarshi-city' },
  { id: 'd-shahrisabz-city', name: 'Shahrisabz shahri', code: 'shahrisabz-city' },
  { id: 'd-qarshi', name: 'Qarshi tumani', code: 'qarshi' },
  { id: 'd-shahrisabz', name: 'Shahrisabz tumani', code: 'shahrisabz' },
  { id: DEFAULT_DISTRICT_ID, name: 'Qamashi tumani', code: 'qamashi' },
  { id: 'd-kitob', name: 'Kitob tumani', code: 'kitob' },
  { id: 'd-yakkabog', name: "Yakkabog' tumani", code: 'yakkabog' },
  { id: 'd-chiroqchi', name: 'Chiroqchi tumani', code: 'chiroqchi' },
  { id: 'd-kasbi', name: 'Kasbi tumani', code: 'kasbi' },
  { id: 'd-nishon', name: 'Nishon tumani', code: 'nishon' },
  { id: 'd-muborak', name: 'Muborak tumani', code: 'muborak' },
  { id: 'd-koson', name: 'Koson tumani', code: 'koson' },
  { id: 'd-mirishkor', name: 'Mirishkor tumani', code: 'mirishkor' },
  { id: 'd-guzor', name: "G'uzor tumani", code: 'guzor' },
  { id: 'd-dehqonobod', name: 'Dehqonobod tumani', code: 'dehqonobod' },
];

function regionDistricts(): District[] {
  return REGION_DISTRICTS.map((d) => ({
    ...d,
    region: DEFAULT_REGION_NAME,
    regionId: DEFAULT_REGION_ID,
  }));
}

async function main() {
  const hash = (p: string) => bcrypt.hashSync(p, 10);
  const did = DEFAULT_DISTRICT_ID;
  const kitob = 'd-kitob';

  const circles = officialCircles.map((c) => {
    const open =
      !c.isNetwork && c.enrolled < c.capacity
        ? { ...c, status: 'active' as const }
        : c;
    const withDistrict = { ...open, districtId: did };
    // To'garak rahbarlari jadvalidan kelgan — o'qituvchini saqlaymiz
    if (withDistrict.teacherId?.startsWith('tl')) return withDistrict;
    if (withDistrict.status === 'planned' || withDistrict.enrolled === 0) {
      return { ...withDistrict, teacher: 'Tayinlanmagan', teacherId: '' };
    }
    const t = staffByCategory[withDistrict.category];
    return t
      ? { ...withDistrict, teacher: t.name, teacherId: t.id }
      : withDistrict;
  });

  const leaderTeachers = buildLeaderTeachers().map((t) => ({ ...t, districtId: did }));
  const qamashiSchools = buildOfficialNetworkSchools(did);

  // Ro'yxatdan kelgan o'quvchi soniga moslab guruhlarni to'ldirish
  for (const [circleId, count] of Object.entries(studentImportMeta.enrolledByCircle)) {
    const i = circles.findIndex((c) => c.id === circleId);
    if (i < 0) continue;
    const n = Number(count) || 0;
    const capacity = Math.max(circles[i].capacity, n, 20);
    circles[i] = {
      ...circles[i],
      enrolled: n,
      capacity,
      status: n >= capacity ? 'full' : 'active',
      progress: Math.min(95, Math.round((n / capacity) * 100)),
    };
  }

  const rosterStudents = officialStudents.map(
    ({ externalId: _e, birthDate: _b, rosterSubject: _s, rosterGroup: _g, ...s }) => ({
      ...s,
      districtId: s.districtId || did,
    })
  );
  // Demo ota-ona login: +998 90 111 22 33 / 1234
  if (rosterStudents[0]) {
    rosterStudents[0] = {
      ...rosterStudents[0],
      parentPhone: '+998 90 111 22 33',
      parentName: `${rosterStudents[0].lastName} oilasi (demo)`,
    };
  }
  const demoStudentId = rosterStudents[0]?.id || 'rs0001';

  const pickCircle = (...needles: string[]) => {
    for (const n of needles) {
      const hit = circles.find(
        (c) => c.id.startsWith('cl-') && c.name.toLowerCase().includes(n.toLowerCase())
      );
      if (hit) return hit.id;
    }
    return circles.find((c) => c.id.startsWith('cl-'))?.id || 'cl-01-markaz';
  };
  const cProg = pickCircle('dasturchi');
  const cDesign = pickCircle('dizayn');
  const cMath = pickCircle('matematika');
  const cChem = pickCircle('kimyo');
  const cArt = pickCircle('tasviriy');
  const cChess = pickCircle('shaxmat');
  const cEng = pickCircle('ingliz');
  const cCraft = pickCircle('plastika', 'tikish');
  const cFolk = circles.find((c) => c.id === 'c-cul-01')?.id || cArt;
  const cLit = circles.find((c) => c.id === 'c-pr-01')?.id || cMath;
  const cEco = circles.find((c) => c.id === 'c-tou-07')?.id || cCraft;

  const inclusiveIdx = circles.findIndex((c) => c.id === 'c-cul-02');
  if (inclusiveIdx >= 0) {
    circles[inclusiveIdx] = {
      ...circles[inclusiveIdx],
      isInclusive: true,
      description:
        (circles[inclusiveIdx].description || '') +
        ' · Inklyuziv / ijtimoiy reestr uchun ochiq',
    };
  }

  circles.push(
    {
      id: 'kitob-c1',
      name: 'Ingliz tili (Kitob)',
      category: 'language',
      teacher: 'Karimova Dilnoza',
      teacherId: 'kitob-t1',
      capacity: 20,
      enrolled: 12,
      schedule: 'Du/Chor 15:00',
      location: 'Kitob markazi',
      fee: MONTHLY_FEE,
      status: 'active',
      description: 'Kitob tumani namuna to‘garagi',
      isNetwork: false,
      ageRange: '8-14',
      progress: 55,
      districtId: kitob,
    },
    {
      id: 'kitob-c2',
      name: 'Robototexnika (Kitob)',
      category: 'it',
      teacher: 'Toshmatov Bekzod',
      teacherId: 'kitob-t2',
      capacity: 15,
      enrolled: 8,
      schedule: 'Se/Pa 14:00',
      location: 'IT xona',
      fee: MONTHLY_FEE,
      status: 'active',
      description: 'Kitob IT namuna',
      isNetwork: false,
      ageRange: '10-16',
      progress: 40,
      districtId: kitob,
    }
  );

  const districts = regionDistricts();
  const qamashiCenter: CenterInfo = {
    name: 'Kelajak Markazi',
    district: 'Qamashi tumani',
    region: DEFAULT_REGION_NAME,
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
    districtId: did,
  };
  const kitobCenter = emptyCenterInfo(
    { id: kitob, name: 'Kitob tumani', region: DEFAULT_REGION_NAME },
    {
      address: 'Kitob tumani, markaz',
      phone: '',
      email: 'kelajak.kitob@edu.uz',
      director: '',
      workingHours: '',
      namedClubs: 2,
      totalStudents: 3,
    }
  );
  const centerInfos: CenterInfo[] = districts.map((d) => {
    if (d.id === did) return qamashiCenter;
    if (d.id === kitob) return kitobCenter;
    return emptyCenterInfo(d);
  });

  const teacherAccounts = buildStaffAccounts(
    [...officialStaff.map((t) => ({ ...t, districtId: did })), ...leaderTeachers],
    did,
    DEFAULT_REGION_ID,
    hash
  );

  const data: DbData = {
    regions: [{ id: DEFAULT_REGION_ID, name: DEFAULT_REGION_NAME, code: 'qashqadaryo' }],
    districts,
    users: [
      {
        id: 'u0',
        username: 'superadmin',
        passwordHash: hash('super123'),
        fullName: 'Qashqadaryo viloyat admini',
        role: 'superadmin',
        regionId: DEFAULT_REGION_ID,
        districtId: undefined,
        blocked: false,
      },
      {
        id: 'u1',
        username: 'admin',
        passwordHash: hash('admin123'),
        fullName: DIRECTOR_FULL_NAME,
        role: 'district_admin',
        teacherId: 'st1',
        districtId: did,
        regionId: DEFAULT_REGION_ID,
        blocked: false,
      },
      ...teacherAccounts,
    ],
    parentPins: {
      '998901112233': hash('1234'),
    },
    parentPinHints: {
      '998901112233': '1234',
    },
    centerInfo: qamashiCenter,
    centerInfos,
    circles,
    teachers: [
      ...officialStaff.map((t) => ({ ...t, districtId: did })),
      ...leaderTeachers,
      {
        id: 'kitob-t1',
        firstName: 'Dilnoza',
        lastName: 'Karimova',
        specialty: 'Ingliz tili',
        phone: '+998 90 200 00 01',
        email: 'kitob.lang@edu.uz',
        circleIds: ['kitob-c1'],
        experience: 5,
        rating: 4.5,
        isInclusive: false,
        districtId: kitob,
      },
      {
        id: 'kitob-t2',
        firstName: 'Bekzod',
        lastName: 'Toshmatov',
        specialty: 'Robototexnika',
        phone: '+998 90 200 00 02',
        email: 'kitob.it@edu.uz',
        circleIds: ['kitob-c2'],
        experience: 3,
        rating: 4.2,
        isInclusive: false,
        districtId: kitob,
      },
    ],
    students: [
      ...rosterStudents,
      { id: 'kitob-s1', firstName: 'Asad', lastName: 'Nurmatov', age: 12, school: '1-son UM', grade: 6, parentName: 'Nurmatov Anvar', parentPhone: '+998 90 300 11 22', circleIds: ['kitob-c1'], status: 'active', enrolledAt: '2025-10-01', achievements: 1, districtId: kitob },
      { id: 'kitob-s2', firstName: 'Malika', lastName: 'Sobirova', age: 13, school: '2-son UM', grade: 7, parentName: 'Sobirova Nilufar', parentPhone: '+998 91 300 22 33', circleIds: ['kitob-c2'], status: 'active', enrolledAt: '2025-10-05', achievements: 2, districtId: kitob },
      { id: 'kitob-s3', firstName: 'Javlon', lastName: 'Aliyev', age: 11, school: '1-son UM', grade: 5, parentName: 'Aliyev Karim', parentPhone: '+998 93 300 33 44', circleIds: ['kitob-c1', 'kitob-c2'], status: 'active', enrolledAt: '2025-11-01', achievements: 0, districtId: kitob },
    ],
    payments: [
      ...rosterStudents.flatMap((s, i) =>
        s.circleIds.map((circleId, j) => ({
          id: `p-${s.id}-${j}`,
          studentId: s.id,
          studentName: `${s.firstName} ${s.lastName}`.trim(),
          circleId,
          circleName: circles.find((c) => c.id === circleId)?.name || 'To‘garak',
          amount: MONTHLY_FEE,
          month: '2026-06',
          status: (i + j) % 5 === 0 ? 'paid' : (i + j) % 11 === 0 ? 'overdue' : 'pending',
          paidAt: (i + j) % 5 === 0 ? '2026-06-05' : undefined,
          districtId: did,
        }))
      ),
      { id: 'kitob-p1', studentId: 'kitob-s1', studentName: 'Asad Nurmatov', circleId: 'kitob-c1', circleName: 'Ingliz tili (Kitob)', amount: MONTHLY_FEE, month: '2026-03', status: 'paid', paidAt: '2026-03-05', districtId: kitob },
      { id: 'kitob-p2', studentId: 'kitob-s2', studentName: 'Malika Sobirova', circleId: 'kitob-c2', circleName: 'Robototexnika (Kitob)', amount: MONTHLY_FEE, month: '2026-03', status: 'pending', districtId: kitob },
    ],
    projects: [
      {
        id: 'pr1',
        title: 'Namuna loyiha',
        studentId: demoStudentId,
        studentName: `${rosterStudents[0]?.firstName || ''} ${rosterStudents[0]?.lastName || ''}`.trim(),
        circleId: rosterStudents[0]?.circleIds[0] || cProg,
        category: 'Import',
        status: 'idea',
        description: 'Bolalar boshqaruvi.xlsx dan import',
        createdAt: '2026-06-01',
        districtId: did,
      },
      {
        id: 'pr2',
        title: 'Guruh ishi',
        studentId: rosterStudents[1]?.id || demoStudentId,
        studentName: `${rosterStudents[1]?.firstName || ''} ${rosterStudents[1]?.lastName || ''}`.trim(),
        circleId: rosterStudents[1]?.circleIds[0] || cProg,
        category: 'Import',
        status: 'development',
        description: 'Joriy o‘quvchi',
        createdAt: '2026-06-10',
        districtId: did,
      },
    ],
    schedule: [
      { id: 'sch1', circleId: cProg, circleName: 'Yosh dasturchi', teacher: 'Jabborova Muqaddas Baxriddinovna', day: 'Dushanba', startTime: '14:00', endTime: '16:00', room: '76-maktab', districtId: did },
      { id: 'sch2', circleId: cProg, circleName: 'Yosh dasturchi', teacher: 'Jabborova Muqaddas Baxriddinovna', day: 'Chorshanba', startTime: '14:00', endTime: '16:00', room: '76-maktab', districtId: did },
      { id: 'sch3', circleId: cDesign, circleName: 'Kompyuter dizayn', teacher: "Tursunov Anvarjon Rustam o'g'li", day: 'Seshanba', startTime: '15:00', endTime: '17:00', room: 'Markaz IT', districtId: did },
      { id: 'sch4', circleId: cChess, circleName: 'Shaxmat-shashka', teacher: "Xoliyorov Sirojiddin G'ulomovich", day: 'Dushanba', startTime: '16:00', endTime: '18:00', room: '58-maktab', districtId: did },
      { id: 'sch5', circleId: cEng, circleName: 'Ingliz tili', teacher: 'Shozamonova Guzal Yaxshiboyevna', day: 'Dushanba', startTime: '15:00', endTime: '17:00', room: '67-maktab', districtId: did },
      { id: 'sch6', circleId: cArt, circleName: "Tasviriy san'at", teacher: "Razzoqova Sanobar Yo'ldoshevna", day: 'Dushanba', startTime: '14:00', endTime: '16:00', room: 'Markaz', districtId: did },
      { id: 'sch7', circleId: cMath, circleName: 'Matematika', teacher: "Nortojiyev Mirjalol Farhod o'g'li", day: 'Chorshanba', startTime: '14:00', endTime: '16:00', room: 'Markaz', districtId: did },
      { id: 'sch8', circleId: cCraft, circleName: 'Mayda plastika', teacher: 'Rasulova Xursand Qurbonovna', day: 'Chorshanba', startTime: '14:00', endTime: '16:00', room: '16-maktab', districtId: did },
    ],
    messages: [
      { id: 'm1', title: "Yangi o'quv yili boshlanishi", content: "2026-2027 o'quv yili 15-sentabrdan boshlanadi.", type: 'info', date: '2026-03-01', read: false, toAudience: 'all', fromName: 'Kelajak Markazi', districtId: did },
      { id: 'm2', title: 'Tuman robototexnika tanlovi', content: '15-aprelda tuman miqyosidagi tanlov.', type: 'event', date: '2026-03-10', read: false, toAudience: 'all', fromName: 'Kelajak Markazi', districtId: did },
      { id: 'm3', title: "Mart oyi to'lovi", content: "Mart oyi uchun badal to'lovi 10-martgacha.", type: 'warning', date: '2026-03-05', read: true, toAudience: 'parents', fromName: 'Bosh buxgalteriya', districtId: did },
      { id: 'm4', title: "To'garak rahbarlari", content: `${officialTotals.activeClubs} ta faol guruh · ${officialTotals.students} o'quvchi (iyun 2026 jadvali).`, type: 'success', date: '2026-06-30', read: false, toAudience: 'teachers', fromName: "Nurmatova Nargiza To'ra qizi", districtId: did },
      { id: 'kitob-m1', title: 'Kitob markazi hisobot', content: 'Mart oyi monitoringi tayyor.', type: 'info', date: '2026-03-15', read: false, toAudience: 'all', fromName: 'Kitob markazi', districtId: kitob },
    ],
    enrollmentRequests: [
      { id: 'er1', firstName: 'Alisher', lastName: 'Valiyev', age: 13, school: '4-son UM', grade: 7, parentName: 'Valiyev Olim', parentPhone: '+998 90 555 12 34', circleId: cProg, circleName: 'Yosh dasturchi', status: 'pending', submittedAt: '2026-03-14', districtId: did },
      { id: 'er2', firstName: 'Zarina', lastName: 'Karimova', age: 11, school: '2-son UM', grade: 5, parentName: 'Karimova Dilnoza', parentPhone: '+998 91 666 23 45', circleId: cEng, circleName: 'Ingliz tili', status: 'pending', submittedAt: '2026-03-15', districtId: did },
    ],
    attendance: rosterStudents.slice(0, 40).flatMap((s, i) =>
      s.circleIds.slice(0, 1).map((circleId, j) => ({
        id: `a-${s.id}-${j}`,
        studentId: s.id,
        circleId,
        date: `2026-06-${String(10 + (i % 5)).padStart(2, '0')}`,
        present: i % 7 !== 0,
        note: i % 7 === 0 ? 'Sababsiz' : undefined,
        districtId: did,
      }))
    ),
    labEquipment: [
      { id: 'le1', name: 'Arduino Uno R3', type: 'arduino', model: 'Uno R3', quantity: 25, available: 18, status: 'available', location: 'IT laboratoriyasi', lastMaintenance: '2026-02-01', districtId: did },
      { id: 'le2', name: 'Arduino Mega 2560', type: 'arduino', model: 'Mega 2560', quantity: 10, available: 7, status: 'available', location: 'IT laboratoriyasi', lastMaintenance: '2026-02-01', districtId: did },
      { id: 'le3', name: 'Raspberry Pi 4', type: 'raspberry', model: '4B 8GB', quantity: 12, available: 8, status: 'available', location: 'IT laboratoriyasi', lastMaintenance: '2026-01-15', districtId: did },
      { id: 'le4', name: 'Raspberry Pi 3', type: 'raspberry', model: '3B+', quantity: 8, available: 5, status: 'in_use', location: 'IT laboratoriyasi', districtId: did },
      { id: 'le5', name: 'Creality Ender 3', type: '3d_printer', model: 'Ender 3 V2', quantity: 3, available: 2, status: 'available', location: '3D chop xonasi', lastMaintenance: '2026-03-01', districtId: did },
      { id: 'le6', name: 'Anycubic i3 Mega', type: '3d_printer', model: 'i3 Mega S', quantity: 2, available: 1, status: 'maintenance', location: '3D chop xonasi', lastMaintenance: '2026-03-10', districtId: did },
      { id: 'le7', name: 'Ultrasonik sensor', type: 'sensor', model: 'HC-SR04', quantity: 30, available: 22, status: 'available', location: 'Sensorlar javoni', districtId: did },
      { id: 'le8', name: 'PIR harakat sensori', type: 'sensor', model: 'HC-SR501', quantity: 20, available: 15, status: 'available', location: 'Sensorlar javoni', districtId: did },
      { id: 'le9', name: 'Servo motorlar', type: 'other', model: 'SG90', quantity: 40, available: 28, status: 'available', location: 'Komponentlar javoni', districtId: did },
      { id: 'le10', name: "LED va rezistorlar to'plami", type: 'other', model: 'Starter Kit', quantity: 15, available: 10, status: 'available', location: 'Komponentlar javoni', districtId: did },
    ],
    partnerships: [
      { id: 'pt1', organization: 'Yoshlar innovatsiya markazi', country: "O'zbekiston", type: 'Tajriba almashish', description: 'Robototexnika va AI', startDate: '2025-09-01', status: 'active', contactPerson: 'Ballieva Shoira Ergashevna', events: 4, districtId: did },
      { id: 'pt2', organization: 'International Inclusive Hub', country: "O'zbekiston", type: "Inklyuziv ta'lim", description: 'Inklyuziv metodika', startDate: '2026-01-15', status: 'active', contactPerson: 'Ibodatova Lobar Olimjon qizi', events: 2, districtId: did },
      { id: 'pt3', organization: 'Iqtidor Academy', country: "O'zbekiston", type: 'Onlayn kurslar', description: 'Master-klasslar', startDate: '2026-02-01', status: 'active', contactPerson: 'Xushanov Baxriddin Saydullaevich', events: 3, districtId: did },
      { id: 'pt4', organization: 'FIRST Global Challenge', country: 'Xalqaro', type: 'Robototexnika tanlovi', description: 'Xalqaro olimpiada', startDate: '2026-04-01', endDate: '2026-10-01', status: 'planned', contactPerson: 'Xushmurodov Urozbek Turayevich', events: 0, districtId: did },
      { id: 'pt5', organization: 'STEM Alliance', country: 'Yevropa Ittifoqi', type: 'Grant loyihasi', description: 'STEAM jihozlari', startDate: '2026-06-01', status: 'planned', contactPerson: "Nurmatova Nargiza To'ra qizi", events: 0, districtId: did },
    ],
    schools: qamashiSchools,
  };

  ensureDataDir();
  await initDb();
  const backend = await seedToBackend(data);
  await flushDb();
  console.log('Seeded OK →', backend, dbPath());
  console.log(`Circles: ${circles.length} · Students: ${rosterStudents.length + 3} (jadval: ${studentImportMeta.assigned})`);
  console.log(
    `Region: ${DEFAULT_REGION_NAME} · Districts: ${REGION_DISTRICTS.length} · Role: viloyat superadmin`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
