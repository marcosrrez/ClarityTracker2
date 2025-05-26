import { WelcomeSection } from "./WelcomeSection";
import { QuickStatsGrid } from "./QuickStatsGrid";
import { ProgressSection } from "./ProgressSection";
import { LogTableSection } from "./LogTableSection";

export const Dashboard = () => {
  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <WelcomeSection />
      <QuickStatsGrid />
      <ProgressSection />
      <LogTableSection />
    </div>
  );
};
