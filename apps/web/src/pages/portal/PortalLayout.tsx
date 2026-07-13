import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { Wrench, LogOut } from 'lucide-react';
import {
  PORTAL_TOKEN_KEY,
  clearPortalSession,
  getPortalUser,
} from '@/lib/portalApi';

export function PortalProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem(PORTAL_TOKEN_KEY);
  if (!token) {
    return <Navigate to="/portal/login" replace />;
  }
  return <>{children}</>;
}

export function PortalLayout() {
  const navigate = useNavigate();
  const user = getPortalUser();

  function logout() {
    clearPortalSession();
    navigate('/portal/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-surface-secondary flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-white border-b border-border">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-brand flex items-center justify-center">
              <Wrench className="h-4.5 w-4.5 text-dark" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-text-primary">ObraFlow</p>
              <p className="text-2xs font-medium text-brand-dark">Portal de Clientes</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden sm:block text-right leading-tight">
                <p className="text-sm font-medium text-text-primary">{user.clientName}</p>
                <p className="text-xs text-text-secondary">{user.email}</p>
              </div>
            )}
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
