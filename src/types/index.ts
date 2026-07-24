export type CircleCategory =
  | 'it'
  | 'sport'
  | 'art'
  | 'language'
  | 'science'
  | 'career'
  | 'reading';

export type CircleStatus = 'active' | 'full' | 'planned' | 'paused';

export type StudentStatus = 'active' | 'graduated' | 'paused' | 'pending';

export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'partial';

export type ProjectStatus = 'idea' | 'development' | 'completed' | 'competition';

export type UserRole = 'superadmin' | 'district_admin' | 'admin' | 'teacher' | 'parent';

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  avatar?: string;
  teacherId?: string;
  phone?: string;
  districtId?: string;
  regionId?: string;
  blocked?: boolean;
}

/** Direktor boshqaruvidagi login akkaunti (parolsiz) */
export interface StaffAccount {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  teacherId?: string;
  phone?: string;
  districtId?: string;
  regionId?: string;
  blocked?: boolean;
  /** Seed / avtomatik yaratilgan standart parol */
  defaultPassword?: string;
}

/** Ota-ona akkaunti — direktor paneli */
export interface ParentAccount {
  id: string;
  parentName: string;
  parentPhone: string;
  phoneNorm: string;
  pin?: string;
  hasPin: boolean;
  districtId?: string;
  children: Array<{
    id: string;
    firstName: string;
    lastName: string;
    school: string;
    grade: number;
    circleNames: string[];
    status: StudentStatus;
  }>;
}

export interface Circle {
  id: string;
  name: string;
  category: CircleCategory;
  teacher: string;
  teacherId: string;
  capacity: number;
  enrolled: number;
  schedule: string;
  location: string;
  fee: number;
  status: CircleStatus;
  description: string;
  isNetwork: boolean;
  isInclusive?: boolean;
  school?: string;
  ageRange: string;
  progress: number;
  districtId?: string;
}

export type EnrollmentStatus = 'pending' | 'approved' | 'rejected';

export interface EnrollmentRequest {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  school: string;
  grade: number;
  parentName: string;
  parentPhone: string;
  circleId: string;
  circleName: string;
  status: EnrollmentStatus;
  submittedAt: string;
  note?: string;
  socialRegistry?: boolean;
  subsidy?: boolean;
  districtId?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  circleId: string;
  date: string;
  present: boolean;
  note?: string;
  districtId?: string;
}

export type LabEquipmentStatus = 'available' | 'in_use' | 'maintenance' | 'broken';

export interface LabEquipment {
  id: string;
  name: string;
  type: 'arduino' | 'raspberry' | '3d_printer' | 'sensor' | 'other';
  model: string;
  quantity: number;
  available: number;
  status: LabEquipmentStatus;
  location: string;
  lastMaintenance?: string;
  districtId?: string;
}

export type PartnershipStatus = 'active' | 'planned' | 'completed';

export interface Partnership {
  id: string;
  organization: string;
  country: string;
  type: string;
  description: string;
  startDate: string;
  endDate?: string;
  status: PartnershipStatus;
  contactPerson: string;
  events: number;
  districtId?: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  school: string;
  grade: number;
  parentName: string;
  parentPhone: string;
  circleIds: string[];
  status: StudentStatus;
  enrolledAt: string;
  avatar?: string;
  achievements: number;
  districtId?: string;
  socialRegistry?: boolean;
  inclusiveNeeds?: string;
  subsidy?: boolean;
}

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  /** To'liq F.I.Sh. (rasmiy shtatlar ro'yxati) */
  fullName?: string;
  specialty: string;
  /** Bo'lim nomi */
  department?: string;
  /** Buyruq sanasi va raqami */
  orderInfo?: string;
  phone: string;
  email: string;
  circleIds: string[];
  experience: number;
  rating: number;
  isInclusive: boolean;
  /** Lavozim bo'sh */
  isVacant?: boolean;
  districtId?: string;
  /** Ma'lumoti: Oliy / O'rta maxsus */
  education?: string;
  /** Stavka (0.25–1.0) */
  stavka?: number;
  /** Haftalik dars soati */
  weeklyHours?: number;
}

export interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  circleId: string;
  circleName: string;
  amount: number;
  month: string;
  status: PaymentStatus;
  paidAt?: string;
  districtId?: string;
  provider?: string;
  providerTxn?: string;
}

export interface Project {
  id: string;
  title: string;
  studentId: string;
  studentName: string;
  circleId: string;
  category: string;
  status: ProjectStatus;
  description: string;
  createdAt: string;
  awards?: string[];
  districtId?: string;
}

export interface ScheduleItem {
  id: string;
  circleId: string;
  circleName: string;
  teacher: string;
  day: string;
  startTime: string;
  endTime: string;
  room: string;
  districtId?: string;
}

export interface Message {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'event' | 'direct';
  date: string;
  read: boolean;
  /** Yuboruvchi */
  fromName?: string;
  fromRole?: UserRole;
  fromUserId?: string;
  /** Qabul qiluvchi: all | staff | parents | yoki aniq foydalanuvchi */
  toAudience?: 'all' | 'staff' | 'parents' | 'user';
  toUserId?: string;
  toName?: string;
  districtId?: string;
}

export interface School {
  id: string;
  name: string;
  address: string;
  networkCircles: number;
  students: number;
  districtId?: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalCircles: number;
  activeCircles: number;
  networkCircles: number;
  monthlyRevenue: number;
  attendanceRate: number;
  newEnrollments: number;
  completedProjects: number;
}

export const CATEGORY_LABELS: Record<CircleCategory, string> = {
  it: 'Texnika, konstruktorlik va modellashtirish',
  sport: 'Jismoniy tarbiya va sport',
  art: "Madaniyat va san'at",
  language: 'Xorijiy tillar',
  science: 'Turizm va ekologiya',
  career: "Hunarmandchilik va qo'l mehnati",
  reading: "Oliy ta'lim va maktabga tayyorlov",
};

export const CATEGORY_COLORS: Record<CircleCategory, string> = {
  it: '#9588E8',
  sport: '#34C759',
  art: '#FF9500',
  language: '#5AC8FA',
  science: '#30D158',
  career: '#FF6482',
  reading: '#AF52DE',
};

export const STATUS_LABELS: Record<CircleStatus, string> = {
  active: 'Faol',
  full: "To'la",
  planned: 'Rejalashtirilgan',
  paused: "To'xtatilgan",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: "To'langan",
  pending: 'Kutilmoqda',
  overdue: "Muddati o'tgan",
  partial: 'Qisman',
};

// Qamashi tumani uchun badal to'lovi (BHMga nisbatan 15% - 2026 yil yanvar)
export const MONTHLY_FEE_BHM_PERCENT = 15;
export const BHM_AMOUNT = 412000; // 2026 yil BHM
export const MONTHLY_FEE = Math.round(BHM_AMOUNT * MONTHLY_FEE_BHM_PERCENT / 100);
