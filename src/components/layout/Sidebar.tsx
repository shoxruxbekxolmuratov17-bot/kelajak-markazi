import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, BookOpen, CreditCard, Calendar, Lightbulb,
  MessageSquare, Settings, MapPin, GraduationCap, ChevronLeft, Moon, Sun,
  UserPlus, Cpu, Globe, LogOut, ClipboardCheck,
} from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '../../store/useStore';
import { Logo } from '../Logo';
import { useIsMobile } from '../../hooks/useIsMobile';
import type { UserRole } from '../../types';

const allNavItems: { to: string; icon: typeof LayoutDashboard; label: string; roles: UserRole[] }[] = [
  { to: '/', icon: LayoutDashboard, label: 'Boshqaruv paneli', roles: ['superadmin', 'district_admin', 'admin', 'teacher'] },
  { to: '/royxat-admin', icon: UserPlus, label: "Ro'yxatdan o'tish", roles: ['district_admin', 'admin'] },
  { to: '/togaraklar', icon: BookOpen, label: "To'garaklar", roles: ['superadmin', 'district_admin', 'admin', 'teacher'] },
  { to: '/oquvchilar', icon: Users, label: "O'quvchilar", roles: ['superadmin', 'district_admin', 'admin', 'teacher'] },
  { to: '/oqtuvchilar', icon: GraduationCap, label: 'Xodimlar', roles: ['superadmin', 'district_admin', 'admin'] },
  { to: '/ota-onalar-admin', icon: Users, label: 'Ota-onalar', roles: ['superadmin', 'district_admin', 'admin'] },
  { to: '/tarmoq', icon: MapPin, label: 'Tarmoq to\'garaklar', roles: ['superadmin', 'district_admin', 'admin'] },
  { to: '/laboratoriya', icon: Cpu, label: 'Laboratoriya', roles: ['superadmin', 'district_admin', 'admin', 'teacher'] },
  { to: '/hamkorlik', icon: Globe, label: 'Xalqaro hamkorlik', roles: ['superadmin', 'district_admin', 'admin'] },
  { to: '/tolovlar', icon: CreditCard, label: "To'lovlar", roles: ['superadmin', 'district_admin', 'admin'] },
  { to: '/jadval', icon: Calendar, label: 'Jadval', roles: ['superadmin', 'district_admin', 'admin', 'teacher'] },
  { to: '/davomat', icon: ClipboardCheck, label: 'Davomat', roles: ['superadmin', 'district_admin', 'admin', 'teacher'] },
  { to: '/loyihalar', icon: Lightbulb, label: 'Loyihalar', roles: ['superadmin', 'district_admin', 'admin', 'teacher'] },
  { to: '/xabarlar', icon: MessageSquare, label: 'Xabarlar', roles: ['superadmin', 'district_admin', 'admin', 'teacher'] },
  { to: '/sozlamalar', icon: Settings, label: 'Sozlamalar', roles: ['superadmin', 'district_admin', 'admin'] },
];

const roleLabels: Record<UserRole, string> = {
  superadmin: 'Viloyat admin',
  district_admin: 'Tuman admin',
  admin: 'Direktor',
  teacher: 'Murabbiy',
  parent: 'Ota-ona',
};

export function Sidebar() {
  const { darkMode, toggleDarkMode, sidebarCollapsed, toggleSidebar, messages, enrollmentRequests, authUser, logout } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const unreadCount = messages.filter((m) => !m.read).length;
  const pendingEnrollments = enrollmentRequests.filter((r) => r.status === 'pending').length;

  const navItems = allNavItems.filter((item) =>
    authUser ? item.roles.includes(authUser.role) : false
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = authUser?.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('') || 'KM';

  const closeOnMobile = () => {
    if (isMobile && !sidebarCollapsed) toggleSidebar();
  };

  return (
    <>
      {isMobile && !sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={toggleSidebar}
          aria-hidden
        />
      )}
      <aside
        className={clsx(
          'fixed left-0 top-0 h-screen bg-card border-r border-border flex flex-col transition-all duration-300',
          isMobile
            ? sidebarCollapsed
              ? '-translate-x-full w-[260px] z-40'
              : 'translate-x-0 w-[260px] z-50'
            : clsx('z-40', sidebarCollapsed ? 'w-[72px]' : 'w-[260px]')
        )}
      >
      <div className="flex items-center gap-3 px-5 py-6">
        <Logo size={sidebarCollapsed ? 'sm' : 'md'} showText={!sidebarCollapsed} showDistrict={!sidebarCollapsed} />
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          const showBadge = item.to === '/xabarlar' && unreadCount > 0;
          const showEnrollmentBadge = item.to === '/royxat-admin' && pendingEnrollments > 0;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={closeOnMobile}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted hover:bg-surface hover:text-dark dark:hover:text-dark'
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {showBadge && (
                    <span className="w-5 h-5 rounded-full bg-danger text-white text-xs flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                  {showEnrollmentBadge && (
                    <span className="w-5 h-5 rounded-full bg-warning text-white text-xs flex items-center justify-center">
                      {pendingEnrollments}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-3">
        {!sidebarCollapsed && authUser && (
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dark truncate">
                {authUser.fullName.split(' ').slice(0, 2).join(' ')}
              </p>
              <p className="text-xs text-muted">{roleLabels[authUser.role]}</p>
            </div>
          </div>
        )}

        <div className={clsx('flex items-center', sidebarCollapsed ? 'justify-center' : 'justify-between px-2')}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2 text-xs text-muted">
              {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              <span>{darkMode ? "Qorong'u" : "Yorug'"}</span>
            </div>
          )}
          <button
            onClick={toggleDarkMode}
            className={clsx(
              'relative w-11 h-6 rounded-full transition-colors',
              darkMode ? 'bg-primary' : 'bg-border'
            )}
          >
            <span
              className={clsx(
                'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                darkMode ? 'translate-x-5' : 'translate-x-0.5'
              )}
            />
          </button>
        </div>

        <button
          onClick={handleLogout}
          className={clsx(
            'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-danger hover:bg-danger/10 transition-colors',
            sidebarCollapsed && 'justify-center'
          )}
          title="Chiqish"
        >
          <LogOut className="w-4 h-4" />
          {!sidebarCollapsed && <span>Chiqish</span>}
        </button>

        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-surface text-muted transition-colors"
        >
          <ChevronLeft className={clsx('w-5 h-5 transition-transform', sidebarCollapsed && 'rotate-180')} />
        </button>
      </div>
    </aside>
    </>
  );
}
