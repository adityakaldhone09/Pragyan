// src/components/NotificationCenter.tsx

import { useRef, useState, useEffect } from 'react';
import { Bell, BellOff, CheckCheck, Trash2, X, ExternalLink } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useLocation } from 'wouter';
import type { AppNotification } from '@/services/notificationService';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (m < 1)   return 'just now';
  if (m < 60)  return `${m}m ago`;
  if (h < 24)  return `${h}h ago`;
  if (d < 7)   return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const TYPE_ICONS: Record<string, string> = {
  FEEDBACK_REPLY: '💬',
  SYSTEM: '🔔',
  ACHIEVEMENT: '🏆',
  ROADMAP: '🗺️',
  JOB: '💼',
  ASSESSMENT: '📝',
  DEFAULT: '🔔',
};

/** Resolve the navigation link for a notification.
 *  Priority: explicit metadata.link → type-based fallback → nothing */
function resolveNotifLink(item: AppNotification): string | undefined {
  const explicit = (item.metadata as Record<string, unknown> | null)?.link as string | undefined;
  if (explicit) return explicit;
  // Type-based fallbacks so notifications always navigate somewhere meaningful
  const TYPE_FALLBACK_LINKS: Record<string, string> = {
    FEEDBACK_REPLY: '/settings?tab=feedback',
    SYSTEM:         '/home',
    ACHIEVEMENT:    '/dashboard',
    ROADMAP:        '/roadmap',
    JOB:            '/jobs',
    ASSESSMENT:     '/assessments',
  };
  return TYPE_FALLBACK_LINKS[item.type] ?? undefined;
}

function NotifItem({
  item,
  onRead,
  onDelete,
}: {
  item: AppNotification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [, navigate] = useLocation();
  const link = resolveNotifLink(item);
  const icon = TYPE_ICONS[item.type] ?? TYPE_ICONS.DEFAULT;

  const handleClick = () => {
    if (!item.read) onRead(item.id);
    if (link) navigate(link);
  };

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors group cursor-pointer ${!item.read ? 'bg-primary/5' : ''}`}
      onClick={handleClick}
    >
      <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${!item.read ? 'font-semibold text-foreground' : 'text-foreground/80'}`}>
          {item.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.message}</p>
        <p className="text-[10px] text-muted-foreground/70 mt-1">{timeAgo(item.createdAt)}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {link && <ExternalLink className="w-3 h-3 text-muted-foreground" />}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
          className="p-1 hover:text-red-500 transition-colors text-muted-foreground"
          aria-label="Delete notification"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      {!item.read && (
        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
      )}
    </div>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markRead, markAllRead, remove, isLoading } = useNotifications();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-bold text-foreground">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                  title="Mark all as read"
                  className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-primary/10"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <BellOff className="w-8 h-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((n) => (
                  <NotifItem
                    key={n.id}
                    item={n}
                    onRead={(id) => markRead.mutate(id)}
                    onDelete={(id) => remove.mutate(id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-border text-center">
              <p className="text-[11px] text-muted-foreground">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                  : 'All caught up!'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
