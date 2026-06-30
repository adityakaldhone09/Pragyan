import { api } from "@/services/apiClient";
import type { AuthUser, Certification, PortfolioProject, ProfileBuilderData } from "@/types/api";

export const profileService = {
  getProfile() {
    return api.get<ProfileBuilderData>("/profile");
  },
  updateProfile(input: Partial<AuthUser>) {
    return api.put<AuthUser>("/profile", input);
  },
  startProviderLink(provider: "github" | "google") {
    return api.post<{ redirectUrl: string }>(`/profile/link/${provider}`);
  },
  createProject(input: Omit<PortfolioProject, "id">) {
    return api.post<PortfolioProject>("/profile/builder/projects", input);
  },
  createCertification(input: Omit<Certification, "id">) {
    return api.post<Certification>("/profile/builder/certifications", input);
  },
};
