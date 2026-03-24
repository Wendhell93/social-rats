import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function AuthenticatedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, profile } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If logged in but no profile yet, redirect to profile creation
  // (except if already on /meu-perfil)
  if (!profile && location.pathname !== "/meu-perfil") {
    return <Navigate to="/meu-perfil" replace />;
  }

  return <>{children}</>;
}
