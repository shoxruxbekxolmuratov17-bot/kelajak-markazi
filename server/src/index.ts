import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { backupNow, insertAudit, loadDb, mutate, initDb, dbBackend, flushDb, shutdownDb, findUserByUsername } from './db.js';
import { repo } from './repo/index.js';
import {
  authRequired,
  getUser,
  optionalAuth,
  publicUser,
  requireRoles,
  signToken,
} from './auth.js';
import { config } from './config.js';
import { bumpMetric, getMetrics, logJson, metricsMiddleware } from './metrics.js';
import { rateLimit } from './rateLimit.js';
import { initRedis, cacheMode, queuePush } from './redis.js';
import { requestOtp, verifyOtp } from './otp.js';
import {
  clickSignOk,
  createPaymentIntent,
  handleClickWebhook,
  handlePaymeWebhook,
  markPaidFromProvider,
  uid,
  verifyPaymeAuth,
} from './payments.js';
import {
  DEFAULT_TEACHER_PASSWORD,
  hashPassword,
  suggestUsername,
  toStaffAccount,
} from './users.js';
import { listParentAccounts, saveParentPin } from './parents.js';
import type { DbUser, StaffAccount } from './types.js';
import {
  districtsForUser,
  inDistrictScope,
  normalizePhone,
  resolveCenterInfo,
  scopeCircles,
  scopeMessages,
  scopeStudents,
  teacherOwnsStudent,
} from './scope.js';
import {
  DEFAULT_DISTRICT_ID,
  DEFAULT_REGION_ID,
  MONTHLY_FEE,
  type AuthUser,
  type AttendanceRecord,
  type Message,
} from './types.js';
import type { Request, Response } from 'express';

const app = express();
const DEMO_MODE = config.demoMode;

app.set('trust proxy', 1);
app.use(
  cors({
    origin: config.corsOrigin === true ? true : config.corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(metricsMiddleware);
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'kelajak-markazi-api',
    demoMode: DEMO_MODE,
    db: dbBackend() === 'postgres' ? 'postgres' : 'sqlite-relational',
    cache: cacheMode(),
    smsProvider: config.smsProvider,
    paymentsSandbox: !(config.click.merchantId && config.payme.merchantId),
  });
});

app.get('/api/metrics', authRequired, requireRoles('superadmin', 'district_admin', 'admin'), (_req, res) => {
  res.json(getMetrics());
});

app.get('/api/districts', authRequired, requireRoles('superadmin', 'district_admin', 'admin'), (req, res) => {
  res.json(districtsForUser(getUser(req)));
});

app.post('/api/admin/backup', authRequired, requireRoles('superadmin', 'district_admin', 'admin'), (_req, res) => {
  const dest = backupNow();
  res.json({ ok: true, path: dest });
});

app.post(
  '/api/auth/login',
  rateLimit({ key: 'login', limit: 20, windowSec: 60 }),
  (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) return res.status(400).json({ error: 'Login va parol kerak' });
  const user = findUserByUsername(username);
  if (!user || !bcrypt.compareSync(password.trim(), user.passwordHash)) {
    return res.status(401).json({ error: "Login yoki parol noto'g'ri" });
  }
  if (user.blocked) {
    return res.status(403).json({ error: 'Akkaunt bloklangan. Direktor bilan bog‘laning.' });
  }
  bumpMetric('logins');
  const auth = publicUser(user);
  res.json({ token: signToken(auth), user: auth, demoMode: DEMO_MODE });
});

app.post(
  '/api/auth/parent',
  rateLimit({ key: 'parent-login', limit: 20, windowSec: 60 }),
  (req, res) => {
  const phone = String(req.body?.phone || '').trim();
  const pin = String(req.body?.pin || '').trim();
  if (!phone) return res.status(400).json({ error: 'Telefon kerak' });
  if (!pin || pin.length < 4) return res.status(400).json({ error: 'PIN kod kerak (kamida 4 raqam)' });

  const db = loadDb();
  const normalized = normalizePhone(phone);
  if (normalized.length < 9) {
    return res.status(400).json({ error: "Telefon raqam noto'g'ri" });
  }

  const hasChild = db.students.some((s) => normalizePhone(s.parentPhone) === normalized);
  const hasPending = db.enrollmentRequests.some(
    (e) => normalizePhone(e.parentPhone) === normalized && e.status === 'pending'
  );
  const hasPin = !!(db.parentPins && db.parentPins[normalized]);

  // Ro'yxatdan o'tgan yoki farzandi bor ota-ona kira oladi
  if (!hasChild && !hasPending && !hasPin) {
    return res.status(404).json({
      error: "Bu telefon topilmadi. Avval /royxat orqali ro'yxatdan o'ting.",
    });
  }

  if (!db.parentPins) db.parentPins = {};
  let pinHash = db.parentPins[normalized];
  if (!pinHash) {
    pinHash = bcrypt.hashSync(pin, 10);
    mutate((d) => {
      saveParentPin(d, normalized, pin, pinHash!);
    });
  } else if (!bcrypt.compareSync(pin, pinHash)) {
    return res.status(401).json({ error: "PIN kod noto'g'ri" });
  }

  const child = db.students.find((s) => normalizePhone(s.parentPhone) === normalized);
  const pending = db.enrollmentRequests.find(
    (e) => normalizePhone(e.parentPhone) === normalized
  );
  bumpMetric('logins');
  const auth: AuthUser = {
    id: `parent-${normalized}`,
    username: phone,
    fullName: child?.parentName || pending?.parentName || 'Ota-ona',
    role: 'parent',
    phone,
    districtId: child?.districtId || pending?.districtId || DEFAULT_DISTRICT_ID,
  };
  res.json({ token: signToken(auth), user: auth, demoMode: DEMO_MODE });
});

app.post(
  '/api/auth/parent/otp/request',
  rateLimit({ key: 'otp', limit: 5, windowSec: 60 }),
  async (req, res) => {
    try {
      const phone = String(req.body?.phone || '');
      const districtId = String(req.body?.districtId || DEFAULT_DISTRICT_ID);
      const result = await requestOtp(phone, districtId);
      res.json(result);
    } catch (e) {
      res.status(400).json({ error: e instanceof Error ? e.message : 'OTP xato' });
    }
  }
);

app.post(
  '/api/auth/parent/otp/verify',
  rateLimit({ key: 'otp-verify', limit: 10, windowSec: 60 }),
  async (req, res) => {
    const phone = String(req.body?.phone || '');
    const code = String(req.body?.code || '');
    const districtId = String(req.body?.districtId || DEFAULT_DISTRICT_ID);
    const ok = await verifyOtp(phone, code, districtId);
    if (!ok) return res.status(401).json({ error: 'OTP noto‘g‘ri yoki muddati o‘tgan' });
    res.json({ ok: true });
  }
);

app.post('/api/auth/parent/pin/change', authRequired, requireRoles('parent'), async (req, res) => {
  const user = getUser(req)!;
  const oldPin = String(req.body?.oldPin || '');
  const newPin = String(req.body?.newPin || '');
  const otp = String(req.body?.otp || '');
  if (!newPin || newPin.length < 4) {
    return res.status(400).json({ error: 'Yangi PIN kamida 4 raqam' });
  }
  const phone = normalizePhone(user.phone || '');
  const db = loadDb();
  const current = db.parentPins[phone];
  let allowed = false;
  if (oldPin && current && bcrypt.compareSync(oldPin, current)) allowed = true;
  if (!allowed && otp) {
    allowed = await verifyOtp(phone, otp, user.districtId || DEFAULT_DISTRICT_ID);
  }
  if (!allowed) return res.status(401).json({ error: 'Eski PIN yoki OTP noto‘g‘ri' });
  mutate((d) => {
    saveParentPin(d, phone, newPin, bcrypt.hashSync(newPin, 10));
  });
  insertAudit({
    districtId: user.districtId,
    userId: user.id,
    action: 'parent.pin_change',
    resource: phone,
  });
  res.json({ ok: true });
});

app.get('/api/auth/me', authRequired, (req, res) => {
  const user = getUser(req)!;
  res.json({ user: publicUser(user) });
});

app.get('/api/bootstrap', optionalAuth, (req, res) => {
  const db = loadDb();
  const user = getUser(req);
  const publicCircles = db.circles.filter((c) => !c.isNetwork || c.status === 'active').map((c) => ({
    id: c.id,
    name: c.name,
    category: c.category,
    capacity: c.capacity,
    enrolled: c.enrolled,
    ageRange: c.ageRange,
    fee: c.fee,
    status: c.status,
    description: c.description,
  }));

  if (!user) {
    const open = db.circles
      .filter((c) => !c.isNetwork && (c.status === 'active' || c.status === 'planned') && c.enrolled < c.capacity)
      .sort((a, b) => {
        const aActive = a.enrolled > 0 ? 1 : 0;
        const bActive = b.enrolled > 0 ? 1 : 0;
        if (bActive !== aActive) return bActive - aActive;
        return b.enrolled - a.enrolled || a.name.localeCompare(b.name, 'uz');
      })
      .map((c) => ({
        id: c.id,
        name: c.name,
        category: c.category,
        capacity: c.capacity,
        enrolled: c.enrolled,
        ageRange: c.ageRange,
        fee: c.fee,
        status: c.status === 'planned' ? 'active' : c.status,
        description: c.description,
        schedule: c.schedule,
        location: c.location,
        teacher: c.teacher,
        teacherId: c.teacherId,
        isNetwork: c.isNetwork,
        isInclusive: c.isInclusive,
        progress: c.progress,
      }));
    return res.json({
      centerInfo: db.centerInfo,
      circles: open,
    });
  }

  res.json({
    centerInfo: resolveCenterInfo(user),
    circles: scopeCircles(req),
    students: scopeStudents(req),
    teachers:
      user.role === 'teacher' && user.teacherId
        ? inDistrictScope(db.teachers, user).filter((t) => t.id === user.teacherId)
        : inDistrictScope(db.teachers, user),
    payments: user.role === 'parent'
      ? db.payments.filter((p) => scopeStudents(req).some((s) => s.id === p.studentId))
      : inDistrictScope(db.payments, user),
    projects: user.role === 'parent'
      ? db.projects.filter((p) => scopeStudents(req).some((s) => s.id === p.studentId))
      : inDistrictScope(db.projects, user),
    schedule: inDistrictScope(db.schedule, user),
    messages: scopeMessages(req),
    enrollmentRequests:
      user.role === 'admin' || user.role === 'district_admin' || user.role === 'superadmin'
        ? inDistrictScope(db.enrollmentRequests, user)
        : [],
    attendance: user.role === 'parent'
      ? db.attendance.filter((a) => scopeStudents(req).some((s) => s.id === a.studentId))
      : inDistrictScope(db.attendance, user),
    labEquipment: inDistrictScope(db.labEquipment, user),
    partnerships: inDistrictScope(db.partnerships, user),
    schools: inDistrictScope(db.schools, user),
    districts: districtsForUser(user),
    region: user.role === 'superadmin'
      ? { id: user.regionId || 'r-qashqadaryo', name: 'Qashqadaryo viloyati' }
      : undefined,
  });
});

app.get('/api/stats/inclusive', authRequired, requireRoles('superadmin', 'district_admin', 'admin'), (req, res) => {
  const students = scopeStudents(req);
  const registry = students.filter((s) => s.socialRegistry);
  const subsidy = students.filter((s) => s.subsidy);
  const inclusiveCircles = scopeCircles(req).filter((c) => c.isInclusive);
  res.json({
    socialRegistryCount: registry.length,
    subsidyCount: subsidy.length,
    inclusiveCircles: inclusiveCircles.length,
    students: registry.map((s) => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      subsidy: !!s.subsidy,
      inclusiveNeeds: s.inclusiveNeeds,
      circleIds: s.circleIds,
    })),
  });
});

app.get('/api/stats/dashboard', authRequired, (req, res) => {
  const db = loadDb();
  const circles = scopeCircles(req);
  const students = scopeStudents(req);
  const present = db.attendance.filter((a) => a.present).length;
  const totalAtt = db.attendance.length;
  const attendanceRate = totalAtt ? Math.round((present / totalAtt) * 100) : 0;
  const monthlyRevenue = db.payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const byCategory: Record<string, number> = {};
  for (const c of circles) {
    byCategory[c.category] = (byCategory[c.category] || 0) + c.enrolled;
  }
  const categoryDistribution = Object.entries(byCategory).map(([name, value]) => ({ name, value }));
  const weeks: Record<string, { present: number; total: number }> = {};
  for (const a of db.attendance) {
    const d = new Date(a.date);
    const week = `W${Math.ceil(d.getDate() / 7)}`;
    if (!weeks[week]) weeks[week] = { present: 0, total: 0 };
    weeks[week].total += 1;
    if (a.present) weeks[week].present += 1;
  }
  const attendanceData = Object.entries(weeks).map(([week, v]) => ({
    week,
    rate: v.total ? Math.round((v.present / v.total) * 100) : 0,
  }));

  res.json({
    totalStudents: students.length,
    totalCircles: circles.length,
    activeCircles: circles.filter((c) => c.status === 'active').length,
    networkCircles: circles.filter((c) => c.isNetwork).length,
    monthlyRevenue,
    attendanceRate,
    newEnrollments: db.enrollmentRequests.filter((e) => e.status === 'pending').length,
    completedProjects: db.projects.filter((p) => p.status === 'completed').length,
    categoryDistribution,
    attendanceData,
  });
});

// Circles
app.get('/api/circles', optionalAuth, (req, res) => {
  const db = loadDb();
  if (!getUser(req)) {
    return res.json(db.circles.filter((c) => c.status !== 'paused'));
  }
  res.json(scopeCircles(req));
});

app.post('/api/circles', authRequired, requireRoles('superadmin', 'district_admin', 'admin'), async (req, res) => {
  const user = getUser(req)!;
  const circle = {
    ...req.body,
    id: uid('c'),
    enrolled: req.body.enrolled ?? 0,
    progress: req.body.progress ?? 0,
    districtId: req.body.districtId || user.districtId || DEFAULT_DISTRICT_ID,
  };
  repo.upsertCircle(circle);
  await flushDb();
  res.status(201).json(circle);
});

app.put('/api/circles/:id', authRequired, requireRoles('superadmin', 'district_admin', 'admin', 'teacher'), (req, res) => {
  const user = getUser(req)!;
  const db = loadDb();
  const i = db.circles.findIndex((c) => c.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'Not found yoki ruxsat yo\'q' });
  if (user.role === 'teacher' && db.circles[i].teacherId !== user.teacherId) {
    return res.status(404).json({ error: 'Not found yoki ruxsat yo\'q' });
  }
  const body = { ...req.body } as Record<string, unknown>;
  // O‘qituvchi to‘garak egasini o‘zgartira olmaydi
  if (user.role === 'teacher') {
    delete body.teacherId;
    delete body.teacher;
    delete body.districtId;
  }
  const updated = {
    ...db.circles[i],
    ...body,
    id: db.circles[i].id,
    teacherId: db.circles[i].teacherId,
    teacher: user.role === 'teacher' ? db.circles[i].teacher : (body.teacher as string) ?? db.circles[i].teacher,
  };
  if (user.role !== 'teacher' && typeof body.teacherId === 'string') {
    updated.teacherId = body.teacherId;
  }
  repo.upsertCircle(updated);
  res.json(updated);
});

app.delete('/api/circles/:id', authRequired, requireRoles('superadmin', 'district_admin', 'admin'), (req, res) => {
  repo.deleteCircle(String(req.params.id));
  res.json({ ok: true });
});

// Students
app.get('/api/students', authRequired, (req, res) => res.json(scopeStudents(req)));

app.post('/api/students', authRequired, requireRoles('superadmin', 'district_admin', 'admin', 'teacher'), async (req, res) => {
  const user = getUser(req)!;
  const db = loadDb();
  let circleIds: string[] = Array.isArray(req.body.circleIds) ? [...req.body.circleIds] : [];
  if (user.role === 'teacher') {
    if (!user.teacherId) return res.status(403).json({ error: 'Forbidden' });
    const mine = new Set(db.circles.filter((c) => c.teacherId === user.teacherId).map((c) => c.id));
    circleIds = circleIds.filter((id) => mine.has(id));
    if (!circleIds.length) {
      return res.status(400).json({ error: 'Faqat o‘z to‘garagingizdagi o‘quvchini qo‘shishingiz mumkin' });
    }
  }
  const student = {
    ...req.body,
    circleIds,
    id: uid('s'),
    achievements: req.body.achievements ?? 0,
    enrolledAt: req.body.enrolledAt || new Date().toISOString().slice(0, 10),
    districtId: req.body.districtId || user.districtId || DEFAULT_DISTRICT_ID,
  };
  repo.upsertStudent(student);
  await flushDb();
  res.status(201).json(student);
});

app.put('/api/students/:id', authRequired, requireRoles('superadmin', 'district_admin', 'admin', 'teacher'), (req, res) => {
  const user = getUser(req)!;
  const db = loadDb();
  const i = db.students.findIndex((s) => s.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'Not found yoki ruxsat yo\'q' });
  if (!teacherOwnsStudent(user, db.students[i])) {
    return res.status(404).json({ error: 'Not found yoki ruxsat yo\'q' });
  }
  const body = { ...req.body } as Record<string, unknown>;
  if (user.role === 'teacher') {
    const mine = new Set(db.circles.filter((c) => c.teacherId === user.teacherId).map((c) => c.id));
    if (Array.isArray(body.circleIds)) {
      body.circleIds = (body.circleIds as string[]).filter((id) => mine.has(id));
      if (!(body.circleIds as string[]).length) {
        return res.status(400).json({ error: 'Kamida bitta o‘z to‘garagingiz bo‘lishi kerak' });
      }
    }
    delete body.districtId;
  }
  const updated = { ...db.students[i], ...body, id: db.students[i].id };
  repo.upsertStudent(updated);
  res.json(updated);
});

app.delete('/api/students/:id', authRequired, requireRoles('superadmin', 'district_admin', 'admin'), (req, res) => {
  repo.deleteStudent(String(req.params.id));
  res.json({ ok: true });
});

// Teachers
app.get('/api/teachers', authRequired, (_req, res) => res.json(loadDb().teachers));

app.post('/api/teachers', authRequired, requireRoles('superadmin', 'district_admin', 'admin'), async (req, res) => {
  const teacher = { ...req.body, id: uid('t'), circleIds: req.body.circleIds ?? [], rating: req.body.rating ?? 5, isInclusive: !!req.body.isInclusive };
  mutate((db) => { db.teachers.push(teacher); });
  await flushDb();
  res.status(201).json(teacher);
});

app.put('/api/teachers/:id', authRequired, requireRoles('superadmin', 'district_admin', 'admin'), (req, res) => {
  let updated = null as unknown;
  mutate((db) => {
    const i = db.teachers.findIndex((t) => t.id === req.params.id);
    if (i < 0) return;
    db.teachers[i] = { ...db.teachers[i], ...req.body, id: db.teachers[i].id };
    updated = db.teachers[i];
  });
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

app.delete('/api/teachers/:id', authRequired, requireRoles('superadmin', 'district_admin', 'admin'), (req, res) => {
  mutate((db) => { db.teachers = db.teachers.filter((t) => t.id !== req.params.id); });
  res.json({ ok: true });
});

// Staff login accounts (direktor boshqaruvi)
app.get('/api/users', authRequired, requireRoles('superadmin', 'district_admin', 'admin'), (req, res) => {
  const user = getUser(req)!;
  const db = loadDb();
  let list = db.users.filter((u) => u.role === 'teacher' || u.role === 'district_admin' || u.role === 'admin');
  if (user.role === 'district_admin' || user.role === 'admin') {
    const did = user.districtId || DEFAULT_DISTRICT_ID;
    list = list.filter((u) => !u.districtId || u.districtId === did);
  } else if (user.role === 'superadmin') {
    const hdr = req.headers['x-district-id'];
    const did = Array.isArray(hdr) ? hdr[0] : hdr;
    if (did && did !== 'all' && did !== '*') {
      list = list.filter((u) => !u.districtId || u.districtId === did);
    }
  }
  res.json(list.map((u) => ({ ...toStaffAccount(u), defaultPassword: DEFAULT_TEACHER_PASSWORD })));
});

app.get('/api/users/suggest-username', authRequired, requireRoles('superadmin', 'district_admin', 'admin'), (req, res) => {
  const fullName = String(req.query.fullName || '');
  const existing = new Set(loadDb().users.map((u) => u.username.toLowerCase()));
  res.json({ username: suggestUsername(fullName, existing) });
});

app.post('/api/users', authRequired, requireRoles('superadmin', 'district_admin', 'admin'), async (req, res) => {
  const actor = getUser(req)!;
  const db = loadDb();
  const username = String(req.body?.username || '').trim().toLowerCase();
  const password = String(req.body?.password || '').trim() || DEFAULT_TEACHER_PASSWORD;
  const fullName = String(req.body?.fullName || '').trim();
  const teacherId = req.body?.teacherId ? String(req.body.teacherId) : undefined;
  const phone = req.body?.phone ? String(req.body.phone) : undefined;
  const role = (req.body?.role === 'district_admin' ? 'district_admin' : 'teacher') as DbUser['role'];

  if (!username || username.length < 3) {
    return res.status(400).json({ error: 'Login kamida 3 belgi bo‘lishi kerak' });
  }
  if (!fullName) return res.status(400).json({ error: 'F.I.Sh. kerak' });
  if (password.length < 4) return res.status(400).json({ error: 'Parol kamida 4 belgi' });
  if (db.users.some((u) => u.username.toLowerCase() === username)) {
    return res.status(409).json({ error: 'Bu login band' });
  }
  if (teacherId && db.users.some((u) => u.teacherId === teacherId && u.role === 'teacher')) {
    return res.status(409).json({ error: 'Bu o‘qituvchida allaqachon akkaunt bor' });
  }
  if (teacherId && !db.teachers.some((t) => t.id === teacherId)) {
    return res.status(400).json({ error: 'O‘qituvchi topilmadi' });
  }

  const districtId =
    actor.role === 'superadmin'
      ? String(req.body?.districtId || actor.districtId || DEFAULT_DISTRICT_ID)
      : actor.districtId || DEFAULT_DISTRICT_ID;

  const created: DbUser = {
    id: uid('u'),
    username,
    passwordHash: hashPassword(password),
    fullName,
    role,
    teacherId,
    phone,
    districtId,
    regionId: actor.regionId || DEFAULT_REGION_ID,
    blocked: false,
  };
  mutate((d) => {
    d.users.push(created);
  });
  await flushDb();
  insertAudit({
    districtId,
    userId: actor.id,
    action: 'user.create',
    resource: created.id,
    meta: { username, teacherId },
  });
  const account: StaffAccount = toStaffAccount(created);
  res.status(201).json({ ...account, tempPassword: password });
});

app.put('/api/users/:id', authRequired, requireRoles('superadmin', 'district_admin', 'admin'), async (req, res) => {
  const actor = getUser(req)!;
  const db = loadDb();
  const i = db.users.findIndex((u) => u.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'Topilmadi' });
  const target = db.users[i];
  if (target.role === 'superadmin') return res.status(403).json({ error: 'Forbidden' });
  if (
    (actor.role === 'district_admin' || actor.role === 'admin') &&
    target.districtId &&
    target.districtId !== actor.districtId
  ) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const username = req.body?.username != null ? String(req.body.username).trim().toLowerCase() : target.username;
  if (username.length < 3) return res.status(400).json({ error: 'Login kamida 3 belgi' });
  if (db.users.some((u) => u.id !== target.id && u.username.toLowerCase() === username)) {
    return res.status(409).json({ error: 'Bu login band' });
  }

  const teacherId =
    req.body?.teacherId !== undefined
      ? req.body.teacherId
        ? String(req.body.teacherId)
        : undefined
      : target.teacherId;
  if (
    teacherId &&
    db.users.some((u) => u.id !== target.id && u.teacherId === teacherId && u.role === 'teacher')
  ) {
    return res.status(409).json({ error: 'Bu o‘qituvchida boshqa akkaunt bor' });
  }

  const updated: DbUser = {
    ...target,
    username,
    fullName: req.body?.fullName != null ? String(req.body.fullName).trim() : target.fullName,
    phone: req.body?.phone !== undefined ? (req.body.phone ? String(req.body.phone) : undefined) : target.phone,
    teacherId,
    blocked: req.body?.blocked !== undefined ? !!req.body.blocked : target.blocked,
  };
  mutate((d) => {
    d.users[i] = updated;
  });
  await flushDb();
  res.json(toStaffAccount(updated));
});

app.put('/api/users/:id/password', authRequired, requireRoles('superadmin', 'district_admin', 'admin'), async (req, res) => {
  const actor = getUser(req)!;
  const password = String(req.body?.password || '').trim();
  if (password.length < 4) return res.status(400).json({ error: 'Parol kamida 4 belgi' });
  const db = loadDb();
  const i = db.users.findIndex((u) => u.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'Topilmadi' });
  const target = db.users[i];
  if (target.role === 'superadmin') return res.status(403).json({ error: 'Forbidden' });
  if (
    (actor.role === 'district_admin' || actor.role === 'admin') &&
    target.districtId &&
    target.districtId !== actor.districtId
  ) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  mutate((d) => {
    d.users[i] = { ...d.users[i], passwordHash: hashPassword(password) };
  });
  await flushDb();
  insertAudit({
    districtId: target.districtId,
    userId: actor.id,
    action: 'user.password',
    resource: target.id,
  });
  res.json({ ok: true });
});

app.post('/api/users/:id/block', authRequired, requireRoles('superadmin', 'district_admin', 'admin'), async (req, res) => {
  const actor = getUser(req)!;
  const blocked = req.body?.blocked !== undefined ? !!req.body.blocked : true;
  const db = loadDb();
  const i = db.users.findIndex((u) => u.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'Topilmadi' });
  const target = db.users[i];
  if (target.id === actor.id) return res.status(400).json({ error: 'O‘zingizni bloklay olmaysiz' });
  if (target.role === 'superadmin') return res.status(403).json({ error: 'Forbidden' });
  if (
    (actor.role === 'district_admin' || actor.role === 'admin') &&
    target.districtId &&
    target.districtId !== actor.districtId
  ) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  mutate((d) => {
    d.users[i] = { ...d.users[i], blocked };
  });
  await flushDb();
  res.json(toStaffAccount({ ...target, blocked }));
});

app.delete('/api/users/:id', authRequired, requireRoles('superadmin', 'district_admin', 'admin'), async (req, res) => {
  const actor = getUser(req)!;
  const db = loadDb();
  const target = db.users.find((u) => u.id === req.params.id);
  if (!target) return res.status(404).json({ error: 'Topilmadi' });
  if (target.id === actor.id) return res.status(400).json({ error: 'O‘zingizni o‘chira olmaysiz' });
  if (target.role !== 'teacher') {
    return res.status(400).json({ error: 'Faqat o‘qituvchi akkauntlarini o‘chirish mumkin' });
  }
  if (
    (actor.role === 'district_admin' || actor.role === 'admin') &&
    target.districtId &&
    target.districtId !== actor.districtId
  ) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  mutate((d) => {
    d.users = d.users.filter((u) => u.id !== target.id);
  });
  await flushDb();
  res.json({ ok: true });
});

// Ota-onalar (direktor boshqaruvi)
app.get('/api/parents', authRequired, requireRoles('superadmin', 'district_admin', 'admin'), (req, res) => {
  const user = getUser(req)!;
  const db = loadDb();
  const did = user.districtId || DEFAULT_DISTRICT_ID;
  let list = listParentAccounts(db, user.role === 'superadmin' && !user.districtId ? undefined : did);
  if (user.role === 'superadmin') {
    const hdr = req.headers['x-district-id'];
    const filterDid = Array.isArray(hdr) ? hdr[0] : hdr;
    if (filterDid && filterDid !== 'all' && filterDid !== '*') {
      list = list.filter((p) => !p.districtId || p.districtId === filterDid);
    }
  }
  res.json(list);
});

app.put('/api/parents/:phoneNorm/pin', authRequired, requireRoles('superadmin', 'district_admin', 'admin'), async (req, res) => {
  const pin = String(req.body?.pin || '').trim();
  if (pin.length < 4) return res.status(400).json({ error: 'PIN kamida 4 raqam' });
  const phoneNorm = String(req.params.phoneNorm).replace(/\D/g, '');
  if (phoneNorm.length < 9) return res.status(400).json({ error: "Telefon noto'g'ri" });
  mutate((d) => {
    saveParentPin(d, phoneNorm, pin, hashPassword(pin));
  });
  await flushDb();
  res.json({ ok: true, pin });
});

// Payments
app.get('/api/payments', authRequired, (req, res) => {
  const db = loadDb();
  const user = getUser(req)!;
  if (user.role === 'parent') {
    const ids = new Set(scopeStudents(req).map((s) => s.id));
    return res.json(db.payments.filter((p) => ids.has(p.studentId)));
  }
  res.json(db.payments);
});

app.put('/api/payments/:id', authRequired, requireRoles('superadmin', 'district_admin', 'admin'), (req, res) => {
  const user = getUser(req)!;
  const db = loadDb();
  const i = db.payments.findIndex((p) => p.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'Not found' });
  const updated = { ...db.payments[i], ...req.body, id: db.payments[i].id };
  repo.upsertPayment(updated);
  insertAudit({
    districtId: user.districtId,
    userId: user.id,
    action: 'payment.manual_update',
    resource: String(req.params.id),
    meta: req.body as Record<string, unknown>,
  });
  res.json(updated);
});

app.post('/api/payments/intent', authRequired, requireRoles('parent', 'superadmin', 'district_admin', 'admin'), (req, res) => {
  try {
    const paymentId = String(req.body?.paymentId || '');
    const provider = (req.body?.provider === 'payme' ? 'payme' : 'click') as 'click' | 'payme';
    const user = getUser(req)!;
    if (user.role === 'parent') {
      const ids = new Set(scopeStudents(req).map((s) => s.id));
      const p = loadDb().payments.find((x) => x.id === paymentId);
      if (!p || !ids.has(p.studentId)) {
        return res.status(403).json({ error: 'Ruxsat yo‘q' });
      }
    }
    res.json(createPaymentIntent(paymentId, provider));
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'Intent xato' });
  }
});

app.post('/api/payments/webhooks/click', (req, res) => {
  if (!clickSignOk(req.body || {})) {
    return res.status(403).json({ error: -1, error_note: 'sign error' });
  }
  res.json(handleClickWebhook(req.body || {}));
});

app.post('/api/payments/webhooks/payme', (req, res) => {
  if (!verifyPaymeAuth(req.headers.authorization)) {
    return res.status(401).json({ error: { code: -32504, message: 'Unauthorized' } });
  }
  res.json(handlePaymeWebhook(req.body || {}));
});

/** Sandbox complete — only when gateway keys missing / DEMO */
app.post('/api/payments/sandbox/complete', authRequired, requireRoles('parent', 'admin', 'district_admin', 'superadmin'), (req, res) => {
  if (config.click.merchantId && config.payme.merchantId && !DEMO_MODE) {
    return res.status(403).json({ error: 'Sandbox o‘chirilgan — haqiqiy webhook ishlating' });
  }
  const paymentId = String(req.body?.paymentId || '');
  const provider = String(req.body?.provider || 'sandbox');
  const user = getUser(req)!;
  if (user.role === 'parent') {
    const ids = new Set(scopeStudents(req).map((s) => s.id));
    const p = loadDb().payments.find((x) => x.id === paymentId);
    if (!p || !ids.has(p.studentId)) return res.status(403).json({ error: 'Ruxsat yo‘q' });
  }
  markPaidFromProvider(paymentId, provider, uid('txn'), { sandbox: true, by: user.id });
  const payment = loadDb().payments.find((p) => p.id === paymentId);
  res.json({ ok: true, payment });
});

// Projects
app.get('/api/projects', authRequired, (req, res) => {
  const db = loadDb();
  const user = getUser(req)!;
  if (user.role === 'parent') {
    const ids = new Set(scopeStudents(req).map((s) => s.id));
    return res.json(db.projects.filter((p) => ids.has(p.studentId)));
  }
  res.json(db.projects);
});

app.post('/api/projects', authRequired, requireRoles('admin', 'teacher'), (req, res) => {
  const project = { ...req.body, id: uid('pr'), createdAt: req.body.createdAt || new Date().toISOString().slice(0, 10) };
  mutate((db) => { db.projects.push(project); });
  res.status(201).json(project);
});

app.put('/api/projects/:id', authRequired, requireRoles('admin', 'teacher'), (req, res) => {
  let updated = null as unknown;
  mutate((db) => {
    const i = db.projects.findIndex((p) => p.id === req.params.id);
    if (i < 0) return;
    db.projects[i] = { ...db.projects[i], ...req.body, id: db.projects[i].id };
    updated = db.projects[i];
  });
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

// Schedule
app.get('/api/schedule', authRequired, (_req, res) => res.json(loadDb().schedule));

app.post('/api/schedule', authRequired, requireRoles('superadmin', 'district_admin', 'admin'), (req, res) => {
  const item = { ...req.body, id: uid('sch') };
  mutate((db) => { db.schedule.push(item); });
  res.status(201).json(item);
});

app.put('/api/schedule/:id', authRequired, requireRoles('superadmin', 'district_admin', 'admin'), (req, res) => {
  let updated = null as unknown;
  mutate((db) => {
    const i = db.schedule.findIndex((s) => s.id === req.params.id);
    if (i < 0) return;
    db.schedule[i] = { ...db.schedule[i], ...req.body, id: db.schedule[i].id };
    updated = db.schedule[i];
  });
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

app.delete('/api/schedule/:id', authRequired, requireRoles('superadmin', 'district_admin', 'admin'), (req, res) => {
  mutate((db) => { db.schedule = db.schedule.filter((s) => s.id !== req.params.id); });
  res.json({ ok: true });
});

// Messages
app.get('/api/messages', authRequired, (req, res) => res.json(scopeMessages(req)));

app.post('/api/messages', authRequired, requireRoles('admin', 'teacher', 'parent'), (req, res) => {
  const body = req.body as Partial<Message>;
  const { title, content, type } = body;
  if (!title || !content) return res.status(400).json({ error: 'Sarlavha va matn kerak' });
  const user = (req as { user?: { id: string; fullName: string; role: string } }).user;
  const msg: Message = {
    id: uid('m'),
    title,
    content,
    type: type || 'info',
    date: new Date().toISOString().slice(0, 10),
    read: false,
    fromName: body.fromName || user?.fullName,
    fromRole: body.fromRole || user?.role,
    fromUserId: body.fromUserId || user?.id,
    toAudience: body.toAudience || 'all',
    toUserId: body.toUserId,
    toName: body.toName,
  };
  mutate((db) => { db.messages.unshift(msg); });
  res.status(201).json(msg);
});

app.post('/api/messages/:id/read', authRequired, (req, res) => {
  let updated = null as unknown;
  mutate((db) => {
    const m = db.messages.find((x) => x.id === req.params.id);
    if (!m) return;
    m.read = true;
    updated = m;
  });
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

// Enrollments
app.get('/api/enrollments', authRequired, requireRoles('superadmin', 'district_admin', 'admin'), (_req, res) => {
  res.json(loadDb().enrollmentRequests);
});

app.post('/api/enrollments', optionalAuth, rateLimit({ key: 'enroll', limit: 10, windowSec: 60 }), async (req, res) => {
  const body = req.body;
  if (!body?.firstName || !body?.lastName || !body?.circleId || !body?.parentPhone || !body?.parentName) {
    return res.status(400).json({ error: "Majburiy maydonlar to'ldirilmagan (ism, familiya, ota-ona, telefon, to'garak)" });
  }

  const parentPhone = String(body.parentPhone).trim();
  const normalized = normalizePhone(parentPhone);
  if (normalized.length < 9) {
    return res.status(400).json({ error: "Telefon raqam noto'g'ri. Masalan: +998 90 123 45 67" });
  }

  const authUser = getUser(req);
  const isLoggedInParent =
    authUser?.role === 'parent' && normalizePhone(authUser.phone || '') === normalized;

  const pin = String(body.pin || '').trim();
  if (!isLoggedInParent && (!pin || pin.length < 4)) {
    return res.status(400).json({ error: 'Kirish uchun PIN kod kerak (kamida 4 raqam)' });
  }

  const socialRegistry = !!body.socialRegistry;
  const subsidy = !!body.subsidy || socialRegistry;
  const districtId = String(body.districtId || authUser?.districtId || DEFAULT_DISTRICT_ID);

  const db = loadDb();
  const circle = db.circles.find((c) => c.id === body.circleId);
  if (!circle) return res.status(400).json({ error: "To'garak topilmadi" });
  if (circle.isNetwork) return res.status(400).json({ error: "Tarmoq to'garagiga onlayn yozilish mumkin emas" });
  if (circle.status !== 'active' && circle.status !== 'planned') {
    return res.status(400).json({ error: "Bu to'garak hozir qabul qilmaydi" });
  }
  if (circle.enrolled >= circle.capacity) return res.status(400).json({ error: "To'garak to'la" });

  if (
    !isLoggedInParent &&
    db.parentPins?.[normalized] &&
    !bcrypt.compareSync(pin, db.parentPins[normalized])
  ) {
    return res.status(401).json({ error: "Bu telefon allaqachon ro'yxatda. PIN noto'g'ri." });
  }

  const enrollment = {
    id: uid('er'),
    firstName: String(body.firstName).trim(),
    lastName: String(body.lastName).trim(),
    age: Number(body.age) || 12,
    school: String(body.school || '').trim() || 'Ko‘rsatilmagan',
    grade: Number(body.grade) || 1,
    parentName: String(body.parentName).trim(),
    parentPhone,
    circleId: body.circleId,
    circleName: body.circleName || circle.name,
    status: 'approved' as const,
    submittedAt: new Date().toISOString().slice(0, 10),
    note: body.note || (socialRegistry ? 'Ijtimoiy reestr — preferensial' : 'Onlayn ro‘yxatdan o‘tish — avtomatik tasdiq'),
    districtId,
    socialRegistry,
    subsidy,
  };

  let studentId = '';
  repo.transaction((d) => {
    if (!d.parentPins) d.parentPins = {};
    if (!d.parentPins[normalized] && pin.length >= 4) {
      saveParentPin(d, normalized, pin, bcrypt.hashSync(pin, 10));
    }

    d.enrollmentRequests.push(enrollment);

    let student = d.students.find(
      (s) =>
        normalizePhone(s.parentPhone) === normalized &&
        s.firstName.toLowerCase() === enrollment.firstName.toLowerCase() &&
        s.lastName.toLowerCase() === enrollment.lastName.toLowerCase()
    );
    if (student) {
      student.circleIds = [...new Set([...student.circleIds, enrollment.circleId])];
      student.status = 'active';
      student.school = enrollment.school || student.school;
      student.grade = enrollment.grade || student.grade;
      student.parentName = enrollment.parentName || student.parentName;
      if (socialRegistry) student.socialRegistry = true;
      if (subsidy) student.subsidy = true;
      if (body.inclusiveNeeds) student.inclusiveNeeds = String(body.inclusiveNeeds);
    } else {
      student = {
        id: uid('s'),
        firstName: enrollment.firstName,
        lastName: enrollment.lastName,
        age: enrollment.age,
        school: enrollment.school,
        grade: enrollment.grade,
        parentName: enrollment.parentName,
        parentPhone,
        circleIds: [enrollment.circleId],
        status: 'active',
        enrolledAt: enrollment.submittedAt,
        achievements: 0,
        districtId,
        socialRegistry,
        subsidy,
        inclusiveNeeds: body.inclusiveNeeds ? String(body.inclusiveNeeds) : undefined,
      };
      d.students.push(student);
    }
    studentId = student.id;

    const c = d.circles.find((x) => x.id === enrollment.circleId);
    if (c && c.enrolled < c.capacity) {
      c.enrolled += 1;
      if (c.status === 'planned') c.status = 'active';
      if (c.enrolled >= c.capacity) c.status = 'full';
    }

    const month = new Date().toISOString().slice(0, 7);
    const dupPay = d.payments.some(
      (p) => p.studentId === student!.id && p.circleId === enrollment.circleId && p.month === month
    );
    if (!dupPay) {
      d.payments.push({
        id: uid('p'),
        studentId: student!.id,
        studentName: `${enrollment.firstName} ${enrollment.lastName}`,
        circleId: enrollment.circleId,
        circleName: enrollment.circleName,
        amount: subsidy ? 0 : MONTHLY_FEE,
        month,
        status: subsidy ? 'paid' : 'pending',
        paidAt: subsidy ? enrollment.submittedAt : undefined,
        districtId,
        provider: subsidy ? 'subsidy' : undefined,
      });
    }
  });

  bumpMetric('enrollments');
  void queuePush('notifications', JSON.stringify({ type: 'enrollment', studentId, phone: parentPhone }));

  // Postgres yozuvi tugaguncha kutamiz — restart dan keyin yo'qolmasin
  await flushDb();

  res.status(201).json({
    ...enrollment,
    studentId,
    message: "Ro'yxatdan o'tdingiz! Telefon va PIN bilan ota-ona kabinetiga kiring.",
  });
});

app.post('/api/enrollments/:id/approve', authRequired, requireRoles('superadmin', 'district_admin', 'admin'), async (req, res) => {
  const db = loadDb();
  const reqItem = db.enrollmentRequests.find((r) => r.id === req.params.id);
  if (!reqItem || reqItem.status !== 'pending') return res.status(400).json({ error: 'Invalid' });
  const circle = db.circles.find((c) => c.id === reqItem.circleId);
  if (!circle || circle.enrolled >= circle.capacity) return res.status(400).json({ error: "To'garak to'la" });

  repo.transaction((d) => {
    const er = d.enrollmentRequests.find((r) => r.id === req.params.id)!;
    er.status = 'approved';
    const phoneN = normalizePhone(er.parentPhone);
    let student = d.students.find(
      (s) =>
        normalizePhone(s.parentPhone) === phoneN &&
        s.firstName.toLowerCase() === er.firstName.toLowerCase() &&
        s.lastName.toLowerCase() === er.lastName.toLowerCase()
    );
    if (student) {
      student.circleIds = [...new Set([...student.circleIds, er.circleId])];
      student.status = 'active';
    } else {
      student = {
        id: uid('s'),
        firstName: er.firstName,
        lastName: er.lastName,
        age: er.age,
        school: er.school,
        grade: er.grade,
        parentName: er.parentName,
        parentPhone: er.parentPhone,
        circleIds: [er.circleId],
        status: 'active',
        enrolledAt: new Date().toISOString().slice(0, 10),
        achievements: 0,
        districtId: er.districtId || DEFAULT_DISTRICT_ID,
      };
      d.students.push(student);
    }
    const c = d.circles.find((x) => x.id === er.circleId);
    if (c) c.enrolled += 1;
    d.payments.push({
      id: uid('p'),
      studentId: student.id,
      studentName: `${er.firstName} ${er.lastName}`,
      circleId: er.circleId,
      circleName: er.circleName,
      amount: MONTHLY_FEE,
      month: new Date().toISOString().slice(0, 7),
      status: 'pending',
      districtId: er.districtId || DEFAULT_DISTRICT_ID,
    });
  });
  await flushDb();
  res.json({ ok: true });
});

app.post('/api/enrollments/:id/reject', authRequired, requireRoles('superadmin', 'district_admin', 'admin'), async (req, res) => {
  mutate((db) => {
    const er = db.enrollmentRequests.find((r) => r.id === req.params.id);
    if (er) {
      er.status = 'rejected';
      if (req.body?.note) er.note = req.body.note;
    }
  });
  await flushDb();
  res.json({ ok: true });
});

// Attendance
app.get('/api/attendance', authRequired, (req, res) => {
  const { circleId, date } = req.query as { circleId?: string; date?: string };
  let list = loadDb().attendance;
  if (circleId) list = list.filter((a) => a.circleId === circleId);
  if (date) list = list.filter((a) => a.date === date);
  const user = getUser(req)!;
  if (user.role === 'parent') {
    const ids = new Set(scopeStudents(req).map((s) => s.id));
    list = list.filter((a) => ids.has(a.studentId));
  }
  res.json(list);
});

app.post('/api/attendance/bulk', authRequired, requireRoles('admin', 'teacher'), (req, res) => {
  const records = req.body?.records as AttendanceRecord[] | undefined;
  if (!Array.isArray(records) || !records.length) {
    return res.status(400).json({ error: 'records kerak' });
  }
  mutate((db) => {
    for (const r of records) {
      const existing = db.attendance.findIndex(
        (a) => a.studentId === r.studentId && a.circleId === r.circleId && a.date === r.date
      );
      const item: AttendanceRecord = {
        id: existing >= 0 ? db.attendance[existing].id : uid('a'),
        studentId: r.studentId,
        circleId: r.circleId,
        date: r.date,
        present: !!r.present,
        note: r.note,
      };
      if (existing >= 0) db.attendance[existing] = item;
      else db.attendance.push(item);
    }
  });
  res.json({ ok: true });
});

// Lab
app.put('/api/lab/:id', authRequired, requireRoles('superadmin', 'district_admin', 'admin', 'teacher'), (req, res) => {
  let updated = null as unknown;
  mutate((db) => {
    const i = db.labEquipment.findIndex((e) => e.id === req.params.id);
    if (i < 0) return;
    db.labEquipment[i] = { ...db.labEquipment[i], ...req.body, id: db.labEquipment[i].id };
    updated = db.labEquipment[i];
  });
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json(updated);
});

// Schools / network
app.get('/api/schools', authRequired, (_req, res) => res.json(loadDb().schools));

app.post('/api/schools/:id/circles', authRequired, requireRoles('superadmin', 'district_admin', 'admin'), (req, res) => {
  const db = loadDb();
  const school = db.schools.find((s) => s.id === req.params.id);
  if (!school) return res.status(404).json({ error: 'School not found' });
  const circle = {
    ...req.body,
    id: uid('c'),
    isNetwork: true,
    school: school.name,
    enrolled: 0,
    status: 'active',
    progress: 0,
  };
  mutate((d) => {
    d.circles.push(circle);
    const sc = d.schools.find((s) => s.id === req.params.id);
    if (sc) sc.networkCircles += 1;
  });
  res.status(201).json(circle);
});

// Partnerships
app.get('/api/partnerships', authRequired, (_req, res) => res.json(loadDb().partnerships));

app.post('/api/partnerships', authRequired, requireRoles('superadmin', 'district_admin', 'admin'), (req, res) => {
  const p = { ...req.body, id: uid('pt'), events: req.body.events ?? 0 };
  mutate((db) => { db.partnerships.push(p); });
  res.status(201).json(p);
});

app.use((err: Error, _req: Request, res: Response, _next: unknown) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

try {
  // sync preload for sqlite; postgres waits for initDb in start()
  if (!process.env.DATABASE_URL) loadDb();
} catch {
  console.warn('DB missing — run npm run seed first');
}

const PORT = config.port;

async function start() {
  const dbMode = await initDb();
  const mode = await initRedis();
  logJson('info', 'api_starting', { port: PORT, cache: mode, demoMode: DEMO_MODE, db: dbMode });
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`API http://0.0.0.0:${PORT} (LAN ham ochiq) · cache=${mode} · db=${dbMode}`);
  });
  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} band. Eski API ni to'xtating yoki: npm run dev`);
      process.exit(1);
    }
    throw err;
  });
  const shutdown = async () => {
    await flushDb();
    await shutdownDb();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());
}

void start();
