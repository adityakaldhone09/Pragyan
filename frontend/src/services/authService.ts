import { api, clearStoredAuthSession } from "@/services/apiClient";
import type { AuthSession, AuthUser } from "@/types/api";

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  fullName: string;
}

export interface AuthConfig {
  googleEnabled: boolean;
  githubEnabled: boolean;
  googleLoginUrl: string;
  githubLoginUrl: string;
}

export interface AuthMessageResponse {
  message?: string;
}

export const authService = {
  register(input: RegisterInput) {
    return api.post<AuthSession>("/auth/register", input, { skipRefresh: true });
  },
  login(input: LoginInput) {
    return api.post<AuthSession>("/auth/login", input, { skipRefresh: true });
  },
  me() {
    return api.get<AuthUser>("/auth/me");
  },
  updateProfile(input: Partial<AuthUser>) {
    return api.patch<AuthUser>("/auth/me", input);
  },
  logout(refreshToken?: string) {
    return api
      .post("/auth/logout", refreshToken ? { refreshToken } : {}, { skipRefresh: true })
      .finally(() => clearStoredAuthSession());
  },
  refreshToken(refreshToken?: string) {
    return api.post<AuthSession>("/auth/refresh-token", refreshToken ? { refreshToken } : {}, { skipRefresh: true });
  },
  forgotPassword(email: string) {
    return api.post<AuthMessageResponse>("/auth/forgot-password", { email }, { skipRefresh: true });
  },
  verifyResetOtp(input: { email: string; otp: string }) {
    return api.post<AuthMessageResponse>("/auth/verify-reset-otp", input, { skipRefresh: true });
  },
  resetPassword(input: { email: string; newPassword: string }) {
    return api.post<AuthMessageResponse>("/auth/reset-password", input, { skipRefresh: true });
  },
  getConfig() {
    return api.get<AuthConfig>("/auth/config", { skipRefresh: true });
  },
};
