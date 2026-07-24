export type UserRole = 'superadmin' | 'district_admin' | 'admin' | 'teacher' | 'parent';

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  teacherId?: string;
  phone?: string;
  /** Tuman (district_admin / teacher). Superadminda odatda bo‘sh. */
  districtId?: string;
  /** Viloyat — superadmin shu region ichidagi barcha tumanlarni ko‘radi. */
  regionId?: string;
  /** Direktor bloklagan akkaunt */
  blocked?: boolean;
}

export interface DbUser extends AuthUser {
  passwordHash: string;
}

/** Login akkaunti (parolsiz) — boshqaruv paneli uchun */
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
}

export interface Region {
  id: string;
  name: string;
  code: string;
}

export interface District {
  id: string;
  name: string;
  /** Display: "Qashqadaryo viloyati" */
  region: string;
  regionId: string;
  code: string;
}

export interface Circle {
  id: string;
  name: string;
  category: string;
  teacher: string;
  teacherId: string;
  capacity: number;
  enrolled: number;
  schedule: string;
  location: string;
  fee: number;
  status: string;
  description: string;
  isNetwork: boolean;
  isInclusive?: boolean;
  school?: string;
  ageRange: string;
  progress: number;
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
  status: string;
  enrolledAt: string;
  achievements: number;
  districtId?: string;
  socialRegistry?: boolean;
  inclusiveNeeds?: string;
  subsidy?: boolean;
}

export type StudentStatus = 'active' | 'graduated' | 'paused' | 'pending';

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  specialty: string;
  department?: string;
  orderInfo?: string;
  phone: string;
  email: string;
  circleIds: string[];
  experience: number;
  rating: number;
  isInclusive: boolean;
  isVacant?: boolean;
  districtId?: string;
  education?: string;
  stavka?: number;
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
  status: string;
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
  status: string;
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
  type: string;
  date: string;
  read: boolean;
  fromName?: string;
  fromRole?: string;
  fromUserId?: string;
  toAudience?: string;
  toUserId?: string;
  toName?: string;
  districtId?: string;
}

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
  status: string;
  submittedAt: string;
  note?: string;
  districtId?: string;
  socialRegistry?: boolean;
  subsidy?: boolean;
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

export interface LabEquipment {
  id: string;
  name: string;
  type: string;
  model: string;
  quantity: number;
  available: number;
  status: string;
  location: string;
  lastMaintenance?: string;
  districtId?: string;
}

export interface Partnership {
  id: string;
  organization: string;
  country: string;
  type: string;
  description: string;
  startDate: string;
  endDate?: string;
  status: string;
  contactPerson: string;
  events: number;
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

export interface CenterInfo {
  name: string;
  district: string;
  region: string;
  address: string;
  phone: string;
  email: string;
  director: string;
  workingHours: string;
  seasonStart: string;
  seasonEnd: string;
  ageRange: string;
  group: string;
  monthlyFee: number;
  namedClubs?: number;
  totalStudents?: number;
  asOf?: string;
  districtId?: string;
}

export interface AuditLog {
  id?: number | string;
  districtId?: string;
  userId?: string;
  action: string;
  resource?: string;
  meta?: Record<string, unknown>;
  createdAt?: string;
}

/** Direktor ko‘rishi uchun PIN (hash emas) */
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

export interface DbData {
  regions?: Region[];
  districts: District[];
  users: DbUser[];
  parentPins: Record<string, string>;
  /** Direktor paneli — ota-ona PIN ko‘rinishi (telefon norm → PIN) */
  parentPinHints?: Record<string, string>;
  /** Default / oxirgi o‘qilgan (odatda Qamashi). */
  centerInfo: CenterInfo;
  /** Har tuman uchun alohida markaz ma’lumoti. */
  centerInfos?: CenterInfo[];
  circles: Circle[];
  students: Student[];
  teachers: Teacher[];
  payments: Payment[];
  projects: Project[];
  schedule: ScheduleItem[];
  messages: Message[];
  enrollmentRequests: EnrollmentRequest[];
  attendance: AttendanceRecord[];
  labEquipment: LabEquipment[];
  partnerships: Partnership[];
  schools: School[];
}

export const MONTHLY_FEE = 61800;
export const DEFAULT_DISTRICT_ID = 'd-qamashi';
export const DEFAULT_REGION_ID = 'r-qashqadaryo';
export const DEFAULT_REGION_NAME = 'Qashqadaryo viloyati';

export function emptyCenterInfo(
  district: { id: string; name: string; region?: string },
  overrides: Partial<CenterInfo> = {}
): CenterInfo {
  return {
    name: 'Kelajak Markazi',
    district: district.name,
    region: district.region || DEFAULT_REGION_NAME,
    address: '',
    phone: '',
    email: '',
    director: '',
    workingHours: '',
    seasonStart: '',
    seasonEnd: '',
    ageRange: '6 — 18 yosh',
    group: '',
    monthlyFee: MONTHLY_FEE,
    namedClubs: 0,
    totalStudents: 0,
    districtId: district.id,
    ...overrides,
  };
}
