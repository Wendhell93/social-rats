import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, FileText, Trophy, Gift, Star, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { PeriodSelector } from "@/components/PeriodSelector";

const RatIcon = () => (
  <svg viewBox="0 0 64 64" className="w-5 h-5" fill="currentColor" style={{ color: "white" }}>
    {/* body */}
    <ellipse cx="26" cy="40" rx="18" ry="13" />
    {/* head */}
    <circle cx="44" cy="30" r="10" />
    {/* ear */}
    <circle cx="40" cy="20" r="5" opacity="0.7" />
    <circle cx="40" cy="20" r="2.5" opacity="0.4" style={{ fill: "#ffaacc" }} />
    {/* eye */}
    <circle cx="48" cy="27" r="1.8" fill="black" />
    <circle cx="48.6" cy="26.4" r="0.6" fill="white" />
    {/* nose */}
    <ellipse cx="54" cy="30" rx="1.5" ry="1" fill="#ffaacc" />
    {/* whiskers */}
    <line x1="54" y1="29" x2="63" y2="26" stroke="white" strokeWidth="1" />
    <line x1="54" y1="30" x2="63" y2="30" stroke="white" strokeWidth="1" />
    <line x1="54" y1="31" x2="63" y2="34" stroke="white" strokeWidth="1" />
    {/* tail */}
    <path d="M8 45 Q2 50 4 58 Q6 62 10 60" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    {/* legs */}
    <ellipse cx="18" cy="52" rx="5" ry="2.5" />
    <ellipse cx="32" cy="53" rx="5" ry="2.5" />
  </svg>
);

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/creators", icon: Users, label: "Criadores" },
  { to: "/posts", icon: FileText, label: "Conteúdos" },
  { to: "/ranking", icon: Trophy, label: "Ranking" },
  { to: "/awards", icon: Gift, label: "Premiações" },
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
        {/* Period selector bar for dashboard and ranking */}
        {(["/", "/ranking"].includes(location.pathname)) && (
          <div className="flex items-center justify-end gap-2 px-8 pt-6 pb-0">
            <PeriodSelector />
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
