import type { PredictiveMilestones, LogEntry, UserProfile } from '../../shared/schema';
import { StateRequirementsEngine } from './state-requirements-engine';

interface ProjectionData {
  currentProgress: number;
  projectedDate: Date | null;
  confidence: number;
  bottlenecks: string[];
  recommendations: string[];
}

interface TrendAnalysis {
  trend: 'accelerating' | 'steady' | 'declining' | 'stagnant';
  weeklyAverage: number;
  monthlyAverage: number;
  variance: number;
  seasonality: Record<string, number>;
}

export class PredictiveMilestoneService {
  
  /**
   * Calculate predictive milestones for a user
   */
  static async calculateMilestones(
    userId: string,
    userProfile: UserProfile,
    logEntries: LogEntry[]
  ): Promise<PredictiveMilestones[]> {
    const requirements = StateRequirementsEngine.getRequirements(
      userProfile.stateRegion, 
      'LPC' // Default license type
    );
    
    if (!requirements) {
      return [];
    }

    const milestones: PredictiveMilestones[] = [];
    
    // Calculate different milestone types
    milestones.push(
      await this.calculateCCHMilestone(userId, logEntries, requirements),
      await this.calculateSupervisionMilestone(userId, logEntries, requirements),
      await this.calculateEthicsMilestone(userId, logEntries, requirements)
    );

    return milestones.filter(m => m !== null) as PredictiveMilestones[];
  }

  /**
   * Calculate CCH completion milestone
   */
  private static async calculateCCHMilestone(
    userId: string,
    logEntries: LogEntry[],
    requirements: any
  ): Promise<PredictiveMilestones> {
    const currentHours = this.calculateCurrentHours(logEntries);
    const trendAnalysis = this.analyzeTrends(logEntries);
    
    const progress = currentHours.total / requirements.totalCCH;
    const projectionData = this.projectCompletion(
      currentHours.total,
      requirements.totalCCH,
      trendAnalysis
    );

    return {
      id: crypto.randomUUID(),
      userId,
      milestoneType: 'cch_completion',
      currentProgress: Math.min(1, progress),
      projectedCompletionDate: projectionData.projectedDate,
      confidenceLevel: projectionData.confidence,
      identifiedBottlenecks: projectionData.bottlenecks,
      suggestedActions: projectionData.recommendations,
      lastCalculated: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Calculate supervision hours milestone
   */
  private static async calculateSupervisionMilestone(
    userId: string,
    logEntries: LogEntry[],
    requirements: any
  ): Promise<PredictiveMilestones> {
    const currentHours = this.calculateCurrentHours(logEntries);
    const supervisionTrend = this.analyzeSupervisionTrend(logEntries);
    
    const progress = currentHours.supervision / requirements.supervisionHours;
    const projectionData = this.projectSupervisionCompletion(
      currentHours,
      requirements,
      supervisionTrend
    );

    return {
      id: crypto.randomUUID(),
      userId,
      milestoneType: 'supervision_completion',
      currentProgress: Math.min(1, progress),
      projectedCompletionDate: projectionData.projectedDate,
      confidenceLevel: projectionData.confidence,
      identifiedBottlenecks: projectionData.bottlenecks,
      suggestedActions: projectionData.recommendations,
      lastCalculated: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Calculate ethics training milestone
   */
  private static async calculateEthicsMilestone(
    userId: string,
    logEntries: LogEntry[],
    requirements: any
  ): Promise<PredictiveMilestones> {
    const currentHours = this.calculateCurrentHours(logEntries);
    const progress = currentHours.ethics / requirements.ethicsHours;
    
    const projectionData: ProjectionData = {
      currentProgress: progress,
      projectedDate: this.calculateEthicsProjection(currentHours.ethics, requirements.ethicsHours),
      confidence: progress > 0.8 ? 0.9 : 0.6,
      bottlenecks: progress < 0.5 ? ['Ethics training behind schedule'] : [],
      recommendations: progress < 0.8 ? ['Schedule ethics training sessions'] : []
    };

    return {
      id: crypto.randomUUID(),
      userId,
      milestoneType: 'ethics_completion',
      currentProgress: Math.min(1, progress),
      projectedCompletionDate: projectionData.projectedDate,
      confidenceLevel: projectionData.confidence,
      identifiedBottlenecks: projectionData.bottlenecks,
      suggestedActions: projectionData.recommendations,
      lastCalculated: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Calculate current hours from log entries
   */
  private static calculateCurrentHours(logEntries: LogEntry[]) {
    return logEntries.reduce((totals, entry) => {
      return {
        total: totals.total + entry.clientContactHours,
        direct: totals.direct + (entry.indirectHours ? 0 : entry.clientContactHours),
        supervision: totals.supervision + entry.supervisionHours,
        ethics: totals.ethics + (entry.professionalDevelopmentType === 'ethics' ? entry.professionalDevelopmentHours : 0),
      };
    }, { total: 0, direct: 0, supervision: 0, ethics: 0 });
  }

  /**
   * Analyze trends in user progress
   */
  private static analyzeTrends(logEntries: LogEntry[]): TrendAnalysis {
    if (logEntries.length === 0) {
      return {
        trend: 'stagnant',
        weeklyAverage: 0,
        monthlyAverage: 0,
        variance: 0,
        seasonality: {},
      };
    }

    // Sort entries by date
    const sortedEntries = logEntries.sort((a, b) => 
      a.dateOfContact.getTime() - b.dateOfContact.getTime()
    );

    // Calculate weekly averages for trend analysis
    const weeklyTotals = this.calculateWeeklyTotals(sortedEntries);
    const trend = this.calculateTrend(weeklyTotals);
    
    return {
      trend,
      weeklyAverage: this.calculateWeeklyAverage(sortedEntries),
      monthlyAverage: this.calculateMonthlyAverage(sortedEntries),
      variance: this.calculateVariance(weeklyTotals),
      seasonality: this.calculateSeasonality(sortedEntries),
    };
  }

  /**
   * Project completion date based on current trends
   */
  private static projectCompletion(
    currentHours: number,
    targetHours: number,
    trendAnalysis: TrendAnalysis
  ): ProjectionData {
    const remainingHours = targetHours - currentHours;
    
    if (remainingHours <= 0) {
      return {
        currentProgress: 1,
        projectedDate: new Date(),
        confidence: 1,
        bottlenecks: [],
        recommendations: ['Congratulations! CCH requirement completed.'],
      };
    }

    if (trendAnalysis.weeklyAverage <= 0) {
      return {
        currentProgress: currentHours / targetHours,
        projectedDate: null,
        confidence: 0.1,
        bottlenecks: ['No recent progress detected'],
        recommendations: ['Resume regular client contact sessions'],
      };
    }

    // Calculate projection based on trend
    let projectedWeeks = remainingHours / trendAnalysis.weeklyAverage;
    
    // Adjust for trend
    switch (trendAnalysis.trend) {
      case 'accelerating':
        projectedWeeks *= 0.8; // 20% faster
        break;
      case 'declining':
        projectedWeeks *= 1.3; // 30% slower
        break;
      case 'stagnant':
        projectedWeeks *= 1.5; // 50% slower
        break;
    }

    const projectedDate = new Date();
    projectedDate.setDate(projectedDate.getDate() + (projectedWeeks * 7));

    // Calculate confidence based on consistency
    const confidence = Math.max(0.3, Math.min(0.9, 1 - (trendAnalysis.variance / 10)));

    const bottlenecks = this.identifyBottlenecks(trendAnalysis, remainingHours);
    const recommendations = this.generateRecommendations(trendAnalysis, remainingHours);

    return {
      currentProgress: currentHours / targetHours,
      projectedDate,
      confidence,
      bottlenecks,
      recommendations,
    };
  }

  /**
   * Analyze supervision-specific trends
   */
  private static analyzeSupervisionTrend(logEntries: LogEntry[]) {
    const supervisionEntries = logEntries.filter(entry => entry.supervisionHours > 0);
    
    if (supervisionEntries.length === 0) {
      return { frequency: 0, average: 0, consistency: 0 };
    }

    // Calculate supervision frequency (sessions per month)
    const timeSpan = this.getTimeSpanMonths(supervisionEntries);
    const frequency = supervisionEntries.length / Math.max(1, timeSpan);
    
    // Calculate average supervision hours per session
    const totalHours = supervisionEntries.reduce((sum, entry) => sum + entry.supervisionHours, 0);
    const average = totalHours / supervisionEntries.length;
    
    // Calculate consistency (lower variance = higher consistency)
    const variance = this.calculateSupervisionVariance(supervisionEntries);
    const consistency = Math.max(0, 1 - (variance / 4)); // Normalize to 0-1

    return { frequency, average, consistency };
  }

  /**
   * Project supervision completion
   */
  private static projectSupervisionCompletion(
    currentHours: any,
    requirements: any,
    supervisionTrend: any
  ): ProjectionData {
    const remainingSupervision = requirements.supervisionHours - currentHours.supervision;
    const remainingCCH = requirements.totalCCH - currentHours.total;
    
    if (remainingSupervision <= 0) {
      return {
        currentProgress: 1,
        projectedDate: new Date(),
        confidence: 1,
        bottlenecks: [],
        recommendations: ['Supervision requirement completed!'],
      };
    }

    // Check supervision ratio compliance
    const currentRatio = currentHours.supervision / Math.max(1, currentHours.total);
    const targetRatio = requirements.supervisionHours / requirements.totalCCH;
    
    const bottlenecks: string[] = [];
    const recommendations: string[] = [];
    
    if (currentRatio < targetRatio * 0.8) {
      bottlenecks.push('Supervision hours behind required ratio');
      recommendations.push('Schedule additional supervision sessions immediately');
    }
    
    if (supervisionTrend.frequency < 0.8) { // Less than 3.2 sessions per month
      bottlenecks.push('Infrequent supervision sessions');
      recommendations.push('Increase supervision session frequency');
    }

    // Project completion date
    let projectedDate: Date | null = null;
    let confidence = 0.5;
    
    if (supervisionTrend.frequency > 0) {
      const monthsToComplete = remainingSupervision / (supervisionTrend.frequency * supervisionTrend.average);
      projectedDate = new Date();
      projectedDate.setMonth(projectedDate.getMonth() + Math.ceil(monthsToComplete));
      confidence = Math.min(0.9, supervisionTrend.consistency * 0.8 + 0.2);
    }

    return {
      currentProgress: currentHours.supervision / requirements.supervisionHours,
      projectedDate,
      confidence,
      bottlenecks,
      recommendations,
    };
  }

  /**
   * Calculate ethics training projection
   */
  private static calculateEthicsProjection(currentEthics: number, requiredEthics: number): Date | null {
    const remaining = requiredEthics - currentEthics;
    
    if (remaining <= 0) return new Date();
    
    // Assume ethics can be completed in focused sessions
    // Most users complete ethics in 1-2 months once they start
    const projectedDate = new Date();
    projectedDate.setMonth(projectedDate.getMonth() + 2);
    
    return projectedDate;
  }

  /**
   * Helper methods for calculations
   */
  private static calculateWeeklyTotals(entries: LogEntry[]): number[] {
    const weeklyTotals: Record<string, number> = {};
    
    for (const entry of entries) {
      const weekKey = this.getWeekKey(entry.dateOfContact);
      weeklyTotals[weekKey] = (weeklyTotals[weekKey] || 0) + entry.clientContactHours;
    }
    
    return Object.values(weeklyTotals);
  }

  private static calculateTrend(weeklyTotals: number[]): 'accelerating' | 'steady' | 'declining' | 'stagnant' {
    if (weeklyTotals.length < 3) return 'steady';
    
    const recent = weeklyTotals.slice(-4); // Last 4 weeks
    const earlier = weeklyTotals.slice(-8, -4); // Previous 4 weeks
    
    if (earlier.length === 0) return 'steady';
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, val) => sum + val, 0) / earlier.length;
    
    const change = (recentAvg - earlierAvg) / Math.max(1, earlierAvg);
    
    if (Math.abs(change) < 0.1) return 'steady';
    if (change > 0.2) return 'accelerating';
    if (change < -0.2) return 'declining';
    if (recentAvg < 1) return 'stagnant';
    
    return 'steady';
  }

  private static calculateWeeklyAverage(entries: LogEntry[]): number {
    if (entries.length === 0) return 0;
    
    const timeSpan = this.getTimeSpanWeeks(entries);
    const totalHours = entries.reduce((sum, entry) => sum + entry.clientContactHours, 0);
    
    return totalHours / Math.max(1, timeSpan);
  }

  private static calculateMonthlyAverage(entries: LogEntry[]): number {
    return this.calculateWeeklyAverage(entries) * 4.33; // Average weeks per month
  }

  private static calculateVariance(weeklyTotals: number[]): number {
    if (weeklyTotals.length === 0) return 0;
    
    const mean = weeklyTotals.reduce((sum, val) => sum + val, 0) / weeklyTotals.length;
    const variance = weeklyTotals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / weeklyTotals.length;
    
    return Math.sqrt(variance); // Standard deviation
  }

  private static calculateSeasonality(entries: LogEntry[]): Record<string, number> {
    const monthlyTotals: Record<number, number[]> = {};
    
    for (const entry of entries) {
      const month = entry.dateOfContact.getMonth();
      if (!monthlyTotals[month]) monthlyTotals[month] = [];
      monthlyTotals[month].push(entry.clientContactHours);
    }
    
    const seasonality: Record<string, number> = {};
    for (const [month, totals] of Object.entries(monthlyTotals)) {
      const average = totals.reduce((sum, val) => sum + val, 0) / totals.length;
      seasonality[month] = average;
    }
    
    return seasonality;
  }

  private static identifyBottlenecks(trendAnalysis: TrendAnalysis, remainingHours: number): string[] {
    const bottlenecks: string[] = [];
    
    if (trendAnalysis.trend === 'declining') {
      bottlenecks.push('Progress rate is declining');
    }
    
    if (trendAnalysis.trend === 'stagnant') {
      bottlenecks.push('No recent progress detected');
    }
    
    if (trendAnalysis.variance > 8) {
      bottlenecks.push('Inconsistent session scheduling');
    }
    
    if (trendAnalysis.weeklyAverage < 10 && remainingHours > 1000) {
      bottlenecks.push('Low weekly hour volume for remaining requirements');
    }
    
    return bottlenecks;
  }

  private static generateRecommendations(trendAnalysis: TrendAnalysis, remainingHours: number): string[] {
    const recommendations: string[] = [];
    
    if (trendAnalysis.weeklyAverage < 15) {
      recommendations.push('Consider increasing weekly client contact hours');
    }
    
    if (trendAnalysis.variance > 6) {
      recommendations.push('Establish more consistent session scheduling');
    }
    
    if (trendAnalysis.trend === 'declining') {
      recommendations.push('Review and address factors causing reduced productivity');
    }
    
    if (remainingHours > 2000) {
      recommendations.push('Consider setting interim milestones to maintain motivation');
    }
    
    return recommendations;
  }

  private static getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const week = Math.floor((date.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
    return `${year}-W${week}`;
  }

  private static getTimeSpanWeeks(entries: LogEntry[]): number {
    if (entries.length === 0) return 1;
    
    const earliest = Math.min(...entries.map(e => e.dateOfContact.getTime()));
    const latest = Math.max(...entries.map(e => e.dateOfContact.getTime()));
    
    return Math.max(1, (latest - earliest) / (7 * 24 * 60 * 60 * 1000));
  }

  private static getTimeSpanMonths(entries: LogEntry[]): number {
    return this.getTimeSpanWeeks(entries) / 4.33;
  }

  private static calculateSupervisionVariance(entries: LogEntry[]): number {
    const hours = entries.map(entry => entry.supervisionHours);
    const mean = hours.reduce((sum, val) => sum + val, 0) / hours.length;
    const variance = hours.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / hours.length;
    
    return Math.sqrt(variance);
  }
}