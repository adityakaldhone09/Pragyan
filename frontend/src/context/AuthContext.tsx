import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { authService, type LoginInput, type RegisterInput } from "@/services/authService";
import { AUTH_SESSION_KEY, clearStoredAuthSession, setStoredAuthSession } from "@/services/apiClient";
import type { AuthSession, AuthUser } from "@/types/api";

export type UserRole = "STUDENT" | "RECRUITER" | "PLACEMENT_OFFICER" | "ADMIN";

interface AuthContextValue {
  user: AuthUser | null;
  userRole: UserRole | null;
  loading: boolean;
  isAuthenticated: boolean;
  hasRole(role: UserRole | UserRole[]): boolean;
  getRoleDisplayName(role?: UserRole): string;
  login(input: LoginInput): Promise<AuthSession>;
  register(input: RegisterInput): Promise<AuthSession>;
  logout(): Promise<void>;
  reloadUser(): Promise<void>;
  setSession(session: AuthSession | null): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(() => readStoredSession());
  const [loading, setLoading] = useState(!session); // ✅ Only show loading if no stored session

  const persistSession = useCallback((nextSession: AuthSession | null) => {
    setSessionState(nextSession);
    setStoredAuthSession(nextSession);
  }, []);

  useEffect(() => {
    let active = true;

    async function restore() {
      try {
        // ✅ Only call /me if we have tokens to validate
        const stored = readStoredSession();
        if (stored?.accessToken) {
          const user = await authService.me();
          if (!active) return;
          persistSession({
            user,
            accessToken: stored.accessToken,
            refreshToken: stored.refreshToken || "",
          });
        }
      } catch {
        if (active) {
          clearStoredAuthSession();
          setSessionState(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void restore();
    return () => {
      active = false;
    };
  }, []); // ✅ Empty dependency - run only on mount

  const value = useMemo<AuthContextValue>(() => {
    const userRole = (session?.user?.role as UserRole) || null;
    
    return {
      user: session?.user || null,
      userRole,
      loading,
      isAuthenticated: Boolean(session?.user),
      hasRole(role: UserRole | UserRole[]) {
        if (!userRole) return false;
        return Array.isArray(role) ? role.includes(userRole) : role === userRole;
      },
      getRoleDisplayName(role?: UserRole) {
        const targetRole = role || userRole;
        const names: Record<UserRole, string> = {
          STUDENT: "Student",
          RECRUITER: "Recruiter",
          PLACEMENT_OFFICER: "T&P Coordinator",
          ADMIN: "Administrator",
        };
        return targetRole ? names[targetRole] : "Unknown";
      },
      async login(input) {
        const next = await authService.login(input);
        persistSession(next);
        return next;
      },
      async register(input) {
        // Registration returns { message, email } — NOT auth tokens
        // User must verify email and login separately
        const response = await authService.register(input);
        // Don't persist session or redirect — show verification message
        return {
          user: null,
          accessToken: "",
          refreshToken: "",
        } as AuthSession;
      },
      async logout() {
        const refreshToken = session?.refreshToken;
        await authService.logout(refreshToken || undefined).catch(() => undefined);
        persistSession(null);
      },
      async reloadUser() {
        const user = await authService.me();
        setSessionState((current) => {
          const next = current
            ? { ...current, user }
            : { user, accessToken: "", refreshToken: "" };
          setStoredAuthSession(next);
          return next;
        });
      },
      setSession: persistSession,
    };
  }, [loading, persistSession, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm font-medium text-muted-foreground">
        Restoring session...
      </div>
    );
  }

  if (!isAuthenticated) return null;
  return <>{children}</>;
}

/**
 * Require specific role(s) for component rendering
 * Redirects to /auth if user doesn't have the role
 */
export function RequireRole({ 
  role, 
  children,
  fallback 
}: { 
  role: UserRole | UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { loading, isAuthenticated, hasRole, getRoleDisplayName, userRole } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && (!isAuthenticated || !hasRole(role))) {
      navigate("/auth");
    }
  }, [isAuthenticated, loading, hasRole, role, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm font-medium text-muted-foreground">
        Checking permissions...
      </div>
    );
  }

  if (!isAuthenticated || !hasRole(role)) {
    return fallback || (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground mt-2">
            Your role ({getRoleDisplayName(userRole || undefined)}) doesn't have access to this page
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
