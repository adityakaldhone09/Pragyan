import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/authService";
import { clearStoredAuthSession, setStoredAuthSession } from "@/services/apiClient";

function readOAuthTokens() {
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  const params = new URLSearchParams(hash);

  return {
    accessToken: params.get("accessToken") || "",
    refreshToken: params.get("refreshToken") || "",
  };
}

export function AuthSuccess() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [status, setStatus] = useState("Completing secure sign-in...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function completeOAuthLogin() {
      try {
        const { accessToken, refreshToken } = readOAuthTokens();

        if (!accessToken || !refreshToken) {
          throw new Error("OAuth tokens were not returned by the server. Please try signing in again.");
        }

        setStatus("Storing secure session...");
        setStoredAuthSession({ accessToken, refreshToken });

        setStatus("Loading your profile...");
        const user = await authService.me();

        if (!active) {
          return;
        }

        setSession({ accessToken, refreshToken, user });
        setStatus("Redirecting to your dashboard...");

        window.setTimeout(() => {
          if (active) {
            navigate("/dashboard", { replace: true });
          }
        }, 650);
      } catch (loginError) {
        if (!active) {
          return;
        }

        clearStoredAuthSession();
        setSession(null);
        setError(loginError instanceof Error ? loginError.message : "OAuth sign-in failed");
        setStatus("Unable to complete sign-in");
      }
    }

    completeOAuthLogin();

    return () => {
      active = false;
    };
  }, [navigate, setSession]);

  return (
    <div className="min-h-screen relative flex items-center justify-center px-6 py-12 overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.14),_transparent_32%),linear-gradient(135deg,_rgba(9,10,17,0.96),_rgba(4,8,20,0.98))]" />
      <div className="absolute inset-0 opacity-30 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:72px_72px]" />

      <motion.div
        className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-card/70 backdrop-blur-2xl shadow-2xl shadow-black/40 p-8 text-center"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <motion.div
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 text-background shadow-lg shadow-emerald-500/25"
          animate={{ rotate: [0, 6, -6, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          {error ? <Sparkles className="h-8 w-8" /> : <ShieldCheck className="h-8 w-8" />}
        </motion.div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground">{error ? "Sign-in failed" : "Almost there"}</h1>
        <p className="mt-3 text-sm text-muted-foreground min-h-10">{error || status}</p>

        <div className="mt-8 flex items-center justify-center gap-3 text-primary">
          {!error ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          <span className="text-sm font-medium">{error ? "Please return to login and try again." : "Securing your Pragyan session"}</span>
        </div>

        {error ? (
          <button
            type="button"
            onClick={() => navigate("/auth", { replace: true })}
            className="mt-8 inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            Back to login
          </button>
        ) : null}
      </motion.div>
    </div>
  );
}
