import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Chrome } from "lucide-react";

const RatIcon = () => (
  <svg viewBox="0 0 64 64" className="w-8 h-8" fill="currentColor" style={{ color: "white" }}>
    <ellipse cx="26" cy="40" rx="18" ry="13" />
    <circle cx="44" cy="30" r="10" />
    <circle cx="40" cy="20" r="5" opacity="0.7" />
    <circle cx="40" cy="20" r="2.5" opacity="0.4" style={{ fill: "#ffaacc" }} />
    <circle cx="48" cy="27" r="1.8" fill="black" />
    <circle cx="48.6" cy="26.4" r="0.6" fill="white" />
    <ellipse cx="54" cy="30" rx="1.5" ry="1" fill="#ffaacc" />
    <line x1="54" y1="29" x2="63" y2="26" stroke="white" strokeWidth="1" />
    <line x1="54" y1="30" x2="63" y2="30" stroke="white" strokeWidth="1" />
    <line x1="54" y1="31" x2="63" y2="34" stroke="white" strokeWidth="1" />
    <path d="M8 45 Q2 50 4 58 Q6 62 10 60" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    <ellipse cx="18" cy="52" rx="5" ry="2.5" />
    <ellipse cx="32" cy="53" rx="5" ry="2.5" />
  </svg>
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
        navigate("/meu-perfil", { replace: true });
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
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center glow-blue">
              <RatIcon />
            </div>
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
