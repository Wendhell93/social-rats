import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, FileText, Trophy, Gift, Star, BookOpen,
  Settings, LogIn, LogOut, Menu, MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PeriodSelector } from "@/components/PeriodSelector";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const RatIcon = () => (
  <svg viewBox="0 0 64 64" className="w-5 h-5" fill="currentColor" style={{ color: "white" }}>
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

const baseNavItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/creators", icon: Users, label: "Criadores" },
  { to: "/posts", icon: FileText, label: "Conteúdos" },
  { to: "/ranking", icon: Trophy, label: "Ranking" },
  { to: "/awards", icon: Gift, label: "Prêmios e Regras" },
  { to: "/quero-pontuar", icon: Star, label: "Quero Pontuar" },
  { to: "/escola-de-criacao", icon: BookOpen, label: "Escola de criação" },
];

// Bottom nav: 4 primary items + "Mais" drawer
const bottomPrimary = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/creators", icon: Users, label: "Criadores" },
  { to: "/posts", icon: FileText, label: "Conteúdos" },
  { to: "/ranking", icon: Trophy, label: "Ranking" },
];

function SidebarContent({ navItems, user, isAdmin, onSignOut }: {
  navItems: typeof baseNavItems;
  user: any;
  isAdmin: boolean;
  onSignOut: () => void;
}) {
  const location = useLocation();
  return (
    <>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => {
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
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-sidebar-border">
        {isAdmin && user ? (
          <div className="flex items-center gap-2">
            <Avatar className="w-7 h-7 flex-shrink-0">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback className="text-xs bg-primary/20 text-primary">
                {(user.user_metadata?.full_name || user.email || "A").slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {user.user_metadata?.full_name || "Admin"}
              </p>
              <p className="text-[10px] text-muted-foreground">Administrador</p>
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
            Entrar como admin
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
  const [topMenuOpen, setTopMenuOpen] = useState(false);
  const [bottomMenuOpen, setBottomMenuOpen] = useState(false);

  const navItems = isAdmin
    ? [...baseNavItems, { to: "/settings", icon: Settings, label: "Configurações" }]
    : baseNavItems;

  // Items not in bottomPrimary (for the "Mais" sheet)
  const moreItems = navItems.filter(item => !bottomPrimary.find(b => b.to === item.to));

  async function handleSignOut() {
    await signOut();
    navigate("/");
    setTopMenuOpen(false);
    setBottomMenuOpen(false);
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Desktop sidebar ────────────────────────────────── */}
      <aside className="hidden md:flex w-60 flex-shrink-0 flex-col border-r border-sidebar-border" style={{ background: "hsl(225 28% 6%)" }}>
        <div className="px-6 py-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center glow-blue">
              <RatIcon />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">SocialRats</p>
            </div>
          </div>
        </div>
        <SidebarContent navItems={navItems} user={user} isAdmin={isAdmin} onSignOut={handleSignOut} />
      </aside>

      {/* ── Mobile top bar ─────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 border-b border-sidebar-border" style={{ background: "hsl(225 28% 6%)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center glow-blue">
            <RatIcon />
          </div>
          <p className="text-sm font-bold text-foreground">SocialRats</p>
        </div>

        {/* "Mais" sheet trigger (hamburger) */}
        <Sheet open={topMenuOpen} onOpenChange={setTopMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0 border-sidebar-border" style={{ background: "hsl(225 28% 6%)" }}>
            <div className="px-6 py-5 border-b border-sidebar-border">
              <p className="text-sm font-bold text-foreground">Menu</p>
            </div>
            <div className="flex flex-col h-[calc(100%-57px)]" onClick={() => setTopMenuOpen(false)}>
              <SidebarContent navItems={navItems} user={user} isAdmin={isAdmin} onSignOut={handleSignOut} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* ── Main content ───────────────────────────────────── */}
      <main className="flex-1 overflow-auto min-h-screen pt-14 pb-16 md:pt-0 md:pb-0">
        {(["/", "/ranking"].includes(location.pathname)) && (
          <div className="flex items-center justify-end gap-2 px-4 md:px-8 pt-4 md:pt-6 pb-0">
            <PeriodSelector />
          </div>
        )}
        {children}
      </main>

      {/* ── Mobile bottom nav ──────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 flex items-center border-t border-sidebar-border" style={{ background: "hsl(225 28% 6%)" }}>
        {bottomPrimary.map(({ to, icon: Icon, label }) => {
          const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", active && "drop-shadow-[0_0_6px_hsl(var(--primary))]")} />
              <span className="text-[10px] font-medium">{label}</span>
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
              <span className="text-[10px] font-medium">Mais</span>
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
                  {isAdmin && user ? (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl">
                      <Avatar className="w-7 h-7 flex-shrink-0">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback className="text-xs bg-primary/20 text-primary">
                          {(user.user_metadata?.full_name || user.email || "A").slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{user.user_metadata?.full_name || "Admin"}</p>
                        <p className="text-[10px] text-muted-foreground">Administrador</p>
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
                      Entrar como admin
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
