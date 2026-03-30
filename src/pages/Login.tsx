import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Chrome } from "lucide-react";

const RatIcon = () => (
  <img src="/logo-icon-40.png" alt="SocialRats" width={48} height={48} className="rounded-xl" />
);

export default function Login() {
  const { user, loading, signInWithGoogle, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";

  useEffect(() => {
    if (!loading && user) {
      // If logged in but no profile, go to profile creation
      if (!profile) {
        navigate("/cadastro", { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    }
  }, [user, profile, loading, navigate, from]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm mx-auto px-6">
        <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center gap-6 shadow-lg">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <RatIcon />
            <div className="text-center">
              <h1 className="text-xl font-bold text-foreground">SocialRats</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Plataforma de criadores</p>
            </div>
          </div>

          <div className="w-full border-t border-border" />

          <div className="w-full flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground text-center">
              Entre com sua conta Google para acessar a plataforma
            </p>
            <Button
              onClick={signInWithGoogle}
              disabled={loading}
              className="w-full gap-2 gradient-primary text-white border-0 glow-blue h-11"
            >
              <Chrome className="w-4 h-4" />
              Entrar com Google
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
