import type { Request } from 'express';
import { loadDb } from './db.js';
import { getUser } from './auth.js';
import {
  DEFAULT_DISTRICT_ID,
  DEFAULT_REGION_ID,
  DEFAULT_REGION_NAME,
  MONTHLY_FEE,
  emptyCenterInfo,
  type AuthUser,
  type CenterInfo,
  type Message,
  type Student,
} from './types.js';

export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '');
}

/** Superadmin → region ichidagi tumanlar; boshqalar → o‘z tumani. */
export function allowedDistrictIds(user?: AuthUser): string[] | null {
  if (!user) return [DEFAULT_DISTRICT_ID];
  const db = loadDb();

  if (user.role === 'superadmin') {
    const regionId = user.regionId || DEFAULT_REGION_ID;
    const inRegion = db.districts.filter(
      (d) => d.regionId === regionId || (!d.regionId && d.region.includes('Qashqadaryo'))
    );
    const ids = inRegion.map((d) => d.id);
    if (user.districtId) {
      return ids.includes(user.districtId) ? [user.districtId] : [];
    }
    return ids.length ? ids : null;
  }

  return [user.districtId || DEFAULT_DISTRICT_ID];
}

export function districtOf(user?: AuthUser) {
  if (!user) return DEFAULT_DISTRICT_ID;
  if (user.role === 'superadmin') return user.districtId; // may be undefined = all in region
  return user.districtId || DEFAULT_DISTRICT_ID;
}

export function inDistrictScope<T extends { districtId?: string }>(
  items: T[],
  user?: AuthUser
): T[] {
  const ids = allowedDistrictIds(user);
  if (!ids) return items;
  const set = new Set(ids);
  return items.filter((row) => !row.districtId || set.has(row.districtId));
}

export function districtsForUser(user?: AuthUser) {
  const db = loadDb();
  if (!user) return [];
  if (user.role === 'superadmin') {
    const regionId = user.regionId || DEFAULT_REGION_ID;
    return db.districts.filter(
      (d) => d.regionId === regionId || (!d.regionId && d.region.includes('Qashqadaryo'))
    );
  }
  const did = user.districtId || DEFAULT_DISTRICT_ID;
  return db.districts.filter((d) => d.id === did);
}

export function resolveCenterInfo(user?: AuthUser): CenterInfo {
  const db = loadDb();
  const infos =
    db.centerInfos?.length
      ? db.centerInfos
      : db.centerInfo
        ? [db.centerInfo]
        : [];

  if (user?.role === 'superadmin' && !user.districtId) {
    const districts = districtsForUser(user);
    const circles = inDistrictScope(db.circles, user);
    const students = inDistrictScope(db.students, user).filter((s) => s.status === 'active');
    return emptyCenterInfo(
      { id: 'all', name: 'Qashqadaryo — barcha tumanlar', region: DEFAULT_REGION_NAME },
      {
        name: 'Kelajak Markazi (viloyat)',
        director: '',
        namedClubs: circles.length,
        totalStudents: students.length,
        asOf: `${districts.length} tuman/shahar`,
      }
    );
  }

  const did = districtOf(user) || DEFAULT_DISTRICT_ID;
  const found = infos.find((c) => c.districtId === did);
  if (found) return found;
  const d = db.districts.find((x) => x.id === did);
  return emptyCenterInfo(d || { id: did, name: 'Tuman', region: DEFAULT_REGION_NAME });
}

export function scopeCircles(req: Request) {
  const db = loadDb();
  const user = getUser(req);
  let list = inDistrictScope(db.circles, user);
  if (user?.role === 'teacher' && user.teacherId) {
    list = list.filter((c) => c.teacherId === user.teacherId);
  }
  return [...list].sort((a, b) => {
    const aActive = a.enrolled > 0 ? 1 : 0;
    const bActive = b.enrolled > 0 ? 1 : 0;
    if (bActive !== aActive) return bActive - aActive;
    return b.enrolled - a.enrolled || a.name.localeCompare(b.name, 'uz');
  });
}

export function scopeStudents(req: Request): Student[] {
  const db = loadDb();
  const user = getUser(req);
  let list = inDistrictScope(db.students, user);

  if (user?.role === 'parent' && user.phone) {
    const phone = normalizePhone(user.phone);
    return list.filter((s) => normalizePhone(s.parentPhone) === phone);
  }
  if (user?.role === 'teacher' && user.teacherId) {
    const circleIds = new Set(
      db.circles.filter((c) => c.teacherId === user.teacherId).map((c) => c.id)
    );
    return list.filter((s) => s.circleIds.some((id) => circleIds.has(id)));
  }
  return list;
}

export function scopeMessages(req: Request): Message[] {
  const db = loadDb();
  const user = getUser(req);
  if (!user) return [];
  let list = inDistrictScope(db.messages, user);

  if (user.role === 'superadmin' || user.role === 'district_admin' || user.role === 'admin') {
    return list;
  }
  if (user.role === 'teacher') {
    return list.filter(
      (m) =>
        m.toAudience === 'all' ||
        m.toAudience === 'teachers' ||
        m.toUserId === user.id ||
        m.fromUserId === user.id
    );
  }
  const phone = normalizePhone(user.phone || '');
  return list.filter(
    (m) =>
      m.toAudience === 'all' ||
      m.toAudience === 'parents' ||
      m.toUserId === user.id ||
      (m.toUserId && normalizePhone(m.toUserId) === phone) ||
      m.fromUserId === user.id
  );
}

export function teacherOwnsStudent(user: AuthUser, student: Student) {
  if (user.role === 'superadmin' || user.role === 'district_admin' || user.role === 'admin') {
    return true;
  }
  if (user.role !== 'teacher' || !user.teacherId) return false;
  const db = loadDb();
  const circleIds = new Set(
    db.circles.filter((c) => c.teacherId === user.teacherId).map((c) => c.id)
  );
  return student.circleIds.some((id) => circleIds.has(id));
}
