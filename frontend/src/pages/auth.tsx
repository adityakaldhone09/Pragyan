import { FormEvent, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ArrowRight, Eye, Github, LockKeyhole, Mail, Sparkles, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { authService } from "@/services/authService";
import { useAuth } from "@/hooks/useAuth";

type AuthMode = "signin" | "signup";

export default function AuthPage() {
  const [location, navigate] = useLocation();
  const initialMode = useMemo<AuthMode>(() => {
    return location.includes("mode=signup") || location.includes("signup")
      ? "signup"
      : "signin";
  }, [location]);
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const { login, register } = useAuth();
  const { data: authConfig } = useQuery({
    queryKey: ["auth-config"],
    queryFn: authService.getConfig,
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isSignup = mode === "signup";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    const fullName = String(formData.get("fullName") || "");

    setError("");
    setSubmitting(true);
    try {
      if (isSignup) {
        await register({ fullName, email, password });
      } else {
        await login({ email, password });
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-background text-foreground lg:grid-cols-[0.95fr_1.05fr]">
      <section className="relative hidden overflow-hidden bg-[#151D3B] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <img
          src="/opengraph.jpg"
          alt="Pragyan AI"
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-[#151D3B]/75" />

        <Link href="/" className="relative z-10 flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-primary">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="text-xl font-bold">Pragyan AI</span>
        </Link>

        <div className="relative z-10 max-w-md">
          <p className="text-sm font-semibold uppercase tracking-normal text-blue-200">
            Career intelligence
          </p>
          <h1 className="mt-4 text-5xl font-bold leading-tight tracking-normal">
            Build the path before choosing the destination.
          </h1>
          <p className="mt-5 text-base leading-7 text-white/75">
            Sign in to continue your recommendations, assessments, learning roadmap, and counselor conversations.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-3">
          {["Assess", "Match", "Grow"].map((item) => (
            <div key={item} className="rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur">
              <p className="text-sm font-bold">{item}</p>
              <p className="mt-2 text-xs leading-5 text-white/65">Personalized career flow</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-10 flex items-center gap-2 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="text-xl font-bold">Pragyan AI</span>
          </Link>

          <div className="mb-8">
            <p className="text-sm font-semibold text-primary">
              {isSignup ? "Create your account" : "Welcome back"}
            </p>
            <h2 className="mt-2 text-4xl font-bold tracking-normal">
              {isSignup ? "Start with Pragyan AI" : "Sign in to Pragyan AI"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {isSignup
                ? "Create a profile and begin your career discovery journey."
                : "Continue from your dashboard, roadmap, and saved recommendations."}
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-lg border border-border bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`min-h-10 rounded-md text-sm font-bold transition-colors ${
                !isSignup ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`min-h-10 rounded-md text-sm font-bold transition-colors ${
                isSignup ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Full name</span>
                <span className="relative block">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input name="fullName" className="h-11 pl-10" placeholder="Sanika Bhosale" required />
                </span>
              </label>
            )}

            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Email address</span>
              <span className="relative block">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input name="email" className="h-11 pl-10" type="email" placeholder="you@example.com" required />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Password</span>
              <span className="relative block">
                <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input name="password" className="h-11 pl-10 pr-10" type="password" placeholder="Enter password" required />
                <Eye className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </span>
            </label>

            {!isSignup && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-muted-foreground">
                  <input type="checkbox" className="h-4 w-4 rounded border-border accent-primary" />
                  Remember me
                </label>
                <Link href="/forgot-password" className="font-semibold text-primary">
                  Forgot password?
                </Link>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-primary-border bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-md"
            >
              {submitting ? "Please wait..." : isSignup ? "Create account" : "Sign in"} <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {(authConfig?.googleEnabled || authConfig?.githubEnabled) && (
            <div className="mt-5 grid gap-3">
              {authConfig.googleEnabled && (
                <button
                  type="button"
                  onClick={() => { window.location.href = authConfig.googleLoginUrl; }}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-border bg-white px-5 py-3 text-sm font-bold text-foreground shadow-sm"
                >
                  <Sparkles className="h-4 w-4" /> Continue with Google
                </button>
              )}
              {authConfig.githubEnabled && (
                <button
                  type="button"
                  onClick={() => { window.location.href = authConfig.githubLoginUrl; }}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-border bg-white px-5 py-3 text-sm font-bold text-foreground shadow-sm"
                >
                  <Github className="h-4 w-4" /> Continue with GitHub
                </button>
              )}
            </div>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignup ? "Already have an account?" : "New to Pragyan AI?"}{" "}
            <button
              type="button"
              onClick={() => setMode(isSignup ? "signin" : "signup")}
              className="font-bold text-primary"
            >
              {isSignup ? "Sign in" : "Create account"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
