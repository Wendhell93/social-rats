import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, FileText, Trophy, Gift, Star, BookOpen,
  Settings, LogIn, LogOut, Menu, MoreHorizontal, User, ShieldAlert, ScrollText, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { PeriodSelector } from "@/components/PeriodSelector";
import { AreaFilter } from "@/components/AreaFilter";
import { useAreaFilter } from "@/contexts/AreaFilterContext";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const RatIcon = ({ size = 32 }: { size?: number }) => (
  <img src="/logo-icon-40.png" alt="SocialRats" width={size} height={size} className="rounded-lg" />
);

const baseNavItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/ranking", icon: Trophy, label: "Ranking" },
  { to: "/quero-pontuar", icon: Star, label: "Quero Pontuar" },
  { to: "/awards", icon: Gift, label: "Prêmios e Regras" },
  { to: "/escola-de-criacao", icon: BookOpen, label: "Escola de criação" },
  { to: "/politicas", icon: ScrollText, label: "Políticas" },
  { to: "/posts", icon: FileText, label: "Conteúdos" },
  { to: "/creators", icon: Users, label: "Criadores" },
];

// Bottom nav: 4 items + center FAB + "Mais" drawer
// "Quero Pontuar" moved to "Mais" sheet; FAB for creating posts takes center
const bottomPrimary = [
  { to: "/", icon: LayoutDashboard, label: "Home" },
  { to: "/ranking", icon: Trophy, label: "Ranking" },
  // FAB goes in render between these two
  { to: "/awards", icon: Gift, label: "Prêmios" },
];

function SidebarContent({ navItems, user, isAdmin, onSignOut }: {
  navItems: { to: string; icon: any; label: string; badge?: number }[];
  user: any;
  isAdmin: boolean;
  onSignOut: () => void;
}) {
  const location = useLocation();
  return (
    <>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label, badge }) => {
          const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-primary/15 text-primary border border-primary/20"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {badge && badge > 0 ? (
                <span className="min-w-5 h-5 px-1.5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
                  {badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-sidebar-border">
        {user ? (
          <div className="flex items-center gap-2">
            <Avatar className="w-7 h-7 flex-shrink-0">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback className="text-xs bg-primary/20 text-primary">
                {(user.user_metadata?.full_name || user.email || "?").slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {user.user_metadata?.full_name || user.email || "Usuário"}
              </p>
              <p className="text-[10px] text-muted-foreground">{isAdmin ? "Administrador" : "Criador"}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground flex-shrink-0"
              onClick={onSignOut}
              title="Sair"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-all"
          >
            <LogIn className="w-3.5 h-3.5" />
            Entrar
          </Link>
        )}
      </div>
    </>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();
  const { areaFilter, setAreaFilter } = useAreaFilter();
  const [bottomMenuOpen, setBottomMenuOpen] = useState(false);
  const [pendingDisputes, setPendingDisputes] = useState(0);

  // Fetch pending disputes count for admins
  useEffect(() => {
    if (!isAdmin) return;
    supabase
      .from("post_disputes")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .then(({ count }) => setPendingDisputes(count || 0));
  }, [isAdmin, location.pathname]);

  const navItems = [
    ...baseNavItems,
    ...(user ? [{ to: "/meu-perfil", icon: User, label: "Meu Perfil" }] : []),
    ...(isAdmin ? [{ to: "/contestacoes", icon: ShieldAlert, label: "Contestações", badge: pendingDisputes }] : []),
    ...(isAdmin ? [{ to: "/settings", icon: Settings, label: "Configurações" }] : []),
  ];

  // Items not in bottomPrimary (for the "Mais" sheet)
  const moreItems = navItems.filter(item => !bottomPrimary.find(b => b.to === item.to));

  async function handleSignOut() {
    await signOut();
    navigate("/");
    setBottomMenuOpen(false);
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Desktop sidebar ────────────────────────────────── */}
      <aside className="hidden md:flex w-60 flex-shrink-0 flex-col border-r border-sidebar-border" style={{ background: "hsl(225 28% 6%)" }}>
        <div className="px-6 py-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <RatIcon size={32} />
            <div>
              <p className="text-sm font-bold text-foreground">SocialRats</p>
            </div>
          </div>
        </div>
        <SidebarContent navItems={navItems} user={user} isAdmin={isAdmin} onSignOut={handleSignOut} />
      </aside>

      {/* ── Mobile top bar (logo only — nav is in bottom bar) ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-12 flex items-center justify-center px-4 border-b border-sidebar-border/50" style={{ background: "hsl(225 28% 6% / 0.9)", backdropFilter: "blur(8px)" }}>
        <div className="flex items-center gap-2">
          <RatIcon size={24} />
          <p className="text-sm font-bold text-foreground">SocialRats</p>
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────── */}
      <main className="flex-1 overflow-auto min-h-screen pt-12 pb-16 md:pt-0 md:pb-0 relative">
        {(["/", "/ranking", "/posts", "/creators"].includes(location.pathname)) && (
          <div className="absolute top-12 md:top-3 right-3 md:right-6 z-10 flex items-center gap-2 flex-wrap">
            <AreaFilter value={areaFilter} onChange={setAreaFilter} />
            <PeriodSelector />
          </div>
        )}
        {children}
      </main>

      {/* ── Mobile bottom nav ──────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 flex items-center border-t border-sidebar-border" style={{ background: "hsl(225 28% 6%)" }}>
        {/* Left items */}
        {bottomPrimary.slice(0, 2).map(({ to, icon: Icon, label }) => {
          const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
          return (
            <Link key={to} to={to} className={cn("flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors", active ? "text-primary" : "text-muted-foreground")}>
              <Icon className={cn("w-5 h-5", active && "drop-shadow-[0_0_6px_hsl(var(--primary))]")} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}

        {/* Center FAB — Create Post */}
        <div className="flex-1 flex justify-center relative">
          <Link
            to="/posts/new"
            className={cn(
              "absolute -top-5 w-[52px] h-[52px] rounded-full gradient-primary flex items-center justify-center shadow-lg active:scale-95 transition-transform glow-blue",
              location.pathname === "/posts/new" && "ring-2 ring-primary/50"
            )}
          >
            <Plus className="w-6 h-6 text-white" />
          </Link>
          <span className="text-xs font-medium text-muted-foreground mt-3">Novo</span>
        </div>

        {/* Right items */}
        {bottomPrimary.slice(2).map(({ to, icon: Icon, label }) => {
          const active = location.pathname.startsWith(to);
          return (
            <Link key={to} to={to} className={cn("flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors", active ? "text-primary" : "text-muted-foreground")}>
              <Icon className={cn("w-5 h-5", active && "drop-shadow-[0_0_6px_hsl(var(--primary))]")} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}

        {/* "Mais" tab */}
        <Sheet open={bottomMenuOpen} onOpenChange={setBottomMenuOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors",
                moreItems.some(item => item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to))
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-xs font-medium">Mais</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl border-t border-sidebar-border pb-safe" style={{ background: "hsl(225 28% 6%)" }}>
            <div className="pt-2 pb-1">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4" />
              <div className="space-y-1 px-2" onClick={() => setBottomMenuOpen(false)}>
                {moreItems.map(({ to, icon: Icon, label }) => {
                  const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
                  return (
                    <Link
                      key={to}
                      to={to}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                        active
                          ? "bg-primary/15 text-primary border border-primary/20"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                      )}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {label}
                    </Link>
                  );
                })}
                <div className="pt-2 border-t border-sidebar-border mt-2">
                  {user ? (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl">
                      <Avatar className="w-7 h-7 flex-shrink-0">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback className="text-xs bg-primary/20 text-primary">
                          {(user.user_metadata?.full_name || user.email || "?").slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{user.user_metadata?.full_name || user.email || "Usuário"}</p>
                        <p className="text-[10px] text-muted-foreground">{isAdmin ? "Administrador" : "Criador"}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={handleSignOut}>
                        <LogOut className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Link
                      to="/login"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-all"
                    >
                      <LogIn className="w-4 h-4" />
                      Entrar
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}
