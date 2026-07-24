import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import type { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: UserRole[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { authUser } = useStore();
  const location = useLocation();

  if (!authUser) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (roles && !roles.includes(authUser.role)) {
    if (authUser.role === 'parent') {
      return <Navigate to="/ota-ona" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { authUser } = useStore();

  if (authUser) {
    if (authUser.role === 'parent') {
      return <Navigate to="/ota-ona" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
