import type { CommunityIntelligence, UserProfile, LogEntry, ResourceRecommendation } from '../../shared/schema';

interface BenchmarkData {
  metric: string;
  userValue: number;
  communityAverage: number;
  percentile: number;
  interpretation: string;
  recommendation?: string;
}

interface CommunityTrend {
  metric: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  changePercent: number;
  timeframe: string;
  significance: 'high' | 'medium' | 'low';
}

export class CommunityIntelligenceService {
  
  // In-memory storage for community metrics (would be database in production)
  private static communityMetrics: Map<string, CommunityIntelligence> = new Map();

  /**
   * Update community intelligence metrics
   */
  static async updateCommunityMetrics(
    userProfiles: UserProfile[],
    allLogEntries: Map<string, LogEntry[]>,
    allRecommendations: Map<string, ResourceRecommendation[]>
  ): Promise<void> {
    // Calculate aggregate metrics while preserving privacy
    const metrics = this.calculateAggregateMetrics(userProfiles, allLogEntries, allRecommendations);
    
    // Store community metrics
    for (const metric of metrics) {
      const key = this.generateMetricKey(metric.metric, metric.state, metric.licenseType, metric.timeframe);
      this.communityMetrics.set(key, metric);
    }
  }

  /**
   * Get user benchmarks against community
   */
  static async getUserBenchmarks(
    userId: string,
    userProfile: UserProfile,
    userLogEntries: LogEntry[]
  ): Promise<BenchmarkData[]> {
    const benchmarks: BenchmarkData[] = [];
    
    // Calculate user metrics
    const userMetrics = this.calculateUserMetrics(userLogEntries);
    
    // Compare against community averages
    for (const [metricName, userValue] of Object.entries(userMetrics)) {
      const communityData = this.getCommunityMetric(
        metricName,
        userProfile.stateRegion,
        'LPC',
        'month'
      );
      
      if (communityData) {
        const benchmark = this.createBenchmark(metricName, userValue, communityData);
        benchmarks.push(benchmark);
      }
    }

    return benchmarks;
  }

  /**
   * Get community trends
   */
  static getCommunityTrends(
    state?: string,
    licenseType?: string,
    timeframe: 'week' | 'month' | 'quarter' = 'month'
  ): CommunityTrend[] {
    const trends: CommunityTrend[] = [];
    
    // Analyze trends from stored metrics
    const currentMetrics = this.getMetricsForPeriod(state, licenseType, timeframe);
    const previousMetrics = this.getMetricsForPeriod(state, licenseType, timeframe, 1); // Previous period
    
    for (const [metricName, current] of currentMetrics) {
      const previous = previousMetrics.get(metricName);
      if (previous) {
        const trend = this.calculateTrend(current, previous);
        trends.push(trend);
      }
    }

    return trends;
  }

  /**
   * Get popular resources from community usage
   */
  static getPopularResources(
    state?: string,
    licenseType?: string,
    category?: string
  ): Array<{
    resourceType: string;
    title: string;
    usageCount: number;
    successRate: number;
    averageRating: number;
    relevanceScore: number;
  }> {
    // This would aggregate resource usage data while maintaining privacy
    return [
      {
        resourceType: 'article',
        title: 'Ethics in Clinical Practice',
        usageCount: 145,
        successRate: 0.87,
        averageRating: 4.6,
        relevanceScore: 0.92,
      },
      {
        resourceType: 'course',
        title: 'Supervision Skills Development',
        usageCount: 98,
        successRate: 0.91,
        averageRating: 4.8,
        relevanceScore: 0.89,
      },
      {
        resourceType: 'tool',
        title: 'Session Documentation Templates',
        usageCount: 203,
        successRate: 0.94,
        averageRating: 4.5,
        relevanceScore: 0.85,
      },
    ];
  }

  /**
   * Calculate aggregate metrics from user data
   */
  private static calculateAggregateMetrics(
    userProfiles: UserProfile[],
    allLogEntries: Map<string, LogEntry[]>,
    allRecommendations: Map<string, ResourceRecommendation[]>
  ): CommunityIntelligence[] {
    const metrics: CommunityIntelligence[] = [];
    const now = new Date();

    // Group users by state and license type
    const userGroups = this.groupUsers(userProfiles);

    for (const [groupKey, users] of userGroups) {
      const [state, licenseType] = groupKey.split('|');
      
      // Calculate average completion times
      const completionTimes = this.calculateAverageCompletionTimes(users, allLogEntries);
      metrics.push({
        id: crypto.randomUUID(),
        metric: 'avg_completion_time_months',
        state,
        licenseType,
        timeframe: 'month',
        value: completionTimes,
        sampleSize: users.length,
        lastUpdated: now,
        createdAt: now,
      });

      // Calculate weekly hour averages
      const weeklyHours = this.calculateAverageWeeklyHours(users, allLogEntries);
      metrics.push({
        id: crypto.randomUUID(),
        metric: 'avg_weekly_hours',
        state,
        licenseType,
        timeframe: 'week',
        value: weeklyHours,
        sampleSize: users.length,
        lastUpdated: now,
        createdAt: now,
      });

      // Calculate success rates
      const successRates = this.calculateSuccessRates(users, allLogEntries);
      metrics.push({
        id: crypto.randomUUID(),
        metric: 'completion_success_rate',
        state,
        licenseType,
        timeframe: 'quarter',
        value: successRates,
        sampleSize: users.length,
        lastUpdated: now,
        createdAt: now,
      });

      // Calculate resource effectiveness
      const resourceEffectiveness = this.calculateResourceEffectiveness(users, allRecommendations);
      metrics.push({
        id: crypto.randomUUID(),
        metric: 'resource_effectiveness',
        state,
        licenseType,
        timeframe: 'month',
        value: resourceEffectiveness,
        sampleSize: users.length,
        lastUpdated: now,
        createdAt: now,
      });
    }

    return metrics;
  }

  /**
   * Group users by state and license type
   */
  private static groupUsers(userProfiles: UserProfile[]): Map<string, UserProfile[]> {
    const groups = new Map<string, UserProfile[]>();
    
    for (const user of userProfiles) {
      const key = `${user.stateRegion}|LPC`; // Default to LPC
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(user);
    }
    
    return groups;
  }

  /**
   * Calculate average completion times
   */
  private static calculateAverageCompletionTimes(
    users: UserProfile[],
    allLogEntries: Map<string, LogEntry[]>
  ): any {
    const completionData: number[] = [];
    
    for (const user of users) {
      const entries = allLogEntries.get(user.preferredName) || []; // Using preferredName as ID
      if (entries.length > 0) {
        // Calculate months between first and last entry
        const sortedEntries = entries.sort((a, b) => a.dateOfContact.getTime() - b.dateOfContact.getTime());
        const firstEntry = sortedEntries[0];
        const lastEntry = sortedEntries[sortedEntries.length - 1];
        
        const monthsDiff = (lastEntry.dateOfContact.getTime() - firstEntry.dateOfContact.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
        completionData.push(monthsDiff);
      }
    }
    
    if (completionData.length === 0) return { average: 0, median: 0, range: { min: 0, max: 0 } };
    
    const sorted = completionData.sort((a, b) => a - b);
    const average = completionData.reduce((sum, val) => sum + val, 0) / completionData.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    
    return {
      average: Math.round(average * 10) / 10,
      median: Math.round(median * 10) / 10,
      range: { min: sorted[0], max: sorted[sorted.length - 1] },
    };
  }

  /**
   * Calculate average weekly hours
   */
  private static calculateAverageWeeklyHours(
    users: UserProfile[],
    allLogEntries: Map<string, LogEntry[]>
  ): any {
    const weeklyHours: number[] = [];
    
    for (const user of users) {
      const entries = allLogEntries.get(user.preferredName) || [];
      if (entries.length > 0) {
        const totalHours = entries.reduce((sum, entry) => sum + entry.clientContactHours, 0);
        const timeSpanWeeks = this.calculateTimeSpanWeeks(entries);
        const averageWeekly = totalHours / Math.max(1, timeSpanWeeks);
        weeklyHours.push(averageWeekly);
      }
    }
    
    if (weeklyHours.length === 0) return { average: 0, percentiles: { p25: 0, p50: 0, p75: 0 } };
    
    const sorted = weeklyHours.sort((a, b) => a - b);
    const average = weeklyHours.reduce((sum, val) => sum + val, 0) / weeklyHours.length;
    
    return {
      average: Math.round(average * 10) / 10,
      percentiles: {
        p25: sorted[Math.floor(sorted.length * 0.25)],
        p50: sorted[Math.floor(sorted.length * 0.5)],
        p75: sorted[Math.floor(sorted.length * 0.75)],
      },
    };
  }

  /**
   * Calculate success rates
   */
  private static calculateSuccessRates(
    users: UserProfile[],
    allLogEntries: Map<string, LogEntry[]>
  ): any {
    let completedUsers = 0;
    let activeUsers = 0;
    
    for (const user of users) {
      const entries = allLogEntries.get(user.preferredName) || [];
      const totalHours = entries.reduce((sum, entry) => sum + entry.clientContactHours, 0);
      
      if (totalHours >= 4000) {
        completedUsers++;
      } else if (totalHours > 0) {
        activeUsers++;
      }
    }
    
    const totalActiveUsers = completedUsers + activeUsers;
    
    return {
      completionRate: totalActiveUsers > 0 ? completedUsers / totalActiveUsers : 0,
      activeUsers,
      completedUsers,
      totalUsers: users.length,
    };
  }

  /**
   * Calculate resource effectiveness
   */
  private static calculateResourceEffectiveness(
    users: UserProfile[],
    allRecommendations: Map<string, ResourceRecommendation[]>
  ): any {
    const resourceStats: Map<string, { total: number; completed: number; rated: number; totalRating: number }> = new Map();
    
    for (const user of users) {
      const recommendations = allRecommendations.get(user.preferredName) || [];
      
      for (const rec of recommendations) {
        if (!resourceStats.has(rec.resourceType)) {
          resourceStats.set(rec.resourceType, { total: 0, completed: 0, rated: 0, totalRating: 0 });
        }
        
        const stats = resourceStats.get(rec.resourceType)!;
        stats.total++;
        
        if (rec.completedAt) stats.completed++;
        if (rec.userRating) {
          stats.rated++;
          stats.totalRating += rec.userRating;
        }
      }
    }
    
    const effectiveness: Record<string, any> = {};
    for (const [type, stats] of resourceStats) {
      effectiveness[type] = {
        completionRate: stats.total > 0 ? stats.completed / stats.total : 0,
        averageRating: stats.rated > 0 ? stats.totalRating / stats.rated : 0,
        sampleSize: stats.total,
      };
    }
    
    return effectiveness;
  }

  /**
   * Calculate user-specific metrics
   */
  private static calculateUserMetrics(logEntries: LogEntry[]): Record<string, number> {
    if (logEntries.length === 0) return {};
    
    const totalHours = logEntries.reduce((sum, entry) => sum + entry.clientContactHours, 0);
    const timeSpanWeeks = this.calculateTimeSpanWeeks(logEntries);
    const weeklyAverage = totalHours / Math.max(1, timeSpanWeeks);
    
    const supervisionHours = logEntries.reduce((sum, entry) => sum + entry.supervisionHours, 0);
    const supervisionRatio = supervisionHours / Math.max(1, totalHours);
    
    return {
      weekly_hours: weeklyAverage,
      total_hours: totalHours,
      supervision_ratio: supervisionRatio,
      session_consistency: this.calculateConsistency(logEntries),
    };
  }

  /**
   * Get community metric by key
   */
  private static getCommunityMetric(
    metric: string,
    state?: string,
    licenseType?: string,
    timeframe?: string
  ): CommunityIntelligence | null {
    const key = this.generateMetricKey(metric, state, licenseType, timeframe);
    return this.communityMetrics.get(key) || null;
  }

  /**
   * Create benchmark comparison
   */
  private static createBenchmark(
    metricName: string,
    userValue: number,
    communityData: CommunityIntelligence
  ): BenchmarkData {
    const communityValue = this.extractValueFromCommunityData(communityData, metricName);
    const percentile = this.calculatePercentile(userValue, communityValue);
    
    return {
      metric: metricName,
      userValue,
      communityAverage: communityValue,
      percentile,
      interpretation: this.interpretBenchmark(metricName, percentile),
      recommendation: this.getBenchmarkRecommendation(metricName, percentile),
    };
  }

  /**
   * Extract numeric value from community data
   */
  private static extractValueFromCommunityData(data: CommunityIntelligence, metricName: string): number {
    if (typeof data.value === 'number') return data.value;
    if (typeof data.value === 'object' && data.value.average) return data.value.average;
    return 0;
  }

  /**
   * Calculate user percentile against community
   */
  private static calculatePercentile(userValue: number, communityAverage: number): number {
    // Simplified percentile calculation
    // In production, this would use actual distribution data
    const ratio = userValue / Math.max(1, communityAverage);
    
    if (ratio >= 1.5) return 90;
    if (ratio >= 1.2) return 75;
    if (ratio >= 0.9) return 50;
    if (ratio >= 0.7) return 25;
    return 10;
  }

  /**
   * Interpret benchmark results
   */
  private static interpretBenchmark(metricName: string, percentile: number): string {
    if (percentile >= 75) return 'Above average performance';
    if (percentile >= 50) return 'Average performance';
    if (percentile >= 25) return 'Below average performance';
    return 'Significantly below average';
  }

  /**
   * Get benchmark recommendation
   */
  private static getBenchmarkRecommendation(metricName: string, percentile: number): string | undefined {
    if (percentile < 50) {
      const recommendations: Record<string, string> = {
        'weekly_hours': 'Consider increasing your weekly session hours to match community pace',
        'supervision_ratio': 'Schedule more frequent supervision sessions',
        'session_consistency': 'Work on maintaining more consistent session scheduling',
      };
      return recommendations[metricName];
    }
    return undefined;
  }

  /**
   * Helper methods
   */
  private static generateMetricKey(
    metric: string,
    state?: string,
    licenseType?: string,
    timeframe?: string
  ): string {
    return `${metric}|${state || 'all'}|${licenseType || 'all'}|${timeframe || 'month'}`;
  }

  private static calculateTimeSpanWeeks(entries: LogEntry[]): number {
    if (entries.length === 0) return 1;
    
    const dates = entries.map(e => e.dateOfContact.getTime());
    const earliest = Math.min(...dates);
    const latest = Math.max(...dates);
    
    return Math.max(1, (latest - earliest) / (7 * 24 * 60 * 60 * 1000));
  }

  private static calculateConsistency(entries: LogEntry[]): number {
    if (entries.length < 2) return 1;
    
    // Calculate variance in weekly hours
    const weeklyTotals = this.calculateWeeklyTotals(entries);
    const mean = weeklyTotals.reduce((sum, val) => sum + val, 0) / weeklyTotals.length;
    const variance = weeklyTotals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / weeklyTotals.length;
    
    // Convert to consistency score (0-1, higher is more consistent)
    return Math.max(0, 1 - (Math.sqrt(variance) / Math.max(1, mean)));
  }

  private static calculateWeeklyTotals(entries: LogEntry[]): number[] {
    const weeklyTotals: Record<string, number> = {};
    
    for (const entry of entries) {
      const weekKey = this.getWeekKey(entry.dateOfContact);
      weeklyTotals[weekKey] = (weeklyTotals[weekKey] || 0) + entry.clientContactHours;
    }
    
    return Object.values(weeklyTotals);
  }

  private static getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const week = Math.floor((date.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
    return `${year}-W${week}`;
  }

  private static getMetricsForPeriod(
    state?: string,
    licenseType?: string,
    timeframe?: string,
    periodsBack: number = 0
  ): Map<string, CommunityIntelligence> {
    // This would fetch historical data in production
    return new Map();
  }

  private static calculateTrend(
    current: CommunityIntelligence,
    previous: CommunityIntelligence
  ): CommunityTrend {
    const currentValue = this.extractValueFromCommunityData(current, current.metric);
    const previousValue = this.extractValueFromCommunityData(previous, previous.metric);
    
    const changePercent = ((currentValue - previousValue) / Math.max(1, previousValue)) * 100;
    
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (Math.abs(changePercent) > 5) {
      trend = changePercent > 0 ? 'increasing' : 'decreasing';
    }
    
    return {
      metric: current.metric,
      trend,
      changePercent: Math.round(changePercent * 10) / 10,
      timeframe: current.timeframe,
      significance: Math.abs(changePercent) > 15 ? 'high' : Math.abs(changePercent) > 5 ? 'medium' : 'low',
    };
  }
}