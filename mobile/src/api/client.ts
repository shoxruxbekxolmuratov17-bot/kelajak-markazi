import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

function extractLanIp(): string | null {
  const candidates = [
    Constants.expoConfig?.hostUri,
    // @ts-expect-error expoGoConfig mavjud bo'lishi mumkin
    Constants.expoGoConfig?.debuggerHost,
    Constants.linkingUri,
    // @ts-expect-error manifest2
    Constants.manifest2?.extra?.expoClient?.hostUri,
    // @ts-expect-error legacy manifest
    Constants.manifest?.debuggerHost,
    // @ts-expect-error legacy
    Constants.manifest?.hostUri,
  ]
    .filter(Boolean)
    .map(String);

  for (const c of candidates) {
    const m = c.match(/(\d{1,3}(?:\.\d{1,3}){3})/);
    if (m) return m[1];
  }
  return null;
}

function resolveApiUrl(): string {
  const fromExtra = String(Constants.expoConfig?.extra?.apiUrl || '').trim();
  const fromEnv = (process.env.EXPO_PUBLIC_API_URL || '').trim();
  for (const candidate of [fromExtra, fromEnv]) {
    if (candidate && !/localhost|127\.0\.0\.1/i.test(candidate)) {
      return candidate.replace(/\/$/, '');
    }
  }

  const lanIp = extractLanIp();
  if (lanIp) return `http://${lanIp}:3001/api`;

  // Web (brauzer) da localhost OK
  if (Platform.OS === 'web') {
    return (fromEnv || 'http://localhost:3001/api').replace(/\/$/, '');
  }

  // Native + tunnel: hostUri da IP bo'lmasa — env/LAN kerak
  // Android emulator uchun maxsus loopback
  if (Platform.OS === 'android') {
    // Faqat emulatorda 10.0.2.2 → host PC; real device da ishlamaydi
    // Real device uchun EXPO_PUBLIC_API_URL / start skripti LAN IP beradi
  }

  return (fromEnv || 'http://localhost:3001/api').replace(/\/$/, '');
}

let cachedApiUrl: string | null = null;

export function getApiUrl() {
  if (!cachedApiUrl) cachedApiUrl = resolveApiUrl();
  return cachedApiUrl;
}

/** Test / debug: URL ni qayta hisoblash */
export function refreshApiUrl() {
  cachedApiUrl = resolveApiUrl();
  return cachedApiUrl;
}

const TOKEN_KEY = 'kelajak-mobile-token';
const DISTRICT_KEY = 'kelajak-mobile-district-id';

let token: string | null = null;
let activeDistrictId: string | null = null;
let tokenReady: Promise<void> | null = null;

export async function initApiToken() {
  if (!tokenReady) {
    tokenReady = (async () => {
      token = await AsyncStorage.getItem(TOKEN_KEY);
      activeDistrictId = await AsyncStorage.getItem(DISTRICT_KEY);
    })();
  }
  await tokenReady;
}

export async function setApiToken(t: string | null) {
  token = t;
  if (t) await AsyncStorage.setItem(TOKEN_KEY, t);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

export function getApiToken() {
  return token;
}

export function getActiveDistrictId() {
  return activeDistrictId;
}

export async function setActiveDistrictId(id: string | null) {
  activeDistrictId = id;
  if (id) await AsyncStorage.setItem(DISTRICT_KEY, id);
  else await AsyncStorage.removeItem(DISTRICT_KEY);
}

const DEFAULT_TIMEOUT_MS = 15000;
const LOGIN_TIMEOUT_MS = 20000;

type RequestOptions = RequestInit & { timeoutMs?: number };

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options;
  await initApiToken();
  const apiUrl = getApiUrl();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (activeDistrictId) headers['X-District-Id'] = activeDistrictId;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${apiUrl}${path}`, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error((data as { error?: string }).error || `API ${res.status}`);
    }
    return data as T;
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error(
        `Server javob bermadi (timeout).\nAPI: ${apiUrl}\nTelefon va PC bir Wi‑Fi da bo'lsin; npm run stop → npm run dev:tunnel`
      );
    }
    if (e instanceof TypeError) {
      throw new Error(
        `Serverga ulanishning imkoni yo'q.\nAPI: ${apiUrl}\nAPI ishlayaptimi? (port 3001)`
      );
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  health: () =>
    request<{ ok: boolean; db?: string; cache?: string; demoMode?: boolean }>('/health', {
      timeoutMs: 8000,
    }),
  login: (username: string, password: string) =>
    request<{ token: string; user: Record<string, unknown> }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      timeoutMs: LOGIN_TIMEOUT_MS,
    }),
  parentLogin: (phone: string, pin: string) =>
    request<{ token: string; user: Record<string, unknown> }>('/auth/parent', {
      method: 'POST',
      body: JSON.stringify({ phone, pin }),
      timeoutMs: LOGIN_TIMEOUT_MS,
    }),
  me: () =>
    request<{ user: Record<string, unknown> }>('/auth/me', { timeoutMs: LOGIN_TIMEOUT_MS }),
  bootstrap: () => request<Record<string, unknown>>('/bootstrap', { timeoutMs: 20000 }),
  dashboardStats: () => request<Record<string, unknown>>('/stats/dashboard'),
  backup: () => request<{ ok: boolean; path: string }>('/admin/backup', { method: 'POST' }),
  districts: () =>
    request<Array<{ id: string; name: string; region: string; code: string; regionId?: string }>>(
      '/districts'
    ),

  submitEnrollment: (body: unknown) => request('/enrollments', { method: 'POST', body: JSON.stringify(body) }),
  approveEnrollment: (id: string) => request(`/enrollments/${id}/approve`, { method: 'POST' }),
  rejectEnrollment: (id: string, note?: string) =>
    request(`/enrollments/${id}/reject`, { method: 'POST', body: JSON.stringify({ note }) }),

  markMessageRead: (id: string) => request(`/messages/${id}/read`, { method: 'POST' }),
  createMessage: (body: unknown) => request('/messages', { method: 'POST', body: JSON.stringify(body) }),

  bulkAttendance: (records: unknown[]) =>
    request('/attendance/bulk', { method: 'POST', body: JSON.stringify({ records }) }),

  updatePayment: (id: string, data: unknown) =>
    request(`/payments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  paymentIntent: (paymentId: string, provider: 'click' | 'payme') =>
    request<{ checkoutUrl?: string; sandbox?: boolean; message?: string }>('/payments/intent', {
      method: 'POST',
      body: JSON.stringify({ paymentId, provider }),
    }),
  sandboxCompletePayment: (paymentId: string, provider: string) =>
    request<{ ok: boolean; payment?: { providerTxn?: string; status?: string } }>(
      '/payments/sandbox/complete',
      { method: 'POST', body: JSON.stringify({ paymentId, provider }) }
    ),

  createStudent: (data: unknown) => request('/students', { method: 'POST', body: JSON.stringify(data) }),
  updateStudent: (id: string, data: unknown) =>
    request(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStudent: (id: string) => request(`/students/${id}`, { method: 'DELETE' }),

  createCircle: (data: unknown) => request('/circles', { method: 'POST', body: JSON.stringify(data) }),
  updateCircle: (id: string, data: unknown) =>
    request(`/circles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCircle: (id: string) => request(`/circles/${id}`, { method: 'DELETE' }),

  createTeacher: (data: unknown) => request('/teachers', { method: 'POST', body: JSON.stringify(data) }),
  updateTeacher: (id: string, data: unknown) =>
    request(`/teachers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTeacher: (id: string) => request(`/teachers/${id}`, { method: 'DELETE' }),

  listUsers: () => request<Array<Record<string, unknown>>>('/users'),
  listParents: () => request<Array<Record<string, unknown>>>('/parents'),
  setParentPin: (phoneNorm: string, pin: string) =>
    request<{ ok: boolean; pin: string }>(`/parents/${phoneNorm}/pin`, {
      method: 'PUT',
      body: JSON.stringify({ pin }),
    }),
  suggestUsername: (fullName: string) =>
    request<{ username: string }>(`/users/suggest-username?fullName=${encodeURIComponent(fullName)}`),
  createUser: (data: Record<string, unknown>) =>
    request<Record<string, unknown>>('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: string, data: Record<string, unknown>) =>
    request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  setUserPassword: (id: string, password: string) =>
    request(`/users/${id}/password`, { method: 'PUT', body: JSON.stringify({ password }) }),
  blockUser: (id: string, blocked: boolean) =>
    request(`/users/${id}/block`, { method: 'POST', body: JSON.stringify({ blocked }) }),
  deleteUser: (id: string) => request(`/users/${id}`, { method: 'DELETE' }),

  createProject: (data: unknown) => request('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id: string, data: unknown) =>
    request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  createSchedule: (data: unknown) => request('/schedule', { method: 'POST', body: JSON.stringify(data) }),
  updateSchedule: (id: string, data: unknown) =>
    request(`/schedule/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSchedule: (id: string) => request(`/schedule/${id}`, { method: 'DELETE' }),

  updateLab: (id: string, data: unknown) =>
    request(`/lab/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  addNetworkCircle: (schoolId: string, data: unknown) =>
    request(`/schools/${schoolId}/circles`, { method: 'POST', body: JSON.stringify(data) }),
  createPartnership: (data: unknown) =>
    request('/partnerships', { method: 'POST', body: JSON.stringify(data) }),
};

export async function apiAvailable() {
  try {
    await api.health();
    return true;
  } catch {
    return false;
  }
}
