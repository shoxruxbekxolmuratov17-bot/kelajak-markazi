import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell, Search, Plus, User, Settings, LogOut, X,
  Users, BookOpen, GraduationCap, LayoutDashboard, UserPlus, MapPin, Menu,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useIsMobile } from '../../hooks/useIsMobile';
import type { UserRole } from '../../types';
import clsx from 'clsx';

const pageTitles: Record<string, string> = {
  '/': 'Boshqaruv paneli',
  '/royxat-admin': "Ro'yxatdan o'tish",
  '/togaraklar': "To'garaklar",
  '/oquvchilar': "O'quvchilar",
  '/oqtuvchilar': 'Xodimlar',
  '/ota-onalar-admin': 'Ota-onalar',
  '/davomat': 'Davomat',
  '/tarmoq': "Tarmoq to'garaklar",
  '/laboratoriya': 'Robototexnika laboratoriyasi',
  '/hamkorlik': 'Xalqaro hamkorlik',
  '/tolovlar': "To'lovlar",
  '/jadval': 'Jadval',
  '/loyihalar': 'Loyihalar',
  '/xabarlar': 'Xabarlar',
  '/sozlamalar': 'Sozlamalar',
};

const roleLabels: Record<UserRole, string> = {
  superadmin: 'Viloyat admin',
  district_admin: 'Tuman admin',
  admin: 'Direktor',
  teacher: 'Murabbiy',
  parent: 'Ota-ona',
};

  const staticPages = [
  { title: 'Boshqaruv paneli', path: '/', icon: LayoutDashboard },
  { title: "To'garaklar", path: '/togaraklar', icon: BookOpen },
  { title: "O'quvchilar", path: '/oquvchilar', icon: Users },
  { title: "O'qituvchilar", path: '/oqtuvchilar', icon: GraduationCap },
  { title: 'Sozlamalar', path: '/sozlamalar', icon: Settings },
];

// Ro'yxatdan o'tish faqat tuman admin/direktor qidiruvida
const enrollSearchPage = { title: "Ro'yxatdan o'tish", path: '/royxat-admin', icon: UserPlus };

interface HeaderProps {
  onAction?: () => void;
  actionLabel?: string;
}

type Panel = 'search' | 'notifications' | 'profile' | null;

interface SearchResult {
  id: string;
  type: 'student' | 'circle' | 'teacher' | 'page';
  title: string;
  subtitle: string;
  path: string;
}

export function Header({ onAction, actionLabel = "Yangi qo'shish" }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    sidebarCollapsed,
    toggleSidebar,
    messages,
    enrollmentRequests,
    students,
    circles,
    teachers,
    authUser,
    logout,
    markMessageRead,
    districts,
    activeDistrictId,
    setActiveDistrict,
  } = useStore();

  const [activePanel, setActivePanel] = useState<Panel>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const isMobile = useIsMobile();

  const unreadCount = messages.filter((m) => !m.read).length;
  const pendingEnrollments = enrollmentRequests.filter((r) => r.status === 'pending').length;
  const notificationCount = unreadCount + pendingEnrollments;

  const title = pageTitles[location.pathname] || 'Kelajak Markazi';
  const greeting = authUser
    ? `Xush kelibsiz, ${authUser.fullName.split(/\s+/)[0]}!`
    : 'Xush kelibsiz!';

  const initials = authUser?.fullName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('') || 'KM';

  const searchResults = useMemo<SearchResult[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const results: SearchResult[] = [];

    students
      .filter(
        (s) =>
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
          s.school.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .forEach((s) =>
        results.push({
          id: `student-${s.id}`,
          type: 'student',
          title: `${s.firstName} ${s.lastName}`,
          subtitle: `${s.school} · ${s.grade}-sinf`,
          path: '/oquvchilar',
        })
      );

    circles
      .filter((c) => c.name.toLowerCase().includes(q) || c.teacher.toLowerCase().includes(q))
      .slice(0, 5)
      .forEach((c) =>
        results.push({
          id: `circle-${c.id}`,
          type: 'circle',
          title: c.name,
          subtitle: c.teacher,
          path: '/togaraklar',
        })
      );

    teachers
      .filter(
        (t) =>
          `${t.firstName} ${t.lastName}`.toLowerCase().includes(q) ||
          t.specialty.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .forEach((t) =>
        results.push({
          id: `teacher-${t.id}`,
          type: 'teacher',
          title: `${t.firstName} ${t.lastName}`,
          subtitle: t.specialty,
          path: '/oqtuvchilar',
        })
      );

    const pagesForSearch = [
      ...staticPages,
      ...(authUser?.role !== 'superadmin' ? [enrollSearchPage] : []),
    ];
    pagesForSearch
      .filter((p) => p.title.toLowerCase().includes(q))
      .forEach((p) =>
        results.push({
          id: `page-${p.path}`,
          type: 'page',
          title: p.title,
          subtitle: 'Sahifa',
          path: p.path,
        })
      );

    return results.slice(0, 10);
  }, [searchQuery, students, circles, teachers, authUser?.role]);

  const togglePanel = (panel: Panel) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
    if (panel !== 'search') setSearchQuery('');
  };

  const closePanels = () => {
    setActivePanel(null);
    setSearchQuery('');
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    closePanels();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closePanels();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanels();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    closePanels();
  }, [location.pathname]);

  const resultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'student': return Users;
      case 'circle': return BookOpen;
      case 'teacher': return GraduationCap;
      default: return LayoutDashboard;
    }
  };

  return (
    <header
      className={clsx(
        'fixed top-0 right-0 h-16 bg-card/90 backdrop-blur-md border-b border-border flex items-center justify-between px-4 sm:px-6 z-30 transition-all duration-300',
        isMobile ? 'left-0' : sidebarCollapsed ? 'left-[72px]' : 'left-[260px]'
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        {isMobile && (
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-2 rounded-xl hover:bg-surface text-muted flex-shrink-0"
            aria-label="Menyu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-dark truncate">{title}</h2>
          <p className="text-xs text-muted truncate hidden sm:block">{greeting}</p>
        </div>
      </div>

      <div ref={containerRef} className="flex items-center gap-2 relative">
        {authUser?.role === 'superadmin' && districts.length > 0 && (
          <label className="hidden md:flex items-center gap-2 text-xs text-muted mr-1">
            <MapPin className="w-4 h-4 text-primary" />
            <select
              aria-label="Viloyat tumanlari"
              value={activeDistrictId || 'all'}
              onChange={(e) => {
                const v = e.target.value;
                void setActiveDistrict(v === 'all' ? 'all' : v);
              }}
              className="rounded-xl border border-border bg-surface text-dark text-sm py-2 px-3 max-w-[220px] focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">Qashqadaryo — barcha tumanlar</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {/* Qidiruv */}
        <div className="relative">
          <button
            onClick={() => togglePanel('search')}
            className={clsx(
              'p-2.5 rounded-xl transition-colors',
              activePanel === 'search'
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-surface text-muted'
            )}
            title="Qidirish"
          >
            <Search className="w-5 h-5" />
          </button>

          {activePanel === 'search' && (
            <div className="absolute right-0 top-full mt-2 w-96 bg-card rounded-2xl shadow-xl border border-border overflow-hidden animate-fade-in">
              <div className="p-3 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="O'quvchi, to'garak, sahifa qidirish..."
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-surface text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-dark"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {searchQuery.trim() === '' ? (
                  <p className="p-4 text-sm text-muted text-center">
                    O'quvchi, to'garak, o'qituvchi yoki sahifa nomini yozing
                  </p>
                ) : searchResults.length === 0 ? (
                  <p className="p-4 text-sm text-muted text-center">Natija topilmadi</p>
                ) : (
                  searchResults.map((result) => {
                    const Icon = resultIcon(result.type);
                    return (
                      <button
                        key={result.id}
                        onClick={() => handleNavigate(result.path)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface transition-colors text-left"
                      >
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-dark truncate">{result.title}</p>
                          <p className="text-xs text-muted truncate">{result.subtitle}</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bildirishnomalar */}
        <div className="relative">
          <button
            onClick={() => togglePanel('notifications')}
            className={clsx(
              'relative p-2.5 rounded-xl transition-colors',
              activePanel === 'notifications'
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-surface text-muted'
            )}
            title="Bildirishnomalar"
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          {activePanel === 'notifications' && (
            <div className="absolute right-0 top-full mt-2 w-96 bg-card rounded-2xl shadow-xl border border-border overflow-hidden animate-fade-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="font-semibold text-dark">Bildirishnomalar</h3>
                <button
                  onClick={() => handleNavigate('/xabarlar')}
                  className="text-xs text-primary font-medium hover:underline"
                >
                  Barchasini ko'rish
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {pendingEnrollments > 0 && (
                  <button
                    onClick={() => handleNavigate('/royxat-admin')}
                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-surface transition-colors text-left border-b border-border"
                  >
                    <div className="w-9 h-9 rounded-xl bg-warning/20 flex items-center justify-center flex-shrink-0">
                      <UserPlus className="w-4 h-4 text-warning" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-dark">
                        {pendingEnrollments} ta yangi ro'yxatdan o'tish
                      </p>
                      <p className="text-xs text-muted mt-0.5">Tasdiqlashni kutmoqda</p>
                    </div>
                  </button>
                )}

                {messages.slice(0, 5).map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => {
                      if (!msg.read) markMessageRead(msg.id);
                      handleNavigate('/xabarlar');
                    }}
                    className={clsx(
                      'w-full flex items-start gap-3 px-4 py-3 hover:bg-surface transition-colors text-left',
                      !msg.read && 'bg-primary/5'
                    )}
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bell className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-dark truncate">{msg.title}</p>
                        {!msg.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-muted mt-0.5 line-clamp-2">{msg.content}</p>
                      <p className="text-xs text-muted/70 mt-1">{msg.date}</p>
                    </div>
                  </button>
                ))}

                {notificationCount === 0 && (
                  <p className="p-6 text-sm text-muted text-center">Yangi bildirishnoma yo'q</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profil */}
        <div className="relative">
          <button
            onClick={() => togglePanel('profile')}
            className={clsx(
              'flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl transition-colors',
              activePanel === 'profile'
                ? 'bg-primary/10'
                : 'hover:bg-surface'
            )}
            title="Profil"
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-xs">
              {initials}
            </div>
            {authUser && (
              <span className="hidden md:block text-sm font-medium text-dark max-w-[120px] truncate">
                {authUser.fullName.split(' ')[0]}
              </span>
            )}
          </button>

          {activePanel === 'profile' && authUser && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-card rounded-2xl shadow-xl border border-border overflow-hidden animate-fade-in">
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-dark truncate">{authUser.fullName}</p>
                    <p className="text-xs text-muted">{roleLabels[authUser.role]}</p>
                    <p className="text-xs text-primary mt-0.5">@{authUser.username}</p>
                  </div>
                </div>
              </div>

              <div className="p-2">
                {authUser.role === 'admin' && (
                  <button
                    onClick={() => handleNavigate('/sozlamalar')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-dark hover:bg-surface transition-colors"
                  >
                    <Settings className="w-4 h-4 text-muted" />
                    Sozlamalar
                  </button>
                )}
                <button
                  onClick={() => handleNavigate('/')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-dark hover:bg-surface transition-colors"
                >
                  <User className="w-4 h-4 text-muted" />
                  Mening profilim
                </button>
              </div>

              <div className="p-2 border-t border-border">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-danger hover:bg-danger/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Chiqish
                </button>
              </div>
            </div>
          )}
        </div>

        {onAction && (
          <button
            onClick={onAction}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors shadow-sm ml-1"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{actionLabel}</span>
          </button>
        )}
      </div>
    </header>
  );
}
