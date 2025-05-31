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

// Pages
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
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/add-entry" component={AddEntryPage} />
      <Route path="/insights" component={InsightsPage} />
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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
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
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
