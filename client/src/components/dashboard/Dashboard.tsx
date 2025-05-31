import { useState, useEffect } from "react";
import { WelcomeSection } from "./WelcomeSection";
import { QuickStatsGrid } from "./QuickStatsGrid";
import { ProgressSection } from "./ProgressSection";
import { LogTableSection } from "./LogTableSection";
import { PersonalizedAICoaching } from "./PersonalizedAICoaching";
import { CompetencyTracker } from "./CompetencyTracker";
import { SmartInsightsCard } from "./SmartInsightsCard";
import { AchievementCelebration } from "./AchievementCelebration";
import { MilestoneCelebration } from "./MilestoneCelebration";
import { SupervisorDashboard } from "./SupervisorDashboard";
import { WelcomeOverlay } from "./WelcomeOverlay";
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
        <div className="backdrop-blur-sm">
          <WelcomeSection />
        </div>
      
        {/* Quick Stats - always shown */}
        <div>
          <QuickStatsGrid />
        </div>
        
        {/* Smart Features Section - only if enabled */}
        {smartFeaturesEnabled && (
          <div className="space-y-6">
            <SmartInsightsCard />
            <PersonalizedAICoaching />
            <CompetencyTracker />
          </div>
        )}
        
        {/* Progress tracking - always shown */}
        <div>
          <ProgressSection />
        </div>
        
        {/* Recent entries - always shown */}
        <div>
          <LogTableSection />
        </div>
      </div>
    </div>
  );
};
