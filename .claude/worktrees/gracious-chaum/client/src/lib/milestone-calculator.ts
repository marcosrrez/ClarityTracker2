import { AppSettings } from "@shared/schema";

// State-specific licensing phases
export const LICENSING_PHASES = {
  default: [
    { hours: 100, name: "Foundation Phase", description: "Building basic clinical skills" },
    { hours: 250, name: "Development Phase", description: "Expanding therapeutic competencies" },
    { hours: 500, name: "Proficiency Phase", description: "Demonstrating clinical confidence" },
    { hours: 750, name: "Competency Phase", description: "Advanced practice skills" },
    { hours: 1000, name: "Mastery Phase", description: "Independent clinical practice" },
    { hours: 1500, name: "Specialization Phase", description: "Focused expertise development" },
    { hours: 2000, name: "Licensure Phase", description: "Ready for independent practice" }
  ]
};

export interface MilestoneInfo {
  currentMilestone: {
    target: number;
    name: string;
    description: string;
    progress: number;
    remaining: number;
  };
  nextMilestone: {
    target: number;
    name: string;
    description: string;
  } | null;
  totalProgress: {
    percentage: number;
    remaining: number;
  };
  phaseInfo: {
    current: number;
    total: number;
  };
}

export interface TimeToCompletion {
  milestone: {
    weeks: number;
    realistic: boolean;
  };
  total: {
    weeks: number;
    realistic: boolean;
  };
}

export function calculateCurrentMilestone(
  currentHours: number, 
  settings?: AppSettings | null
): MilestoneInfo {
  const totalGoal = settings?.goals?.totalCCH || 2000;
  const phases = LICENSING_PHASES.default;
  
  // Find current milestone
  let currentMilestone = phases[0];
  let nextMilestone = phases[1] || null;
  let phaseIndex = 0;
  
  for (let i = 0; i < phases.length; i++) {
    if (currentHours < phases[i].hours) {
      currentMilestone = phases[i];
      nextMilestone = phases[i + 1] || null;
      phaseIndex = i;
      break;
    } else if (i === phases.length - 1) {
      // If we've passed all predefined milestones, handle end cases
      const remaining = totalGoal - currentHours;
      if (remaining > 0 && totalGoal > phases[phases.length - 1].hours) {
        // Create custom milestone for goals beyond predefined phases
        currentMilestone = {
          hours: totalGoal,
          name: "Final Sprint",
          description: "Completing your licensure goal"
        };
        nextMilestone = null;
        phaseIndex = phases.length;
      } else {
        // Use the last phase or goal complete
        currentMilestone = remaining > 0 ? phases[phases.length - 1] : {
          hours: totalGoal,
          name: "Goal Complete",
          description: "Licensure requirements fulfilled"
        };
        nextMilestone = null;
        phaseIndex = phases.length - (remaining > 0 ? 1 : 0);
      }
    }
  }
  
  const progress = Math.min(currentHours, currentMilestone.hours);
  const remaining = Math.max(0, currentMilestone.hours - currentHours);
  
  return {
    currentMilestone: {
      target: currentMilestone.hours,
      name: currentMilestone.name,
      description: currentMilestone.description,
      progress: progress,
      remaining: remaining
    },
    nextMilestone: nextMilestone ? {
      target: nextMilestone.hours,
      name: nextMilestone.name,
      description: nextMilestone.description
    } : null,
    totalProgress: {
      percentage: Math.min((currentHours / totalGoal) * 100, 100),
      remaining: Math.max(0, totalGoal - currentHours)
    },
    phaseInfo: {
      current: phaseIndex + 1,
      total: Math.ceil(totalGoal / 100) // Approximate total phases based on goal
    }
  };
}

export function calculateTimeToCompletion(
  currentHours: number,
  weeklyHours: number,
  settings?: AppSettings | null
): TimeToCompletion {
  const milestone = calculateCurrentMilestone(currentHours, settings);
  const totalGoal = settings?.goals?.totalCCH || 2000;
  
  // Ensure we have valid weekly hours (minimum 0.1 to avoid division by zero)
  const safeWeeklyHours = Math.max(0.1, weeklyHours);
  
  const milestoneWeeks = Math.ceil(milestone.currentMilestone.remaining / safeWeeklyHours);
  const totalWeeks = Math.ceil(milestone.totalProgress.remaining / safeWeeklyHours);
  
  // Consider projections "realistic" if they're based on reasonable weekly hours and timeframes
  const milestoneRealistic = weeklyHours >= 1 && milestoneWeeks <= 52; // Within a year
  const totalRealistic = weeklyHours >= 5 && totalWeeks <= 208; // Within 4 years
  
  return {
    milestone: {
      weeks: milestoneWeeks,
      realistic: milestoneRealistic
    },
    total: {
      weeks: totalWeeks,
      realistic: totalRealistic
    }
  };
}

export function getCustomMilestoneIntervals(settings?: AppSettings | null): number[] {
  const totalGoal = settings?.goals?.totalCCH || 2000;
  
  // Generate milestone intervals based on total goal
  if (totalGoal <= 500) {
    return [50, 100, 250, 500];
  } else if (totalGoal <= 1000) {
    return [100, 250, 500, 750, 1000];
  } else if (totalGoal <= 2000) {
    return [100, 250, 500, 750, 1000, 1500, 2000];
  } else {
    // For larger goals, create more intervals
    const intervals = [];
    let current = 100;
    while (current < totalGoal) {
      intervals.push(current);
      if (current < 1000) {
        current += 250;
      } else {
        current += 500;
      }
    }
    intervals.push(totalGoal);
    return intervals;
  }
}