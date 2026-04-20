import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="console-panel-strong rounded-[32px] px-10 py-12 text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full border-4 border-cyan-300/35 border-t-transparent animate-spin" />
          <p className="console-kicker mb-2">Authorizing session</p>
          <p className="text-slate-300/82">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
