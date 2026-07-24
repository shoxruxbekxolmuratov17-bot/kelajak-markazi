import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Layout, ParentLayout, PublicLayout } from './components/layout/Layout';
import { PublicOnlyRoute, ProtectedRoute } from './components/auth/ProtectedRoute';
import { useStoreHydration } from './hooks/useStoreHydration';
import { useDarkMode } from './hooks/useDarkMode';
import { DashboardPage } from './pages/Dashboard';
import { CirclesPage } from './pages/Circles';
import { StudentsPage } from './pages/Students';
import { TeachersPage } from './pages/Teachers';
import { ParentsPage } from './pages/Parents';
import { NetworkPage } from './pages/Network';
import { PaymentsPage } from './pages/Payments';
import { SchedulePage } from './pages/Schedule';
import { ProjectsPage } from './pages/Projects';
import { MessagesPage } from './pages/Messages';
import { SettingsPage } from './pages/Settings';
import { EnrollmentPage } from './pages/Enrollment';
import { ParentPortalPage } from './pages/ParentPortal';
import { ParentGamesPage } from './pages/ParentGames';
import { LaboratoryPage } from './pages/Laboratory';
import { PartnershipsPage } from './pages/Partnerships';
import { LoginPage } from './pages/Login';
import { AttendancePage } from './pages/Attendance';
import { PrivacyPage } from './pages/Privacy';
import type { UserRole } from './types';

function RoleOutlet({ roles }: { roles: UserRole[] }) {
  return (
    <ProtectedRoute roles={roles}>
      <Outlet />
    </ProtectedRoute>
  );
}

export default function App() {
  const hydrated = useStoreHydration();
  useDarkMode();

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-sm text-muted">Yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />

      <Route path="/maxfiylik" element={<PrivacyPage />} />

      <Route element={<PublicLayout />}>
        <Route path="/royxat" element={<EnrollmentPage publicMode />} />
      </Route>

      <Route element={<ParentLayout />}>
        <Route path="/ota-ona" element={<ParentPortalPage />} />
        <Route path="/ota-ona/oyinlar" element={<ParentGamesPage />} />
        <Route path="/ota-ona/xabarlar" element={<MessagesPage />} />
      </Route>

      <Route path="/" element={<Layout />}>
        <Route element={<RoleOutlet roles={['superadmin', 'district_admin', 'admin', 'teacher']} />}>
          <Route index element={<DashboardPage />} />
          <Route path="togaraklar" element={<CirclesPage />} />
          <Route path="oquvchilar" element={<StudentsPage />} />
          <Route path="jadval" element={<SchedulePage />} />
          <Route path="davomat" element={<AttendancePage />} />
          <Route path="loyihalar" element={<ProjectsPage />} />
          <Route path="xabarlar" element={<MessagesPage />} />
          <Route path="laboratoriya" element={<LaboratoryPage />} />
        </Route>

        <Route element={<RoleOutlet roles={['district_admin', 'admin']} />}>
          <Route path="royxat-admin" element={<EnrollmentPage />} />
        </Route>

        <Route element={<RoleOutlet roles={['superadmin', 'district_admin', 'admin']} />}>
          <Route path="oqtuvchilar" element={<TeachersPage />} />
          <Route path="ota-onalar-admin" element={<ParentsPage />} />
          <Route path="tarmoq" element={<NetworkPage />} />
          <Route path="tolovlar" element={<PaymentsPage />} />
          <Route path="hamkorlik" element={<PartnershipsPage />} />
          <Route path="sozlamalar" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
