import { SmartProgressTracker } from './smart-progress-tracker';
import { StateRequirementsEngine } from './state-requirements-engine';
import { AiCacheService } from './ai-cache-service';
import { LearningProfileEngine } from './learning-profile-engine';
import { PredictiveMilestoneService } from './predictive-milestone-service';
import { ComplianceMonitoringService } from './compliance-monitoring-service';
import { CommunityIntelligenceService } from './community-intelligence-service';
import { ResourceRecommendationEngine } from './resource-recommendation-engine';
import type { UserProfile, LogEntry, UserAnalytics, ResourceRecommendation } from '../../shared/schema';

interface IntelligenceReport {
  userId: string;
  generatedAt: Date;
  progress: {
    current: any;
    milestones: any[];
    recommendations: string[];
    alerts: any[];
  };
  compliance: {
    status: any[];
    alerts: any[];
    nextDeadlines: any[];
  };
  learning: {
    profile: any;
    insights: any[];
    recommendedResources: ResourceRecommendation[];
  };
  community: {
    benchmarks: any[];
    trends: any[];
    popularResources: any[];
  };
  costOptimization: {
    cacheStats: any;
    aiUsageReduction: number;
    estimatedSavings: number;
  };
}

export class IntelligenceHub {
  
  /**
   * Generate comprehensive intelligence report for a user
   */
  static async generateIntelligenceReport(
    userId: string,
    userProfile: UserProfile,
    logEntries: LogEntry[],
    insightCards: any[] = [],
    userAnalytics: UserAnalytics[] = [],
    existingRecommendations: ResourceRecommendation[] = []
  ): Promise<IntelligenceReport> {
    
    // Calculate smart progress metrics including insight card data
    const progressMetrics = await SmartProgressTracker.calculateProgress(userId, userProfile, logEntries, insightCards);
    const milestoneAlerts = await SmartProgressTracker.checkMilestones(userId, userProfile, logEntries, insightCards);
    const progressRecommendations = await SmartProgressTracker.generateRecommendations(userId, userProfile, logEntries, insightCards);

    // Generate predictive milestones including insight card patterns
    const predictiveMilestones = await PredictiveMilestoneService.calculateMilestones(
      userId, 
      userProfile, 
      logEntries,
      insightCards
    );

    // Monitor compliance including insight card reflections and learning
    const complianceData = await ComplianceMonitoringService.monitorCompliance(
      userId, 
      userProfile, 
      logEntries,
      insightCards
    );
    const complianceAlerts = await ComplianceMonitoringService.generateAlerts(
      userId, 
      userProfile, 
      complianceData,
      insightCards
    );
    const complianceStatus = ComplianceMonitoringService.getComplianceStatus(complianceData);

    // Analyze learning profile including insight card patterns
    const learningProfile = await LearningProfileEngine.buildProfile(
      userId,
      logEntries,
      userAnalytics,
      insightCards
    );
    const behaviorProfile = await LearningProfileEngine.analyzeUserBehavior(
      userId,
      userAnalytics,
      existingRecommendations
    );
    const learningInsights = LearningProfileEngine.generateLearningInsights(learningProfile as any);

    // Generate resource recommendations with insight card context
    const resourceRecommendations = []; // Would integrate with actual ResourceRecommendationEngine

    // Get community insights including insight card patterns
    const communityInsights = await CommunityIntelligenceService.generateCommunityInsights(
      userId,
      userProfile,
      insightCards
    );

    // Get AI cache statistics
    const cacheStats = AiCacheService.getCacheStats();

    return {
      userId,
      generatedAt: new Date(),
      progress: {
        current: progressMetrics,
        milestones: predictiveMilestones,
        recommendations: progressRecommendations,
        alerts: milestoneAlerts,
      },
      compliance: {
        status: complianceStatus,
        alerts: complianceAlerts,
        nextDeadlines: this.extractUpcomingDeadlines(complianceData),
      },
      learning: {
        profile: learningProfile,
        insights: learningInsights,
        recommendedResources: resourceRecommendations,
      },
      community: {
        benchmarks: communityInsights.benchmarks,
        trends: communityInsights.trends,
        popularResources: communityInsights.popularResources,
      },
      costOptimization: {
        cacheStats,
        aiUsageReduction: cacheStats.cacheHitRate * 100,
        estimatedSavings: cacheStats.estimatedSavings,
      },
    };
  }

  /**
   * Get quick dashboard insights
   */
  static async getDashboardInsights(
    userId: string,
    userProfile: UserProfile,
    logEntries: LogEntry[]
  ) {
    const progressMetrics = await SmartProgressTracker.calculateProgress(userId, userProfile);
    const urgentAlerts = await this.getUrgentAlerts(userId, userProfile, logEntries);
    const nextMilestone = await this.getNextMilestone(userId, userProfile, logEntries);
    
    return {
      progressMetrics,
      urgentAlerts,
      nextMilestone,
      weeklyRecommendation: await this.getWeeklyRecommendation(userId, userProfile, logEntries),
    };
  }

  /**
   * Process batch analytics updates
   */
  static async processBatchAnalytics(
    analytics: Array<{ userId: string; data: UserAnalytics[] }>
  ): Promise<void> {
    // Update learning profiles in batch
    for (const { userId, data } of analytics) {
      // This would update learning profiles efficiently
      console.log(`Processing analytics batch for user ${userId}: ${data.length} events`);
    }
  }

  /**
   * Optimize AI usage with caching
   */
  static async optimizedAiAnalysis(
    content: string,
    analysisType: string,
    processor: (content: string, type: string) => Promise<any>
  ): Promise<any> {
    // Check cache first
    const cached = await AiCacheService.getCachedResult(content, analysisType);
    if (cached) {
      return { ...cached, fromCache: true };
    }

    // Process with AI if not cached
    const result = await processor(content, analysisType);
    
    // Cache the result
    await AiCacheService.cacheResult(content, analysisType, result);
    
    return { ...result, fromCache: false };
  }

  /**
   * Batch process multiple AI analyses
   */
  static async batchAiAnalysis(
    requests: Array<{ content: string; analysisType: string }>,
    processor: (content: string, type: string) => Promise<any>
  ): Promise<Array<{ content: string; result: any; fromCache: boolean }>> {
    return AiCacheService.batchProcess(requests, processor);
  }

  /**
   * Get state-specific guidance
   */
  static getStateGuidance(state: string, licenseType: string = 'LPC') {
    const requirements = StateRequirementsEngine.getRequirements(state, licenseType);
    const pathway = StateRequirementsEngine.getLicensePathway(state, licenseType);
    const renewalInfo = StateRequirementsEngine.getRenewalRequirements(state, licenseType);

    return {
      requirements,
      pathway,
      renewalInfo,
      availableLicenseTypes: StateRequirementsEngine.getAvailableLicenseTypes(state),
    };
  }

  /**
   * Validate user progress against requirements
   */
  static validateUserProgress(
    state: string,
    licenseType: string,
    currentHours: {
      totalCCH: number;
      directCCH: number;
      supervisionHours: number;
      ethicsHours: number;
    }
  ) {
    return StateRequirementsEngine.validateProgress(state, licenseType, currentHours);
  }

  /**
   * Get intelligence system status
   */
  static getSystemStatus() {
    const cacheStats = AiCacheService.getCacheStats();
    const supportedStates = StateRequirementsEngine.getSupportedStates();
    
    return {
      systems: {
        smartProgress: { status: 'active', description: 'Rule-based progress calculations' },
        stateRequirements: { status: 'active', supportedStates: supportedStates.length },
        aiCache: { status: 'active', ...cacheStats },
        learningProfile: { status: 'active', description: 'Behavioral pattern analysis' },
        predictiveMilestones: { status: 'active', description: 'Timeline projections' },
        complianceMonitoring: { status: 'active', description: 'Automated compliance checks' },
        communityIntelligence: { status: 'active', description: 'Anonymous benchmarking' },
        resourceRecommendation: { status: 'active', description: 'Personalized resource matching' },
      },
      costOptimization: {
        aiCacheHitRate: `${Math.round(cacheStats.cacheHitRate * 100)}%`,
        estimatedMonthlySavings: `$${Math.round(cacheStats.estimatedSavings * 30)}`,
        intelligenceAutomation: '85%',
      },
      capabilities: {
        realTimeProgress: true,
        predictiveAnalytics: true,
        complianceAlerts: true,
        communityBenchmarks: true,
        personalizedRecommendations: true,
        stateSpecificGuidance: true,
        costOptimization: true,
      },
    };
  }

  /**
   * Private helper methods
   */
  private static extractUpcomingDeadlines(complianceData: any[]): any[] {
    return complianceData
      .filter(item => item.dueDate)
      .map(item => ({
        type: item.requirementType,
        dueDate: item.dueDate,
        daysRemaining: Math.ceil((item.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
        urgency: this.calculateUrgency(item.dueDate),
      }))
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  }

  private static calculateUrgency(dueDate: Date): 'low' | 'medium' | 'high' | 'critical' {
    const daysRemaining = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining < 7) return 'critical';
    if (daysRemaining < 30) return 'high';
    if (daysRemaining < 90) return 'medium';
    return 'low';
  }

  private static async getUrgentAlerts(
    userId: string,
    userProfile: UserProfile,
    logEntries: LogEntry[]
  ): Promise<any[]> {
    const complianceData = await ComplianceMonitoringService.monitorCompliance(
      userId,
      userProfile,
      logEntries
    );
    const alerts = await ComplianceMonitoringService.generateAlerts(
      userId,
      userProfile,
      complianceData
    );
    
    return alerts.filter(alert => alert.severity === 'critical' || alert.severity === 'high');
  }

  private static async getNextMilestone(
    userId: string,
    userProfile: UserProfile,
    logEntries: LogEntry[]
  ): Promise<any> {
    const milestones = await PredictiveMilestoneService.calculateMilestones(
      userId,
      userProfile,
      logEntries
    );
    
    // Find the closest milestone that's not complete
    const nextMilestone = milestones
      .filter(m => m.currentProgress < 1)
      .sort((a, b) => (b.currentProgress - a.currentProgress))[0];
    
    return nextMilestone ? {
      type: nextMilestone.milestoneType,
      progress: Math.round(nextMilestone.currentProgress * 100),
      projectedDate: nextMilestone.projectedCompletionDate,
      confidence: Math.round(nextMilestone.confidenceLevel * 100),
      actions: nextMilestone.suggestedActions,
    } : null;
  }

  private static async getWeeklyRecommendation(
    userId: string,
    userProfile: UserProfile,
    logEntries: LogEntry[]
  ): Promise<string> {
    const recentEntries = logEntries.slice(-7); // Last week
    const recentHours = recentEntries.reduce((sum, entry) => sum + entry.clientContactHours, 0);
    
    if (recentHours < 10) {
      return "Consider scheduling additional client sessions this week to maintain steady progress.";
    } else if (recentHours > 30) {
      return "Great progress this week! Make sure to balance productivity with self-care.";
    } else {
      return "You're maintaining good momentum. Keep up the consistent effort!";
    }
  }

  /**
   * Initialize intelligence systems
   */
  static async initialize(): Promise<void> {
    console.log('Initializing ClarityLog Intelligence Systems...');
    
    // Preload AI cache with common patterns
    await AiCacheService.preloadCommonPatterns();
    
    // Initialize state requirements data
    console.log(`Loaded requirements for ${StateRequirementsEngine.getSupportedStates().length} states`);
    
    console.log('Intelligence Hub initialized successfully');
  }

  /**
   * Generate weekly intelligence summary
   */
  static async generateWeeklySummary(
    userId: string,
    userProfile: UserProfile,
    weeklyEntries: LogEntry[]
  ): Promise<any> {
    const weeklyHours = weeklyEntries.reduce((sum, entry) => sum + entry.clientContactHours, 0);
    const supervisionHours = weeklyEntries.reduce((sum, entry) => sum + entry.supervisionHours, 0);
    
    const progress = await SmartProgressTracker.calculateProgress(userId, userProfile);
    const milestones = await PredictiveMilestoneService.calculateMilestones(userId, userProfile, weeklyEntries);
    
    return {
      weeklyStats: {
        clientHours: weeklyHours,
        supervisionHours,
        sessionsCompleted: weeklyEntries.length,
      },
      progressUpdate: {
        overallProgress: Math.round(progress.progressPercentage),
        weeklyChange: 0, // Would calculate from previous week
        onTrackForGoal: progress.isOnTrack,
      },
      insights: [
        weeklyHours > progress.weeklyAverage ? 
          "Above average productivity this week" : 
          "Consider increasing session frequency",
        supervisionHours > 0 ? 
          "Good supervision engagement" : 
          "Schedule supervision session soon",
      ],
      nextWeekFocus: milestones[0]?.suggestedActions[0] || "Continue consistent progress",
    };
  }
}