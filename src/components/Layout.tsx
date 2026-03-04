import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, FileText, Trophy, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const RatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white">
    <ellipse cx="9" cy="14" rx="6" ry="5" />
    <path d="M15 12c2-1 5-1 6 2" />
    <path d="M3 10c0-3 2-6 5-6 1.5 0 3 1 3 3" />
    <circle cx="7" cy="13" r="0.5" fill="currentColor" />
    <path d="M6 19c0 1-1 2-2 2" />
    <path d="M12 19c0 1 1 2 2 2" />
  </svg>
);

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/creators", icon: Users, label: "Criadores" },
  { to: "/posts", icon: FileText, label: "Conteúdos" },
  { to: "/ranking", icon: Trophy, label: "Ranking" },
  { to: "/settings", icon: Settings, label: "Configurações" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-60 flex-shrink-0 flex flex-col border-r border-sidebar-border" style={{ background: "hsl(225 28% 6%)" }}>
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
          <p className="text-xs text-muted-foreground text-center">Rastreamento manual</p>
        </div>
      </aside>

      <main className="flex-1 overflow-auto min-h-screen">
        {children}
      </main>
    </div>
  );
}
