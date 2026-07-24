import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { config } from './config.js';
import {
  DEFAULT_DISTRICT_ID,
  DEFAULT_REGION_ID,
  DEFAULT_REGION_NAME,
  type AttendanceRecord,
  type Circle,
  type CenterInfo,
  type DbData,
  type DbUser,
  type District,
  type EnrollmentRequest,
  type Message,
  type Payment,
  type Student,
  type Teacher,
} from './types.js';
import {
  addPaymentEventPg,
  initPg,
  insertAuditPg,
  isPgConfigured,
  readAllFromPg,
  updatePaymentStatusPg,
  upsertPaymentPg,
  writeAllToPg,
  closePg,
} from './pg.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const SQLITE_PATH = path.join(DATA_DIR, 'kelajak.db');
const LEGACY_JSON = path.join(DATA_DIR, 'db.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

let sqlite: DatabaseSync | null = null;
let cache: DbData | null = null;
let backupCounter = 0;
let relationalReady = false;
let backend: 'sqlite' | 'postgres' = 'sqlite';
let writeQueue: Promise<void> = Promise.resolve();

export function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export function dbBackend() {
  return backend;
}

/** Call once at process start — enables Postgres when DATABASE_URL is set. */
export async function initDb() {
  if (isPgConfigured()) {
    try {
      await initPg();
      backend = 'postgres';
      cache = await readAllFromPg();
      if (!cache.districts?.length || !cache.users?.length) {
        console.warn('Postgres bo‘sh — SQLite seed dan ko‘chiriladi yoki npm run seed ishlating');
      }
      relationalReady = true;
      return backend;
    } catch (e) {
      console.error('Postgres ulanish xatosi, SQLite ga o‘tiladi:', e instanceof Error ? e.message : e);
      backend = 'sqlite';
    }
  }
  backend = 'sqlite';
  loadDb();
  return backend;
}

export async function flushDb() {
  await writeQueue;
}

export async function shutdownDb() {
  await flushDb();
  if (backend === 'postgres') await closePg();
}

function getSqlite() {
  if (sqlite) return sqlite;
  ensureDataDir();
  sqlite = new DatabaseSync(SQLITE_PATH);
  sqlite.exec('PRAGMA journal_mode = WAL;');
  sqlite.exec('PRAGMA synchronous = NORMAL;');
  sqlite.exec('PRAGMA foreign_keys = ON;');
  initRelationalSchema(sqlite);
  return sqlite;
}

function ensureColumn(db: DatabaseSync, table: string, column: string, ddl: string) {
  try {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
    if (!cols.some((c) => c.name === column)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
    }
  } catch {
    // ignore on fresh create race
  }
}

function initRelationalSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS districts (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, region TEXT NOT NULL, code TEXT UNIQUE,
      region_id TEXT
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, district_id TEXT, username TEXT NOT NULL, password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL, role TEXT NOT NULL, teacher_id TEXT, phone TEXT, region_id TEXT
    );
    CREATE TABLE IF NOT EXISTS parent_pins (
      phone_norm TEXT NOT NULL, district_id TEXT NOT NULL, pin_hash TEXT NOT NULL,
      PRIMARY KEY (phone_norm, district_id)
    );
    CREATE TABLE IF NOT EXISTS center_info (
      district_id TEXT PRIMARY KEY, payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS teachers (
      id TEXT PRIMARY KEY, district_id TEXT NOT NULL, payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS circles (
      id TEXT PRIMARY KEY, district_id TEXT NOT NULL, name TEXT NOT NULL, category TEXT,
      teacher TEXT, teacher_id TEXT, capacity INT, enrolled INT, schedule TEXT, location TEXT,
      fee INT, status TEXT, description TEXT, is_network INT, is_inclusive INT,
      school TEXT, age_range TEXT, progress INT
    );
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY, district_id TEXT NOT NULL, first_name TEXT, last_name TEXT,
      age INT, school TEXT, grade INT, parent_name TEXT, parent_phone TEXT, status TEXT,
      enrolled_at TEXT, achievements INT, social_registry INT DEFAULT 0,
      inclusive_needs TEXT, subsidy INT DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS student_circles (
      student_id TEXT NOT NULL, circle_id TEXT NOT NULL, PRIMARY KEY (student_id, circle_id)
    );
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY, district_id TEXT NOT NULL, student_id TEXT, student_name TEXT,
      circle_id TEXT, circle_name TEXT, amount INT, month TEXT, status TEXT, paid_at TEXT,
      provider TEXT, provider_txn TEXT
    );
    CREATE TABLE IF NOT EXISTS payment_events (
      id TEXT PRIMARY KEY, payment_id TEXT, provider TEXT, event_type TEXT, payload TEXT, created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY, district_id TEXT NOT NULL, payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS schedule_items (
      id TEXT PRIMARY KEY, district_id TEXT NOT NULL, payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY, district_id TEXT NOT NULL, title TEXT, content TEXT, type TEXT,
      date TEXT, read INT, from_name TEXT, from_role TEXT, from_user_id TEXT,
      to_audience TEXT, to_user_id TEXT, to_name TEXT
    );
    CREATE TABLE IF NOT EXISTS enrollments (
      id TEXT PRIMARY KEY, district_id TEXT NOT NULL, first_name TEXT, last_name TEXT,
      age INT, school TEXT, grade INT, parent_name TEXT, parent_phone TEXT,
      circle_id TEXT, circle_name TEXT, status TEXT, submitted_at TEXT, note TEXT,
      social_registry INT DEFAULT 0, subsidy INT DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY, district_id TEXT NOT NULL, student_id TEXT, circle_id TEXT,
      date TEXT, present INT, note TEXT
    );
    CREATE TABLE IF NOT EXISTS lab_equipment (
      id TEXT PRIMARY KEY, district_id TEXT NOT NULL, payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS partnerships (
      id TEXT PRIMARY KEY, district_id TEXT NOT NULL, payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS schools (
      id TEXT PRIMARY KEY, district_id TEXT NOT NULL, payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS otp_codes (
      phone_norm TEXT NOT NULL, district_id TEXT NOT NULL, code_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL, attempts INT DEFAULT 0,
      PRIMARY KEY (phone_norm, district_id)
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT, district_id TEXT, user_id TEXT,
      action TEXT NOT NULL, resource TEXT, meta TEXT, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS app_state (
      id INTEGER PRIMARY KEY CHECK (id = 1), payload TEXT NOT NULL, updated_at TEXT NOT NULL
    );
  `);
  ensureColumn(db, 'districts', 'region_id', 'region_id TEXT');
  ensureColumn(db, 'users', 'region_id', 'region_id TEXT');
  ensureColumn(db, 'users', 'blocked', 'blocked INT DEFAULT 0');
  relationalReady = true;
}

function migrateBlobToRelationalIfNeeded(db: DatabaseSync) {
  const flag = db.prepare("SELECT value FROM meta WHERE key = 'relational_v1'").get() as
    | { value: string }
    | undefined;
  if (flag?.value === '1') return;

  let payload: string | null = null;
  const row = db.prepare('SELECT payload FROM app_state WHERE id = 1').get() as
    | { payload: string }
    | undefined;
  if (row) payload = row.payload;
  else if (fs.existsSync(LEGACY_JSON)) payload = fs.readFileSync(LEGACY_JSON, 'utf-8');

  if (payload) {
    const data = JSON.parse(payload) as DbData;
    if (!data.districts?.length) {
      data.districts = [
        {
          id: DEFAULT_DISTRICT_ID,
          name: data.centerInfo?.district || 'Qamashi tumani',
          region: data.centerInfo?.region || DEFAULT_REGION_NAME,
          regionId: DEFAULT_REGION_ID,
          code: 'qamashi',
        },
      ];
    }
    writeAllTables(db, data);
    console.log('Migrated blob/JSON → relational SQLite tables');
  }

  db.prepare(
    "INSERT INTO meta (key, value) VALUES ('relational_v1', '1') ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).run();
}

function writeAllTables(db: DatabaseSync, data: DbData) {
  const did = DEFAULT_DISTRICT_ID;
  db.exec('BEGIN');
  try {
    for (const t of [
      'student_circles', 'payments', 'payment_events', 'attendance', 'enrollments', 'messages',
      'projects', 'schedule_items', 'lab_equipment', 'partnerships', 'schools', 'students',
      'circles', 'teachers', 'parent_pins', 'users', 'center_info', 'districts',
    ]) {
      db.exec(`DELETE FROM ${t}`);
    }

    const districts: District[] = data.districts?.length
      ? data.districts
      : [{ id: did, name: 'Qamashi tumani', region: DEFAULT_REGION_NAME, regionId: DEFAULT_REGION_ID, code: 'qamashi' }];

    for (const d of districts) {
      db.prepare('INSERT INTO districts (id, name, region, code, region_id) VALUES (?, ?, ?, ?, ?)').run(
        d.id, d.name, d.region, d.code, d.regionId || DEFAULT_REGION_ID
      );
    }

    const centerList =
      data.centerInfos?.length
        ? data.centerInfos
        : data.centerInfo
          ? [{ ...data.centerInfo, districtId: data.centerInfo.districtId || did }]
          : [];
    for (const ci of centerList) {
      const cid = ci.districtId || did;
      db.prepare('INSERT INTO center_info (district_id, payload) VALUES (?, ?)').run(
        cid,
        JSON.stringify({ ...ci, districtId: cid })
      );
    }

    for (const u of data.users || []) {
      db.prepare(
        `INSERT INTO users (id, district_id, username, password_hash, full_name, role, teacher_id, phone, region_id, blocked)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        u.id,
        u.districtId || null,
        u.username,
        u.passwordHash,
        u.fullName,
        u.role,
        u.teacherId || null,
        u.phone || null,
        u.regionId || (u.role === 'superadmin' ? DEFAULT_REGION_ID : null),
        u.blocked ? 1 : 0
      );
    }

    for (const [phone, hash] of Object.entries(data.parentPins || {})) {
      db.prepare(
        'INSERT INTO parent_pins (phone_norm, district_id, pin_hash) VALUES (?, ?, ?)'
      ).run(phone, did, hash);
    }

    for (const t of data.teachers || []) {
      db.prepare('INSERT INTO teachers (id, district_id, payload) VALUES (?, ?, ?)').run(
        t.id, t.districtId || did, JSON.stringify({ ...t, districtId: t.districtId || did })
      );
    }

    for (const c of data.circles || []) {
      db.prepare(
        `INSERT INTO circles (
          id, district_id, name, category, teacher, teacher_id, capacity, enrolled, schedule, location,
          fee, status, description, is_network, is_inclusive, school, age_range, progress
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        c.id, c.districtId || did, c.name, c.category, c.teacher, c.teacherId,
        c.capacity, c.enrolled, c.schedule, c.location, c.fee, c.status, c.description,
        c.isNetwork ? 1 : 0, c.isInclusive ? 1 : 0, c.school || null, c.ageRange, c.progress
      );
    }

    for (const s of data.students || []) {
      db.prepare(
        `INSERT INTO students (
          id, district_id, first_name, last_name, age, school, grade, parent_name, parent_phone,
          status, enrolled_at, achievements, social_registry, inclusive_needs, subsidy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        s.id, s.districtId || did, s.firstName, s.lastName, s.age, s.school, s.grade,
        s.parentName, s.parentPhone, s.status, s.enrolledAt, s.achievements,
        s.socialRegistry ? 1 : 0, s.inclusiveNeeds || null, s.subsidy ? 1 : 0
      );
      for (const cid of s.circleIds || []) {
        db.prepare('INSERT OR IGNORE INTO student_circles (student_id, circle_id) VALUES (?, ?)').run(
          s.id, cid
        );
      }
    }

    for (const p of data.payments || []) {
      db.prepare(
        `INSERT INTO payments (
          id, district_id, student_id, student_name, circle_id, circle_name, amount, month, status, paid_at, provider, provider_txn
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        p.id, p.districtId || did, p.studentId, p.studentName, p.circleId, p.circleName,
        p.amount, p.month, p.status, p.paidAt || null, p.provider || null, p.providerTxn || null
      );
    }

    for (const p of data.projects || []) {
      db.prepare('INSERT INTO projects (id, district_id, payload) VALUES (?, ?, ?)').run(
        p.id, p.districtId || did, JSON.stringify(p)
      );
    }
    for (const s of data.schedule || []) {
      db.prepare('INSERT INTO schedule_items (id, district_id, payload) VALUES (?, ?, ?)').run(
        s.id, s.districtId || did, JSON.stringify(s)
      );
    }
    for (const m of data.messages || []) {
      db.prepare(
        `INSERT INTO messages (
          id, district_id, title, content, type, date, read, from_name, from_role, from_user_id, to_audience, to_user_id, to_name
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        m.id, m.districtId || did, m.title, m.content, m.type, m.date, m.read ? 1 : 0,
        m.fromName || null, m.fromRole || null, m.fromUserId || null,
        m.toAudience || null, m.toUserId || null, m.toName || null
      );
    }
    for (const e of data.enrollmentRequests || []) {
      db.prepare(
        `INSERT INTO enrollments (
          id, district_id, first_name, last_name, age, school, grade, parent_name, parent_phone,
          circle_id, circle_name, status, submitted_at, note, social_registry, subsidy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        e.id, e.districtId || did, e.firstName, e.lastName, e.age, e.school, e.grade,
        e.parentName, e.parentPhone, e.circleId, e.circleName, e.status, e.submittedAt,
        e.note || null, e.socialRegistry ? 1 : 0, e.subsidy ? 1 : 0
      );
    }
    for (const a of data.attendance || []) {
      db.prepare(
        `INSERT INTO attendance (id, district_id, student_id, circle_id, date, present, note)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(
        a.id, a.districtId || did, a.studentId, a.circleId, a.date, a.present ? 1 : 0, a.note || null
      );
    }
    for (const l of data.labEquipment || []) {
      db.prepare('INSERT INTO lab_equipment (id, district_id, payload) VALUES (?, ?, ?)').run(
        l.id, l.districtId || did, JSON.stringify(l)
      );
    }
    for (const p of data.partnerships || []) {
      db.prepare('INSERT INTO partnerships (id, district_id, payload) VALUES (?, ?, ?)').run(
        p.id, p.districtId || did, JSON.stringify(p)
      );
    }
    for (const s of data.schools || []) {
      db.prepare('INSERT INTO schools (id, district_id, payload) VALUES (?, ?, ?)').run(
        s.id, s.districtId || did, JSON.stringify(s)
      );
    }

    db.exec('COMMIT');
    db.prepare(
      "INSERT INTO meta (key, value) VALUES ('relational_v1', '1') ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    ).run();
    if (data.parentPinHints && Object.keys(data.parentPinHints).length) {
      db.prepare(
        "INSERT INTO meta (key, value) VALUES ('parent_pin_hints', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
      ).run(JSON.stringify(data.parentPinHints));
    }
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

function readAllTables(db: DatabaseSync): DbData {
  const districts = (db.prepare('SELECT * FROM districts').all() as Array<Record<string, unknown>>).map(
    (d) => ({
      id: String(d.id),
      name: String(d.name),
      region: String(d.region),
      regionId: d.region_id ? String(d.region_id) : DEFAULT_REGION_ID,
      code: String(d.code),
    })
  );

  const centerInfos = (
    db.prepare('SELECT district_id, payload FROM center_info').all() as Array<{
      district_id: string;
      payload: string;
    }>
  ).map((row) => {
    const parsed = JSON.parse(row.payload) as CenterInfo;
    return { ...parsed, districtId: parsed.districtId || String(row.district_id) };
  });
  const centerInfo =
    centerInfos.find((c) => c.districtId === DEFAULT_DISTRICT_ID) ||
    centerInfos[0] || {
      name: 'Kelajak Markazi',
      district: 'Qamashi tumani',
      region: DEFAULT_REGION_NAME,
      address: '',
      phone: '',
      email: '',
      director: '',
      workingHours: '',
      seasonStart: '',
      seasonEnd: '',
      ageRange: '6 — 18 yosh',
      group: '',
      monthlyFee: 61800,
      namedClubs: 0,
      totalStudents: 0,
      districtId: DEFAULT_DISTRICT_ID,
    };

  const users: DbUser[] = (
    db.prepare('SELECT * FROM users').all() as Array<Record<string, unknown>>
  ).map((u) => ({
    id: String(u.id),
    username: String(u.username),
    passwordHash: String(u.password_hash),
    fullName: String(u.full_name),
    role: u.role as DbUser['role'],
    teacherId: u.teacher_id ? String(u.teacher_id) : undefined,
    phone: u.phone ? String(u.phone) : undefined,
    districtId: u.district_id ? String(u.district_id) : undefined,
    regionId: u.region_id
      ? String(u.region_id)
      : u.role === 'superadmin'
        ? DEFAULT_REGION_ID
        : undefined,
    blocked: Number(u.blocked) === 1 || u.blocked === true,
  }));

  const parentPins: Record<string, string> = {};
  for (const row of db.prepare('SELECT phone_norm, pin_hash FROM parent_pins').all() as Array<{
    phone_norm: string;
    pin_hash: string;
  }>) {
    parentPins[row.phone_norm] = row.pin_hash;
  }

  let parentPinHints: Record<string, string> = {};
  const hintsMeta = db.prepare("SELECT value FROM meta WHERE key = 'parent_pin_hints'").get() as
    | { value: string }
    | undefined;
  if (hintsMeta?.value) {
    try {
      parentPinHints = JSON.parse(hintsMeta.value) as Record<string, string>;
    } catch {
      parentPinHints = {};
    }
  }

  const teachers: Teacher[] = (
    db.prepare('SELECT payload FROM teachers').all() as Array<{ payload: string }>
  ).map((r) => JSON.parse(r.payload));

  const circles: Circle[] = (
    db.prepare('SELECT * FROM circles').all() as Array<Record<string, unknown>>
  ).map((c) => ({
    id: String(c.id),
    districtId: String(c.district_id),
    name: String(c.name),
    category: String(c.category || ''),
    teacher: String(c.teacher || ''),
    teacherId: String(c.teacher_id || ''),
    capacity: Number(c.capacity),
    enrolled: Number(c.enrolled),
    schedule: String(c.schedule || ''),
    location: String(c.location || ''),
    fee: Number(c.fee),
    status: String(c.status),
    description: String(c.description || ''),
    isNetwork: Boolean(c.is_network),
    isInclusive: Boolean(c.is_inclusive),
    school: c.school ? String(c.school) : undefined,
    ageRange: String(c.age_range || ''),
    progress: Number(c.progress || 0),
  }));

  const linkRows = db.prepare('SELECT student_id, circle_id FROM student_circles').all() as Array<{
    student_id: string;
    circle_id: string;
  }>;
  const links = new Map<string, string[]>();
  for (const r of linkRows) {
    const arr = links.get(r.student_id) || [];
    arr.push(r.circle_id);
    links.set(r.student_id, arr);
  }

  const students: Student[] = (
    db.prepare('SELECT * FROM students').all() as Array<Record<string, unknown>>
  ).map((s) => ({
    id: String(s.id),
    districtId: String(s.district_id),
    firstName: String(s.first_name),
    lastName: String(s.last_name),
    age: Number(s.age),
    school: String(s.school || ''),
    grade: Number(s.grade || 0),
    parentName: String(s.parent_name || ''),
    parentPhone: String(s.parent_phone || ''),
    circleIds: links.get(String(s.id)) || [],
    status: String(s.status),
    enrolledAt: String(s.enrolled_at || ''),
    achievements: Number(s.achievements || 0),
    socialRegistry: Boolean(s.social_registry),
    inclusiveNeeds: s.inclusive_needs ? String(s.inclusive_needs) : undefined,
    subsidy: Boolean(s.subsidy),
  }));

  const payments: Payment[] = (
    db.prepare('SELECT * FROM payments').all() as Array<Record<string, unknown>>
  ).map((p) => ({
    id: String(p.id),
    districtId: String(p.district_id),
    studentId: String(p.student_id),
    studentName: String(p.student_name || ''),
    circleId: String(p.circle_id),
    circleName: String(p.circle_name || ''),
    amount: Number(p.amount),
    month: String(p.month),
    status: String(p.status),
    paidAt: p.paid_at ? String(p.paid_at) : undefined,
    provider: p.provider ? String(p.provider) : undefined,
    providerTxn: p.provider_txn ? String(p.provider_txn) : undefined,
  }));

  const projects = (db.prepare('SELECT payload FROM projects').all() as Array<{ payload: string }>).map(
    (r) => JSON.parse(r.payload)
  );
  const schedule = (
    db.prepare('SELECT payload FROM schedule_items').all() as Array<{ payload: string }>
  ).map((r) => JSON.parse(r.payload));
  const messages: Message[] = (
    db.prepare('SELECT * FROM messages').all() as Array<Record<string, unknown>>
  ).map((m) => ({
    id: String(m.id),
    districtId: String(m.district_id),
    title: String(m.title || ''),
    content: String(m.content || ''),
    type: String(m.type || 'info'),
    date: String(m.date || ''),
    read: Boolean(m.read),
    fromName: m.from_name ? String(m.from_name) : undefined,
    fromRole: m.from_role ? String(m.from_role) : undefined,
    fromUserId: m.from_user_id ? String(m.from_user_id) : undefined,
    toAudience: m.to_audience ? String(m.to_audience) : undefined,
    toUserId: m.to_user_id ? String(m.to_user_id) : undefined,
    toName: m.to_name ? String(m.to_name) : undefined,
  }));
  const enrollmentRequests: EnrollmentRequest[] = (
    db.prepare('SELECT * FROM enrollments').all() as Array<Record<string, unknown>>
  ).map((e) => ({
    id: String(e.id),
    districtId: String(e.district_id),
    firstName: String(e.first_name),
    lastName: String(e.last_name),
    age: Number(e.age),
    school: String(e.school || ''),
    grade: Number(e.grade || 0),
    parentName: String(e.parent_name || ''),
    parentPhone: String(e.parent_phone || ''),
    circleId: String(e.circle_id),
    circleName: String(e.circle_name || ''),
    status: String(e.status),
    submittedAt: String(e.submitted_at || ''),
    note: e.note ? String(e.note) : undefined,
    socialRegistry: Boolean(e.social_registry),
    subsidy: Boolean(e.subsidy),
  }));
  const attendance: AttendanceRecord[] = (
    db.prepare('SELECT * FROM attendance').all() as Array<Record<string, unknown>>
  ).map((a) => ({
    id: String(a.id),
    districtId: String(a.district_id),
    studentId: String(a.student_id),
    circleId: String(a.circle_id),
    date: String(a.date),
    present: Boolean(a.present),
    note: a.note ? String(a.note) : undefined,
  }));
  const labEquipment = (
    db.prepare('SELECT payload FROM lab_equipment').all() as Array<{ payload: string }>
  ).map((r) => JSON.parse(r.payload));
  const partnerships = (
    db.prepare('SELECT payload FROM partnerships').all() as Array<{ payload: string }>
  ).map((r) => JSON.parse(r.payload));
  const schools = (db.prepare('SELECT payload FROM schools').all() as Array<{ payload: string }>).map(
    (r) => JSON.parse(r.payload)
  );

  return {
    districts: districts.length
      ? districts
      : [{ id: DEFAULT_DISTRICT_ID, name: 'Qamashi tumani', region: DEFAULT_REGION_NAME, regionId: DEFAULT_REGION_ID, code: 'qamashi' }],
    users,
    parentPins,
    parentPinHints,
    centerInfo,
    centerInfos,
    circles,
    students,
    teachers,
    payments,
    projects,
    schedule,
    messages,
    enrollmentRequests,
    attendance,
    labEquipment,
    partnerships,
    schools,
  };
}

function rowToDbUser(row: Record<string, unknown>): DbUser {
  return {
    id: String(row.id),
    districtId: row.district_id ? String(row.district_id) : undefined,
    username: String(row.username),
    passwordHash: String(row.password_hash),
    fullName: String(row.full_name),
    role: row.role as DbUser['role'],
    teacherId: row.teacher_id ? String(row.teacher_id) : undefined,
    phone: row.phone ? String(row.phone) : undefined,
    regionId: row.region_id ? String(row.region_id) : undefined,
    blocked: row.blocked === 1 || row.blocked === true,
  };
}

/** Login / auth uchun — butun DB ni yuklamasdan foydalanuvchini topish */
export function findUserByUsername(username: string): DbUser | undefined {
  const norm = username.trim().toLowerCase();
  if (cache?.users?.length) {
    return cache.users.find((u) => u.username.toLowerCase() === norm);
  }
  if (backend === 'postgres') {
    return loadDb().users.find((u) => u.username.toLowerCase() === norm);
  }
  const db = getSqlite();
  migrateBlobToRelationalIfNeeded(db);
  const row = db
    .prepare('SELECT * FROM users WHERE lower(username) = ?')
    .get(norm) as Record<string, unknown> | undefined;
  return row ? rowToDbUser(row) : undefined;
}

export function findUserById(id: string): DbUser | undefined {
  if (cache?.users?.length) {
    return cache.users.find((u) => u.id === id);
  }
  if (backend === 'postgres') {
    return loadDb().users.find((u) => u.id === id);
  }
  const db = getSqlite();
  migrateBlobToRelationalIfNeeded(db);
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  return row ? rowToDbUser(row) : undefined;
}

export function loadDb(): DbData {
  if (cache) return cache;
  if (backend === 'postgres') {
    throw new Error('Postgres cache empty — call await initDb() first');
  }
  const db = getSqlite();
  migrateBlobToRelationalIfNeeded(db);
  const count = (
    db.prepare("SELECT value FROM meta WHERE key = 'relational_v1'").get() as { value: string } | undefined
  )?.value;
  if (count !== '1') {
    throw new Error('Database not seeded. Run: npm run seed');
  }
  const districtCount = (
    db.prepare('SELECT COUNT(*) as c FROM districts').get() as { c: number }
  ).c;
  if (!districtCount) {
    throw new Error('Database not seeded. Run: npm run seed');
  }
  cache = readAllTables(db);
  return cache;
}

export function saveDb(data: DbData) {
  cache = data;
  // Legacy JSON mirror — fon rejimida, API/login bloklanmasin
  setImmediate(() => {
    try {
      ensureDataDir();
      const payload = JSON.stringify(data, null, 2);
      fs.writeFileSync(LEGACY_JSON, payload, 'utf-8');
      backupCounter += 1;
      if (backupCounter % 5 === 0) {
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        fs.writeFileSync(path.join(BACKUP_DIR, `kelajak-${stamp}.json`), payload, 'utf-8');
        const files = fs
          .readdirSync(BACKUP_DIR)
          .filter((f) => f.startsWith('kelajak-') && f.endsWith('.json'))
          .sort();
        while (files.length > 20) {
          const old = files.shift();
          if (old) fs.unlinkSync(path.join(BACKUP_DIR, old));
        }
      }
    } catch (e) {
      console.error('Legacy JSON yozish xatosi:', e instanceof Error ? e.message : e);
    }
  });

  if (backend === 'postgres') {
    writeQueue = writeQueue
      .then(() => writeAllToPg(data))
      .catch((err) => console.error('Postgres write failed:', err));
    return;
  }

  const db = getSqlite();
  writeAllTables(db, data);
  db.prepare(
    `INSERT INTO app_state (id, payload, updated_at) VALUES (1, ?, ?)
     ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`
  ).run(JSON.stringify(data), new Date().toISOString());
}

export function mutate(fn: (db: DbData) => void) {
  const data = loadDb();
  fn(data);
  saveDb(data);
  return data;
}

export function invalidateCache() {
  cache = null;
}

export function dbPath() {
  return backend === 'postgres' ? config.databaseUrl : SQLITE_PATH;
}

export function backupNow() {
  const data = loadDb();
  const payload = JSON.stringify(data, null, 2);
  ensureDataDir();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = path.join(BACKUP_DIR, `manual-${stamp}.json`);
  fs.writeFileSync(dest, payload, 'utf-8');
  return dest;
}

export function insertAudit(entry: {
  districtId?: string;
  userId?: string;
  action: string;
  resource?: string;
  meta?: Record<string, unknown>;
}) {
  if (backend === 'postgres') {
    writeQueue = writeQueue
      .then(() => insertAuditPg(entry))
      .catch((err) => console.error('audit pg failed:', err));
    return;
  }
  const db = getSqlite();
  db.prepare(
    `INSERT INTO audit_logs (district_id, user_id, action, resource, meta, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    entry.districtId || null,
    entry.userId || null,
    entry.action,
    entry.resource || null,
    entry.meta ? JSON.stringify(entry.meta) : null,
    new Date().toISOString()
  );
}

export function updatePaymentStatus(
  id: string,
  status: string,
  extra?: { paidAt?: string; provider?: string; providerTxn?: string }
) {
  if (cache) {
    const i = cache.payments.findIndex((p) => p.id === id);
    if (i >= 0) {
      cache.payments[i] = {
        ...cache.payments[i],
        status,
        paidAt: extra?.paidAt ?? cache.payments[i].paidAt,
        provider: extra?.provider ?? cache.payments[i].provider,
        providerTxn: extra?.providerTxn ?? cache.payments[i].providerTxn,
      };
    }
  }
  if (backend === 'postgres') {
    writeQueue = writeQueue
      .then(() => updatePaymentStatusPg(id, status, extra))
      .catch((err) => console.error('payment update pg failed:', err));
    return;
  }
  const db = getSqlite();
  db.prepare(
    `UPDATE payments SET status = ?, paid_at = COALESCE(?, paid_at),
     provider = COALESCE(?, provider), provider_txn = COALESCE(?, provider_txn) WHERE id = ?`
  ).run(status, extra?.paidAt || null, extra?.provider || null, extra?.providerTxn || null, id);
}

export function addPaymentEvent(ev: {
  id: string;
  paymentId: string;
  provider: string;
  eventType: string;
  payload: unknown;
}) {
  if (backend === 'postgres') {
    writeQueue = writeQueue
      .then(() => addPaymentEventPg(ev))
      .catch((err) => console.error('payment event pg failed:', err));
    return;
  }
  const db = getSqlite();
  db.prepare(
    `INSERT INTO payment_events (id, payment_id, provider, event_type, payload, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    ev.id,
    ev.paymentId,
    ev.provider,
    ev.eventType,
    JSON.stringify(ev.payload),
    new Date().toISOString()
  );
}

/** Entity-level payment write (repo helper). */
export function persistPayment(pay: Payment) {
  mutate((db) => {
    const i = db.payments.findIndex((p) => p.id === pay.id);
    if (i >= 0) db.payments[i] = pay;
    else db.payments.push(pay);
  });
  if (backend === 'postgres') {
    writeQueue = writeQueue
      .then(() => upsertPaymentPg(pay))
      .catch((err) => console.error('upsert payment pg failed:', err));
  }
}

export function isRelationalReady() {
  return relationalReady || backend === 'postgres';
}

/** Seed helper: force write current cache/data to active backend.
 *  Agar DB da allaqachon foydalanuvchi bo‘lsa — o‘chirmaydi (FORCE_SEED=true bilan to‘liq qayta seed).
 */
export async function seedToBackend(data: DbData) {
  const force = process.env.FORCE_SEED === 'true' || process.env.FORCE_SEED === '1';
  try {
    const existing = loadDb();
    if (!force && existing.users?.length) {
      console.log(
        `Seed o‘tkazib yuborildi — DB da ${existing.users.length} foydalanuvchi bor. Qayta yozish: FORCE_SEED=true npm run seed`
      );
      return backend === 'postgres' ? 'postgres' : 'sqlite';
    }
  } catch {
    // bo'sh DB
  }
  cache = data;
  if (backend === 'postgres') {
    await writeAllToPg(data);
    return 'postgres';
  }
  saveDb(data);
  await flushDb();
  return 'sqlite';
}
