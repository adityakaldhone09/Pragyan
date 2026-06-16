import { motion } from "motion/react";
import { useState } from "react";
import { Mail, Lock, User, ArrowRight, Sparkles } from "lucide-react";
import { NeuralBackground } from "../components/NeuralBackground";
import { GlassCard } from "../components/GlassCard";
import { GlowButton } from "../components/GlowButton";

type AuthMode = "login" | "signup" | "forgot";

export function Auth() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ mode, email, password, name });
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-6 py-12">
      <NeuralBackground />

      <motion.div
        className="w-full max-w-md z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <GlassCard glow glowColor="primary" className="p-8">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <motion.div
              className="inline-flex items-center gap-2 mb-4"
              whileHover={{ scale: 1.05 }}
            >
              <Sparkles className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Pragyan
              </h1>
            </motion.div>
            <p className="text-muted-foreground">
              {mode === "login" && "Welcome back to your career journey"}
              {mode === "signup" && "Start your AI-powered career journey"}
              {mode === "forgot" && "Reset your password"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {mode !== "forgot" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            )}

            {mode === "login" && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-border" />
                  <span className="text-muted-foreground">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <GlowButton type="submit" variant="primary" className="w-full">
              {mode === "login" && "Sign In"}
              {mode === "signup" && "Create Account"}
              {mode === "forgot" && "Send Reset Link"}
              <ArrowRight className="w-5 h-5 ml-2 inline" />
            </GlowButton>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">OR</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            <button type="button" className="w-full py-3 px-4 bg-input-background border border-border rounded-lg hover:bg-muted/50 transition-all flex items-center justify-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
            <button type="button" className="w-full py-3 px-4 bg-input-background border border-border rounded-lg hover:bg-muted/50 transition-all flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>Continue with GitHub</span>
            </button>
          </div>

          {/* Toggle Mode */}
          <div className="mt-6 text-center text-sm">
            {mode === "login" && (
              <p className="text-muted-foreground">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  Sign up
                </button>
              </p>
            )}
            {mode === "signup" && (
              <p className="text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  Sign in
                </button>
              </p>
            )}
            {mode === "forgot" && (
              <p className="text-muted-foreground">
                Remember your password?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </GlassCard>

        {/* Terms */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to our{" "}
          <a href="#" className="text-primary hover:text-primary/80">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-primary hover:text-primary/80">
            Privacy Policy
          </a>
        </p>
      </motion.div>
    </div>
  );
}
