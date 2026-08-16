import { FormEvent, useMemo, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, Eye, LockKeyhole, Mail, Sparkles, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { PasswordStrengthMeter, type PasswordStrengthResult } from "@/components/auth/PasswordStrengthMeter";

type AuthMode = "signin" | "signup";

/**
 * Role-based redirect map
 * After login, users are redirected to their role-specific dashboard
 */
const ROLE_REDIRECTS: Record<string, string> = {
  USER: "/dashboard",
  STUDENT: "/dashboard",
  RECRUITER: "/company/dashboard",
  PLACEMENT_OFFICER: "/placement/dashboard",
  ADMIN: "/admin/dashboard",
};

export default function AuthPage() {
  const [location, navigate] = useLocation();
  const { isAuthenticated, userRole, login, register } = useAuth();

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && userRole) {
      const redirectUrl = ROLE_REDIRECTS[userRole] || "/home";
      navigate(redirectUrl);
    }
  }, [isAuthenticated, userRole, navigate]);

  const initialMode = useMemo<AuthMode>(() => {
    return location.includes("mode=signup") || location.includes("signup")
      ? "signup"
      : "signin";
  }, [location]);

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Controlled state for role so JSX can react to selection
  const [selectedRole, setSelectedRole] = useState("STUDENT");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrengthResult | null>(null);
  const [formPassword, setFormPassword] = useState("");
  const [formConfirmPassword, setFormConfirmPassword] = useState("");

  const isSignup = mode === "signup";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "");
    const fullName = String(formData.get("fullName") || "");
    const role = selectedRole;
    const collegeCode = String(formData.get("collegeCode") || "");
    
    // Use controlled state values for passwords
    const password = formPassword;
    const confirmPassword = formConfirmPassword;

    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      if (isSignup) {
        // Validate password match
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          return;
        }

        // Validate college code for students
        if (role === "STUDENT" && !collegeCode) {
          setError("College code is required for students");
          return;
        }

        // Build register request
        const registerData: any = {
          fullName,
          email,
          password,
          confirmPassword,  // ✅ REQUIRED by backend validation
          role,
        };

        if (role === "STUDENT" && collegeCode) {
          registerData.collegeCode = collegeCode;
        }

        // Use register from AuthContext — returns empty session
        const response = await register(registerData);
        // ✅ ADDED: Clear form after successful signup
        setFormPassword("");
        setFormConfirmPassword("");
        // After signup, show success and switch to login mode
        setMode("signin");
        setSuccess(`Registration successful! Check your email to verify your account, then sign in.`);
        setError(""); // Clear any errors
      } else {
        const response = await login({ email, password });
        // ✅ ADDED: Clear form before redirect
        setFormPassword("");
        setFormConfirmPassword("");
        setError("");
        setSuccess("");
        const redirectUrl = ROLE_REDIRECTS[response.user?.role || "STUDENT"] || "/home";
        navigate(redirectUrl);
      }
    } catch (err) {
      let errorMessage = "Authentication failed";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === "object" && err !== null) {
        // Check for API error responses
        const apiError = err as any;
        if (apiError.response?.data?.message) {
          errorMessage = apiError.response.data.message;
        } else if (apiError.message) {
          errorMessage = apiError.message;
        }
      }
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-background text-foreground lg:grid-cols-2">
      {/* Left Side - Hero Section */}
      <section className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between p-10" style={{ backgroundColor: "#0F172A" }}>
        {/* Background gradient matching template */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#1D1B5E] to-[#0F172A]" />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <div
              className="p-1.5 rounded-md flex items-center justify-center transition-transform duration-300 hover:scale-110"
              style={{ background: "linear-gradient(135deg, #7666F6 0%, #625EF8 100%)" }}
            >
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-white">Pragyan AI</span>
              <p className="text-xs" style={{ color: "#94A3B8" }}>Your Career Guide</p>
            </div>
          </Link>
        </div>

        <div className="relative z-10">
          <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#94A3B8" }}>
            🚀 CAREER INTELLIGENCE
          </p>
          <h1 className="mt-6 text-5xl font-bold leading-tight text-white">
            Build the path before choosing the destination
          </h1>
          <p className="mt-4 text-base leading-relaxed" style={{ color: "#94A3B8" }}>
            Get personalized career recommendations, AI assessments, and custom learning roadmaps designed for your success.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { icon: "🎯", title: "Assess", desc: "AI-powered assessment" },
            { icon: "💡", title: "Match", desc: "Career recommendations" },
            { icon: "🚀", title: "Grow", desc: "Personalized roadmap" },
          ].map((item) => (
            <div key={item.title} className="rounded-lg p-4 transition-all hover:scale-105" style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <div className="text-2xl mb-2">{item.icon}</div>
              <p className="font-bold text-white text-sm">{item.title}</p>
              <p className="mt-1 text-xs" style={{ color: "#94A3B8" }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Right Side - Auth Form */}
      <section className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8" style={{ backgroundColor: "#F7F8FC" }}>
        <div className="w-full max-w-md">
          {/* Logo for mobile */}
          <Link href="/" className="mb-8 flex items-center gap-3 lg:hidden justify-center">
            <div
              className="p-1.5 rounded-md flex items-center justify-center transition-transform duration-300 hover:scale-110"
              style={{ background: "linear-gradient(135deg, #7666F6 0%, #625EF8 100%)" }}
            >
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold">Pragyan AI</span>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <p className="text-sm font-semibold" style={{ color: "#7666F6" }}>
              {isSignup ? "Get Started" : "Welcome Back"}
            </p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              {isSignup ? "Create Your Account" : "Sign In"}
            </h2>
            <p className="mt-4 text-sm" style={{ color: "#94A3B8" }}>
              {isSignup
                ? "Join thousands of students discovering their ideal career path."
                : "Continue to your personalized career dashboard."}
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="mb-8 inline-flex gap-1 rounded-xl p-1 backdrop-blur" style={{ background: "rgba(255, 255, 255, 0.8)", border: "1px solid rgba(0, 0, 0, 0.1)" }}>
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 rounded-lg px-6 py-2.5 text-sm font-semibold transition-all ${
                !isSignup ? "text-white" : "text-foreground hover:text-foreground"
              }`}
              style={!isSignup ? { background: "linear-gradient(135deg, #7666F6 0%, #625EF8 100%)" } : {}}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-lg px-6 py-2.5 text-sm font-semibold transition-all ${
                isSignup ? "text-white" : "text-foreground hover:text-foreground"
              }`}
              style={isSignup ? { background: "linear-gradient(135deg, #7666F6 0%, #625EF8 100%)" } : {}}
            >
              Sign Up
            </button>
          </div>

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <>
                <label className="block">
                  <span className="mb-2.5 block text-sm font-semibold text-foreground">Full Name</span>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2" style={{ color: "#94A3B8" }} />
                    <Input
                      name="fullName"
                      className="h-12 pl-11 rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#7666F6]/50"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2.5 block text-sm font-semibold text-foreground">Role</span>
                  <select
                    name="role"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="h-12 w-full rounded-lg px-3.5 py-2 text-sm font-medium transition-all"
                    style={{ borderColor: "#E2E8F0", background: "#FFFFFF" }}
                    required
                  >
                    <option value="STUDENT">Student</option>
                    <option value="RECRUITER">Recruiter</option>
                    <option value="PLACEMENT_OFFICER">Placement Officer</option>
                  </select>
                </label>

                {/* College code — only required for students */}
                {selectedRole === "STUDENT" && (
                  <label className="block">
                    <span className="mb-2.5 block text-sm font-semibold text-foreground">
                      College Code <span style={{ color: "#EF4444" }}>*</span>
                    </span>
                    <Input
                      name="collegeCode"
                      className="h-12 rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#7666F6]/50"
                      placeholder="e.g., IIT001"
                      required
                    />
                  </label>
                )}
              </>
            )}

            <label className="block">
              <span className="mb-2.5 block text-sm font-semibold text-foreground">Email Address</span>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2" style={{ color: "#94A3B8" }} />
                <Input
                  name="email"
                  className="h-12 pl-11 rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#7666F6]/50"
                  type="email"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2.5 block text-sm font-semibold text-foreground">Password</span>
              <div className="relative">
                <LockKeyhole className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2" style={{ color: "#94A3B8" }} />
                <Input
                  name="password"
                  className="h-12 pl-11 pr-11 rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#7666F6]/50"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  aria-label="Toggle password visibility"
                >
                  <Eye className="h-5 w-5 cursor-pointer transition-colors" style={{ color: showPassword ? "#7666F6" : "#94A3B8" }} />
                </button>
              </div>
              
              {/* Password Strength Meter */}
              {isSignup && (
                <PasswordStrengthMeter
                  password={formPassword}
                  onPasswordChange={setFormPassword}
                  onStrengthChange={setPasswordStrength}
                  showSuggestions={true}
                  showRequirements={true}
                  showGenerateButton={true}
                />
              )}
            </label>

            {isSignup && (
              <label className="block">
                <span className="mb-2.5 block text-sm font-semibold text-foreground">Confirm Password</span>
                <div className="relative">
                  <LockKeyhole className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2" style={{ color: "#94A3B8" }} />
                  <Input
                    name="confirmPassword"
                    className="h-12 pl-11 pr-11 rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#7666F6]/50"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formConfirmPassword}
                    onChange={(e) => setFormConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2"
                    aria-label="Toggle confirm password visibility"
                  >
                    <Eye className="h-5 w-5 cursor-pointer transition-colors" style={{ color: showConfirmPassword ? "#7666F6" : "#94A3B8" }} />
                  </button>
                </div>
              </label>
            )}

            {!isSignup && (
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2.5 text-sm cursor-pointer transition-colors" style={{ color: "#94A3B8" }}>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded transition-all"
                    style={{ borderColor: "#E2E8F0", accentColor: "#7666F6" }}
                  />
                  Remember me
                </label>
                <Link href="/forgot-password" className="text-sm font-semibold transition-colors" style={{ color: "#7666F6" }}>
                  Forgot password?
                </Link>
              </div>
            )}

            {error && (
              <div className="rounded-lg px-4 py-3 text-sm font-medium" style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#DC2626" }}>
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg px-4 py-3 text-sm font-medium" style={{ background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.2)", color: "#15803D" }}>
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 mt-6 rounded-lg text-white font-semibold text-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              style={{ background: "linear-gradient(135deg, #7666F6 0%, #625EF8 100%)" }}
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  {isSignup ? "Create Account" : "Sign In"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Sign In/Up Toggle */}
          <p className="mt-8 text-center text-sm" style={{ color: "#94A3B8" }}>
            {isSignup ? "Already have an account? " : "Don't have an account? "}{" "}
            <button
              type="button"
              onClick={() => setMode(isSignup ? "signin" : "signup")}
              className="font-semibold transition-colors"
              style={{ color: "#7666F6" }}
            >
              {isSignup ? "Sign in here" : "Create account"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
