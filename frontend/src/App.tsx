import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, RequireAuth } from "@/context/AuthContext";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout";
import Landing from "@/pages/landing";
import AuthPage from "@/pages/auth";
import AuthSuccess from "@/pages/auth-success";
import ForgotPassword from "@/pages/forgot-password";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import Assessments from "@/pages/assessments";
import Resources from "@/pages/resources";
import Certificates from "@/pages/certificates";
import Profile from "@/pages/profile";
import Skills from "@/pages/skills";
import Information from "@/pages/information";
import EditInformation from "@/pages/edit-information";
import CareerReadiness from "@/pages/career-readiness";
import Roadmap from "@/pages/roadmap";
import CareerDiscovery from "@/pages/career-discovery";
import AICounselor from "@/pages/ai-counselor";
import SettingsPage from "@/pages/settings";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/auth/success" component={AuthSuccess} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/login" component={AuthPage} />
      <Route path="/signup" component={AuthPage} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route>
        <RequireAuth>
          <Layout>
            <Switch>
              <Route path="/home" component={Home} />
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/assessments" component={Assessments} />
              <Route path="/resources" component={Resources} />
              <Route path="/resources/certificates" component={Certificates} />
              <Route path="/profile" component={Profile} />
              <Route path="/profile/skills" component={Skills} />
              <Route path="/information" component={Information} />
              <Route path="/information/edit" component={EditInformation} />
              <Route path="/information/career-readiness" component={CareerReadiness} />

              <Route path="/career-discovery" component={CareerDiscovery} />
              <Route path="/ai-counselor" component={AICounselor} />
              <Route path="/roadmap" component={Roadmap} />
              <Route path="/settings" component={SettingsPage} />

              <Route component={NotFound} />
            </Switch>
          </Layout>
        </RequireAuth>
      </Route>
    </Switch>
  );
}

function App() {
  return (
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
  );
}

export default App;
