import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { Briefcase, BookOpen, LayoutDashboard, LogOut, Route, BadgeCheck } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { cn } from "../utils/cn";
import { useAuth } from "@/context/useAuth";


const shellNavItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/journey", label: "Journey", icon: Route },
  { path: "/learning-resources", label: "Learning", icon: BookOpen },
  { path: "/assessment", label: "Assessments", icon: BadgeCheck },
  { path: "/opportunities", label: "Jobs", icon: Briefcase },
];

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-50 w-[280px] border-r border-transparent bg-[#090b16]/90 shadow-2xl shadow-black/40 backdrop-blur-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.15),_transparent_32%)]" />
        <div className="relative z-10 flex h-full flex-col p-4">
          <div className="flex items-center gap-3 rounded-3xl border border-transparent bg-transparent px-4 py-3 backdrop-blur-xl">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">P</div>
            <div className="min-w-0">
              <span className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--brand-font)" }}>Pragyan</span>
            </div>
          </div>

          {user ? (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-transparent bg-transparent px-3 py-2">
              <Link to="/profile" className="flex items-center gap-3 w-full">
                <Avatar className="h-10 w-10 border border-transparent shadow-sm">
                  <AvatarImage src={user.avatar || undefined} alt={user.fullName || 'User'} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-semibold text-sm">
                    {(user.fullName || 'User')
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((p) => p[0]?.toUpperCase())
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 text-left">
                  <p className="truncate text-sm font-semibold text-foreground">{user.fullName || 'Learner'}</p>
                  <p className="text-xs text-muted-foreground">{user.currentTitle || user.careerTrack || 'Student'}</p>
                </div>
              </Link>
            </div>
          ) : null}

          <nav className="mt-5 flex-1 space-y-2 overflow-y-auto pr-1">
            {shellNavItems.map((item) => {
              const active = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "group flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-200",
                    active
                      ? "border-primary/30 bg-primary/10 text-foreground"
                      : "border-transparent text-muted-foreground hover:border-white/10 hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-all", active ? "border-primary/25 bg-primary/15 text-primary" : "border-transparent bg-transparent") }>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-4">
            <button
              type="button"
              onClick={async () => {
                try {
                  await logout();
                } finally {
                  navigate("/auth");
                  window.location.reload();
                }
              }}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:border-red-400/20 hover:bg-red-500/10 hover:text-red-100"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-red-200">
                <LogOut className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1 text-left">Logout</span>
            </button>
          </div>

          {/* Bottom signed-in card removed per design request */}
        </div>
      </aside>

      <main className="min-h-screen lg:ml-[280px]">
        <Outlet />
      </main>
    </div>
  );
}