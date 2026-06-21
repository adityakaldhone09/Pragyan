import { useMutation, useQuery } from "@tanstack/react-query";
import { assessmentService } from "@/services/assessmentService";

export function useAssessmentQuestions(enabled = false) {
  return useQuery({
    queryKey: ["assessment", "questions"],
    queryFn: assessmentService.getQuestions,
    enabled,
  });
}

export function useAssessment() {
  return {
    saveProfile: useMutation({ mutationFn: assessmentService.saveProfile }),
    saveSkills: useMutation({ mutationFn: assessmentService.saveSkills }),
    saveAssessment: useMutation({ mutationFn: assessmentService.saveAssessment }),
    submitAssessment: useMutation({ mutationFn: assessmentService.submitAssessment }),
  };
}
