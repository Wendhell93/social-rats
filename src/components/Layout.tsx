import { Outlet, NavLink } from "react-router-dom";
import { LayoutDashboard, FileText, Plus, Users, Trophy, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/posts", icon: FileText, label: "Conteúdos" },
  { to: "/posts/new", icon: Plus, label: "Cadastrar" },
  { to: "/members", icon: Users, label: "Membros" },
  { to: "/ranking", icon: Trophy, label: "Ranking" },
  { to: "/settings", icon: Settings, label: "Configurações" },
];

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-sidebar-background flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sidebar-foreground font-bold text-sm leading-tight">Engage</p>
              <p className="text-sidebar-foreground/50 text-xs">Ranking Social</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <p className="text-sidebar-foreground/30 text-xs text-center">
            Engage Ranking v1.0
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
