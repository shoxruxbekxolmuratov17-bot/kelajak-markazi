import type {
  AuthUser,
  Circle,
  Student,
  Teacher,
  Payment,
  Project,
  ScheduleItem,
  Message,
  EnrollmentRequest,
  AttendanceRecord,
  LabEquipment,
  Partnership,
  School,
  StaffAccount,
  ParentAccount,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const TOKEN_KEY = 'kelajak-token';
const DISTRICT_KEY = 'kelajak-district-id';

const DEFAULT_TIMEOUT_MS = 15000;
const AUTH_TIMEOUT_MS = 20000;
const HEALTH_TIMEOUT_MS = 8000;

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

export function getActiveDistrictId(): string | null {
  try {
    return localStorage.getItem(DISTRICT_KEY);
  } catch {
    return null;
  }
}

export function setActiveDistrictId(id: string | null) {
  try {
    if (id) localStorage.setItem(DISTRICT_KEY, id);
    else localStorage.removeItem(DISTRICT_KEY);
  } catch {
    // ignore
  }
}

type RequestOptions = RequestInit & { timeoutMs?: number };

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> | undefined),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const districtId = getActiveDistrictId();
  if (districtId) headers['X-District-Id'] = districtId;

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error((data as { error?: string }).error || `API xatosi (${res.status})`);
    }
    return data as T;
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error('Server javob bermadi (timeout)');
    }
    if (e instanceof TypeError) {
      throw new Error("Serverga ulanishning imkoni yo'q");
    }
    throw e;
  } finally {
    window.clearTimeout(timer);
  }
}

export const api = {
  health: () => request<{ ok: boolean }>('/health', { timeoutMs: HEALTH_TIMEOUT_MS }),
  login: (username: string, password: string) =>
    request<{ token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      timeoutMs: AUTH_TIMEOUT_MS,
    }),
  me: () =>
    request<{ user: AuthUser }>('/auth/me', { timeoutMs: AUTH_TIMEOUT_MS }),
  parentLogin: (phone: string, pin: string) =>
    request<{ token: string; user: AuthUser }>('/auth/parent', {
      method: 'POST',
      body: JSON.stringify({ phone, pin }),
      timeoutMs: AUTH_TIMEOUT_MS,
    }),
  createMessage: (data: Partial<Message>) =>
    request<Message>('/messages', { method: 'POST', body: JSON.stringify(data) }),
  backup: () => request<{ ok: boolean; path: string }>('/admin/backup', { method: 'POST' }),
  bootstrap: () =>
    request<{
      centerInfo: unknown;
      districts?: Array<{ id: string; name: string; region: string; code: string }>;
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
    }>('/bootstrap', { timeoutMs: 12000 }),
  dashboardStats: () => request<Record<string, unknown>>('/stats/dashboard'),
  createCircle: (data: Partial<Circle>) => request<Circle>('/circles', { method: 'POST', body: JSON.stringify(data) }),
  updateCircle: (id: string, data: Partial<Circle>) =>
    request<Circle>(`/circles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCircle: (id: string) => request(`/circles/${id}`, { method: 'DELETE' }),
  createStudent: (data: Partial<Student>) =>
    request<Student>('/students', { method: 'POST', body: JSON.stringify(data) }),
  updateStudent: (id: string, data: Partial<Student>) =>
    request<Student>(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStudent: (id: string) => request(`/students/${id}`, { method: 'DELETE' }),
  createTeacher: (data: Partial<Teacher>) =>
    request<Teacher>('/teachers', { method: 'POST', body: JSON.stringify(data) }),
  updateTeacher: (id: string, data: Partial<Teacher>) =>
    request<Teacher>(`/teachers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTeacher: (id: string) => request(`/teachers/${id}`, { method: 'DELETE' }),
  listUsers: () => request<StaffAccount[]>('/users'),
  suggestUsername: (fullName: string) =>
    request<{ username: string }>(`/users/suggest-username?fullName=${encodeURIComponent(fullName)}`),
  createUser: (data: {
    username: string;
    password?: string;
    fullName: string;
    teacherId?: string;
    phone?: string;
    role?: string;
    districtId?: string;
  }) =>
    request<StaffAccount & { tempPassword?: string }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateUser: (id: string, data: Partial<StaffAccount>) =>
    request<StaffAccount>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  setUserPassword: (id: string, password: string) =>
    request<{ ok: boolean }>(`/users/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify({ password }),
    }),
  blockUser: (id: string, blocked: boolean) =>
    request<StaffAccount>(`/users/${id}/block`, {
      method: 'POST',
      body: JSON.stringify({ blocked }),
    }),
  deleteUser: (id: string) => request(`/users/${id}`, { method: 'DELETE' }),
  listParents: () => request<ParentAccount[]>('/parents'),
  setParentPin: (phoneNorm: string, pin: string) =>
    request<{ ok: boolean; pin: string }>(`/parents/${phoneNorm}/pin`, {
      method: 'PUT',
      body: JSON.stringify({ pin }),
    }),
  updatePayment: (id: string, data: Partial<Payment>) =>
    request<Payment>(`/payments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  createProject: (data: Partial<Project>) =>
    request<Project>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id: string, data: Partial<Project>) =>
    request<Project>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  createSchedule: (data: Partial<ScheduleItem>) =>
    request<ScheduleItem>('/schedule', { method: 'POST', body: JSON.stringify(data) }),
  updateSchedule: (id: string, data: Partial<ScheduleItem>) =>
    request<ScheduleItem>(`/schedule/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSchedule: (id: string) => request(`/schedule/${id}`, { method: 'DELETE' }),
  markMessageRead: (id: string) => request(`/messages/${id}/read`, { method: 'POST' }),
  submitEnrollment: (
    data: Omit<EnrollmentRequest, 'id' | 'status' | 'submittedAt'> & { pin?: string }
  ) => request<EnrollmentRequest>('/enrollments', { method: 'POST', body: JSON.stringify(data) }),
  paymentIntent: (paymentId: string, provider: 'click' | 'payme') =>
    request<{
      paymentId: string;
      provider: string;
      amount: number;
      sandbox: boolean;
      checkoutUrl: string | null;
      message: string;
    }>('/payments/intent', { method: 'POST', body: JSON.stringify({ paymentId, provider }) }),
  sandboxCompletePayment: (paymentId: string, provider: string) =>
    request<{ ok: boolean; payment: Payment }>('/payments/sandbox/complete', {
      method: 'POST',
      body: JSON.stringify({ paymentId, provider }),
    }),
  requestParentOtp: (phone: string, districtId?: string) =>
    request<{ ok: boolean; expiresInSec: number; demoCode?: string }>('/auth/parent/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phone, districtId }),
    }),
  changeParentPin: (data: { oldPin?: string; newPin: string; otp?: string }) =>
    request<{ ok: boolean }>('/auth/parent/pin/change', { method: 'POST', body: JSON.stringify(data) }),
  inclusiveStats: () => request<Record<string, unknown>>('/stats/inclusive'),
  districts: () => request<Array<{ id: string; name: string; region: string; code: string }>>('/districts'),
  approveEnrollment: (id: string) => request(`/enrollments/${id}/approve`, { method: 'POST' }),
  rejectEnrollment: (id: string, note?: string) =>
    request(`/enrollments/${id}/reject`, { method: 'POST', body: JSON.stringify({ note }) }),
  bulkAttendance: (records: AttendanceRecord[]) =>
    request('/attendance/bulk', { method: 'POST', body: JSON.stringify({ records }) }),
  updateLab: (id: string, data: Partial<LabEquipment>) =>
    request<LabEquipment>(`/lab/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  addNetworkCircle: (schoolId: string, data: Partial<Circle>) =>
    request<Circle>(`/schools/${schoolId}/circles`, { method: 'POST', body: JSON.stringify(data) }),
  createPartnership: (data: Partial<Partnership>) =>
    request<Partnership>('/partnerships', { method: 'POST', body: JSON.stringify(data) }),
};

export async function apiAvailable() {
  try {
    await api.health();
    return true;
  } catch {
    return false;
  }
}
