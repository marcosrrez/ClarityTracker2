import { WelcomeSection } from "./WelcomeSection";
import { QuickStatsGrid } from "./QuickStatsGrid";
import { ProgressSection } from "./ProgressSection";
import { LogTableSection } from "./LogTableSection";
import { PersonalizedAICoaching } from "./PersonalizedAICoaching";
import { CompetencyTracker } from "./CompetencyTracker";
import { AchievementCelebration } from "./AchievementCelebration";

export const Dashboard = () => {
  return (
    <div className="ive-spacing-lg">
      <div className="ive-fade-in">
        <WelcomeSection />
      </div>
      
      <div className="ive-fade-in">
        <QuickStatsGrid />
      </div>
      
      <div className="ive-fade-in">
        <AchievementCelebration />
      </div>
      
      {/* Jony Ive: Seamless integration of AI components */}
      <div className="ive-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <PersonalizedAICoaching />
          <CompetencyTracker />
        </div>
      </div>
      
      <div className="ive-fade-in">
        <ProgressSection />
      </div>
      
      <div className="ive-fade-in">
        <LogTableSection />
      </div>
    </div>
  );
};
