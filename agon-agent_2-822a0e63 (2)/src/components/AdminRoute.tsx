import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();

  // Stay on loading screen until auth + profile/role are fully resolved
  if (loading) return <div className="flex items-center justify-center min-h-screen"><LoadingSpinner /></div>;
  if (!user) return <Navigate to="/login" replace />;
  // Only redirect non-admins AFTER loading is complete (profile fetched, isAdmin determined)
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
