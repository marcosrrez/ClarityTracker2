import { WelcomeSection } from "./WelcomeSection";
import { QuickStatsGrid } from "./QuickStatsGrid";
import { ProgressSection } from "./ProgressSection";
import { LogTableSection } from "./LogTableSection";
import { PersonalizedAICoaching } from "./PersonalizedAICoaching";
import { CompetencyTracker } from "./CompetencyTracker";
import { AchievementCelebration } from "./AchievementCelebration";
import { MilestoneCelebration } from "./MilestoneCelebration";
import { useMilestoneDetection } from "@/hooks/use-milestone-detection";

export const Dashboard = () => {
  const { showCelebration, celebrationData, closeCelebration } = useMilestoneDetection();

  return (
    <div className="space-y-8">
      {/* Milestone Celebration Modal */}
      {showCelebration && celebrationData && (
        <MilestoneCelebration
          open={showCelebration}
          onClose={closeCelebration}
          milestone={celebrationData}
        />
      )}

      {/* Welcome section with integrated stats */}
      <div>
        <WelcomeSection />
      </div>
      
      {/* Collapsible coaching and insights */}
      <div className="space-y-6">
        <PersonalizedAICoaching />
        <CompetencyTracker />
      </div>
      
      {/* Progress tracking */}
      <div>
        <ProgressSection />
      </div>
      
      {/* Recent entries */}
      <div>
        <LogTableSection />
      </div>
    </div>
  );
};
