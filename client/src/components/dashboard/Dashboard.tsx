import { WelcomeSection } from "./WelcomeSection";
import { QuickStatsGrid } from "./QuickStatsGrid";
import { ProgressSection } from "./ProgressSection";
import { LogTableSection } from "./LogTableSection";
import { PersonalizedAICoaching } from "./PersonalizedAICoaching";
import { CompetencyTracker } from "./CompetencyTracker";
import { AchievementCelebration } from "./AchievementCelebration";

export const Dashboard = () => {
  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <WelcomeSection />
      <QuickStatsGrid />
      
      <AchievementCelebration />
      
      {/* AI-Powered Personalization Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PersonalizedAICoaching />
        <CompetencyTracker />
      </div>
      
      <ProgressSection />
      <LogTableSection />
    </div>
  );
};
