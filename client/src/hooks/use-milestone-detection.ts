import { useState, useEffect } from "react";
import { useLogEntries, useAppSettings } from "./use-firestore";
import { generateMilestoneMessage } from "@/components/dashboard/MilestoneCelebration";

interface MilestoneData {
  type: 'hours' | 'supervision' | 'goal_completion' | 'streak';
  value: number;
  total?: number;
  title: string;
  description: string;
  nextGoal?: string;
  cognitiveMessage: string;
  achievements: string[];
}

export const useMilestoneDetection = () => {
  const { entries } = useLogEntries();
  const { settings } = useAppSettings();
  const [celebrationData, setCelebrationData] = useState<MilestoneData | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Calculate current totals
  const totals = entries?.reduce((acc, entry) => {
    acc.totalHours += entry.clientContactHours + (typeof entry.indirectHours === 'number' ? entry.indirectHours : 0);
    acc.directHours += entry.clientContactHours;
    acc.supervisionHours += (typeof entry.supervisionHours === 'number' ? entry.supervisionHours : 0);
    return acc;
  }, { totalHours: 0, directHours: 0, supervisionHours: 0 }) || { totalHours: 0, directHours: 0, supervisionHours: 0 };

  // Check for milestone achievements
  useEffect(() => {
    if (!entries || entries.length === 0) return;

    const checkMilestones = () => {
      const milestoneThresholds = [25, 50, 100, 250, 500, 750, 1000, 1250, 1500, 2000];
      const supervisionThresholds = [10, 25, 50, 75, 100, 150, 200];

      // Check for CCH milestones
      for (const threshold of milestoneThresholds) {
        const key = `milestone_cch_${threshold}`;
        const hasSeenMilestone = localStorage.getItem(key);
        
        if (totals.totalHours >= threshold && !hasSeenMilestone) {
          localStorage.setItem(key, 'true');
          
          const nextThreshold = milestoneThresholds.find(t => t > threshold);
          const goalTotal = settings?.goals?.totalCCH || 2000;
          
          setCelebrationData({
            type: 'hours',
            value: totals.totalHours,
            total: goalTotal,
            title: `${threshold} Clinical Hours Complete!`,
            description: `You've successfully logged ${threshold} client contact hours toward your licensure goal.`,
            nextGoal: nextThreshold ? `Next milestone: ${nextThreshold} hours` : 'Continue building your clinical expertise!',
            cognitiveMessage: generateMilestoneMessage('hours', threshold),
            achievements: [
              `Demonstrated consistency in clinical practice documentation`,
              `Built professional habits that will serve your entire career`,
              `Maintained detailed records for licensure requirements`,
              threshold >= 100 ? `Proven commitment to professional excellence` : `Established foundation for clinical growth`,
              threshold >= 500 ? `Reached significant progress toward licensure` : `Created momentum for continued success`
            ].filter(Boolean)
          });
          
          setShowCelebration(true);
          return;
        }
      }

      // Check for supervision milestones
      for (const threshold of supervisionThresholds) {
        const key = `milestone_supervision_${threshold}`;
        const hasSeenMilestone = localStorage.getItem(key);
        
        if (totals.supervisionHours >= threshold && !hasSeenMilestone) {
          localStorage.setItem(key, 'true');
          
          const nextThreshold = supervisionThresholds.find(t => t > threshold);
          const goalTotal = settings?.goals?.supervisionHours || 200;
          
          setCelebrationData({
            type: 'supervision',
            value: totals.supervisionHours,
            total: goalTotal,
            title: `${threshold} Supervision Hours Complete!`,
            description: `You've completed ${threshold} hours of professional supervision - a key component of your development.`,
            nextGoal: nextThreshold ? `Next milestone: ${nextThreshold} supervision hours` : 'Continue growing through mentorship!',
            cognitiveMessage: generateMilestoneMessage('supervision', threshold),
            achievements: [
              `Actively engaged in professional mentorship`,
              `Demonstrated commitment to guided learning`,
              `Built relationships that enhance clinical skills`,
              `Invested in reflective practice and growth`,
              threshold >= 50 ? `Shown dedication to professional excellence` : `Established foundation for clinical development`
            ].filter(Boolean)
          });
          
          setShowCelebration(true);
          return;
        }
      }

      // Check for goal completion milestones
      if (settings?.goals) {
        const progressPercent = (totals.totalHours / settings.goals.totalCCH) * 100;
        const milestonePercents = [25, 50, 75, 90];
        
        for (const percent of milestonePercents) {
          const key = `milestone_goal_${percent}`;
          const hasSeenMilestone = localStorage.getItem(key);
          
          if (progressPercent >= percent && !hasSeenMilestone) {
            localStorage.setItem(key, 'true');
            
            setCelebrationData({
              type: 'goal_completion',
              value: totals.totalHours,
              total: settings.goals.totalCCH,
              title: `${percent}% of Your Goal Complete!`,
              description: `You're ${percent}% of the way to your ${settings.goals.totalCCH} hour licensure goal!`,
              nextGoal: percent < 90 ? `Keep going toward ${percent + 25}% completion` : 'You\'re so close to your goal!',
              cognitiveMessage: `Goal psychology research shows that people who acknowledge progress at ${percent}% completion are significantly more likely to reach their ultimate goals. Your systematic approach to licensure is exemplary!`,
              achievements: [
                `Maintained consistent progress toward licensure`,
                `Demonstrated long-term commitment to professional goals`,
                `Built sustainable habits for clinical practice`,
                `Proven ability to track and manage professional development`,
                percent >= 75 ? `Approaching mastery of licensure requirements` : `Established strong foundation for continued growth`
              ].filter(Boolean)
            });
            
            setShowCelebration(true);
            return;
          }
        }
      }
    };

    checkMilestones();
  }, [entries, totals.totalHours, totals.supervisionHours, settings]);

  const closeCelebration = () => {
    setShowCelebration(false);
    setCelebrationData(null);
  };

  return {
    showCelebration,
    celebrationData,
    closeCelebration,
    totals
  };
};