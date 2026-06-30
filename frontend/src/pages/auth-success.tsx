import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/authService";
import { setStoredAuthSession } from "@/services/apiClient";
import type { AuthSession } from "@/types/api";

function readOAuthTokens() {
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  const params = new URLSearchParams(hash);
  return {
    accessToken: params.get("accessToken") || "",
    refreshToken: params.get("refreshToken") || "",
  };
}

export default function AuthSuccess() {
  const [, navigate] = useLocation();
  const { setSession } = useAuth();
  const [message, setMessage] = useState("Completing sign in...");

  useEffect(() => {
    let active = true;

    async function completeOAuth() {
      const tokens = readOAuthTokens();

      try {
        if (tokens.accessToken || tokens.refreshToken) {
          setStoredAuthSession({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: { id: "", email: "", fullName: "" },
          });
        }

        const user = await authService.me();
        if (!active) return;

        const session: AuthSession = {
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        };
        setSession(session);
        window.history.replaceState(null, "", "/auth/success");
        navigate("/dashboard");
      } catch (error) {
        if (!active) return;
        setStoredAuthSession(null);
        setMessage(error instanceof Error ? error.message : "Unable to complete OAuth sign in.");
        window.setTimeout(() => navigate("/auth"), 1500);
      }
    }

    void completeOAuth();
    return () => {
      active = false;
    };
  }, [navigate, setSession]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
      <div>
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Sparkles className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Pragyan AI</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </div>
    </main>
  );
}
