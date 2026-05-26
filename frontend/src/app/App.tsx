import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { Suspense, lazy } from "react";
import { LandingPage } from "./pages/LandingPage";
import { Auth } from "./pages/Auth";
import { AuthSuccess } from "./pages/AuthSuccess";
import { Navigation } from "./components/Navigation";
import { AuthProvider } from "@/context/AuthContext";
import { RequireAuth } from "./components/RequireAuth";

const Dashboard = lazy(() => import("./pages/Dashboard").then((module) => ({ default: module.Dashboard })));
const Assessment = lazy(() => import("./pages/Assessment").then((module) => ({ default: module.Assessment })));
const Results = lazy(() => import("./pages/Results").then((module) => ({ default: module.Results })));
const Roadmap = lazy(() => import("./pages/Roadmap").then((module) => ({ default: module.Roadmap })));
const DetailedAnalysis = lazy(() => import("./pages/DetailedAnalysis").then((module) => ({ default: module.DetailedAnalysis })));
const Jobs = lazy(() => import("./pages/Jobs").then((module) => ({ default: module.Jobs })));
const Assistant = lazy(() => import("./pages/Assistant").then((module) => ({ default: module.Assistant })));
const Profile = lazy(() => import("./pages/Profile").then((module) => ({ default: module.Profile })));

export default function App() {
  return (
    <div className="size-full dark">
      <AuthProvider>
        <BrowserRouter>
          <Navigation />
          <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center px-6 text-center text-muted-foreground">
                Loading Pragyan experience...
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/success" element={<AuthSuccess />} />
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <Dashboard />
                  </RequireAuth>
                }
              />
              <Route
                path="/assessment"
                element={
                  <RequireAuth>
                    <Assessment />
                  </RequireAuth>
                }
              />
              <Route
                path="/results"
                element={
                  <RequireAuth>
                    <Results />
                  </RequireAuth>
                }
              />
              <Route
                path="/analysis"
                element={
                  <RequireAuth>
                    <DetailedAnalysis />
                  </RequireAuth>
                }
              />
              <Route
                path="/roadmap"
                element={
                  <RequireAuth>
                    <Roadmap />
                  </RequireAuth>
                }
              />
              <Route
                path="/jobs"
                element={
                  <RequireAuth>
                    <Jobs />
                  </RequireAuth>
                }
              />
              <Route
                path="/assistant"
                element={
                  <RequireAuth>
                    <Assistant />
                  </RequireAuth>
                }
              />
              <Route
                path="/profile"
                element={<Profile />}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}