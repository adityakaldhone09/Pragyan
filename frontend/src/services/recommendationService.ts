import { apiClient } from "./apiClient";
import type { AssessmentMatch, RoadmapDomainSection } from "@/types/api";

export interface RecommendationProfile {
  skills?: string[];
  interests?: string[];
  personality?: string[];
  education?: string;
  experience?: string;
  workStyle?: string[];
  learningPreferences?: string[];
}

export interface RecommendationBundle {
  topCareer: AssessmentMatch | null;
  careerMatches: AssessmentMatch[];
  skillRecommendations: Array<{ skill: string; confidence: number; reason: string }>;
  roadmapRecommendations: Array<{ id: string; title: string; category: string; level: string; matchScore: number; reason: string; tags: string[] }>;
}

export const recommendationService = {
  generateRecommendations(profile?: RecommendationProfile) {
    return apiClient.post<RecommendationBundle>("/recommendations", profile || {});
  },

  getTopCareer() {
    return apiClient.get<AssessmentMatch | null>("/recommendations/top-career");
  },

  getRoadmapRecommendations() {
    return apiClient.get<RecommendationBundle["roadmapRecommendations"]>("/recommendations/roadmaps");
  },

  getRoadmapSections() {
    return apiClient.get<RoadmapDomainSection[]>("/recommendations/roadmap-sections");
  },

  getSkillRecommendations() {
    return apiClient.get<RecommendationBundle["skillRecommendations"]>("/recommendations/skills");
  },

  getCareerRecommendations() {
    return apiClient.get<Array<{ career: string; score: number; reason: string }>>("/recommendations/careers");
  },

  getJobRecommendations() {
    return apiClient.get<Array<{ id: string; title: string; company: string; location: string; matchScore: number }>>("/recommendations/jobs");
  },

  explainCareer(careerId: string) {
    return apiClient.get<{ explanation: string; parsed?: unknown }>(`/recommendations/explain/${careerId}`);
  },
};