import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { authService, type LoginInput, type RegisterInput } from "@/services/authService";
import { AUTH_SESSION_KEY, clearStoredAuthSession, setStoredAuthSession } from "@/services/apiClient";
import type { AuthSession, AuthUser } from "@/types/api";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
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
  const [loading, setLoading] = useState(true);

  const persistSession = useCallback((nextSession: AuthSession | null) => {
    setSessionState(nextSession);
    setStoredAuthSession(nextSession);
  }, []);

  useEffect(() => {
    let active = true;

    async function restore() {
      try {
        const user = await authService.me();
        if (!active) return;
        const stored = readStoredSession();
        persistSession({
          user,
          accessToken: stored?.accessToken || "",
          refreshToken: stored?.refreshToken || "",
        });
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
  }, [persistSession]);

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user || null,
    loading,
    isAuthenticated: Boolean(session?.user),
    async login(input) {
      const next = await authService.login(input);
      persistSession(next);
      return next;
    },
    async register(input) {
      const next = await authService.register(input);
      persistSession(next);
      return next;
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
  }), [loading, persistSession, session]);

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
