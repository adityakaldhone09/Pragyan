import { apiClient, clearStoredAuthSession, setStoredAuthSession } from "./apiClient";
import type { AuthSession, AuthUser } from "@/types/api";

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  fullName: string;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface UpdateProfileInput {
  fullName?: string;
  bio?: string;
  skills?: string[];
  interests?: string[];
  education?: string;
  experience?: string;
}

function normalizeSession(data: AuthSession | { user: AuthUser; accessToken?: string; refreshToken?: string }) {
  const accessToken = data.accessToken || "";
  const refreshToken = data.refreshToken || "";
  return { user: data.user, accessToken, refreshToken } satisfies AuthSession;
}

export const authService = {
  async login(input: LoginInput) {
    const session = await apiClient.post<AuthSession>("/auth/login", input, { skipAuth: true });
    const normalized = normalizeSession(session);
    setStoredAuthSession(normalized);
    return normalized;
  },

  async register(input: RegisterInput) {
    const session = await apiClient.post<AuthSession>("/auth/register", input, { skipAuth: true });
    const normalized = normalizeSession(session);
    setStoredAuthSession(normalized);
    return normalized;
  },

  async me() {
    return apiClient.get<AuthUser>("/auth/me", { retryCount: 0 });
  },

  async updateProfile(input: UpdateProfileInput) {
    return apiClient.patch<AuthUser>("/auth/me", input);
  },

  async refreshToken(input: RefreshTokenInput) {
    const session = await apiClient.post<AuthSession>("/auth/refresh-token", input, { skipAuth: true });
    const normalized = normalizeSession(session);
    setStoredAuthSession(normalized);
    return normalized;
  },

  async logout(refreshToken: string) {
    try {
      await apiClient.post("/auth/logout", { refreshToken }, { skipAuth: true });
    } finally {
      clearStoredAuthSession();
    }
  },
};