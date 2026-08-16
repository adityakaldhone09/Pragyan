/**
 * Assessment Progress Tracker
 * Determines which phase the user should resume from based on backend data
 */

import { assessmentService } from "@/services/assessmentService";

export interface AssessmentProgress {
  currentPhase: number;
  completedPhases: number[];
  nextPhaseUrl: string;
  canResume: boolean;
  progressPercent: number;
}

const TOTAL_PHASES = 7;
export const PHASE4_RESULT_STORAGE_KEY = "pragyan:v1:phase4_result";

const PHASE_ROUTES: Record<number, string> = {
  0: "/assessments",
  1: "/assessment/phase-1",
  2: "/assessment/phase-2",
  3: "/assessment/phase-3",
  4: "/assessment/phase-4",
  5: "/assessment/phase-5",
  6: "/assessment/phase-6",
  7: "/assessment/phase-7",
};

/**
 * Determines which assessment phase the user should continue from
 * Checks backend for completed phases and returns resume information
 */
export async function getAssessmentProgress(): Promise<AssessmentProgress> {
  try {
    const completedPhases: number[] = [];
    let currentPhase = 1; // Default: start from phase 1

    // Check Phase 1
    try {
      const phase1Data = await assessmentService.getPhase1();
      if (phase1Data && phase1Data.personalInfo) {
        completedPhases.push(1);
        currentPhase = 2;
      }
    } catch {
      // Phase 1 not completed
    }

    // Check Phase 2
    if (completedPhases.includes(1)) {
      try {
        const phase2Data = await assessmentService.getPhase2();
        if (phase2Data && phase2Data.preferredDomains?.length > 0) {
          completedPhases.push(2);
          currentPhase = 3;
        }
      } catch {
        // Phase 2 not completed
      }
    }

    // Check Phase 3 (adaptive assessment)
    if (completedPhases.includes(2)) {
      try {
        const latestAssessment = await assessmentService.getLatestAssessment();
        if (latestAssessment && latestAssessment.id) {
          completedPhases.push(3);
          currentPhase = 4;
        }
      } catch {
        // Phase 3 not completed
      }
    }

    // Check Phase 4 (technical assessment)
    if (completedPhases.includes(3)) {
      try {
        const phase4Result =
          localStorage.getItem(PHASE4_RESULT_STORAGE_KEY) ||
          localStorage.getItem("pragyan_phase4_result");
        if (phase4Result) {
          const parsed = JSON.parse(phase4Result);
          if (parsed && parsed.resultId) {
            completedPhases.push(4);
            currentPhase = 5;
          }
        }
      } catch {
        // Phase 4 not completed
      }
    }

    // Check Phase 5 (specialization detection)
    if (completedPhases.includes(4)) {
      try {
        const phase5Result = localStorage.getItem("pragyan_phase5_result");
        if (phase5Result) {
          const parsed = JSON.parse(phase5Result);
          // Phase 5 returns { sessionId, confidence, summary } — no resultId
          if (parsed && (parsed.resultId || parsed.sessionId || parsed.summary)) {
            completedPhases.push(5);
            currentPhase = 6;
          }
        }
      } catch {
        // Phase 5 not completed
      }
    }

    // Check Phase 6 (confidence validation)
    if (completedPhases.includes(5)) {
      try {
        const phase6Result = localStorage.getItem("pragyan_phase6_result");
        if (phase6Result) {
          const parsed = JSON.parse(phase6Result);
          if (parsed && parsed.assessmentComplete) {
            completedPhases.push(6);
            currentPhase = 7;
          }
        }
      } catch {
        // Phase 6 not completed
      }
    }

    // Check Phase 7 (career recommendations)
    if (completedPhases.includes(6)) {
      try {
        const phase7Result = localStorage.getItem("pragyan_phase7_result");
        if (phase7Result) {
          const parsed = JSON.parse(phase7Result);
          if (parsed && parsed.completed) {
            completedPhases.push(7);
            // All phases complete, stay on Phase 7 or go to dashboard
            currentPhase = 7;
          }
        }
      } catch {
        // Phase 7 not completed
      }
    }

    const progressPercent = Math.round((completedPhases.length / TOTAL_PHASES) * 100);
    const nextPhaseUrl = PHASE_ROUTES[currentPhase] || PHASE_ROUTES[1];
    const canResume = completedPhases.length > 0;

    return {
      currentPhase,
      completedPhases,
      nextPhaseUrl,
      canResume,
      progressPercent,
    };
  } catch (error) {
    console.error("[getAssessmentProgress] Error:", error);
    // Default fallback: start from phase 1
    return {
      currentPhase: 1,
      completedPhases: [],
      nextPhaseUrl: "/assessment/phase-1",
      canResume: false,
      progressPercent: 0,
    };
  }
}

/**
 * Checks if user can skip to a specific phase
 * Ensures prerequisites are met
 */
export function canAccessPhase(targetPhase: number, completedPhases: number[]): boolean {
  // Phase 1 is always accessible
  if (targetPhase === 1) return true;

  const completedPhaseSet = new Set(completedPhases);

  // All other phases require the previous phase to be completed
  for (let i = 1; i < targetPhase; i++) {
    if (!completedPhaseSet.has(i)) {
      return false;
    }
  }

  return true;
}

/**
 * Gets display name for a phase
 */
export function getPhaseDisplayName(phase: number): string {
  const names: Record<number, string> = {
    1: "Personal Profile",
    2: "Interests & Domains",
    3: "Adaptive Assessment",
    4: "Technical Assessment",
    5: "AI Specialization Detection",
    6: "Confidence Validation",
    7: "Career Recommendations",
  };
  return names[phase] || `Phase ${phase}`;
}

/**
 * Stores last accessed phase in localStorage for quick resume
 */
export function saveLastAccessedPhase(phase: number): void {
  try {
    localStorage.setItem("pragyan_last_accessed_phase", String(phase));
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Retrieves last accessed phase from localStorage
 */
export function getLastAccessedPhase(): number | null {
  try {
    const stored = localStorage.getItem("pragyan_last_accessed_phase");
    return stored ? parseInt(stored, 10) : null;
  } catch {
    return null;
  }
}
