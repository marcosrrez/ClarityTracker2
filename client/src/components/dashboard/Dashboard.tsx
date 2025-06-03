import { useState, useEffect } from "react";
import { WelcomeSection } from "./WelcomeSection";
import { QuickStatsGrid } from "./QuickStatsGrid";
import { ProgressSection } from "./ProgressSection";
import { LogTableSection } from "./LogTableSection";
import { PersonalizedAICoaching } from "./PersonalizedAICoaching";
import { CompetencyTracker } from "./CompetencyTracker";
import { SmartInsightsCard } from "./SmartInsightsCard";
import { AIIntegrationTracker } from "./AIIntegrationTracker";
import { CrossSessionInsights } from "./CrossSessionInsights";
import { AchievementCelebration } from "./AchievementCelebration";
import { MilestoneCelebration } from "./MilestoneCelebration";
import { SupervisorDashboard } from "./SupervisorDashboard";
import { WelcomeOverlay } from "./WelcomeOverlay";
import { ErrorBoundary } from "./ErrorBoundary";
import { SupervisionMetrics } from "../insights/SupervisionMetrics";
import { useMilestoneDetection } from "@/hooks/use-milestone-detection";
import { useAppSettings } from "@/hooks/use-firestore";
import { useAccountType } from "@/hooks/use-account-type";
import { useLocation } from "wouter";

export const Dashboard = () => {
  const { showCelebration, celebrationData, closeCelebration } = useMilestoneDetection();
  const { settings } = useAppSettings();
  const { isSupervisor } = useAccountType();
  const [location, setLocation] = useLocation();
  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(false);

  // Get user preferences - use localStorage for immediate toggle without Firebase dependency
  const smartFeaturesEnabled = localStorage.getItem('smartFeaturesEnabled') !== 'false';

  // Check if we should show welcome overlay for returning users
  useEffect(() => {
    const lastWelcomeShown = localStorage.getItem('lastWelcomeShown');
    const today = new Date().toDateString();
    
    // Show welcome overlay if it hasn't been shown today
    if (lastWelcomeShown !== today && !isSupervisor) {
      setShowWelcomeOverlay(true);
    }
  }, [isSupervisor]);

  const handleStartLogging = () => {
    setShowWelcomeOverlay(false);
    localStorage.setItem('lastWelcomeShown', new Date().toDateString());
    setLocation('/add-entry');
  };

  const handleCloseWelcome = () => {
    setShowWelcomeOverlay(false);
    localStorage.setItem('lastWelcomeShown', new Date().toDateString());
  };

  // Show supervisor-specific dashboard for supervisors
  if (isSupervisor) {
    return <SupervisorDashboard />;
  }

  // Show welcome overlay for returning users
  if (showWelcomeOverlay) {
    return (
      <WelcomeOverlay 
        onStartLogging={handleStartLogging}
        onClose={handleCloseWelcome}
      />
    );
  }

  // Show regular dashboard for individual counselors
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="space-y-8 p-6 max-w-7xl mx-auto">
        {/* Milestone Celebration Modal - only if smart features are enabled */}
        {smartFeaturesEnabled && showCelebration && celebrationData && (
          <MilestoneCelebration
            open={showCelebration}
            onClose={closeCelebration}
            milestone={celebrationData}
          />
        )}

        {/* Welcome section - always shown */}
        <ErrorBoundary>
          <div className="backdrop-blur-sm">
            <WelcomeSection />
          </div>
        </ErrorBoundary>
      
        {/* Quick Stats - always shown */}
        <ErrorBoundary>
          <div>
            <QuickStatsGrid />
          </div>
        </ErrorBoundary>
        
        {/* Smart Features Section - only if enabled */}
        {smartFeaturesEnabled && (
          <div className="space-y-6">
            <ErrorBoundary>
              <AIIntegrationTracker />
            </ErrorBoundary>
            <ErrorBoundary>
              <SmartInsightsCard />
            </ErrorBoundary>
            <ErrorBoundary>
              <CrossSessionInsights />
            </ErrorBoundary>
            <ErrorBoundary>
              <PersonalizedAICoaching />
            </ErrorBoundary>
            <ErrorBoundary>
              <CompetencyTracker />
            </ErrorBoundary>
          </div>
        )}
        
        {/* Supervision tracking - always shown */}
        <ErrorBoundary>
          <div>
            <SupervisionMetrics />
          </div>
        </ErrorBoundary>
        
        {/* Progress tracking - always shown */}
        <ErrorBoundary>
          <div>
            <ProgressSection />
          </div>
        </ErrorBoundary>
        
        {/* Recent entries - always shown */}
        <ErrorBoundary>
          <div>
            <LogTableSection />
          </div>
        </ErrorBoundary>
      </div>
    </div>
  );
};
