import { useEffect, useMemo, useCallback, useState } from "react";
import { authService } from "@/services/authService";
import { clearStoredAuthSession, AUTH_SESSION_KEY } from "@/services/apiClient";
import type { AuthSession } from "@/types/api";
import { AuthContext, type AuthStatus, type AuthContextValue } from "@/context/auth-context";

function readStoredSession() {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => readStoredSession());
  const [status, setStatus] = useState<AuthStatus>("initializing");

  const persistSession = useCallback((nextSession: AuthSession | null) => {
    setSession(nextSession);
    if (nextSession) {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(nextSession));
    } else {
      clearStoredAuthSession();
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function initialize() {
      const stored = readStoredSession();
      if (!stored?.accessToken) {
        if (active) {
          setSession(null);
          setStatus("anonymous");
        }
        return;
      }

      if (stored.user) {
        if (active) {
          persistSession(stored);
          setStatus("authenticated");
        }

        void authService.me()
          .then((user) => {
            if (!active) {
              return;
            }

            persistSession({ ...stored, user });
          })
          .catch(() => {
            if (!active) {
              return;
            }

            clearStoredAuthSession();
            setSession(null);
            setStatus("anonymous");
          });

        return;
      }

      try {
        const user = await authService.me();
        if (active) {
          const nextSession = { ...stored, user };
          persistSession(nextSession);
          setStatus("authenticated");
        }
      } catch {
        clearStoredAuthSession();
        if (active) {
          setSession(null);
          setStatus("anonymous");
        }
      }
    }

    initialize();

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user || null,
    session,
    status,
    isAuthenticated: Boolean(session?.accessToken),
    login: async (input) => {
      const next = await authService.login(input);
      persistSession(next);
      setStatus("authenticated");
      return next;
    },
    register: async (input) => {
      const next = await authService.register(input);
      persistSession(next);
      setStatus("authenticated");
      return next;
    },
    refreshToken: async (input) => {
      const next = await authService.refreshToken(input);
      persistSession(next);
      setStatus("authenticated");
      return next;
    },
    updateProfile: authService.updateProfile,
    logout: async () => {
      const refreshToken = session?.refreshToken;
      if (refreshToken) {
        await authService.logout(refreshToken);
      } else {
        clearStoredAuthSession();
      }

      sessionStorage.clear();
      persistSession(null);
      setStatus("anonymous");
    },
    reloadUser: async () => {
      const user = await authService.me();
      if (session?.accessToken && session?.refreshToken) {
        const nextSession = { ...session, user };
        persistSession(nextSession);
      } else {
        setSession((current) => (current ? { ...current, user } : current));
      }
    },
    setSession: persistSession,
  }), [session, status]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
