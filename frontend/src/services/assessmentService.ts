import { api } from "@/services/apiClient";
import type { AssessmentQuestion, AssessmentResult, AssessmentSaveResponse, AuthUser } from "@/types/api";

export interface AssessmentProfileInput {
  profile: Partial<AuthUser>;
  resume?: File | null;
  careerPreference?: string;
}

export const assessmentService = {
  async saveProfile(input: AssessmentProfileInput) {
    return api.patch<AuthUser>("/auth/me", {
      ...input.profile,
      careerTrack: input.careerPreference || input.profile.careerTrack,
    });
  },
  saveSkills(input: { skills: string[]; interests?: string[]; preferences?: string[] }) {
    return api.patch<AuthUser>("/auth/me", input);
  },
  getQuestions() {
    return api.get<AssessmentQuestion[]>("/assessment/questions");
  },
  saveAssessment(answers: Record<string, string>) {
    return api.post<AssessmentSaveResponse>("/assessment/save", { answers });
  },
  submitAssessment(answers: Record<string, string>) {
    return api.post<AssessmentResult>("/assessment/submit-legacy", { answers });
  },
};
