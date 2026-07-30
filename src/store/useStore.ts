import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Circle, Student, Teacher, Payment, Project, Message, ScheduleItem,
  EnrollmentRequest, AttendanceRecord, LabEquipment, Partnership, School, AuthUser, StaffAccount, ParentAccount,
} from '../types';
import { MONTHLY_FEE } from '../types';
import {
  initialCircles,
  initialStudents,
  initialTeachers,
  initialPayments,
  initialProjects,
  initialMessages,
  initialSchedule,
  initialEnrollmentRequests,
  initialAttendance,
  initialLabEquipment,
  initialPartnerships,
  initialSchools,
} from '../data/initialData';
import { api, setToken, getToken, setActiveDistrictId, getActiveDistrictId } from '../api/client';

export type DistrictInfo = { id: string; name: string; region: string; code: string; regionId?: string };

export type CenterInfoState = {
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
};

const emptyUiCenter = (): CenterInfoState => ({
  name: 'Kelajak Markazi',
  district: '',
  region: 'Qashqadaryo viloyati',
  address: '',
  phone: '',
  email: '',
  director: '',
  workingHours: '',
  seasonStart: '',
  seasonEnd: '',
  ageRange: '',
  group: '',
  monthlyFee: MONTHLY_FEE,
  namedClubs: 0,
  totalStudents: 0,
});

interface AppState {
  darkMode: boolean;
  apiOnline: boolean;
  districts: DistrictInfo[];
  activeDistrictId: string | null;
  centerInfo: CenterInfoState;
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
  staffAccounts: StaffAccount[];
  parentAccounts: ParentAccount[];
  authUser: AuthUser | null;
  parentPhone: string | null;
  sidebarCollapsed: boolean;

  setApiOnline: (v: boolean) => void;
  setActiveDistrict: (id: string | null) => Promise<void>;
  hydrateFromApi: () => Promise<boolean>;
  restoreSession: () => Promise<boolean>;
  loadStaffAccounts: () => Promise<void>;
  loadParentAccounts: () => Promise<void>;
  setParentPin: (phoneNorm: string, pin: string) => Promise<boolean>;
  loginWithCredentials: (username: string, password: string) => Promise<string | null>;
  loginParentWithPhone: (phone: string, pin: string) => Promise<string | null>;
  login: (user: AuthUser) => void;
  logout: () => void;

  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  addStudent: (student: Student) => void;
  updateStudent: (id: string, data: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  addCircle: (circle: Circle) => void;
  updateCircle: (id: string, data: Partial<Circle>) => void;
  deleteCircle: (id: string) => void;
  addTeacher: (teacher: Teacher) => void;
  updateTeacher: (id: string, data: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;
  createStaffAccount: (data: {
    username: string;
    password?: string;
    fullName: string;
    teacherId?: string;
    phone?: string;
  }) => Promise<(StaffAccount & { tempPassword?: string }) | null>;
  updateStaffAccount: (id: string, data: Partial<StaffAccount>) => Promise<StaffAccount | null>;
  setStaffPassword: (id: string, password: string) => Promise<boolean>;
  blockStaffAccount: (id: string, blocked: boolean) => Promise<boolean>;
  deleteStaffAccount: (id: string) => Promise<boolean>;
  addPayment: (payment: Payment) => void;
  updatePayment: (id: string, data: Partial<Payment>) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  addScheduleItem: (item: ScheduleItem) => void;
  updateScheduleItem: (id: string, data: Partial<ScheduleItem>) => void;
  deleteScheduleItem: (id: string) => void;
  markMessageRead: (id: string) => void;
  addMessage: (msg: Omit<Message, 'id' | 'date' | 'read'>) => void;
  enrollStudent: (studentId: string, circleId: string) => void;

  submitEnrollment: (req: Omit<EnrollmentRequest, 'id' | 'status' | 'submittedAt'> & { pin?: string }) => Promise<string | null>;
  approveEnrollment: (id: string) => void;
  rejectEnrollment: (id: string, note?: string) => void;
  parentLogin: (phone: string, pin?: string) => boolean;
  parentLogout: () => void;
  addAttendance: (record: AttendanceRecord) => void;
  saveAttendanceBulk: (records: AttendanceRecord[]) => Promise<void>;
  updateLabEquipment: (id: string, data: Partial<LabEquipment>) => void;
  addNetworkCircle: (schoolId: string, circle: Omit<Circle, 'id' | 'isNetwork' | 'enrolled' | 'progress' | 'school'>) => void;
  addPartnership: (p: Partnership) => void;
  flushOfflineQueue: () => Promise<void>;
}

function applyBootstrap(set: (p: Partial<AppState>) => void, data: Awaited<ReturnType<typeof api.bootstrap>>) {
  const raw = (data.circles as Circle[]) || [];
  const sortedCircles = [...raw].sort((a, b) => {
    const aActive = a.enrolled > 0 ? 1 : 0;
    const bActive = b.enrolled > 0 ? 1 : 0;
    if (bActive !== aActive) return bActive - aActive;
    return b.enrolled - a.enrolled || a.name.localeCompare(b.name, 'uz');
  });
  set({
    districts: (data.districts as DistrictInfo[]) || [],
    centerInfo: (data.centerInfo as CenterInfoState) || emptyUiCenter(),
    circles: sortedCircles,
    students: (data.students as Student[]) || [],
    teachers: (data.teachers as Teacher[]) || [],
    payments: (data.payments as Payment[]) || [],
    projects: (data.projects as Project[]) || [],
    schedule: (data.schedule as ScheduleItem[]) || [],
    messages: (data.messages as Message[]) || [],
    enrollmentRequests: (data.enrollmentRequests as EnrollmentRequest[]) || [],
    attendance: (data.attendance as AttendanceRecord[]) || [],
    labEquipment: (data.labEquipment as LabEquipment[]) || [],
    partnerships: (data.partnerships as Partnership[]) || [],
    schools: (data.schools as School[]) || [],
    apiOnline: true,
  });
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      darkMode: false,
      apiOnline: false,
      districts: [],
      activeDistrictId: getActiveDistrictId(),
      centerInfo: emptyUiCenter(),
      circles: initialCircles,
      students: initialStudents,
      teachers: initialTeachers,
      payments: initialPayments,
      projects: initialProjects,
      schedule: initialSchedule,
      messages: initialMessages,
      enrollmentRequests: initialEnrollmentRequests,
      attendance: initialAttendance,
      labEquipment: initialLabEquipment,
      partnerships: initialPartnerships,
      schools: initialSchools,
      staffAccounts: [],
      parentAccounts: [],
      authUser: null,
      parentPhone: null,
      sidebarCollapsed: false,

      setApiOnline: (v) => set({ apiOnline: v }),

      loadStaffAccounts: async () => {
        const role = get().authUser?.role;
        if (!getToken() || !role || !['superadmin', 'district_admin', 'admin'].includes(role)) {
          set({ staffAccounts: [] });
          return;
        }
        try {
          const list = await api.listUsers();
          set({ staffAccounts: list });
        } catch (e) {
          console.error('loadStaffAccounts failed', e);
        }
      },

      loadParentAccounts: async () => {
        const role = get().authUser?.role;
        if (!getToken() || !role || !['superadmin', 'district_admin', 'admin'].includes(role)) {
          set({ parentAccounts: [] });
          return;
        }
        try {
          const list = await api.listParents();
          set({ parentAccounts: list });
        } catch (e) {
          console.error('loadParentAccounts failed', e);
        }
      },

      setParentPin: async (phoneNorm, pin) => {
        try {
          await api.setParentPin(phoneNorm, pin);
          await get().loadParentAccounts();
          return true;
        } catch (e) {
          console.error('setParentPin failed', e);
          throw e;
        }
      },

      setActiveDistrict: async (id) => {
        setActiveDistrictId(id);
        set({
          activeDistrictId: id,
          // Tuman almashtirishda eski (masalan Qamashi) ma'lumot oqib ketmasin
          circles: [],
          students: [],
          teachers: [],
          payments: [],
          projects: [],
          schedule: [],
          messages: [],
          enrollmentRequests: [],
          attendance: [],
          labEquipment: [],
          partnerships: [],
          schools: [],
          centerInfo: emptyUiCenter(),
        });
        await get().hydrateFromApi();
      },

      hydrateFromApi: async () => {
        try {
          const data = await api.bootstrap();
          if (!getToken()) {
            // Ochiq sahifalar (masalan /royxat) — faqat to'garaklar
            const raw = (data.circles as Circle[]) || [];
            const sorted = [...raw].sort((a, b) => {
              const aActive = a.enrolled > 0 ? 1 : 0;
              const bActive = b.enrolled > 0 ? 1 : 0;
              if (bActive !== aActive) return bActive - aActive;
              return b.enrolled - a.enrolled || a.name.localeCompare(b.name, 'uz');
            });
            set({
              apiOnline: true,
              circles: sorted.length ? sorted : get().circles,
            });
            return true;
          }
          applyBootstrap(set, data);
          await get().flushOfflineQueue();
          await get().loadStaffAccounts();
          await get().loadParentAccounts();
          return true;
        } catch {
          set({ apiOnline: false });
          return false;
        }
      },

      restoreSession: async () => {
        const token = getToken();
        if (!token) return false;
        try {
          const { user } = await api.me();
          set({
            authUser: user,
            parentPhone: user.role === 'parent' ? user.phone ?? null : null,
          });
          return true;
        } catch (e) {
          const msg = e instanceof Error ? e.message : '';
          if (/Unauthorized|Invalid token|bloklangan|Forbidden|401|403/i.test(msg)) {
            setToken(null);
            set({ authUser: null, parentPhone: null });
          }
          return false;
        }
      },

      flushOfflineQueue: async () => {
        try {
          const { flushOfflineQueue } = await import('../api/offlineQueue');
          await flushOfflineQueue(api as never);
          const data = await api.bootstrap();
          applyBootstrap(set, data);
        } catch {
          // ignore
        }
      },

      loginWithCredentials: async (username, password) => {
        try {
          const { token, user } = await api.login(username, password);
          setToken(token);
          set({
            authUser: user,
            parentPhone: null,
            apiOnline: true,
          });
          // Bootstrap fonida — login tugmasini kutdirmaslik
          void get().hydrateFromApi();
          return null;
        } catch (e) {
          return e instanceof Error ? e.message : "Login xatosi";
        }
      },

      loginParentWithPhone: async (phone, pin) => {
        try {
          const { token, user } = await api.parentLogin(phone, pin);
          setToken(token);
          set({
            authUser: user,
            parentPhone: phone,
            apiOnline: true,
          });
          void get().hydrateFromApi();
          return null;
        } catch (e) {
          return e instanceof Error ? e.message : "Login xatosi";
        }
      },

      login: (user) => set({
        authUser: user,
        parentPhone: user.role === 'parent' ? (user.phone ?? null) : null,
      }),
      logout: () => {
        setToken(null);
        setActiveDistrictId(null);
        set({ authUser: null, parentPhone: null, activeDistrictId: null, districts: [] });
      },

      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      addStudent: (student) => {
        if (!getToken()) {
          console.warn('addStudent: JWT yo‘q — avval tizimga kiring');
          return;
        }
        void api
          .createStudent(student)
          .then((created) => {
            set((s) => ({ students: [...s.students, created] }));
          })
          .catch((e) => console.error('createStudent failed', e));
      },
      updateStudent: (id, data) => {
        set((s) => ({
          students: s.students.map((st) => (st.id === id ? { ...st, ...data } : st)),
        }));
        if (getToken()) api.updateStudent(id, data).catch((e) => console.error(e));
      },
      deleteStudent: (id) => {
        set((s) => ({ students: s.students.filter((st) => st.id !== id) }));
        if (getToken()) api.deleteStudent(id).catch((e) => console.error(e));
      },

      addCircle: (circle) => {
        if (!getToken()) {
          console.warn('addCircle: JWT yo‘q — avval tizimga kiring');
          return;
        }
        void api
          .createCircle(circle)
          .then((created) => {
            set((s) => ({ circles: [...s.circles, created] }));
          })
          .catch((e) => console.error('createCircle failed', e));
      },
      updateCircle: (id, data) => {
        set((s) => ({
          circles: s.circles.map((c) => (c.id === id ? { ...c, ...data } : c)),
        }));
        if (getToken()) api.updateCircle(id, data).catch((e) => console.error(e));
      },
      deleteCircle: (id) => {
        set((s) => ({ circles: s.circles.filter((c) => c.id !== id) }));
        if (getToken()) api.deleteCircle(id).catch((e) => console.error(e));
      },

      addTeacher: (teacher) => {
        if (!getToken()) {
          console.warn('addTeacher: JWT yo‘q — avval tizimga kiring');
          return;
        }
        void api
          .createTeacher(teacher)
          .then((created) => {
            set((s) => ({ teachers: [...s.teachers, created] }));
          })
          .catch((e) => console.error('createTeacher failed', e));
      },
      updateTeacher: (id, data) => {
        set((s) => ({
          teachers: s.teachers.map((t) => (t.id === id ? { ...t, ...data } : t)),
        }));
        if (getToken()) api.updateTeacher(id, data).catch((e) => console.error(e));
      },
      deleteTeacher: (id) => {
        set((s) => ({ teachers: s.teachers.filter((t) => t.id !== id) }));
        if (getToken()) api.deleteTeacher(id).catch((e) => console.error(e));
      },

      createStaffAccount: async (data) => {
        if (!getToken()) return null;
        try {
          const created = await api.createUser(data);
          set((s) => ({
            staffAccounts: [...s.staffAccounts.filter((a) => a.id !== created.id), created],
          }));
          return created;
        } catch (e) {
          console.error('createStaffAccount failed', e);
          throw e;
        }
      },
      updateStaffAccount: async (id, data) => {
        if (!getToken()) return null;
        try {
          const updated = await api.updateUser(id, data);
          set((s) => ({
            staffAccounts: s.staffAccounts.map((a) => (a.id === id ? updated : a)),
          }));
          return updated;
        } catch (e) {
          console.error('updateStaffAccount failed', e);
          throw e;
        }
      },
      setStaffPassword: async (id, password) => {
        if (!getToken()) return false;
        try {
          await api.setUserPassword(id, password);
          return true;
        } catch (e) {
          console.error('setStaffPassword failed', e);
          throw e;
        }
      },
      blockStaffAccount: async (id, blocked) => {
        if (!getToken()) return false;
        try {
          const updated = await api.blockUser(id, blocked);
          set((s) => ({
            staffAccounts: s.staffAccounts.map((a) => (a.id === id ? updated : a)),
          }));
          return true;
        } catch (e) {
          console.error('blockStaffAccount failed', e);
          throw e;
        }
      },
      deleteStaffAccount: async (id) => {
        if (!getToken()) return false;
        try {
          await api.deleteUser(id);
          set((s) => ({ staffAccounts: s.staffAccounts.filter((a) => a.id !== id) }));
          return true;
        } catch (e) {
          console.error('deleteStaffAccount failed', e);
          throw e;
        }
      },

      addPayment: (payment) => set((s) => ({ payments: [...s.payments, payment] })),
      updatePayment: (id, data) => {
        set((s) => ({
          payments: s.payments.map((p) => (p.id === id ? { ...p, ...data } : p)),
        }));
        if (getToken()) api.updatePayment(id, data).catch((e) => console.error(e));
      },

      addProject: (project) => {
        if (!getToken()) {
          console.warn('addProject: JWT yo‘q');
          return;
        }
        void api
          .createProject(project)
          .then((created) => {
            set((s) => ({ projects: [...s.projects, created] }));
          })
          .catch((e) => console.error('createProject failed', e));
      },
      updateProject: (id, data) => {
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, ...data } : p)),
        }));
        if (getToken()) api.updateProject(id, data).catch((e) => console.error(e));
      },

      addScheduleItem: (item) => {
        if (!getToken()) {
          console.warn('addScheduleItem: JWT yo‘q');
          return;
        }
        void api
          .createSchedule(item)
          .then((created) => {
            set((s) => ({ schedule: [...s.schedule, created] }));
          })
          .catch((e) => console.error('createSchedule failed', e));
      },
      updateScheduleItem: (id, data) => {
        set((s) => ({
          schedule: s.schedule.map((x) => (x.id === id ? { ...x, ...data } : x)),
        }));
        if (getToken()) api.updateSchedule(id, data).catch((e) => console.error(e));
      },
      deleteScheduleItem: (id) => {
        set((s) => ({ schedule: s.schedule.filter((x) => x.id !== id) }));
        if (getToken()) api.deleteSchedule(id).catch((e) => console.error(e));
      },

      markMessageRead: (id) => {
        set((s) => ({
          messages: s.messages.map((m) => (m.id === id ? { ...m, read: true } : m)),
        }));
        if (getToken()) api.markMessageRead(id).catch((e) => console.error(e));
      },

      addMessage: (msg) => {
        if (!getToken()) {
          console.warn('addMessage: JWT yo‘q');
          return;
        }
        void api
          .createMessage(msg)
          .then(() => get().hydrateFromApi())
          .catch((e) => console.error(e));
      },

      enrollStudent: (studentId, circleId) => {
        const { students, circles } = get();
        const circle = circles.find((c) => c.id === circleId);
        if (!circle || circle.enrolled >= circle.capacity) return;
        set({
          students: students.map((st) =>
            st.id === studentId
              ? { ...st, circleIds: [...new Set([...st.circleIds, circleId])] }
              : st
          ),
          circles: circles.map((c) =>
            c.id === circleId ? { ...c, enrolled: c.enrolled + 1 } : c
          ),
        });
      },

      submitEnrollment: async (req) => {
        const { pin, ...rest } = req as Omit<EnrollmentRequest, 'id' | 'status' | 'submittedAt'> & { pin?: string };
        try {
          await api.submitEnrollment({ ...rest, pin });
          await get().hydrateFromApi();
          set({ parentPhone: rest.parentPhone });
          return null;
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Ro'yxatdan o'tish xatosi";
          return msg || "Serverga saqlanmadi — qayta urinib ko'ring";
        }
      },

      approveEnrollment: (id) => {
        if (!getToken()) return;
        void api
          .approveEnrollment(id)
          .then(() => get().hydrateFromApi())
          .catch((e) => console.error(e));
      },

      rejectEnrollment: (id, note) => {
        set((s) => ({
          enrollmentRequests: s.enrollmentRequests.map((r) =>
            r.id === id ? { ...r, status: 'rejected' as const, note } : r
          ),
        }));
        if (getToken()) api.rejectEnrollment(id, note).catch((e) => console.error(e));
      },

      parentLogin: (phone, pin) => {
        const norm = (p: string) => p.replace(/\D/g, '');
        const phoneN = norm(phone);
        const hasChild = get().students.some((s) => norm(s.parentPhone) === phoneN);
        if (!hasChild || !pin || pin.length < 4) return false;
        set({ parentPhone: phone.trim() });
        return true;
      },

      parentLogout: () => {
        setToken(null);
        set({ authUser: null, parentPhone: null });
      },

      addAttendance: (record) => set((s) => ({ attendance: [...s.attendance, record] })),

      saveAttendanceBulk: async (records) => {
        if (!getToken()) {
          console.warn('saveAttendanceBulk: JWT yo‘q');
          return;
        }
        try {
          await api.bulkAttendance(records);
          await get().hydrateFromApi();
        } catch (e) {
          console.error('bulkAttendance failed', e);
          throw e;
        }
      },

      updateLabEquipment: (id, data) => {
        set((s) => ({
          labEquipment: s.labEquipment.map((e) => (e.id === id ? { ...e, ...data } : e)),
        }));
        if (getToken()) api.updateLab(id, data).catch((e) => console.error(e));
      },

      addNetworkCircle: (schoolId, circleData) => {
        if (!getToken()) {
          console.warn('addNetworkCircle: JWT yo‘q');
          return;
        }
        void api
          .addNetworkCircle(schoolId, circleData)
          .then(() => get().hydrateFromApi())
          .catch((e) => console.error(e));
      },

      addPartnership: (p) => {
        if (!getToken()) {
          console.warn('addPartnership: JWT yo‘q');
          return;
        }
        void api
          .createPartnership(p)
          .then(() => get().hydrateFromApi())
          .catch((e) => console.error(e));
      },
    }),
    {
      name: 'kelajak-markazi-store-v10',
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          try {
            return localStorage.getItem(name);
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, value);
          } catch {
            // storage full or blocked
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch {
            // ignore
          }
        },
      })),
      // Faqat UI sozlamasi — o'quvchi/to'lov/guruh ma'lumotlari Postgresdan keladi
      partialize: (state) => ({
        darkMode: state.darkMode,
        authUser: state.authUser,
        parentPhone: state.parentPhone,
      }),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<AppState>;
        const current = currentState as AppState;
        const persistedTeachers = persisted.teachers || [];
        const hasOfficialStaff = persistedTeachers.some(
          (t) => t.id === 'st1' && (t.fullName || '').includes('Nurmatova')
        );
        const persistedCircles = persisted.circles || [];
        const persistedEnrolled = persistedCircles.reduce((s, c) => s + (c.enrolled || 0), 0);
        const freshEnrolled = current.circles.reduce((s, c) => s + (c.enrolled || 0), 0);
        // Rasmiy jadval (1410 o'quvchi) yangilanganda eski cache ni almashtirish
        const useFreshCircles =
          !persistedCircles.some((c) => String(c.id).startsWith('c-')) ||
          persistedEnrolled !== freshEnrolled ||
          persistedCircles.length !== current.circles.length;
        return {
          ...current,
          ...persisted,
          teachers: hasOfficialStaff ? persistedTeachers : current.teachers,
          circles: useFreshCircles ? current.circles : persistedCircles,
          authUser: current.authUser ?? persisted.authUser ?? null,
          parentPhone: current.parentPhone ?? persisted.parentPhone ?? null,
        };
      },
    }
  )
);
