import { Link, useLocation } from "wouter";
import {
  Home, Compass, BrainCircuit, Map,
  CheckSquare, BookOpen,
  Grid, Sparkles,
  Briefcase, Users, TrendingUp, FileText,
  BarChart3, Building2, Activity, MessageSquare,
  LogOut,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/NotificationCenter";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  roles?: string[];
  section?: string;
};

// All available nav items — organized by role
const allNavItems: NavItem[] = [
  // Shared for all roles
  { href: "/home", label: "Home", icon: Home, section: "Core" },

  // STUDENT-specific items
  { href: "/dashboard",        label: "Dashboard",       icon: Grid,        roles: ["STUDENT"], section: "Learning" },
  { href: "/career-discovery", label: "Career Discovery", icon: Compass,     roles: ["STUDENT"], section: "Learning" },
  { href: "/ai-counselor",     label: "AI Counselor",    icon: BrainCircuit, roles: ["STUDENT"], section: "Learning" },
  { href: "/roadmap",          label: "Roadmap",          icon: Map,          roles: ["STUDENT"], section: "Learning" },
  { href: "/assessments",      label: "Assessments",      icon: CheckSquare,  roles: ["STUDENT"], section: "Learning" },
  { href: "/resources",        label: "Resources",        icon: BookOpen,     roles: ["STUDENT"], section: "Learning" },

  // RECRUITER-specific items
  { href: "/company/dashboard",      label: "Dashboard",    icon: Grid,        roles: ["RECRUITER"], section: "Recruitment" },
  { href: "/company/jobs",           label: "Jobs",         icon: Briefcase,   roles: ["RECRUITER"], section: "Recruitment" },
  { href: "/company/applications",   label: "Applications", icon: FileText,    roles: ["RECRUITER"], section: "Recruitment" },
  { href: "/company/hiring-drives",  label: "Hiring Drives",icon: TrendingUp,  roles: ["RECRUITER"], section: "Recruitment" },
  { href: "/company/analytics",      label: "Analytics",    icon: BarChart3,   roles: ["RECRUITER"], section: "Recruitment" },

  // PLACEMENT_OFFICER-specific items
  { href: "/placement/dashboard",    label: "Dashboard",    icon: Grid,        roles: ["PLACEMENT_OFFICER"], section: "Placement" },
  { href: "/placement/students",     label: "Students",     icon: Users,       roles: ["PLACEMENT_OFFICER"], section: "Placement" },
  { href: "/placement/companies",    label: "Companies",    icon: Building2,   roles: ["PLACEMENT_OFFICER"], section: "Placement" },
  { href: "/placement/applications", label: "Applications", icon: FileText,    roles: ["PLACEMENT_OFFICER"], section: "Placement" },
  { href: "/placement/analytics",    label: "Analytics",    icon: BarChart3,   roles: ["PLACEMENT_OFFICER"], section: "Placement" },

  // ADMIN-specific items
  { href: "/admin/dashboard",    label: "Dashboard",    icon: Grid,        roles: ["ADMIN"], section: "Administration" },
  { href: "/admin/users",        label: "Users",        icon: Users,       roles: ["ADMIN"], section: "Administration" },
  { href: "/admin/organizations",label: "Organizations",icon: Building2,   roles: ["ADMIN"], section: "Administration" },
  { href: "/admin/roadmaps",     label: "Roadmaps",     icon: Map,         roles: ["ADMIN"], section: "Administration" },
  { href: "/admin/feedback",     label: "Feedback",     icon: MessageSquare, roles: ["ADMIN"], section: "Administration" },
  { href: "/admin/audit-logs",   label: "Audit Logs",   icon: Activity,    roles: ["ADMIN"], section: "Administration" },
  // Profile and Settings are accessed via the Account Menu (avatar button at bottom)
];

// Section labels shown above nav groups (except "Core" which needs no header)
const SECTION_LABELS: Record<string, string> = {
  Learning:       "Learning",
  Recruitment:    "Recruitment",
  Placement:      "Placement",
  Administration: "Administration",
};

// ── NavLink ────────────────────────────────────────────────────────────────────
function NavLink({
  item,
  isActive,
  idx,
  compact,
}: {
  item: NavItem;
  isActive: boolean;
  idx: number;
  compact: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={`nav-item flex items-center gap-3 rounded-xl transition-all duration-300 cursor-pointer ${
        compact ? "px-2.5 py-2" : "px-3 py-2.5"
      } ${
        isActive 
          ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white" 
          : "text-slate-400 hover:text-white hover:bg-white/10"
      }`}
      style={{
        animationDelay: `${idx * 50}ms`,
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.1)";
          (e.currentTarget as HTMLElement).style.color = "#FFFFFF";
          (e.currentTarget as HTMLElement).style.transform = "translateX(4px)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
          (e.currentTarget as HTMLElement).style.color = "#CBD5E1";
          (e.currentTarget as HTMLElement).style.transform = "translateX(0)";
        }
      }}
    >
      <item.icon
        className="flex-shrink-0 transition-transform duration-300"
        style={{ width: compact ? 16 : 18, height: compact ? 16 : 18 }}
      />
      <span className={`transition-all duration-300 ${compact ? "text-xs" : "text-sm"}`}>
        {item.label}
      </span>
    </Link>
  );
}

// ── Layout ─────────────────────────────────────────────────────────────────────
export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const compactSidebar = Boolean(
    (user?.preferences as Record<string, unknown> | undefined)?.compactSidebar
  );

  const isActive = (href: string, exact = false) => {
    if (exact) return location === href;
    return location.startsWith(href);
  };

  // Filter nav items by role
  const getVisibleItems = (): NavItem[] => {
    const userRole = user?.role || "";
    return allNavItems.filter((item) => {
      if (!item.roles || item.roles.length === 0) return true;
      return item.roles.includes(userRole);
    });
  };

  // Group items by section, preserving insertion order
  const groupedItems = (): [string, NavItem[]][] => {
    const items = getVisibleItems();
    const groups: Record<string, NavItem[]> = {};
    const order: string[] = [];
    for (const item of items) {
      const sec = item.section || "Core";
      if (!groups[sec]) { groups[sec] = []; order.push(sec); }
      groups[sec].push(item);
    }
    return order.map((sec) => [sec, groups[sec]]);
  };

  return (
    <div className="flex h-screen w-full">
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside 
        className={`${compactSidebar ? "w-[190px]" : "w-[220px]"} flex-shrink-0 flex flex-col transition-all duration-300 bg-slate-900`}
      >
        {/* Logo */}
        <div className="p-6 flex items-center gap-2">
          <div
            className="p-1.5 rounded-md flex items-center justify-center transition-transform duration-300 hover:scale-110 bg-gradient-to-br from-purple-600 to-purple-500"
          >
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-white">Pragyan AI</h1>
            <p className="text-xs transition-colors duration-200 text-slate-400">Your Career Guide</p>
          </div>
        </div>

        {/* Nav */}
        <nav
          className="flex-1 px-3 flex flex-col gap-0.5 overflow-y-auto py-2"
          aria-label="Main navigation"
        >
          <style>{`
            @keyframes slideIn {
              from { opacity: 0; transform: translateX(-10px); }
              to   { opacity: 1; transform: translateX(0);     }
            }
            .nav-item { animation: slideIn 0.3s ease-out forwards; }
          `}</style>

          {groupedItems().map(([section, items], groupIdx) => (
            <div key={section} className={groupIdx > 0 ? "mt-2" : ""}>
              {/* Section label — shown for all named sections except "Core" */}
              {section !== "Core" && SECTION_LABELS[section] && (
                <p
                  className="px-3 pb-1.5 pt-2 text-xs font-bold tracking-wider text-slate-500 uppercase"
                >
                  {SECTION_LABELS[section]}
                </p>
              )}

              {items.map((item, idx) => (
                <NavLink
                  key={`${section}-${item.href}`}
                  item={item}
                  isActive={isActive(item.href, item.exact)}
                  idx={idx}
                  compact={compactSidebar}
                />
              ))}
            </div>
          ))}
        </nav>

        {/* ── Sidebar footer — Logout Button ─────────────────────────── */}
        <div className="px-3 py-3 border-t border-white/10 transition-colors duration-200">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 text-red-400 hover:bg-red-500/20"
          >
            <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <main
        className="flex-1 flex flex-col rounded-tl-[56px] overflow-hidden transition-all duration-300 bg-slate-50"
      >
        {/* Top bar */}
        <div className="flex items-center justify-end px-6 pt-4 pb-0 gap-2">
          <NotificationBell />
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 transition-all duration-300">
          {children}
        </div>
      </main>
    </div>
  );
}
