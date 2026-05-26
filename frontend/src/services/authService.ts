import { apiClient, clearStoredAuthSession, setStoredAuthSession } from "./apiClient";
import type { AuthSession, AuthUser, ConnectedProvidersResponse } from "@/types/api";

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
  avatar?: string | null;
  bio?: string;
  skills?: string[];
  interests?: string[];
  education?: string;
  experience?: string;
}

export interface LinkProviderResponse {
  redirectUrl: string;
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

  async getLinkedProviders() {
    return apiClient.get<ConnectedProvidersResponse>("/profile/providers");
  },

  async startLink(provider: "google" | "github") {
    return apiClient.post<LinkProviderResponse>(`/profile/link/${provider}`);
  },

  async unlinkProvider(provider: "google" | "github") {
    return apiClient.delete<ConnectedProvidersResponse>(`/profile/unlink/${provider}`);
  },
};