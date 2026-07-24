import bcrypt from 'bcryptjs';
import type { AuthUser, DbUser, StaffAccount, Teacher, UserRole } from './types.js';

export const DEFAULT_TEACHER_PASSWORD = 'teacher123';

export function buildStaffAccounts(
  allTeachers: Teacher[],
  districtId: string,
  regionId: string,
  hash: (p: string) => string = hashPassword
): DbUser[] {
  const leaderUsers = buildTeacherAccounts(allTeachers, districtId, regionId, hash);
  const existing = new Set(leaderUsers.map((u) => u.username.toLowerCase()));

  const staff = allTeachers.filter(
    (t) => t.id.startsWith('st') && !t.isVacant && t.id !== 'st1' && t.id !== 'st2'
  );

  for (const t of staff) {
    if (leaderUsers.some((u) => u.teacherId === t.id)) continue;
    const fullName = t.fullName || `${t.lastName} ${t.firstName}`.trim();
    let username = suggestUsername(fullName, existing);
    if (t.id === 'st6') {
      existing.delete(username.toLowerCase());
      username = 'ballieva.s';
      existing.add('ballieva.s');
    }
    existing.add(username.toLowerCase());
    leaderUsers.push({
      id: `u-s-${t.id}`,
      username,
      passwordHash: hash(DEFAULT_TEACHER_PASSWORD),
      fullName,
      role: 'teacher' as UserRole,
      teacherId: t.id,
      phone: t.phone !== '—' ? t.phone : undefined,
      districtId,
      regionId,
      blocked: false,
    });
  }

  return leaderUsers;
}

export function toStaffAccount(u: DbUser): StaffAccount {
  return {
    id: u.id,
    username: u.username,
    fullName: u.fullName,
    role: u.role,
    teacherId: u.teacherId,
    phone: u.phone,
    districtId: u.districtId,
    regionId: u.regionId,
    blocked: !!u.blocked,
  };
}

export function toAuthUser(u: DbUser): AuthUser {
  return {
    id: u.id,
    username: u.username,
    fullName: u.fullName,
    role: u.role,
    teacherId: u.teacherId,
    phone: u.phone,
    districtId: u.districtId,
    regionId: u.regionId,
    blocked: !!u.blocked,
  };
}

/** Familiya.ism → jabborova.m */
export function suggestUsername(fullName: string, existing: Set<string>): string {
  const parts = fullName
    .trim()
    .toLowerCase()
    .replace(/[ʻʼ'`‘’]/g, '')
    .replace(/[^a-z0-9\s]/gi, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const last = (parts[0] || 'teacher').replace(/[^a-z0-9]/g, '') || 'teacher';
  const first = (parts[1] || 'x').replace(/[^a-z0-9]/g, '') || 'x';
  let base = `${last}.${first[0] || 'x'}`;
  let u = base;
  let n = 2;
  while (existing.has(u.toLowerCase())) {
    u = `${base}${n}`;
    n += 1;
  }
  return u;
}

export function hashPassword(password: string) {
  return bcrypt.hashSync(password, 10);
}

export function buildTeacherAccounts(
  teachers: Teacher[],
  districtId: string,
  regionId: string,
  hash: (p: string) => string = hashPassword
): DbUser[] {
  const existing = new Set<string>();
  const users: DbUser[] = [];
  const leaders = teachers.filter((t) => t.id.startsWith('tl') && !t.isVacant);
  for (const t of leaders) {
    const fullName = t.fullName || `${t.lastName} ${t.firstName}`.trim();
    const username = suggestUsername(fullName, existing);
    existing.add(username.toLowerCase());
    users.push({
      id: `u-t-${t.id}`,
      username,
      passwordHash: hash(DEFAULT_TEACHER_PASSWORD),
      fullName,
      role: 'teacher' as UserRole,
      teacherId: t.id,
      phone: t.phone !== '—' ? t.phone : undefined,
      districtId,
      regionId,
      blocked: false,
    });
  }
  // Stable demo logins
  const uTl3 = users.find((x) => x.teacherId === 'tl3');
  if (uTl3) {
    existing.delete(uTl3.username.toLowerCase());
    uTl3.username = 'shoira.b';
    uTl3.id = 'u2';
    existing.add('shoira.b');
  }
  const uTl10 = users.find((x) => x.teacherId === 'tl10');
  if (uTl10) {
    existing.delete(uTl10.username.toLowerCase());
    uTl10.username = 'baxriddin.x';
    uTl10.id = 'u3';
    existing.add('baxriddin.x');
  }
  return users;
}
