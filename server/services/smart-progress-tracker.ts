import { db } from '../db';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import type { LogEntry, StateRequirements, UserProfile } from '../../shared/schema';

interface ProgressMetrics {
  totalCCH: number;
  directCCH: number;
  supervisionHours: number;
  ethicsHours: number;
  progressPercentage: number;
  remainingHours: {
    total: number;
    direct: number;
    supervision: number;
    ethics: number;
  };
  projectedCompletion: Date | null;
  weeklyAverage: number;
  isOnTrack: boolean;
}

interface MilestoneAlert {
  type: 'milestone' | 'warning' | 'celebration';
  title: string;
  message: string;
  percentage: number;
  actionRequired?: string;
}

export class SmartProgressTracker {
  
  /**
   * Calculate comprehensive progress metrics for a user
   */
  static async calculateProgress(userId: string, userProfile: UserProfile): Promise<ProgressMetrics> {
    // Get state requirements
    const stateReqs = await this.getStateRequirements(userProfile.stateRegion, 'LPC');
    
    // Get all log entries for the user
    const entries = await this.getUserLogEntries(userId);
    
    // Calculate current totals
    const totals = this.calculateCurrentTotals(entries);
    
    // Calculate weekly average
    const weeklyAverage = this.calculateWeeklyAverage(entries);
    
    // Calculate projected completion
    const projectedCompletion = this.calculateProjectedCompletion(
      totals, stateReqs, weeklyAverage, userProfile.licensureGoalDate
    );
    
    // Calculate progress percentage (weighted)
    const progressPercentage = this.calculateOverallProgress(totals, stateReqs);
    
    return {
      totalCCH: totals.totalCCH,
      directCCH: totals.directCCH,
      supervisionHours: totals.supervisionHours,
      ethicsHours: totals.ethicsHours,
      progressPercentage,
      remainingHours: {
        total: Math.max(0, stateReqs.totalCCH - totals.totalCCH),
        direct: Math.max(0, stateReqs.directCCH - totals.directCCH),
        supervision: Math.max(0, stateReqs.supervisionHours - totals.supervisionHours),
        ethics: Math.max(0, stateReqs.ethicsHours - totals.ethicsHours),
      },
      projectedCompletion,
      weeklyAverage,
      isOnTrack: this.isOnTrack(projectedCompletion, userProfile.licensureGoalDate),
    };
  }

  /**
   * Generate milestone alerts and notifications
   */
  static async checkMilestones(userId: string, userProfile: UserProfile): Promise<MilestoneAlert[]> {
    const progress = await this.calculateProgress(userId, userProfile);
    const alerts: MilestoneAlert[] = [];

    // Check major milestones
    const milestones = [25, 50, 75, 90, 95];
    for (const milestone of milestones) {
      if (this.justReachedMilestone(progress.progressPercentage, milestone)) {
        alerts.push({
          type: 'celebration',
          title: `${milestone}% Complete!`,
          message: `Congratulations! You've reached ${milestone}% of your licensure requirements.`,
          percentage: milestone,
        });
      }
    }

    // Check if behind schedule
    if (!progress.isOnTrack && userProfile.licensureGoalDate) {
      const daysRemaining = Math.ceil(
        (userProfile.licensureGoalDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      
      alerts.push({
        type: 'warning',
        title: 'Schedule Alert',
        message: `You're ${daysRemaining} days from your goal date. Consider increasing your weekly hours to stay on track.`,
        percentage: progress.progressPercentage,
        actionRequired: 'Increase weekly session hours or extend goal date',
      });
    }

    // Check supervision ratio compliance
    if (progress.totalCCH > 0) {
      const supervisionRatio = progress.supervisionHours / progress.totalCCH;
      const requiredRatio = 1 / 20; // Typical 1:20 ratio
      
      if (supervisionRatio < requiredRatio * 0.8) {
        alerts.push({
          type: 'warning',
          title: 'Supervision Hours Low',
          message: 'Your supervision hours may be falling behind the required ratio. Schedule additional supervision sessions.',
          percentage: (supervisionRatio / requiredRatio) * 100,
          actionRequired: 'Schedule supervision sessions',
        });
      }
    }

    return alerts;
  }

  /**
   * Get state-specific licensure requirements
   */
  private static async getStateRequirements(state: string, licenseType: string): Promise<StateRequirements> {
    // Default requirements - would be populated from database
    return {
      id: 'default',
      state,
      licenseType,
      totalCCH: 4000,
      directCCH: 3000,
      supervisionHours: 200,
      ethicsHours: 40,
      groupSupervisionRatio: 2,
      maxGroupParticipants: 6,
      renewalCEHours: 40,
      renewalPeriodMonths: 24,
      specialRequirements: [],
      lastUpdated: new Date(),
    };
  }

  /**
   * Fetch user's log entries from database
   */
  private static async getUserLogEntries(userId: string): Promise<LogEntry[]> {
    // This would fetch from the actual database
    // For now, return empty array - will be implemented with real storage
    return [];
  }

  /**
   * Calculate current hour totals from log entries
   */
  private static calculateCurrentTotals(entries: LogEntry[]) {
    return entries.reduce((totals, entry) => {
      const directHours = entry.indirectHours ? 0 : entry.clientContactHours;
      const totalHours = entry.clientContactHours;
      
      return {
        totalCCH: totals.totalCCH + totalHours,
        directCCH: totals.directCCH + directHours,
        supervisionHours: totals.supervisionHours + entry.supervisionHours,
        ethicsHours: totals.ethicsHours + (entry.professionalDevelopmentType === 'ethics' ? entry.professionalDevelopmentHours : 0),
      };
    }, { totalCCH: 0, directCCH: 0, supervisionHours: 0, ethicsHours: 0 });
  }

  /**
   * Calculate weekly average hours
   */
  private static calculateWeeklyAverage(entries: LogEntry[]): number {
    if (entries.length === 0) return 0;

    const now = new Date();
    const twelveWeeksAgo = new Date(now.getTime() - (12 * 7 * 24 * 60 * 60 * 1000));
    
    const recentEntries = entries.filter(entry => 
      entry.dateOfContact >= twelveWeeksAgo
    );

    if (recentEntries.length === 0) return 0;

    const totalHours = recentEntries.reduce((sum, entry) => sum + entry.clientContactHours, 0);
    const weeksSpanned = Math.max(1, 
      (now.getTime() - recentEntries[recentEntries.length - 1].dateOfContact.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );

    return totalHours / weeksSpanned;
  }

  /**
   * Calculate projected completion date
   */
  private static calculateProjectedCompletion(
    totals: any, 
    requirements: StateRequirements, 
    weeklyAverage: number,
    goalDate?: Date
  ): Date | null {
    if (weeklyAverage <= 0) return null;

    const remainingHours = Math.max(
      requirements.totalCCH - totals.totalCCH,
      requirements.directCCH - totals.directCCH,
      (requirements.supervisionHours - totals.supervisionHours) * 20 // Assuming 20:1 ratio
    );

    if (remainingHours <= 0) return new Date(); // Already complete

    const weeksToComplete = remainingHours / weeklyAverage;
    const projectedDate = new Date();
    projectedDate.setDate(projectedDate.getDate() + (weeksToComplete * 7));

    return projectedDate;
  }

  /**
   * Calculate overall progress percentage
   */
  private static calculateOverallProgress(totals: any, requirements: StateRequirements): number {
    const weights = { total: 0.4, direct: 0.3, supervision: 0.2, ethics: 0.1 };
    
    const percentages = {
      total: Math.min(1, totals.totalCCH / requirements.totalCCH),
      direct: Math.min(1, totals.directCCH / requirements.directCCH),
      supervision: Math.min(1, totals.supervisionHours / requirements.supervisionHours),
      ethics: Math.min(1, totals.ethicsHours / requirements.ethicsHours),
    };

    return Math.round(
      (percentages.total * weights.total +
       percentages.direct * weights.direct +
       percentages.supervision * weights.supervision +
       percentages.ethics * weights.ethics) * 100
    );
  }

  /**
   * Check if user is on track for goal date
   */
  private static isOnTrack(projectedDate: Date | null, goalDate?: Date): boolean {
    if (!projectedDate || !goalDate) return true;
    return projectedDate <= goalDate;
  }

  /**
   * Check if user just reached a milestone
   */
  private static justReachedMilestone(currentPercentage: number, milestone: number): boolean {
    // This would check against stored previous percentage
    // For now, return false - would be implemented with user milestone tracking
    return false;
  }

  /**
   * Generate personalized recommendations based on progress
   */
  static async generateRecommendations(userId: string, userProfile: UserProfile): Promise<string[]> {
    const progress = await this.calculateProgress(userId, userProfile);
    const recommendations: string[] = [];

    // Pace recommendations
    if (progress.weeklyAverage < 10) {
      recommendations.push('Consider increasing your weekly client contact hours to maintain steady progress toward licensure.');
    }

    // Supervision recommendations
    const supervisionRatio = progress.supervisionHours / Math.max(1, progress.totalCCH);
    if (supervisionRatio < 0.04) { // Less than 1:25 ratio
      recommendations.push('Schedule additional supervision sessions to maintain compliance with supervision requirements.');
    }

    // Ethics recommendations
    if (progress.ethicsHours < progress.progressPercentage * 0.4) { // Ethics should track with overall progress
      recommendations.push('Consider completing ethics training to stay on track with professional development requirements.');
    }

    return recommendations;
  }
}