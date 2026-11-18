import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { SessionBootstrapLoader } from '../components/feedback/SessionBootstrapLoader.jsx';
import { PENDING_INVITE_STORAGE_KEY } from '../pages/auth/LoginPage.jsx';

/**
 * Route guard for guest-only routes (login, register).
 */
export function GuestRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return <SessionBootstrapLoader />;
  }

  if (isAuthenticated) {
    let pendingToken = null;
    try {
      pendingToken = window.sessionStorage.getItem(PENDING_INVITE_STORAGE_KEY);
    } catch {
      pendingToken = null;
    }

    const redirectTo =
      location.state?.from?.pathname ||
      (pendingToken ? `/invites/${pendingToken}` : '/projects');
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
