import { Navigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { useAuthStore } from '../store/useAuthStore';
import { Skeleton } from '../components/common/Skeleton';

export function ProtectedRoute({ allowedRoles, children }) {
  const { currentUser, role, isInitialized, isLoading } = useAuthStore();

  if (!isInitialized || isLoading) {
    return (
      <main className="min-h-screen bg-navy-950 p-6">
        <div className="mx-auto grid max-w-6xl gap-5">
          <Skeleton className="h-16 w-full" />
          <div className="grid gap-5 md:grid-cols-3">
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
          </div>
          <Skeleton className="h-80 w-full" />
        </div>
      </main>
    );
  }

  if (!currentUser) return <Navigate to={ROUTES.LOGIN} replace />;
  if (!allowedRoles.includes(role)) return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  return children;
}
