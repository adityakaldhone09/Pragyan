import { motion } from "motion/react";
import { Link, useLocation, useNavigate } from "react-router";
import { Home, LayoutDashboard, Brain, User, LogOut, Briefcase, Compass } from "lucide-react";
import { cn } from "../utils/cn";
import { useAuth } from "@/context/useAuth";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/assessment", label: "Assessment", icon: Brain },
  { path: "/journey", label: "Journey", icon: Compass },
  { path: "/opportunities", label: "Opportunities", icon: Briefcase },
];

export function Navigation() {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const isLandingPage = location.pathname === "/";
  const isAuthPage = location.pathname === "/auth";
  const isAuthSuccessPage = location.pathname === "/auth/success";
  const isDashboardPage = location.pathname === "/dashboard";

  if (isLandingPage || isAuthPage || isAuthSuccessPage || isDashboardPage) {
    return null;
  }

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-card/60 border-b border-card-border"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">P</div>
            <span className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--brand-font)" }}>Pragyan</span>
          </Link>

          {/* Nav Items */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "relative px-4 py-2 rounded-lg transition-all flex items-center gap-2",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 bg-primary/10 rounded-lg border border-primary/20"
                      layoutId="nav-active"
                      transition={{ duration: 0.3 }}
                    />
                  )}
                  <Icon className="w-4 h-4 relative z-10" />
                  <span className="text-sm font-medium relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted/50 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium hidden md:block">
                    {user?.fullName || "Profile"}
                  </span>
                </Link>
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
                  className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted/50 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium hidden md:block">Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
