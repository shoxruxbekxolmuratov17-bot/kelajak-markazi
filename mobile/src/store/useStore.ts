import { InteractionManager } from 'react-native';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from '@/src/storage/safeStorage';
import type {
  Circle, Student, Teacher, Payment, Project, Message,
  EnrollmentRequest, AttendanceRecord, LabEquipment, Partnership, School, AuthUser,
  ScheduleItem, StaffAccount, ParentAccount,
} from '@shared/types';
import { MONTHLY_FEE } from '@shared/types';
import {
  initialCircles,
  initialStudents,
  initialTeachers,
  initialPayments,
  initialProjects,
  initialMessages,
  initialEnrollmentRequests,
  initialAttendance,
  initialLabEquipment,
  initialPartnerships,
  initialSchools,
  initialSchedule,
  centerInfo as defaultCenterInfo,
} from '@shared/data/initialData';
import { api, setApiToken, initApiToken, getApiToken, setActiveDistrictId as persistDistrictId } from '@/src/api/client';

export type DistrictInfo = { id: string; name: string; region: string; code: string; regionId?: string };

export type CenterInfoState = {
  name: string;
  district: string;
  region: string;
  address: string;
  phone: string;
  email: string;
  seasonStart?: string;
  seasonEnd?: string;
  ageRange?: string;
};

interface AppState {
  darkMode: boolean;
  apiOnline: boolean;
  apiSyncing: boolean;
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
  districts: DistrictInfo[];
  activeDistrictId: string | null;
  centerInfo: CenterInfoState;
  monthlyFee: number;
  _hasHydrated: boolean;

  login: (user: AuthUser) => void;
  logout: () => void;
  toggleDarkMode: () => void;
  markMessageRead: (id: string) => void;
  parentLogin: (phone: string, pin?: string) => boolean;
  loginWithCredentials: (username: string, password: string) => Promise<string | null>;
  loginParentWithPhone: (phone: string, pin: string) => Promise<string | null>;
  hydrateFromApi: () => Promise<void>;
  restoreSession: () => Promise<boolean>;
  loadStaffAccounts: () => Promise<void>;
  loadParentAccounts: () => Promise<void>;
  setParentPin: (phoneNorm: string, pin: string) => Promise<boolean>;
  setActiveDistrict: (id: string | null) => Promise<void>;
  submitEnrollment: (req: Omit<EnrollmentRequest, 'id' | 'status' | 'submittedAt'> & { pin?: string }) => Promise<string | null>;
  approveEnrollment: (id: string) => void;
  rejectEnrollment: (id: string, note?: string) => void;
  saveAttendanceBulk: (records: AttendanceRecord[]) => Promise<void>;
  updatePayment: (id: string, data: Partial<Payment>) => void;
  addStudent: (student: Partial<Student>) => void;
  updateStudent: (id: string, data: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  addCircle: (circle: Partial<Circle>) => void;
  updateCircle: (id: string, data: Partial<Circle>) => void;
  deleteCircle: (id: string) => void;
  addTeacher: (teacher: Partial<Teacher>) => void;
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
  addScheduleItem: (item: Partial<ScheduleItem>) => void;
  deleteScheduleItem: (id: string) => void;
  addProject: (project: Partial<Project>) => void;
  updateLabEquipment: (id: string, data: Partial<LabEquipment>) => void;
  addNetworkCircle: (schoolId: string, circleData: Partial<Circle>) => void;
  addPartnership: (p: Partial<Partnership>) => void;
  addMessage: (msg: Omit<Message, 'id' | 'date' | 'read'> & Partial<Pick<Message, 'id' | 'date' | 'read'>>) => void;
  runBackup: () => Promise<string>;
}

function emptyCenter(): CenterInfoState {
  return {
    name: defaultCenterInfo.name,
    district: defaultCenterInfo.district,
    region: defaultCenterInfo.region,
    address: defaultCenterInfo.address,
    phone: defaultCenterInfo.phone,
    email: defaultCenterInfo.email,
    seasonStart: defaultCenterInfo.seasonStart,
    seasonEnd: defaultCenterInfo.seasonEnd,
    ageRange: defaultCenterInfo.ageRange,
  };
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      darkMode: false,
      apiOnline: false,
      apiSyncing: false,
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
      districts: [],
      activeDistrictId: null,
      centerInfo: emptyCenter(),
      monthlyFee: MONTHLY_FEE,
      _hasHydrated: false,

      login: (user) =>
        set({
          authUser: user,
          parentPhone: user.role === 'parent' ? (user.phone ?? null) : null,
        }),
      logout: () => {
        void setApiToken(null);
        void persistDistrictId(null);
        set({ authUser: null, parentPhone: null, activeDistrictId: null, districts: [] });
      },
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),

      setActiveDistrict: async (id) => {
        await persistDistrictId(id === 'all' ? null : id);
        set({
          activeDistrictId: id === 'all' ? null : id,
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
        });
        await get().hydrateFromApi();
      },

      markMessageRead: (id) => {
        set((s) => ({
          messages: s.messages.map((m) => (m.id === id ? { ...m, read: true } : m)),
        }));
        api.markMessageRead(id).catch((e) => console.error(e));
      },
      parentLogin: (phone, pin) => {
        const normalize = (p: string) => p.replace(/\D/g, '');
        const normalized = normalize(phone);
        const hasChild = get().students.some((s) => normalize(s.parentPhone) === normalized);
        if (!hasChild || !pin || pin.length < 4) return false;
        set({ parentPhone: phone.trim() });
        return true;
      },

      hydrateFromApi: async () => {
        set({ apiSyncing: true });
        try {
          await initApiToken();
          const data = await api.bootstrap();
          await new Promise<void>((resolve) => {
            InteractionManager.runAfterInteractions(() => resolve());
          });
          const hasAuth = !!get().authUser;
          const raw = (data.circles as Circle[]) || get().circles;
          const circles = [...raw].sort((a, b) => {
            const aActive = a.enrolled > 0 ? 1 : 0;
            const bActive = b.enrolled > 0 ? 1 : 0;
            if (bActive !== aActive) return bActive - aActive;
            return b.enrolled - a.enrolled || a.name.localeCompare(b.name, 'uz');
          });
          const ci = data.centerInfo as CenterInfoState | undefined;
          set({
            apiOnline: true,
            circles,
            ...(ci
              ? {
                  centerInfo: {
                    name: ci.name || emptyCenter().name,
                    district: ci.district || '',
                    region: ci.region || '',
                    address: ci.address || '',
                    phone: ci.phone || '',
                    email: ci.email || '',
                    seasonStart: ci.seasonStart,
                    seasonEnd: ci.seasonEnd,
                    ageRange: ci.ageRange,
                  },
                }
              : {}),
            ...(hasAuth
              ? {
                  students: (data.students as Student[]) || get().students,
                  teachers: (data.teachers as Teacher[]) || get().teachers,
                  payments: (data.payments as Payment[]) || get().payments,
                  projects: (data.projects as Project[]) || get().projects,
                  schedule: (data.schedule as ScheduleItem[]) || get().schedule,
                  messages: (data.messages as Message[]) || get().messages,
                  enrollmentRequests:
                    (data.enrollmentRequests as EnrollmentRequest[]) || get().enrollmentRequests,
                  attendance: (data.attendance as AttendanceRecord[]) || get().attendance,
                  labEquipment: (data.labEquipment as LabEquipment[]) || get().labEquipment,
                  partnerships: (data.partnerships as Partnership[]) || get().partnerships,
                  schools: (data.schools as School[]) || get().schools,
                  districts: (data.districts as DistrictInfo[]) || get().districts,
                }
              : {}),
          });
          if (hasAuth) {
            await get().loadStaffAccounts();
            await get().loadParentAccounts();
          }
        } catch {
          set({ apiOnline: false });
        } finally {
          set({ apiSyncing: false });
        }
      },

      restoreSession: async () => {
        await initApiToken();
        if (!getApiToken()) return false;
        try {
          const { user } = await api.me();
          const u = user as AuthUser;
          set({
            authUser: u,
            parentPhone: u.role === 'parent' ? u.phone ?? null : null,
          });
          return true;
        } catch (e) {
          const msg = e instanceof Error ? e.message : '';
          if (/Unauthorized|Invalid token|bloklangan|Forbidden|401|403/i.test(msg)) {
            await setApiToken(null);
            set({ authUser: null, parentPhone: null });
          }
          return false;
        }
      },

      loadStaffAccounts: async () => {
        await initApiToken();
        const role = get().authUser?.role;
        if (!getApiToken() || !role || !['superadmin', 'district_admin', 'admin'].includes(role)) {
          set({ staffAccounts: [] });
          return;
        }
        try {
          const list = (await api.listUsers()) as StaffAccount[];
          set({ staffAccounts: list });
        } catch {
          // ignore
        }
      },

      loadParentAccounts: async () => {
        await initApiToken();
        const role = get().authUser?.role;
        if (!getApiToken() || !role || !['superadmin', 'district_admin', 'admin'].includes(role)) {
          set({ parentAccounts: [] });
          return;
        }
        try {
          const list = (await api.listParents()) as ParentAccount[];
          set({ parentAccounts: list });
        } catch {
          // ignore
        }
      },

      setParentPin: async (phoneNorm, pin) => {
        try {
          await api.setParentPin(phoneNorm, pin);
          await get().loadParentAccounts();
          return true;
        } catch (e) {
          console.error(e);
          throw e;
        }
      },

      loginWithCredentials: async (username, password) => {
        try {
          const { token, user } = await api.login(username, password);
          const u = user as AuthUser;
          if (!u?.id || !u.fullName) return 'Server javobi noto\'g\'ri';
          await setApiToken(token);
          set({ authUser: u, parentPhone: null, apiOnline: true });
          void get().hydrateFromApi();
          return null;
        } catch (e) {
          return e instanceof Error ? e.message : 'Login xatosi';
        }
      },

      loginParentWithPhone: async (phone, pin) => {
        try {
          const { token, user } = await api.parentLogin(phone, pin);
          const u = user as AuthUser;
          if (!u?.id) return 'Server javobi noto\'g\'ri';
          await setApiToken(token);
          set({ authUser: u, parentPhone: phone, apiOnline: true });
          void get().hydrateFromApi();
          return null;
        } catch (e) {
          return e instanceof Error ? e.message : 'Kirish xatosi';
        }
      },

      submitEnrollment: async (req) => {
        const { pin, ...rest } = req;
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
        void api.approveEnrollment(id).then(() => get().hydrateFromApi()).catch((e) => console.error(e));
      },

      rejectEnrollment: (id, note) => {
        void api.rejectEnrollment(id, note).then(() => get().hydrateFromApi()).catch((e) => console.error(e));
      },

      saveAttendanceBulk: async (records) => {
        set((s) => {
          const next = [...s.attendance];
          for (const r of records) {
            const i = next.findIndex(
              (a) => a.studentId === r.studentId && a.circleId === r.circleId && a.date === r.date
            );
            if (i >= 0) next[i] = { ...next[i], ...r };
            else next.push(r);
          }
          return { attendance: next };
        });
        try {
          await api.bulkAttendance(records);
          await get().hydrateFromApi();
        } catch (e) {
          console.error('bulkAttendance failed', e);
          throw e;
        }
      },

      updatePayment: (id, data) => {
        set((s) => ({
          payments: s.payments.map((p) => (p.id === id ? { ...p, ...data } : p)),
        }));
        api.updatePayment(id, data).catch((e) => console.error(e));
      },

      addStudent: (student) => {
        void api
          .createStudent(student)
          .then(() => get().hydrateFromApi())
          .catch((e) => console.error('createStudent failed', e));
      },
      updateStudent: (id, data) => {
        set((s) => ({
          students: s.students.map((st) => (st.id === id ? { ...st, ...data } : st)),
        }));
        api.updateStudent(id, data).catch((e) => console.error(e));
      },
      deleteStudent: (id) => {
        set((s) => ({ students: s.students.filter((st) => st.id !== id) }));
        api.deleteStudent(id).catch((e) => console.error(e));
      },

      addCircle: (circle) => {
        void api
          .createCircle(circle)
          .then(() => get().hydrateFromApi())
          .catch((e) => console.error('createCircle failed', e));
      },
      updateCircle: (id, data) => {
        set((s) => ({
          circles: s.circles.map((c) => (c.id === id ? { ...c, ...data } : c)),
        }));
        api.updateCircle(id, data).catch((e) => console.error(e));
      },
      deleteCircle: (id) => {
        set((s) => ({ circles: s.circles.filter((c) => c.id !== id) }));
        api.deleteCircle(id).catch((e) => console.error(e));
      },

      addTeacher: (teacher) => {
        void api
          .createTeacher(teacher)
          .then(() => get().hydrateFromApi())
          .catch((e) => console.error(e));
      },
      updateTeacher: (id, data) => {
        set((s) => ({
          teachers: s.teachers.map((t) => (t.id === id ? { ...t, ...data } : t)),
        }));
        api.updateTeacher(id, data).catch((e) => console.error(e));
      },
      deleteTeacher: (id) => {
        set((s) => ({ teachers: s.teachers.filter((t) => t.id !== id) }));
        api.deleteTeacher(id).catch((e) => console.error(e));
      },

      createStaffAccount: async (data) => {
        try {
          const created = (await api.createUser(data)) as StaffAccount & { tempPassword?: string };
          set((s) => ({
            staffAccounts: [...s.staffAccounts.filter((a) => a.id !== created.id), created],
          }));
          return created;
        } catch (e) {
          console.error(e);
          throw e;
        }
      },
      updateStaffAccount: async (id, data) => {
        try {
          const updated = (await api.updateUser(id, data)) as StaffAccount;
          set((s) => ({
            staffAccounts: s.staffAccounts.map((a) => (a.id === id ? updated : a)),
          }));
          return updated;
        } catch (e) {
          console.error(e);
          throw e;
        }
      },
      setStaffPassword: async (id, password) => {
        try {
          await api.setUserPassword(id, password);
          return true;
        } catch (e) {
          console.error(e);
          throw e;
        }
      },
      blockStaffAccount: async (id, blocked) => {
        try {
          const updated = (await api.blockUser(id, blocked)) as StaffAccount;
          set((s) => ({
            staffAccounts: s.staffAccounts.map((a) => (a.id === id ? updated : a)),
          }));
          return true;
        } catch (e) {
          console.error(e);
          throw e;
        }
      },
      deleteStaffAccount: async (id) => {
        try {
          await api.deleteUser(id);
          set((s) => ({ staffAccounts: s.staffAccounts.filter((a) => a.id !== id) }));
          return true;
        } catch (e) {
          console.error(e);
          throw e;
        }
      },

      addScheduleItem: (item) => {
        void api
          .createSchedule(item)
          .then(() => get().hydrateFromApi())
          .catch((e) => console.error(e));
      },
      deleteScheduleItem: (id) => {
        set((s) => ({ schedule: s.schedule.filter((x) => x.id !== id) }));
        api.deleteSchedule(id).catch((e) => console.error(e));
      },

      addProject: (project) => {
        void api
          .createProject(project)
          .then(() => get().hydrateFromApi())
          .catch((e) => console.error(e));
      },

      updateLabEquipment: (id, data) => {
        set((s) => ({
          labEquipment: s.labEquipment.map((e) => (e.id === id ? { ...e, ...data } : e)),
        }));
        api.updateLab(id, data).catch((e) => console.error(e));
      },

      addNetworkCircle: (schoolId, circleData) => {
        void api
          .addNetworkCircle(schoolId, circleData)
          .then(() => get().hydrateFromApi())
          .catch((e) => console.error(e));
      },

      addPartnership: (p) => {
        void api
          .createPartnership(p)
          .then(() => get().hydrateFromApi())
          .catch((e) => console.error(e));
      },

      addMessage: (msg) => {
        void api
          .createMessage(msg)
          .then(() => get().hydrateFromApi())
          .catch((e) => console.error(e));
      },

      runBackup: async () => {
        const res = await api.backup();
        return res.path;
      },
    }),
    {
      name: 'kelajak-markazi-mobile-v11',
      storage: createJSONStorage(() => safeStorage),
      skipHydration: true,
      partialize: (state) => ({
        darkMode: state.darkMode,
        authUser: state.authUser,
        parentPhone: state.parentPhone,
      }),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<AppState>;
        const current = currentState as AppState;
        return {
          ...current,
          darkMode: persisted.darkMode ?? current.darkMode,
          authUser: persisted.authUser ?? current.authUser,
          parentPhone: persisted.parentPhone ?? current.parentPhone,
        };
      },
    }
  )
);
