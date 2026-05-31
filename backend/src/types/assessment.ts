export type AssessmentOption = {
  value: string;
  label: string;
  next?: string;
};

export type AssessmentQuestion = {
  id: string;
  question: string;
  options: AssessmentOption[];
};

export type AssessmentResult = {
  careerPath: string;
  recommendedRoles: string[];
  confidence: number;
  roadmapTemplate?: any;
  eligibility?: any[];
};

export type DecisionInput = {
  category?: string;
  sector?: string;
  qualification?: string;
  branch?: string;
  selectedRole?: string;
};

export {};
