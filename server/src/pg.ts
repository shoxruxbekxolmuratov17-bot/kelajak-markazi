/**
 * Postgres live backend — used when DATABASE_URL is set.
 * Schema: server/migrations/001_schema.sql (+ meta).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
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

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.join(__dirname, '..', 'migrations', '001_schema.sql');

let pool: pg.Pool | null = null;

export function isPgConfigured() {
  return Boolean(config.databaseUrl);
}

export function getPool() {
  if (!pool) throw new Error('Postgres not initialized — call initPg()');
  return pool;
}

export async function initPg(): Promise<boolean> {
  if (!config.databaseUrl) return false;
  pool = new Pool({ connectionString: config.databaseUrl });
  await pool.query('SELECT 1');
  const sql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  await pool.query(sql);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  await pool.query(`ALTER TABLE districts ADD COLUMN IF NOT EXISTS region_id TEXT`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS region_id TEXT`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS blocked BOOLEAN DEFAULT FALSE`);
  return true;
}

export async function closePg() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export async function readAllFromPg(): Promise<DbData> {
  const p = getPool();
  const districtsRes = await p.query('SELECT id, name, region, code, region_id FROM districts');
  const districts: District[] = districtsRes.rows.map((d) => ({
    id: String(d.id),
    name: String(d.name),
    region: String(d.region),
    regionId: d.region_id ? String(d.region_id) : DEFAULT_REGION_ID,
    code: String(d.code),
  }));

  const centerRows = await p.query('SELECT district_id, payload FROM center_info');
  const centerInfos: CenterInfo[] = centerRows.rows.map((row) => {
    const parsed =
      typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
    return { ...parsed, districtId: parsed.districtId || String(row.district_id) } as CenterInfo;
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

  const usersRes = await p.query('SELECT * FROM users');
  const users: DbUser[] = usersRes.rows.map((u) => ({
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
    blocked: !!u.blocked,
  }));

  const pinsRes = await p.query('SELECT phone_norm, pin_hash FROM parent_pins');
  const parentPins: Record<string, string> = {};
  for (const row of pinsRes.rows) parentPins[row.phone_norm] = row.pin_hash;

  let parentPinHints: Record<string, string> = {};
  const hintsRes = await p.query("SELECT value FROM meta WHERE key = 'parent_pin_hints'");
  if (hintsRes.rows[0]?.value) {
    try {
      parentPinHints = JSON.parse(String(hintsRes.rows[0].value)) as Record<string, string>;
    } catch {
      parentPinHints = {};
    }
  }

  const teachersRes = await p.query('SELECT payload FROM teachers');
  const teachers: Teacher[] = teachersRes.rows.map((r) =>
    typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload
  );

  const circlesRes = await p.query('SELECT * FROM circles');
  const circles: Circle[] = circlesRes.rows.map((c) => ({
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

  const linkRes = await p.query('SELECT student_id, circle_id FROM student_circles');
  const links = new Map<string, string[]>();
  for (const r of linkRes.rows) {
    const arr = links.get(r.student_id) || [];
    arr.push(r.circle_id);
    links.set(r.student_id, arr);
  }

  const studentsRes = await p.query('SELECT * FROM students');
  const students: Student[] = studentsRes.rows.map((s) => ({
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

  const paymentsRes = await p.query('SELECT * FROM payments');
  const payments: Payment[] = paymentsRes.rows.map((row) => ({
    id: String(row.id),
    districtId: String(row.district_id),
    studentId: String(row.student_id),
    studentName: String(row.student_name || ''),
    circleId: String(row.circle_id),
    circleName: String(row.circle_name || ''),
    amount: Number(row.amount),
    month: String(row.month),
    status: String(row.status),
    paidAt: row.paid_at ? String(row.paid_at) : undefined,
    provider: row.provider ? String(row.provider) : undefined,
    providerTxn: row.provider_txn ? String(row.provider_txn) : undefined,
  }));

  const parsePayload = (rows: Array<{ payload: unknown }>) =>
    rows.map((r) => (typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload));

  const projects = parsePayload((await p.query('SELECT payload FROM projects')).rows);
  const schedule = parsePayload((await p.query('SELECT payload FROM schedule_items')).rows);
  const labEquipment = parsePayload((await p.query('SELECT payload FROM lab_equipment')).rows);
  const partnerships = parsePayload((await p.query('SELECT payload FROM partnerships')).rows);
  const schools = parsePayload((await p.query('SELECT payload FROM schools')).rows);

  const messagesRes = await p.query('SELECT * FROM messages');
  const messages: Message[] = messagesRes.rows.map((m) => ({
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

  const enrollRes = await p.query('SELECT * FROM enrollments');
  const enrollmentRequests: EnrollmentRequest[] = enrollRes.rows.map((e) => ({
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

  const attRes = await p.query('SELECT * FROM attendance');
  const attendance: AttendanceRecord[] = attRes.rows.map((a) => ({
    id: String(a.id),
    districtId: String(a.district_id),
    studentId: String(a.student_id),
    circleId: String(a.circle_id),
    date: String(a.date),
    present: Boolean(a.present),
    note: a.note ? String(a.note) : undefined,
  }));

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

export async function writeAllToPg(data: DbData) {
  const p = getPool();
  const client = await p.connect();
  const did = DEFAULT_DISTRICT_ID;
  try {
    await client.query('BEGIN');
    for (const t of [
      'student_circles',
      'payment_events',
      'payments',
      'attendance',
      'enrollments',
      'messages',
      'projects',
      'schedule_items',
      'lab_equipment',
      'partnerships',
      'schools',
      'students',
      'circles',
      'teachers',
      'parent_pins',
      'users',
      'center_info',
      'districts',
    ]) {
      await client.query(`DELETE FROM ${t}`);
    }

    const districts: District[] = data.districts?.length
      ? data.districts
      : [{ id: did, name: 'Qamashi tumani', region: DEFAULT_REGION_NAME, regionId: DEFAULT_REGION_ID, code: 'qamashi' }];

    for (const d of districts) {
      await client.query(
        'INSERT INTO districts (id, name, region, code, region_id) VALUES ($1, $2, $3, $4, $5)',
        [d.id, d.name, d.region, d.code, d.regionId || DEFAULT_REGION_ID]
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
      await client.query('INSERT INTO center_info (district_id, payload) VALUES ($1, $2::jsonb)', [
        cid,
        JSON.stringify({ ...ci, districtId: cid }),
      ]);
    }

    for (const u of data.users || []) {
      await client.query(
        `INSERT INTO users (id, district_id, username, password_hash, full_name, role, teacher_id, phone, region_id, blocked)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          u.id,
          u.districtId || null,
          u.username,
          u.passwordHash,
          u.fullName,
          u.role,
          u.teacherId || null,
          u.phone || null,
          u.regionId || (u.role === 'superadmin' ? DEFAULT_REGION_ID : null),
          !!u.blocked,
        ]
      );
    }

    for (const [phone, hash] of Object.entries(data.parentPins || {})) {
      await client.query(
        'INSERT INTO parent_pins (phone_norm, district_id, pin_hash) VALUES ($1, $2, $3)',
        [phone, did, hash]
      );
    }

    for (const t of data.teachers || []) {
      await client.query('INSERT INTO teachers (id, district_id, payload) VALUES ($1, $2, $3::jsonb)', [
        t.id,
        t.districtId || did,
        JSON.stringify({ ...t, districtId: t.districtId || did }),
      ]);
    }

    for (const c of data.circles || []) {
      await client.query(
        `INSERT INTO circles (
          id, district_id, name, category, teacher, teacher_id, capacity, enrolled, schedule, location,
          fee, status, description, is_network, is_inclusive, school, age_range, progress
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
        [
          c.id,
          c.districtId || did,
          c.name,
          c.category,
          c.teacher,
          c.teacherId,
          c.capacity,
          c.enrolled,
          c.schedule,
          c.location,
          c.fee,
          c.status,
          c.description,
          Boolean(c.isNetwork),
          Boolean(c.isInclusive),
          c.school || null,
          c.ageRange,
          c.progress,
        ]
      );
    }

    for (const s of data.students || []) {
      await client.query(
        `INSERT INTO students (
          id, district_id, first_name, last_name, age, school, grade, parent_name, parent_phone,
          status, enrolled_at, achievements, social_registry, inclusive_needs, subsidy
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [
          s.id,
          s.districtId || did,
          s.firstName,
          s.lastName,
          s.age,
          s.school,
          s.grade,
          s.parentName,
          s.parentPhone,
          s.status,
          s.enrolledAt,
          s.achievements,
          Boolean(s.socialRegistry),
          s.inclusiveNeeds || null,
          Boolean(s.subsidy),
        ]
      );
      for (const cid of s.circleIds || []) {
        await client.query(
          'INSERT INTO student_circles (student_id, circle_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [s.id, cid]
        );
      }
    }

    for (const pay of data.payments || []) {
      await client.query(
        `INSERT INTO payments (
          id, district_id, student_id, student_name, circle_id, circle_name, amount, month, status, paid_at, provider, provider_txn
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          pay.id,
          pay.districtId || did,
          pay.studentId,
          pay.studentName,
          pay.circleId,
          pay.circleName,
          pay.amount,
          pay.month,
          pay.status,
          pay.paidAt || null,
          pay.provider || null,
          pay.providerTxn || null,
        ]
      );
    }

    for (const proj of data.projects || []) {
      await client.query('INSERT INTO projects (id, district_id, payload) VALUES ($1, $2, $3::jsonb)', [
        proj.id,
        proj.districtId || did,
        JSON.stringify(proj),
      ]);
    }
    for (const s of data.schedule || []) {
      await client.query(
        'INSERT INTO schedule_items (id, district_id, payload) VALUES ($1, $2, $3::jsonb)',
        [s.id, s.districtId || did, JSON.stringify(s)]
      );
    }
    for (const m of data.messages || []) {
      await client.query(
        `INSERT INTO messages (
          id, district_id, title, content, type, date, read, from_name, from_role, from_user_id, to_audience, to_user_id, to_name
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          m.id,
          m.districtId || did,
          m.title,
          m.content,
          m.type,
          m.date,
          Boolean(m.read),
          m.fromName || null,
          m.fromRole || null,
          m.fromUserId || null,
          m.toAudience || null,
          m.toUserId || null,
          m.toName || null,
        ]
      );
    }
    for (const e of data.enrollmentRequests || []) {
      await client.query(
        `INSERT INTO enrollments (
          id, district_id, first_name, last_name, age, school, grade, parent_name, parent_phone,
          circle_id, circle_name, status, submitted_at, note, social_registry, subsidy
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [
          e.id,
          e.districtId || did,
          e.firstName,
          e.lastName,
          e.age,
          e.school,
          e.grade,
          e.parentName,
          e.parentPhone,
          e.circleId,
          e.circleName,
          e.status,
          e.submittedAt,
          e.note || null,
          Boolean(e.socialRegistry),
          Boolean(e.subsidy),
        ]
      );
    }
    for (const a of data.attendance || []) {
      await client.query(
        `INSERT INTO attendance (id, district_id, student_id, circle_id, date, present, note)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [a.id, a.districtId || did, a.studentId, a.circleId, a.date, Boolean(a.present), a.note || null]
      );
    }
    for (const l of data.labEquipment || []) {
      await client.query(
        'INSERT INTO lab_equipment (id, district_id, payload) VALUES ($1, $2, $3::jsonb)',
        [l.id, l.districtId || did, JSON.stringify(l)]
      );
    }
    for (const part of data.partnerships || []) {
      await client.query(
        'INSERT INTO partnerships (id, district_id, payload) VALUES ($1, $2, $3::jsonb)',
        [part.id, part.districtId || did, JSON.stringify(part)]
      );
    }
    for (const s of data.schools || []) {
      await client.query('INSERT INTO schools (id, district_id, payload) VALUES ($1, $2, $3::jsonb)', [
        s.id,
        s.districtId || did,
        JSON.stringify(s),
      ]);
    }

    await client.query(
      `INSERT INTO meta (key, value) VALUES ('relational_v1', '1')
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`
    );
    if (data.parentPinHints && Object.keys(data.parentPinHints).length) {
      await client.query(
        `INSERT INTO meta (key, value) VALUES ('parent_pin_hints', $1)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [JSON.stringify(data.parentPinHints)]
      );
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function insertAuditPg(entry: {
  districtId?: string;
  userId?: string;
  action: string;
  resource?: string;
  meta?: Record<string, unknown>;
}) {
  await getPool().query(
    `INSERT INTO audit_logs (district_id, user_id, action, resource, meta, created_at)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
    [
      entry.districtId || null,
      entry.userId || null,
      entry.action,
      entry.resource || null,
      entry.meta ? JSON.stringify(entry.meta) : null,
      new Date().toISOString(),
    ]
  );
}

export async function updatePaymentStatusPg(
  id: string,
  status: string,
  extra?: { paidAt?: string; provider?: string; providerTxn?: string }
) {
  await getPool().query(
    `UPDATE payments SET status = $1,
     paid_at = COALESCE($2, paid_at),
     provider = COALESCE($3, provider),
     provider_txn = COALESCE($4, provider_txn)
     WHERE id = $5`,
    [status, extra?.paidAt || null, extra?.provider || null, extra?.providerTxn || null, id]
  );
}

export async function addPaymentEventPg(ev: {
  id: string;
  paymentId: string;
  provider: string;
  eventType: string;
  payload: unknown;
}) {
  await getPool().query(
    `INSERT INTO payment_events (id, payment_id, provider, event_type, payload, created_at)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
    [ev.id, ev.paymentId, ev.provider, ev.eventType, JSON.stringify(ev.payload), new Date().toISOString()]
  );
}

export async function upsertPaymentPg(pay: Payment) {
  const did = pay.districtId || DEFAULT_DISTRICT_ID;
  await getPool().query(
    `INSERT INTO payments (
      id, district_id, student_id, student_name, circle_id, circle_name, amount, month, status, paid_at, provider, provider_txn
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    ON CONFLICT (id) DO UPDATE SET
      status = EXCLUDED.status, paid_at = EXCLUDED.paid_at, provider = EXCLUDED.provider,
      provider_txn = EXCLUDED.provider_txn, amount = EXCLUDED.amount,
      student_name = EXCLUDED.student_name, circle_name = EXCLUDED.circle_name`,
    [
      pay.id,
      did,
      pay.studentId,
      pay.studentName,
      pay.circleId,
      pay.circleName,
      pay.amount,
      pay.month,
      pay.status,
      pay.paidAt || null,
      pay.provider || null,
      pay.providerTxn || null,
    ]
  );
}
