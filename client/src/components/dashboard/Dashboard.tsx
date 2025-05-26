import { WelcomeSection } from "./WelcomeSection";
import { QuickStatsGrid } from "./QuickStatsGrid";
import { ProgressSection } from "./ProgressSection";
import { LogTableSection } from "./LogTableSection";
import { PersonalizedAICoaching } from "./PersonalizedAICoaching";
import { CompetencyTracker } from "./CompetencyTracker";
import { AchievementCelebration } from "./AchievementCelebration";

export const Dashboard = () => {
  return (
    <div className="space-y-8">
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
