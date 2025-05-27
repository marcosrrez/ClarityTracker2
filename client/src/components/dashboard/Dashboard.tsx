import { WelcomeSection } from "./WelcomeSection";
import { QuickStatsGrid } from "./QuickStatsGrid";
import { ProgressSection } from "./ProgressSection";
import { LogTableSection } from "./LogTableSection";
import { PersonalizedAICoaching } from "./PersonalizedAICoaching";
import { CompetencyTracker } from "./CompetencyTracker";
import { AchievementCelebration } from "./AchievementCelebration";
import { MilestoneCelebration } from "./MilestoneCelebration";
import { useMilestoneDetection } from "@/hooks/use-milestone-detection";
import { useAppSettings } from "@/hooks/use-firestore";

export const Dashboard = () => {
  const { showCelebration, celebrationData, closeCelebration } = useMilestoneDetection();
  const { settings } = useAppSettings();

  // Get user preferences - simplified Smart Features toggle
  const smartFeaturesEnabled = settings?.interfacePreferences?.smartFeaturesEnabled ?? true;

  // Simple logic: if Smart Features is disabled, only show core tracking components
  const shouldShowSmartFeature = (featureName: string) => {
    if (!smartFeaturesEnabled) {
      return false; // Hide all smart features when toggle is off
    }
    return true; // Show all smart features when toggle is on
  };

  return (
    <div className="space-y-8">
      {/* Milestone Celebration Modal - only if smart features are enabled */}
      {smartFeaturesEnabled && showCelebration && celebrationData && (
        <MilestoneCelebration
          open={showCelebration}
          onClose={closeCelebration}
          milestone={celebrationData}
        />
      )}

      {/* Welcome section - always shown */}
      <div>
        <WelcomeSection />
      </div>
      
      {/* Quick Stats - always shown */}
      <div>
        <QuickStatsGrid />
      </div>
      
      {/* Smart Features Section - only if enabled */}
      {smartFeaturesEnabled && (
        <div className="space-y-6">
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
  );
};
