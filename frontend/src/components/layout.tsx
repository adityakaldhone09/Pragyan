import { Link, useLocation } from "wouter";
import { 
  Home, Compass, BrainCircuit, Map, 
  CheckSquare, BookOpen, User, Info, 
  Settings, Grid, Sparkles, Bell, LogOut
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

const navItems: NavItem[] = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/career-discovery", label: "Career Discovery", icon: Compass },
  { href: "/ai-counselor", label: "AI Counselor", icon: BrainCircuit },
  { href: "/roadmap", label: "Roadmap", icon: Map },
  { href: "/assessments", label: "Assessments", icon: CheckSquare },
  { href: "/resources", label: "Resources", icon: BookOpen },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/information", label: "Information", icon: Info },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/dashboard", label: "Dashboard", icon: Grid },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const initials = (user?.fullName || user?.email || "U")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";

  const isActive = (href: string, exact = false) => {
    if (exact) return location === href;
    return location.startsWith(href);
  };

  return (
    <div className="flex h-screen w-full bg-sidebar">
      {/* Sidebar */}
      <aside className="w-[240px] flex-shrink-0 flex flex-col text-sidebar-foreground">
        <div className="p-6 flex items-center gap-2">
          <div className="bg-white p-1.5 rounded-md flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Pragyan AI</h1>
            <p className="text-xs text-white/70">Your Career Guide</p>
          </div>
        </div>

        <nav className="flex-1 px-3 flex flex-col gap-0.5 overflow-y-auto py-2">
          {navItems.map((item, idx) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link 
                key={idx} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-200 ${
                  active ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" : "text-white/80 hover:bg-white/10"
                }`}
              >
                <item.icon className="w-4.5 h-4.5 flex-shrink-0" style={{ width: 18, height: 18 }} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-background rounded-tl-[32px] overflow-hidden">
        {/* Header */}
        <header className="h-20 px-8 flex items-center justify-end border-b border-border bg-white shrink-0">
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-foreground/70 hover:text-foreground transition-colors hover:bg-muted rounded-full">
              <Bell className="w-6 h-6" />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-white"></span>
            </button>
            <button
              onClick={() => {
                void logout().then(() => navigate("/auth"));
              }}
              className="p-2 text-foreground/70 hover:text-foreground transition-colors hover:bg-muted rounded-full"
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <Avatar className="w-10 h-10 border border-border">
              <AvatarFallback className="bg-orange-500 text-white font-medium">{initials}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
