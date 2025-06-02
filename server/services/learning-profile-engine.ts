import type { UserLearningProfile, ResourceRecommendation, UserAnalytics } from '../../shared/schema';

interface EngagementPattern {
  activityType: string;
  frequency: number;
  averageDuration: number;
  completionRate: number;
  preferredTimeOfDay: number; // 0-23 hours
  preferredDayOfWeek: number; // 0-6 (Sunday = 0)
}

interface LearningInsight {
  type: 'strength' | 'opportunity' | 'preference';
  category: string;
  description: string;
  confidence: number;
  actionable: boolean;
  recommendation?: string;
}

export class LearningProfileEngine {
  
  /**
   * Analyze user behavior to build learning profile
   */
  static async analyzeUserBehavior(
    userId: string,
    analytics: UserAnalytics[],
    recommendations: ResourceRecommendation[]
  ): Promise<Partial<UserLearningProfile>> {
    const engagementPatterns = this.extractEngagementPatterns(analytics);
    const resourcePreferences = this.analyzeResourcePreferences(recommendations);
    const learningStyle = this.inferLearningStyle(analytics, recommendations);
    const optimalTiming = this.analyzeOptimalTiming(analytics);
    
    return {
      userId,
      learningStyle,
      preferredResourceTypes: resourcePreferences.preferred,
      engagementPatterns: this.formatEngagementPatterns(engagementPatterns),
      optimalNotificationTiming: optimalTiming,
      responseToCoachingStyles: this.analyzeCoachingResponse(recommendations),
      completionRates: this.calculateCompletionRates(recommendations),
      strugglingAreas: resourcePreferences.struggling,
      strengthAreas: resourcePreferences.strengths,
      lastAnalyzed: new Date(),
    };
  }

  /**
   * Extract engagement patterns from user analytics
   */
  private static extractEngagementPatterns(analytics: UserAnalytics[]): EngagementPattern[] {
    const patterns: Map<string, {
      sessions: Date[];
      durations: number[];
      completions: boolean[];
    }> = new Map();

    // Group analytics by activity type
    for (const event of analytics) {
      const activityType = event.page || event.event;
      if (!patterns.has(activityType)) {
        patterns.set(activityType, { sessions: [], durations: [], completions: [] });
      }
      
      const pattern = patterns.get(activityType)!;
      pattern.sessions.push(event.timestamp);
      
      // Extract duration and completion from metadata
      try {
        const metadata = event.metadata ? JSON.parse(event.metadata) : {};
        if (metadata.duration) {
          pattern.durations.push(metadata.duration);
        }
        if (metadata.completed !== undefined) {
          pattern.completions.push(metadata.completed);
        }
      } catch (e) {
        // Ignore malformed metadata
      }
    }

    // Calculate patterns for each activity type
    return Array.from(patterns.entries()).map(([activityType, data]) => {
      const frequency = data.sessions.length;
      const averageDuration = data.durations.length > 0 
        ? data.durations.reduce((sum, d) => sum + d, 0) / data.durations.length 
        : 0;
      const completionRate = data.completions.length > 0
        ? data.completions.filter(c => c).length / data.completions.length
        : 0;

      // Calculate preferred time patterns
      const hours = data.sessions.map(d => d.getHours());
      const preferredTimeOfDay = this.calculateMostFrequent(hours);
      
      const days = data.sessions.map(d => d.getDay());
      const preferredDayOfWeek = this.calculateMostFrequent(days);

      return {
        activityType,
        frequency,
        averageDuration,
        completionRate,
        preferredTimeOfDay,
        preferredDayOfWeek,
      };
    });
  }

  /**
   * Analyze resource preferences and effectiveness
   */
  private static analyzeResourcePreferences(recommendations: ResourceRecommendation[]) {
    const typeStats: Map<string, {
      total: number;
      viewed: number;
      completed: number;
      rated: number;
      avgRating: number;
    }> = new Map();

    // Analyze each resource type
    for (const rec of recommendations) {
      if (!typeStats.has(rec.resourceType)) {
        typeStats.set(rec.resourceType, {
          total: 0,
          viewed: 0,
          completed: 0,
          rated: 0,
          avgRating: 0,
        });
      }

      const stats = typeStats.get(rec.resourceType)!;
      stats.total++;
      
      if (rec.viewedAt) stats.viewed++;
      if (rec.completedAt) stats.completed++;
      if (rec.userRating) {
        stats.rated++;
        stats.avgRating = (stats.avgRating * (stats.rated - 1) + rec.userRating) / stats.rated;
      }
    }

    // Calculate preferences
    const typeScores = Array.from(typeStats.entries()).map(([type, stats]) => {
      const viewRate = stats.viewed / Math.max(1, stats.total);
      const completionRate = stats.completed / Math.max(1, stats.viewed);
      const satisfactionScore = stats.avgRating / 5; // Normalize to 0-1
      
      const overallScore = (viewRate * 0.3 + completionRate * 0.4 + satisfactionScore * 0.3);
      
      return { type, score: overallScore, stats };
    }).sort((a, b) => b.score - a.score);

    return {
      preferred: typeScores.slice(0, 3).map(item => item.type),
      struggling: typeScores.slice(-2).filter(item => item.score < 0.3).map(item => item.type),
      strengths: typeScores.slice(0, 2).filter(item => item.score > 0.7).map(item => item.type),
    };
  }

  /**
   * Infer learning style from behavior patterns
   */
  private static inferLearningStyle(
    analytics: UserAnalytics[],
    recommendations: ResourceRecommendation[]
  ): 'visual' | 'auditory' | 'kinesthetic' | 'reading' | undefined {
    const styleIndicators = {
      visual: 0,
      auditory: 0,
      kinesthetic: 0,
      reading: 0,
    };

    // Analyze resource type preferences
    for (const rec of recommendations) {
      if (rec.completedAt) {
        switch (rec.resourceType) {
          case 'video':
          case 'image':
          case 'diagram':
            styleIndicators.visual += 2;
            break;
          case 'podcast':
          case 'audio':
            styleIndicators.auditory += 2;
            break;
          case 'interactive':
          case 'tool':
          case 'exercise':
            styleIndicators.kinesthetic += 2;
            break;
          case 'article':
          case 'book':
          case 'text':
            styleIndicators.reading += 2;
            break;
        }
      }
    }

    // Analyze session patterns for additional indicators
    for (const event of analytics) {
      if (event.event === 'ai_analysis' || event.event === 'insights_viewed') {
        styleIndicators.reading += 1;
      }
      if (event.event === 'dashboard_viewed') {
        styleIndicators.visual += 1;
      }
    }

    // Find dominant style
    const maxScore = Math.max(...Object.values(styleIndicators));
    if (maxScore === 0) return undefined;

    const dominantStyle = Object.entries(styleIndicators)
      .find(([_, score]) => score === maxScore)?.[0] as any;

    return dominantStyle;
  }

  /**
   * Analyze optimal timing for notifications and interactions
   */
  private static analyzeOptimalTiming(analytics: UserAnalytics[]) {
    const hourCounts: number[] = new Array(24).fill(0);
    const dayCounts: number[] = new Array(7).fill(0);
    
    for (const event of analytics) {
      const hour = event.timestamp.getHours();
      const day = event.timestamp.getDay();
      
      hourCounts[hour]++;
      dayCounts[day]++;
    }

    const optimalHour = hourCounts.indexOf(Math.max(...hourCounts));
    const optimalDay = dayCounts.indexOf(Math.max(...dayCounts));

    return {
      preferredHour: optimalHour,
      preferredDay: optimalDay,
      activeHours: hourCounts.map((count, hour) => ({ hour, activity: count }))
        .filter(item => item.activity > 0)
        .sort((a, b) => b.activity - a.activity)
        .slice(0, 6)
        .map(item => item.hour),
      activeDays: dayCounts.map((count, day) => ({ day, activity: count }))
        .filter(item => item.activity > 0)
        .sort((a, b) => b.activity - a.activity)
        .map(item => item.day),
    };
  }

  /**
   * Analyze response to different coaching styles
   */
  private static analyzeCoachingResponse(recommendations: ResourceRecommendation[]) {
    const coachingStyles = ['directive', 'supportive', 'collaborative', 'analytical'];
    const responses: Record<string, { total: number; positive: number }> = {};

    coachingStyles.forEach(style => {
      responses[style] = { total: 0, positive: 0 };
    });

    for (const rec of recommendations) {
      // Infer coaching style from recommendation reason
      const reason = rec.recommendationReason?.toLowerCase() || '';
      let inferredStyle = 'supportive'; // default

      if (reason.includes('should') || reason.includes('must') || reason.includes('required')) {
        inferredStyle = 'directive';
      } else if (reason.includes('collaborate') || reason.includes('together') || reason.includes('explore')) {
        inferredStyle = 'collaborative';
      } else if (reason.includes('analyze') || reason.includes('data') || reason.includes('evidence')) {
        inferredStyle = 'analytical';
      }

      responses[inferredStyle].total++;
      
      if (rec.completedAt || rec.userRating && rec.userRating >= 4) {
        responses[inferredStyle].positive++;
      }
    }

    // Calculate response rates
    const responseRates: Record<string, number> = {};
    for (const [style, data] of Object.entries(responses)) {
      responseRates[style] = data.total > 0 ? data.positive / data.total : 0;
    }

    return responseRates;
  }

  /**
   * Calculate completion rates by category
   */
  private static calculateCompletionRates(recommendations: ResourceRecommendation[]) {
    const categories = ['technical', 'interpersonal', 'theoretical', 'practical'];
    const rates: Record<string, number> = {};

    categories.forEach(category => {
      const categoryRecs = recommendations.filter(rec => 
        rec.tags.some(tag => tag.toLowerCase().includes(category))
      );
      
      if (categoryRecs.length > 0) {
        const completed = categoryRecs.filter(rec => rec.completedAt).length;
        rates[category] = completed / categoryRecs.length;
      } else {
        rates[category] = 0;
      }
    });

    return rates;
  }

  /**
   * Generate learning insights based on profile
   */
  static generateLearningInsights(profile: UserLearningProfile): LearningInsight[] {
    const insights: LearningInsight[] = [];

    // Completion rate insights
    const avgCompletion = Object.values(profile.completionRates).reduce((sum, rate) => sum + rate, 0) / 
      Math.max(1, Object.values(profile.completionRates).length);

    if (avgCompletion > 0.8) {
      insights.push({
        type: 'strength',
        category: 'Engagement',
        description: 'You have excellent follow-through on recommended resources',
        confidence: 0.9,
        actionable: false,
      });
    } else if (avgCompletion < 0.3) {
      insights.push({
        type: 'opportunity',
        category: 'Engagement',
        description: 'Resource completion could be improved',
        confidence: 0.8,
        actionable: true,
        recommendation: 'Try shorter, more focused resources or set specific completion goals',
      });
    }

    // Learning style insights
    if (profile.learningStyle) {
      insights.push({
        type: 'preference',
        category: 'Learning Style',
        description: `Your learning style appears to be ${profile.learningStyle}`,
        confidence: 0.7,
        actionable: true,
        recommendation: `Resources will be prioritized to match your ${profile.learningStyle} learning preference`,
      });
    }

    // Timing insights
    if (profile.optimalNotificationTiming.preferredHour !== undefined) {
      const hour = profile.optimalNotificationTiming.preferredHour;
      const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
      
      insights.push({
        type: 'preference',
        category: 'Timing',
        description: `You're most active in the ${timeOfDay}`,
        confidence: 0.8,
        actionable: true,
        recommendation: `Notifications and reminders will be optimized for ${timeOfDay} delivery`,
      });
    }

    // Struggling areas
    if (profile.strugglingAreas.length > 0) {
      insights.push({
        type: 'opportunity',
        category: 'Development',
        description: `Consider focusing on: ${profile.strugglingAreas.join(', ')}`,
        confidence: 0.7,
        actionable: true,
        recommendation: 'Additional support and alternative resource formats will be provided for these areas',
      });
    }

    return insights;
  }

  /**
   * Update profile based on new user activity
   */
  static async updateProfile(
    currentProfile: UserLearningProfile,
    newAnalytics: UserAnalytics[],
    newRecommendations: ResourceRecommendation[]
  ): Promise<Partial<UserLearningProfile>> {
    // Analyze new behavior
    const newInsights = await this.analyzeUserBehavior(
      currentProfile.userId,
      newAnalytics,
      newRecommendations
    );

    // Merge with existing profile (weighted toward recent behavior)
    const mergedProfile: Partial<UserLearningProfile> = {
      ...currentProfile,
      lastAnalyzed: new Date(),
    };

    // Update engagement patterns (70% weight to recent behavior)
    if (newInsights.engagementPatterns) {
      mergedProfile.engagementPatterns = this.mergeEngagementPatterns(
        currentProfile.engagementPatterns,
        newInsights.engagementPatterns,
        0.7
      );
    }

    // Update completion rates
    if (newInsights.completionRates) {
      mergedProfile.completionRates = this.mergeCompletionRates(
        currentProfile.completionRates,
        newInsights.completionRates,
        0.6
      );
    }

    return mergedProfile;
  }

  /**
   * Merge engagement patterns with weighted average
   */
  private static mergeEngagementPatterns(
    existing: Record<string, any>,
    newPatterns: Record<string, any>,
    newWeight: number
  ): Record<string, any> {
    const merged = { ...existing };
    
    for (const [key, newValue] of Object.entries(newPatterns)) {
      if (existing[key] !== undefined) {
        // Weighted average for numeric values
        if (typeof newValue === 'number' && typeof existing[key] === 'number') {
          merged[key] = existing[key] * (1 - newWeight) + newValue * newWeight;
        } else {
          merged[key] = newValue; // Replace non-numeric values
        }
      } else {
        merged[key] = newValue; // Add new patterns
      }
    }
    
    return merged;
  }

  /**
   * Merge completion rates
   */
  private static mergeCompletionRates(
    existing: Record<string, number>,
    newRates: Record<string, number>,
    newWeight: number
  ): Record<string, number> {
    const merged = { ...existing };
    
    for (const [category, newRate] of Object.entries(newRates)) {
      if (existing[category] !== undefined) {
        merged[category] = existing[category] * (1 - newWeight) + newRate * newWeight;
      } else {
        merged[category] = newRate;
      }
    }
    
    return merged;
  }

  /**
   * Format engagement patterns for storage
   */
  private static formatEngagementPatterns(patterns: EngagementPattern[]): Record<string, any> {
    const formatted: Record<string, any> = {};
    
    for (const pattern of patterns) {
      formatted[pattern.activityType] = {
        frequency: pattern.frequency,
        averageDuration: pattern.averageDuration,
        completionRate: pattern.completionRate,
        preferredTimeOfDay: pattern.preferredTimeOfDay,
        preferredDayOfWeek: pattern.preferredDayOfWeek,
      };
    }
    
    return formatted;
  }

  /**
   * Calculate most frequent value in array
   */
  private static calculateMostFrequent(values: number[]): number {
    if (values.length === 0) return 0;
    
    const frequency: Record<number, number> = {};
    values.forEach(value => {
      frequency[value] = (frequency[value] || 0) + 1;
    });
    
    return Number(Object.entries(frequency).reduce((a, b) => 
      frequency[Number(a[0])] > frequency[Number(b[0])] ? a : b
    )[0]);
  }
}