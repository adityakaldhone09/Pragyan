import { FormEvent, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Mail, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { authService } from "@/services/authService";

type ResetStep = "email" | "otp" | "password" | "done";

export default function ForgotPassword() {
  const [step, setStep] = useState<ResetStep>("email");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextEmail = String(formData.get("email") || email).trim();
    const otp = String(formData.get("otp") || "").trim();
    const newPassword = String(formData.get("newPassword") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

    setMessage("");
    setError("");
    setSubmitting(true);
    try {
      if (step === "email") {
        const response = await authService.forgotPassword(nextEmail);
        setEmail(nextEmail);
        setStep("otp");
        setMessage(response.message || "If an account exists, a verification code has been sent.");
      } else if (step === "otp") {
        const response = await authService.verifyResetOtp({ email, otp });
        setStep("password");
        setMessage(response.message || "Verification code confirmed. You can now reset your password.");
      } else if (step === "password") {
        if (newPassword !== confirmPassword) {
          setError("Passwords do not match.");
          return;
        }
        const response = await authService.resetPassword({ email, newPassword });
        setStep("done");
        setMessage(response.message || "Password reset successfully. You can now sign in.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to complete password reset.");
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
            Reset your password and continue your recommendations, assessments, learning roadmap, and counselor conversations.
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
              Account recovery
            </p>
            <h2 className="mt-2 text-4xl font-bold tracking-normal">
              {step === "done" ? "Password reset" : "Forgot password?"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {step === "email" && "Enter your email address and Pragyan AI will send a reset code if the account exists."}
              {step === "otp" && "Enter the 6-digit verification code sent to your email."}
              {step === "password" && "Choose a new password for your Pragyan AI account."}
              {step === "done" && "Your password has been updated. Return to sign in and continue."}
            </p>
          </div>

          {step !== "done" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {step === "email" && (
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Email address</span>
                  <span className="relative block">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input name="email" className="h-11 pl-10" type="email" placeholder="you@example.com" required />
                  </span>
                </label>
              )}

              {step === "otp" && (
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Verification code</span>
                  <Input
                    name="otp"
                    className="h-11"
                    inputMode="numeric"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    placeholder="123456"
                    required
                  />
                </label>
              )}

              {step === "password" && (
                <>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">New password</span>
                    <Input name="newPassword" className="h-11" type="password" placeholder="Enter new password" minLength={6} required />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">Confirm password</span>
                    <Input name="confirmPassword" className="h-11" type="password" placeholder="Confirm new password" minLength={6} required />
                  </label>
                </>
              )}

              {message && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                  {message}
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
                {submitting && "Please wait..."}
                {!submitting && step === "email" && "Send reset code"}
                {!submitting && step === "otp" && "Verify code"}
                {!submitting && step === "password" && "Reset password"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {step === "done" && message && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              {message}
            </div>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Remembered your password?{" "}
            <Link href="/auth" className="font-bold text-primary">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
