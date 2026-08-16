import { lazy, Suspense, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, RequireAuth } from "@/context/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { StudentRoute } from "@/components/StudentRoute";
import { RecruiterRoute } from "@/components/RecruiterRoute";
import { PlacementOfficerRoute } from "@/components/PlacementOfficerRoute";
import { AdminRoute } from "@/components/AdminRoute";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout";
import Landing from "@/pages/landing";
import AuthPage from "@/pages/auth";
import AuthSuccess from "@/pages/auth-success";
import ForgotPassword from "@/pages/forgot-password";
import Home from "@/pages/home";

// ✅ OPTIMIZED: Group related routes to reduce code splitting overhead
// Critical routes in main bundle, related routes grouped together

// Group 1: Assessment phases (all related, load together)
const AssessmentGroup = lazy(() => import("@/pages/assessment-phase1").then(m => ({ default: m.default })));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Assessments = lazy(() => import("@/pages/assessments"));

// Grouped assessment phases - import separately but they'll be in same chunk
const AssessmentPhase1 = lazy(() => import("@/pages/assessment-phase1"));
const AssessmentPhase2 = lazy(() => import("@/pages/assessment-phase2"));
const AssessmentPhase3 = lazy(() => import("@/pages/assessment-phase3"));
const AssessmentPhase4 = lazy(() => import("@/pages/assessment-phase4"));
const AssessmentPhase5 = lazy(() => import("@/pages/assessment-phase5"));
const AssessmentPhase6 = lazy(() => import("@/pages/assessment-phase6"));
const AssessmentPhase7 = lazy(() => import("@/pages/assessment-phase7"));

// Group 2: Career discovery flows
const Resources = lazy(() => import("@/pages/resources"));
const Certificates = lazy(() => import("@/pages/certificates"));
const Profile = lazy(() => import("@/pages/profile"));
const Skills = lazy(() => import("@/pages/skills"));
const Roadmap = lazy(() => import("@/pages/roadmap"));
const CareerDiscovery = lazy(() => import("@/pages/career-discovery"));
const Discovery = lazy(() => import("@/pages/discovery"));
const InterestDiscovery = lazy(() => import("@/pages/interest-discovery"));
const CapabilityDiscovery = lazy(() => import("@/pages/capability-discovery"));

// Group 3: AI & Learning
const AICounselor = lazy(() => import("@/pages/ai-counselor"));

// Group 4: Admin dashboard
const AdminRoadmapManager = lazy(() => import("@/pages/admin-roadmap-builder-optimized"));
const AdminDashboard = lazy(() => import("@/pages/admin-dashboard"));
const AdminUsers = lazy(() => import("@/pages/admin-users"));
const AdminOrganizations = lazy(() => import("@/pages/admin-organizations"));
const AdminAuditLogs = lazy(() => import("@/pages/admin-audit-logs"));
const AuthCallback = lazy(() => import("@/pages/auth-callback"));
const SettingsPage = lazy(() => import("@/pages/settings"));
const RecruitmentDashboard = lazy(() => import("@/pages/recruitment-dashboard"));
const CompanyDashboard = lazy(() => import("@/pages/company-dashboard"));
const JobsPage = lazy(() => import("@/pages/jobs"));
const MyApplicationsPage = lazy(() => import("@/pages/my-applications"));
const HiringDrivesPage = lazy(() => import("@/pages/hiring-drives"));
const CompanyJobsPage = lazy(() => import("@/pages/company-jobs"));
const CompanyApplicationsPage = lazy(() => import("@/pages/company-applications"));
const CompanyHiringDrivesPage = lazy(() => import("@/pages/company-hiring-drives"));
const CompanyAnalyticsPage = lazy(() => import("@/pages/company-analytics"));
const PlacementDashboardPage = lazy(() => import("@/pages/placement-dashboard"));
const PlacementStudentsPage = lazy(() => import("@/pages/placement-students"));
const PlacementCompaniesPage = lazy(() => import("@/pages/placement-companies"));
const PlacementAnalyticsPage = lazy(() => import("@/pages/placement-analytics"));
const PlacementApplicationsPage = lazy(() => import("@/pages/placement-applications"));

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
      Loading page...
    </div>
  );
}

function RedirectTo({ to }: { to: string }) {
  const [, navigate] = useLocation();

  useEffect(() => {
    navigate(to, { replace: true });
  }, [navigate, to]);

  return null;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,              // ✅ 30 seconds before marked stale (was 2 min)
      refetchOnWindowFocus: true,        // ✅ Refetch when user returns to tab
      refetchOnReconnect: true,          // ✅ Refetch when network reconnects
      retry: 2,                          // ✅ Retry failed requests 2x (was false)
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/auth/success" component={AuthSuccess} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/login" component={AuthPage} />
      <Route path="/signup" component={AuthPage} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route>
        <RequireAuth>
          <Layout>
            <Suspense fallback={<RouteFallback />}>
              <Switch>
                {/* Common Routes (all authenticated users) */}
                <Route path="/home" component={Home} />
                <Route path="/profile" component={Profile} />
                <Route path="/profile/skills" component={Skills} />
                {/* ── Settings deep-link redirects ─────────────────────────────────
                 *  These catch both manual URL entry and old bookmarks.
                 *  /settings/:tab  →  /settings?tab=:tab
                 *  /feedback       →  /settings?tab=feedback  (legacy stale link)
                 * ─────────────────────────────────────────────────────────────── */}
                <Route path="/feedback">
                  {() => { window.location.replace("/settings?tab=feedback"); return null; }}
                </Route>
                <Route path="/settings/feedback">
                  {() => { window.location.replace("/settings?tab=feedback"); return null; }}
                </Route>
                <Route path="/settings/notifications">
                  {() => { window.location.replace("/settings?tab=notifications"); return null; }}
                </Route>
                <Route path="/settings/security">
                  {() => { window.location.replace("/settings?tab=security"); return null; }}
                </Route>
                <Route path="/settings/privacy">
                  {() => { window.location.replace("/settings?tab=privacy"); return null; }}
                </Route>
                <Route path="/settings/appearance">
                  {() => { window.location.replace("/settings?tab=appearance"); return null; }}
                </Route>
                <Route path="/settings/account">
                  {() => { window.location.replace("/settings?tab=account"); return null; }}
                </Route>
                <Route path="/settings" component={SettingsPage} />

                {/* Student Routes */}
                <Route path="/dashboard">
                  <StudentRoute>
                    <Dashboard />
                  </StudentRoute>
                </Route>
                <Route path="/assessments">
                  <StudentRoute>
                    <Assessments />
                  </StudentRoute>
                </Route>
                <Route path="/assessment">
                  <StudentRoute>
                    <RedirectTo to="/assessments" />
                  </StudentRoute>
                </Route>
                <Route path="/assessment/phase-1">
                  <StudentRoute>
                    <AssessmentPhase1 />
                  </StudentRoute>
                </Route>
                <Route path="/assessment/phase-2">
                  <StudentRoute>
                    <AssessmentPhase2 />
                  </StudentRoute>
                </Route>
                <Route path="/assessment/phase-3">
                  <StudentRoute>
                    <AssessmentPhase3 />
                  </StudentRoute>
                </Route>
                <Route path="/assessment/phase-4">
                  <StudentRoute>
                    <AssessmentPhase4 />
                  </StudentRoute>
                </Route>
                <Route path="/assessment/phase-5">
                  <StudentRoute>
                    <AssessmentPhase5 />
                  </StudentRoute>
                </Route>
                <Route path="/assessment/phase-6">
                  <StudentRoute>
                    <AssessmentPhase6 />
                  </StudentRoute>
                </Route>
                <Route path="/assessment/phase-7">
                  <StudentRoute>
                    <AssessmentPhase7 />
                  </StudentRoute>
                </Route>
                <Route path="/resources">
                  <StudentRoute>
                    <Resources />
                  </StudentRoute>
                </Route>
                <Route path="/resources/certificates">
                  <StudentRoute>
                    <Certificates />
                  </StudentRoute>
                </Route>
                {/* /information/career-readiness removed */}
                <Route path="/assessment/discovery">
                  <StudentRoute>
                    <Discovery />
                  </StudentRoute>
                </Route>
                <Route path="/assessment/interest">
                  <StudentRoute>
                    <InterestDiscovery />
                  </StudentRoute>
                </Route>
                <Route path="/assessment/capability">
                  <StudentRoute>
                    <CapabilityDiscovery />
                  </StudentRoute>
                </Route>
                <Route path="/career-discovery">
                  <StudentRoute>
                    <CareerDiscovery />
                  </StudentRoute>
                </Route>
                <Route path="/ai-counselor">
                  <StudentRoute>
                    <AICounselor />
                  </StudentRoute>
                </Route>
                <Route path="/roadmap">
                  <StudentRoute>
                    <Roadmap />
                  </StudentRoute>
                </Route>
                <Route path="/jobs">
                  <StudentRoute>
                    <JobsPage />
                  </StudentRoute>
                </Route>
                <Route path="/my-applications">
                  <StudentRoute>
                    <MyApplicationsPage />
                  </StudentRoute>
                </Route>
                <Route path="/hiring-drives">
                  <StudentRoute>
                    <HiringDrivesPage />
                  </StudentRoute>
                </Route>
                <Route path="/recruitment">
                  <StudentRoute>
                    <RecruitmentDashboard />
                  </StudentRoute>
                </Route>

                {/* Recruiter Routes */}
                <Route path="/company/dashboard">
                  <RecruiterRoute>
                    <CompanyDashboard />
                  </RecruiterRoute>
                </Route>
                <Route path="/company/jobs">
                  <RecruiterRoute>
                    <CompanyJobsPage />
                  </RecruiterRoute>
                </Route>
                <Route path="/company/applications">
                  <RecruiterRoute>
                    <CompanyApplicationsPage />
                  </RecruiterRoute>
                </Route>
                <Route path="/company/drives">
                  <RecruiterRoute>
                    <CompanyHiringDrivesPage />
                  </RecruiterRoute>
                </Route>
                <Route path="/company/analytics">
                  <RecruiterRoute>
                    <CompanyAnalyticsPage />
                  </RecruiterRoute>
                </Route>
                <Route path="/company">
                  <RecruiterRoute>
                    <CompanyDashboard />
                  </RecruiterRoute>
                </Route>

                {/* Placement Officer Routes */}
                <Route path="/placement/dashboard">
                  <PlacementOfficerRoute>
                    <PlacementDashboardPage />
                  </PlacementOfficerRoute>
                </Route>
                <Route path="/placement/students">
                  <PlacementOfficerRoute>
                    <PlacementStudentsPage />
                  </PlacementOfficerRoute>
                </Route>
                <Route path="/placement/companies">
                  <PlacementOfficerRoute>
                    <PlacementCompaniesPage />
                  </PlacementOfficerRoute>
                </Route>
                <Route path="/placement/analytics">
                  <PlacementOfficerRoute>
                    <PlacementAnalyticsPage />
                  </PlacementOfficerRoute>
                </Route>
                <Route path="/placement/applications">
                  <PlacementOfficerRoute>
                    <PlacementApplicationsPage />
                  </PlacementOfficerRoute>
                </Route>
                <Route path="/placement">
                  <PlacementOfficerRoute>
                    <PlacementDashboardPage />
                  </PlacementOfficerRoute>
                </Route>

                {/* Admin Routes */}
                <Route path="/admin/dashboard">
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                </Route>
                <Route path="/admin/users">
                  <AdminRoute>
                    <AdminUsers />
                  </AdminRoute>
                </Route>
                <Route path="/admin/organizations">
                  <AdminRoute>
                    <AdminOrganizations />
                  </AdminRoute>
                </Route>
                <Route path="/admin/audit-logs">
                  <AdminRoute>
                    <AdminAuditLogs />
                  </AdminRoute>
                </Route>
                <Route path="/admin/roadmaps">
                  <AdminRoute>
                    <AdminRoadmapManager />
                  </AdminRoute>
                </Route>
                <Route path="/admin/company/:companyId">
                  <AdminRoute>
                    <CompanyDashboard />
                  </AdminRoute>
                </Route>

                <Route component={NotFound} />
              </Switch>
            </Suspense>
          </Layout>
        </RequireAuth>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
          </AuthProvider>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
