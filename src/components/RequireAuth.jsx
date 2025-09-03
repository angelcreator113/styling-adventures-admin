import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function RequireAuth() {
  const { user, loading } = useAuth();
  const loc = useLocation();

  // show nothing or a tiny spinner while auth resolves
  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: loc.pathname || '/' }} />;
  }

  // IMPORTANT: render nested routes here
  return <Outlet />;
}
