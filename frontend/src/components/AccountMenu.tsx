/**
 * AccountMenu — floating popover triggered by the sidebar footer avatar button.
 *
 * This is the single navigation hub for all account-related pages.
 * Profile and Settings are no longer in the sidebar — this menu is the only entry point.
 *
 * Design references: GitHub, Discord, Slack, Notion, Linear.
 *
 * Features:
 *  - User avatar, full name, email, role badge, verification status
 *  - Nav items: My Profile | Settings | Notifications | Feedback & Support | Help Center
 *  - Logout
 *  - Smooth fade+scale animation (bottom-left origin)
 *  - ESC key closes + returns focus to trigger
 *  - Click-outside closes
 *  - Arrow key / Tab keyboard navigation between menu items
 *  - aria-haspopup / aria-expanded on trigger
 *  - Dark-sidebar compatible (light surface panel)
 */

import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  User,
  Settings,
  Bell,
  MessageSquareDot,
  LifeBuoy,
  LogOut,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AccountMenuProps {
  /** Whether the menu is currently open */
  open: boolean;
  /** Called when the menu should close */
  onClose: () => void;
  /** Ref to the trigger button — excluded from outside-click detection */
  triggerRef: React.RefObject<HTMLButtonElement>;
  /** Whether the sidebar is in compact mode */
  compact?: boolean;
}

interface MenuItem {
  label: string;
  icon: typeof User;
  /** wouter path — can include query string */
  href: string;
  dividerBefore?: boolean;
}

// ── Menu item definitions ──────────────────────────────────────────────────────
//
// Feedback & Support  → /settings?tab=feedback   (opens Settings, selects Feedback tab)
// Notifications       → /settings?tab=notifications
// Help Center         → /settings?tab=feedback   (same page, Help section at bottom)

const MENU_ITEMS: MenuItem[] = [
  { label: "My Profile",          icon: User,             href: "/profile"                      },
  { label: "Settings",            icon: Settings,         href: "/settings"                     },
  { label: "Notifications",       icon: Bell,             href: "/settings?tab=notifications"   },
  {
    label: "Feedback & Support",
    icon: MessageSquareDot,
    href: "/settings?tab=feedback",
    dividerBefore: true,
  },
  { label: "Help Center",         icon: LifeBuoy,         href: "/settings?tab=feedback"        },
];

// ── Component ──────────────────────────────────────────────────────────────────

export function AccountMenu({ open, onClose, triggerRef, compact }: AccountMenuProps) {
  const { user, logout } = useAuth();
  const [, navigate]    = useLocation();
  const menuRef         = useRef<HTMLDivElement>(null);

  // ── Close on ESC ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose, triggerRef]);

  // ── Close on outside click ────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current && !menuRef.current.contains(target) &&
        triggerRef.current && !triggerRef.current.contains(target)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose, triggerRef]);

  // ── Focus first menu item when opened ────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      menuRef.current?.querySelector<HTMLElement>("[role='menuitem']")?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  if (!open) return null;

  // ── Derived user display values ───────────────────────────────────────────────
  const initials = (user?.fullName || user?.email || "U")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "U";

  const displayName = user?.fullName || user?.email || "Account";
  const email       = user?.email ?? "";
  const roleLabel   = (user?.role ?? "user").toLowerCase().replace(/_/g, " ");
  const isVerified  = Boolean(user?.emailVerified);
  const provider    = user?.provider ?? "email";

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleNavigate = (href: string) => {
    onClose();
    navigate(href);
  };

  const handleLogout = async () => {
    onClose();
    await logout();
    navigate("/auth");
  };

  // Arrow key / Tab navigation between [role="menuitem"] elements
  const handleKeyDown = (
    e: React.KeyboardEvent,
    href?: string,
    action?: () => void,
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (href)   handleNavigate(href);
      if (action) void action();
      return;
    }

    const items = menuRef.current?.querySelectorAll<HTMLElement>("[role='menuitem']");
    if (!items) return;
    const list = Array.from(items);
    const idx  = list.indexOf(e.currentTarget as HTMLElement);

    if (e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey)) {
      e.preventDefault();
      list[(idx + 1) % list.length]?.focus();
    }
    if (e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey)) {
      e.preventDefault();
      list[(idx - 1 + list.length) % list.length]?.focus();
    }
  };

  return (
    <>
      {/* Invisible backdrop — closes on outside-click via mousedown handler above */}
      <div className="fixed inset-0 z-40" aria-hidden="true" />

      {/* ── Menu panel ─────────────────────────────────────────────────────── */}
      <div
        ref={menuRef}
        role="menu"
        aria-label="Account menu"
        className="account-menu-panel fixed z-50 w-64 rounded-2xl shadow-2xl border border-border bg-background overflow-hidden"
        style={{
          bottom:          compact ? 56 : 64,
          left:            compact ? 200 : 228,
          transformOrigin: "bottom left",
          animation:       "accountMenuIn 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        <style>{`
          @keyframes accountMenuIn {
            from { opacity: 0; transform: scale(0.94) translateY(6px); }
            to   { opacity: 1; transform: scale(1)    translateY(0);   }
          }
          .account-menu-panel [role="menuitem"]:focus {
            outline: none;
            background-color: hsl(var(--accent));
          }
        `}</style>

        {/* ── User info header ───────────────────────────────────────────── */}
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-full text-white font-bold select-none overflow-hidden"
              style={{
                width:     40,
                height:    40,
                fontSize:  15,
                background: "linear-gradient(135deg, #7666F6 0%, #0ea5e9 100%)",
                boxShadow: "0 0 0 2px rgba(118,102,246,0.25)",
              }}
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
            </div>

            {/* Name + email */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate leading-snug">
                {displayName}
              </p>
              <p className="text-xs text-muted-foreground truncate leading-snug">{email}</p>
            </div>
          </div>

          {/* Role badge + verification */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-primary/10 text-primary capitalize">
              {roleLabel}
            </span>

            {isVerified ? (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-2.5 h-2.5" /> Verified
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                <AlertCircle className="w-2.5 h-2.5" /> Unverified
              </span>
            )}

            {provider !== "email" && (
              <span className="ml-auto text-[10px] text-muted-foreground capitalize">
                {provider}
              </span>
            )}
          </div>
        </div>

        {/* ── Nav items ─────────────────────────────────────────────────── */}
        <div className="py-1.5">
          {MENU_ITEMS.map(({ label, icon: Icon, href, dividerBefore }) => (
            <div key={label}>
              {dividerBefore && (
                <div className="my-1 mx-3 h-px bg-border" aria-hidden="true" />
              )}
              <button
                role="menuitem"
                tabIndex={0}
                onClick={() => handleNavigate(href)}
                onKeyDown={(e) => handleKeyDown(e, href)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors duration-100 outline-none group"
              >
                <Icon
                  className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0"
                  aria-hidden="true"
                />
                <span className="flex-1 text-left font-medium">{label}</span>
                <ChevronRight
                  className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors flex-shrink-0"
                  aria-hidden="true"
                />
              </button>
            </div>
          ))}
        </div>

        {/* ── Logout ────────────────────────────────────────────────────── */}
        <div className="border-t border-border py-1.5">
          <button
            role="menuitem"
            tabIndex={0}
            onClick={() => void handleLogout()}
            onKeyDown={(e) => handleKeyDown(e, undefined, handleLogout)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors duration-100 outline-none"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span className="flex-1 text-left">Log out</span>
          </button>
        </div>
      </div>
    </>
  );
}
