import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";

/**
 * OAuth Callback Page (ADMIN-ONLY)
 * Receives tokens from OAuth providers
 * Stores them and redirects to admin dashboard
 */
export default function AuthCallback() {
  const [, navigate] = useLocation();
  const { login: authLogin, userRole } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get tokens from URL
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        const refreshToken = params.get("refresh");
        const error = params.get("error");

        if (error) {
          console.error("OAuth error:", error);
          navigate("/auth?error=" + error);
          return;
        }

        if (!token) {
          console.error("No token received from OAuth callback");
          navigate("/auth?error=no_token");
          return;
        }

        // Store tokens in localStorage
        localStorage.setItem("accessToken", token);
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        }

        // Fetch user profile
        // Development: uses relative /api (proxied by Vite)
        // Production: direct to Render backend
        const apiUrl =
          import.meta.env.DEV
            ? "/api/auth/me"
            : "https://pragyan-ai-nmeu.onrender.com/api/auth/me";
        
        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user profile");
        }

        const userData = await response.json();
        console.log("User from OAuth:", userData);

        // Update auth context
        if (userData.data) {
          localStorage.setItem("authUser", JSON.stringify(userData.data));
          localStorage.setItem("isAuthenticated", "true");

          // Verify user is ADMIN (OAuth is admin-only)
          const role = userData.data.role;
          if (role === "ADMIN") {
            navigate("/admin/dashboard");
          } else {
            // Non-admin users should not be able to OAuth login
            console.error("OAuth login attempted by non-admin user:", role);
            navigate("/auth?error=admin_only");
          }
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        navigate("/auth?error=callback_failed");
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="space-y-4 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary">
          <svg
            className="w-6 h-6 text-white animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold">Signing you in...</h2>
        <p className="text-sm text-muted-foreground">Completing OAuth authentication</p>
      </div>
    </div>
  );
}
