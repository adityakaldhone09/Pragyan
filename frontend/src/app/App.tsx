import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { Suspense, lazy } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { RequireAuth } from "./components/RequireAuth";
import { Toaster } from "./components/ui/sonner";
import { AppShell } from "./components/AppShell";

const LandingPage = lazy(() => import("./pages/LandingPage").then((module) => ({ default: module.LandingPage })));
const Auth = lazy(() => import("./pages/Auth").then((module) => ({ default: module.Auth })));
const AuthSuccess = lazy(() => import("./pages/AuthSuccess").then((module) => ({ default: module.AuthSuccess })));

const Dashboard = lazy(() => import("./pages/Dashboard").then((module) => ({ default: module.Dashboard })));
const AssessmentFlow = lazy(() => import("./components/assessment/AssessmentFlow"));
const Results = lazy(() => import("./pages/Results").then((module) => ({ default: module.Results })));
const Journey = lazy(() => import("./pages/Journey").then((module) => ({ default: module.Journey })));
const Roadmap = lazy(() => import("./pages/Roadmap").then((module) => ({ default: module.Roadmap })));
const RoadmapCatalog = lazy(() => import("./pages/RoadmapCatalog").then((module) => ({ default: module.RoadmapCatalog })));
const LearningResources = lazy(() => import("./pages/LearningResources").then((module) => ({ default: module.LearningResources })));
const DetailedAnalysis = lazy(() => import("./pages/DetailedAnalysis").then((module) => ({ default: module.DetailedAnalysis })));
const Jobs = lazy(() => import("./pages/Jobs").then((module) => ({ default: module.Jobs })));
const Assistant = lazy(() => import("./pages/Assistant").then((module) => ({ default: module.Assistant })));
const Profile = lazy(() => import("./pages/Profile").then((module) => ({ default: module.Profile })));
const AdminIntelligence = lazy(() => import("./pages/AdminIntelligence").then((module) => ({ default: module.default })));
const AdminIntelligenceAudits = lazy(() => import("./pages/AdminIntelligenceAudits").then((module) => ({ default: module.default })));

export default function App() {
  return (
    <div className="size-full min-h-screen bg-background text-foreground dark">
      <AuthProvider>
        <Toaster richColors closeButton />
        <BrowserRouter>
          <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center px-6 text-center text-muted-foreground bg-background">
                Loading Pragyan experience...
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/success" element={<AuthSuccess />} />
              <Route
                element={
                  <RequireAuth>
                    <AppShell />
                  </RequireAuth>
                }
              >
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="assessment" element={<AssessmentFlow />} />
                <Route path="assessment/hybrid" element={<AssessmentFlow />} />
                <Route path="assessment/start" element={<AssessmentFlow />} />
                <Route path="assessment/form" element={<AssessmentFlow />} />
                <Route path="assessment/discover" element={<AssessmentFlow />} />
                <Route path="assessment/flow" element={<AssessmentFlow />} />
                <Route path="results" element={<Results />} />
                <Route path="journey" element={<Journey />} />
                <Route path="journey/:careerSlug" element={<Journey />} />
                <Route path="analysis" element={<DetailedAnalysis />} />
                <Route path="opportunities" element={<Jobs />} />
                <Route path="roadmap" element={<Roadmap />} />
                <Route path="roadmap-catalog" element={<RoadmapCatalog />} />
                <Route path="learning-resources" element={<LearningResources />} />
                <Route path="jobs" element={<Jobs />} />
                <Route path="assistant" element={<Assistant />} />
                <Route path="profile" element={<Profile />} />
                <Route path="admin/intelligence" element={<AdminIntelligence />} />
                <Route path="admin/intelligence/audits" element={<AdminIntelligenceAudits />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}
