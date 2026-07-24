import type { UserRole } from '@shared/types';

/** Direktor yoki tuman admin — yozish huquqi (viloyat emas) */
export function isCenterAdmin(role?: UserRole | null) {
  return role === 'admin' || role === 'district_admin';
}

export function isViloyat(role?: UserRole | null) {
  return role === 'superadmin';
}

export function isTeacher(role?: UserRole | null) {
  return role === 'teacher';
}

export function isStaff(role?: UserRole | null) {
  return !!role && role !== 'parent';
}

/** To'garak yaratish/tahrirlash (web: teacher + admin + district_admin; superadmin yo'q) */
export function canWriteCircles(role?: UserRole | null) {
  return isCenterAdmin(role) || isTeacher(role);
}

/** O'quvchi yaratish/tahrirlash */
export function canWriteStudents(role?: UserRole | null) {
  return isCenterAdmin(role) || isTeacher(role);
}

/** O'quvchi o'chirish — faqat admin/district */
export function canDeleteStudents(role?: UserRole | null) {
  return isCenterAdmin(role);
}

/** Xodimlar CRUD */
export function canWriteTeachers(role?: UserRole | null) {
  return isCenterAdmin(role);
}

/** To'lov belgilash */
export function canMarkPaid(role?: UserRole | null) {
  return isCenterAdmin(role);
}

/** Jadval qo'shish/o'chirish */
export function canWriteSchedule(role?: UserRole | null) {
  return isCenterAdmin(role);
}

/** Ro'yxat tasdiqlash */
export function canManageEnrollment(role?: UserRole | null) {
  return isCenterAdmin(role);
}

/** Loyiha / tarmoq / hamkorlik qo'shish */
export function canWriteExtras(role?: UserRole | null) {
  return isCenterAdmin(role);
}

/** Laboratoriya status */
export function canToggleLab(role?: UserRole | null) {
  return isCenterAdmin(role) || isTeacher(role);
}

export const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: 'Viloyat admin',
  district_admin: 'Tuman admin',
  admin: 'Direktor',
  teacher: 'Murabbiy',
  parent: 'Ota-ona',
};

/** Profil menyusi — web Sidebar bilan bir xil */
export type MenuRole = Exclude<UserRole, 'parent'>;

export const STAFF_MENU: {
  label: string;
  icon: 'person-add' | 'checkbox' | 'school' | 'people' | 'calendar' | 'card' | 'bulb' | 'hardware-chip' | 'location' | 'globe' | 'settings';
  href: string;
  roles: MenuRole[];
}[] = [
  { label: "Ro'yxatdan o'tish", icon: 'person-add', href: '/enrollment', roles: ['district_admin', 'admin'] },
  { label: 'Davomat', icon: 'checkbox', href: '/attendance', roles: ['superadmin', 'district_admin', 'admin', 'teacher'] },
  { label: 'Xodimlar', icon: 'school', href: '/teachers', roles: ['superadmin', 'district_admin', 'admin'] },
  { label: 'Ota-onalar', icon: 'people', href: '/parents', roles: ['superadmin', 'district_admin', 'admin'] },
  { label: 'Jadval', icon: 'calendar', href: '/schedule', roles: ['superadmin', 'district_admin', 'admin', 'teacher'] },
  { label: "To'lovlar", icon: 'card', href: '/payments', roles: ['superadmin', 'district_admin', 'admin'] },
  { label: 'Loyihalar', icon: 'bulb', href: '/projects', roles: ['superadmin', 'district_admin', 'admin', 'teacher'] },
  { label: 'Laboratoriya', icon: 'hardware-chip', href: '/laboratory', roles: ['superadmin', 'district_admin', 'admin', 'teacher'] },
  { label: 'Tarmoq', icon: 'location', href: '/network', roles: ['superadmin', 'district_admin', 'admin'] },
  { label: 'Hamkorlik', icon: 'globe', href: '/partnerships', roles: ['superadmin', 'district_admin', 'admin'] },
  { label: 'Sozlamalar', icon: 'settings', href: '/settings', roles: ['superadmin', 'district_admin', 'admin'] },
];
