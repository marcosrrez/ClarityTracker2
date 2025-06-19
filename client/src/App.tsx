import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { OnboardingTrigger } from "@/components/onboarding/OnboardingTrigger";
import { AppLayout } from "@/components/layout/AppLayout";
import { V2Layout } from "@/components/layout/V2Layout";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// V1 Pages
import AuthPage from "@/pages/auth";
import { SuperhumanLandingPage } from "@/components/SuperhumanLandingPage";
import DashboardPage from "@/pages/dashboard";
import AddEntryPage from "@/pages/add-entry";
import InsightsPage from "@/pages/insights";
import GalleryPage from "@/pages/gallery";
import AiAnalysisPage from "@/pages/ai-analysis";
import RequirementsPage from "@/pages/requirements";
import SettingsPage from "@/pages/settings";
import FeedbackPage from "@/pages/feedback";
import AdminPage from "@/pages/admin";
import HelpPage from "@/pages/help";
import SummaryPage from "@/pages/summary";
import QuickEntryPage from "@/pages/quick-entry";
import SuperviseesWorkingPage from "@/pages/supervisees-working";
import CompliancePage from "@/pages/compliance";
import SuperviseeProfilePage from "@/pages/supervisee-profile";
import ReportsPage from "@/pages/reports";
import AccountSetupPage from "@/pages/account-setup";
import SpacedRepetition from "@/pages/SpacedRepetition";
import AIInsights from "@/pages/AIInsights";
import IntelligenceHub from "@/pages/IntelligenceHub";
import AICoachPage from "@/pages/AICoachPage";
import AICoach from "@/pages/AICoach";
import EnhancedDashboardPage from "@/pages/EnhancedDashboardPage";
import { SupervisorsPage } from "@/pages/SupervisorsPage";
import ResearchLibrary from "@/pages/ResearchLibrary";
import TestSessionIntelligence from "@/pages/TestSessionIntelligence";
import SessionRecording from "@/pages/SessionRecording";
import SupervisorAnalytics from "@/pages/SupervisorAnalytics";
import ClientPortal from "@/pages/ClientPortal";
import ClientDashboard from "@/pages/ClientDashboard";
import ClientOnboarding from "@/pages/ClientOnboarding";
import ClientSignup from "@/pages/ClientSignup";
import ClientLogin from "@/pages/ClientLogin";
import ClientOnboardingFlow from "@/pages/ClientOnboardingFlow";
import SessionIntelligenceDemo from "@/pages/SessionIntelligenceDemo";
import SessionIntelligenceNew from "@/pages/SessionIntelligenceNew";
import EnhancedSessionRecording from "@/pages/EnhancedSessionRecording";
import PrivacySettings from "@/pages/PrivacySettings";

import NotFound from "@/pages/not-found";



function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      

      
      {/* V1 Legacy Pages */}
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/add-entry" component={AddEntryPage} />
      <Route path="/insights">
        <InsightsPage />
      </Route>
      <Route path="/gallery" component={GalleryPage} />
      <Route path="/ai-analysis" component={AiAnalysisPage} />
      <Route path="/requirements" component={RequirementsPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/feedback" component={FeedbackPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/help" component={HelpPage} />
      <Route path="/summary" component={SummaryPage} />
      <Route path="/quick-entry" component={QuickEntryPage} />
      <Route path="/supervisees" component={SuperviseesWorkingPage} />
      <Route path="/compliance" component={CompliancePage} />
      <Route path="/supervisee/:id" component={SuperviseeProfilePage} />
      <Route path="/reports" component={ReportsPage} />
      <Route path="/spaced-repetition" component={SpacedRepetition} />
      <Route path="/ai-insights" component={AIInsights} />
      <Route path="/intelligence-hub" component={IntelligenceHub} />
      <Route path="/ai-coach" component={AICoachPage} />
      <Route path="/ai-coach-dynamic" component={AICoach} />
      <Route path="/enhanced-dashboard" component={EnhancedDashboardPage} />
      <Route path="/supervisors" component={SupervisorsPage} />
      <Route path="/research-library" component={ResearchLibrary} />
      <Route path="/test-session-intelligence" component={TestSessionIntelligence} />
      <Route path="/session-recording" component={SessionRecording} />
      <Route path="/supervisor-analytics" component={SupervisorAnalytics} />
      <Route path="/client-signup" component={ClientSignup} />
      <Route path="/client-login" component={ClientLogin} />
      <Route path="/client-onboarding-flow" component={ClientOnboardingFlow} />
      <Route path="/client-portal" component={() => <ClientPortal userId="demo-user" />} />
      <Route path="/client-onboarding/:inviteToken" component={ClientOnboarding} />
      <Route path="/client-dashboard" component={ClientDashboard} />
      <Route path="/session-intelligence-demo" component={SessionIntelligenceDemo} />
      <Route path="/session-intelligence" component={SessionIntelligenceNew} />
      <Route path="/session-intelligence-new" component={SessionIntelligenceNew} />
      <Route path="/enhanced-session-recording" component={EnhancedSessionRecording} />
      <Route path="/privacy-settings" component={PrivacySettings} />
      <Route path="/account-setup">
        <AuthGuard requireAccountSetup={false}>
          <AccountSetupPage />
        </AuthGuard>
      </Route>
      
      {/* Default route - redirect to dashboard */}
      <Route path="/" component={DashboardPage} />
      
      {/* 404 fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ErrorBoundary fallback={
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
              <div className="text-white text-center">
                <h1 className="text-2xl font-bold mb-4">ClarityLog</h1>
                <p className="mb-4">Loading your mental health platform...</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="bg-white text-purple-900 px-4 py-2 rounded"
                >
                  Refresh
                </button>
              </div>
            </div>
          }>
            <AuthProvider>
              <TooltipProvider>
                <AuthGuard fallback={
                  <div className="min-h-screen">
                    <SuperhumanLandingPage />
                  </div>
                }>
                  <AppLayout>
                    <Router />
                  </AppLayout>
                  <OnboardingTrigger />
                </AuthGuard>
                <Toaster />
              </TooltipProvider>
            </AuthProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
