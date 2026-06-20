import { apiClient, clearStoredAuthSession, setStoredAuthSession } from "./apiClient";
import type {
  AuthSession,
  AuthUser,
  Certification,
  ConnectedProvidersResponse,
  GitHubRepositorySummary,
  PortfolioProject,
  ProfileBuilderSnapshot,
  ProfileCoachResponse,
} from "@/types/api";

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
  age?: number;
  location?: string;
  phone?: string;
  linkedin?: string;
  skills?: string[];
  interests?: string[];
  preferences?: string[];
  educationEntries?: Array<{
    qualification: string;
    city: string;
    percentage: number;
  }>;
  education?: string;
  experience?: string;
  experienceType?: 'fresher' | 'experienced';
  skillLevel?: string;
  currentTitle?: string;
  careerTrack?: string;
  tenthBoard?: string;
  tenthScore?: string;
  twelfthBoard?: string;
  twelfthScore?: string;
  currentCourse?: string;
  cgpa?: string;
}

export interface PortfolioProjectInput {
  title: string;
  description?: string;
  techStack?: string[];
  highlights?: string[];
  liveUrl?: string;
  repoUrl?: string;
  featured?: boolean;
}

export interface CertificationInput {
  title: string;
  issuer: string;
  credentialId?: string;
  credentialUrl?: string;
  issuedAt?: string;
  expiresAt?: string;
  description?: string;
}

export interface GithubImportInput {
  repoIds: string[];
}

export interface LinkProviderResponse {
  redirectUrl: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface VerifyResetOtpInput {
  email: string;
  otp: string;
}

export interface ResetPasswordInput {
  email: string;
  newPassword: string;
}

export interface PasswordResetMessageResponse {
  message: string;
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

  async requestPasswordReset(input: ForgotPasswordInput) {
    return apiClient.post<PasswordResetMessageResponse>("/auth/forgot-password", input, { skipAuth: true });
  },

  async verifyResetOTP(input: VerifyResetOtpInput) {
    return apiClient.post<PasswordResetMessageResponse>("/auth/verify-reset-otp", input, { skipAuth: true });
  },

  async resetPassword(input: ResetPasswordInput) {
    return apiClient.post<PasswordResetMessageResponse>("/auth/reset-password", input, { skipAuth: true });
  },

  async getLinkedProviders() {
    return apiClient.get<ConnectedProvidersResponse>("/profile/providers");
  },

  async getProfileBuilder() {
    return apiClient.get<ProfileBuilderSnapshot>("/profile/builder");
  },

  async getProfileCoach() {
    return apiClient.get<ProfileCoachResponse>("/profile/builder/coach");
  },

  async updateProfileBuilder(input: UpdateProfileInput) {
    return apiClient.patch<AuthUser>("/profile/builder", input);
  },

  async createPortfolioProject(input: PortfolioProjectInput) {
    return apiClient.post<PortfolioProject>("/profile/builder/projects", input);
  },

  async updatePortfolioProject(projectId: string, input: PortfolioProjectInput) {
    return apiClient.patch<PortfolioProject>(`/profile/builder/projects/${projectId}`, input);
  },

  async deletePortfolioProject(projectId: string) {
    return apiClient.delete<{ deleted: boolean }>(`/profile/builder/projects/${projectId}`);
  },

  async createCertification(input: CertificationInput) {
    return apiClient.post<Certification>("/profile/builder/certifications", input);
  },

  async updateCertification(certificationId: string, input: CertificationInput) {
    return apiClient.patch<Certification>(`/profile/builder/certifications/${certificationId}`, input);
  },

  async deleteCertification(certificationId: string) {
    return apiClient.delete<{ deleted: boolean }>(`/profile/builder/certifications/${certificationId}`);
  },

  async importGithubRepositories(input: GithubImportInput) {
    return apiClient.post<{ imported: PortfolioProject[] }>("/profile/builder/github/import", input);
  },

  async startLink(provider: "google" | "github") {
    return apiClient.post<LinkProviderResponse>(`/profile/link/${provider}`);
  },

  async unlinkProvider(provider: "google" | "github") {
    return apiClient.delete<ConnectedProvidersResponse>(`/profile/unlink/${provider}`);
  },
};
