import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useStore } from '../../store/useStore';
import { useIsMobile } from '../../hooks/useIsMobile';
import clsx from 'clsx';

export function Layout() {
  const { sidebarCollapsed, authUser } = useStore();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) {
      useStore.setState({ sidebarCollapsed: true });
    }
  }, [isMobile]);

  if (!authUser) {
    return <Navigate to="/login" replace />;
  }

  if (authUser.role === 'parent') {
    return <Navigate to="/ota-ona" replace />;
  }

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <Header />
      <main
        className={clsx(
          'pt-16 min-h-screen transition-all duration-300 bg-surface',
          isMobile ? 'pl-0' : sidebarCollapsed ? 'pl-[72px]' : 'pl-[260px]'
        )}
      >
        <div className="p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export function ParentLayout() {
  const { authUser } = useStore();
  const location = useLocation();

  if (!authUser || authUser.role !== 'parent') {
    return <Navigate to="/login" replace />;
  }

  const links = [
    { to: '/ota-ona', label: 'Dashboard' },
    { to: '/ota-ona/oyinlar', label: "O'yinlar" },
    { to: '/ota-ona/xabarlar', label: 'Xabarlar' },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M4 18V6l8 6 8-6v12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-dark text-sm">Kelajak Markazi</p>
            <p className="text-xs text-muted">Ota-ona portali</p>
          </div>
        </div>
        <nav className="flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                location.pathname === l.to ? 'bg-primary/10 text-primary' : 'text-muted hover:text-dark hover:bg-surface'
              )}
            >
              {l.label}
            </Link>
          ))}
          <LogoutButton />
        </nav>
      </header>
      <main className="p-6 max-w-6xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M4 18V6l8 6 8-6v12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-bold text-dark text-sm">Kelajak Markazi</span>
        </div>
        <Link to="/login" className="text-sm text-primary font-medium hover:underline">Kirish</Link>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}

function LogoutButton() {
  const { logout } = useStore();
  return (
    <button
      onClick={() => { logout(); window.location.href = '/login'; }}
      className="text-sm text-muted hover:text-dark px-3 py-1.5 rounded-lg hover:bg-surface transition-colors"
    >
      Chiqish
    </button>
  );
}
