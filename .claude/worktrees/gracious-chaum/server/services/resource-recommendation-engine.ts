import type { ResourceRecommendation, UserLearningProfile, LogEntry, UserProfile } from '../../shared/schema';
import { CommunityIntelligenceService } from './community-intelligence-service';
import { LearningProfileEngine } from './learning-profile-engine';

interface ResourceCatalog {
  id: string;
  type: string;
  title: string;
  description: string;
  url: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // minutes
  prerequisites: string[];
  relevanceFactors: string[];
}

interface RecommendationContext {
  userProfile: UserProfile;
  learningProfile?: UserLearningProfile;
  recentEntries: LogEntry[];
  strugglingAreas: string[];
  competencyGaps: string[];
  currentProgress: any;
}

export class ResourceRecommendationEngine {
  
  // Resource catalog - would be populated from database in production
  private static readonly RESOURCE_CATALOG: ResourceCatalog[] = [
    {
      id: 'ethics-clinical-practice',
      type: 'course',
      title: 'Ethics in Clinical Practice',
      description: 'Comprehensive training on ethical decision-making in therapy settings',
      url: 'https://example.com/ethics-course',
      tags: ['ethics', 'clinical', 'decision-making', 'boundaries'],
      difficulty: 'intermediate',
      estimatedDuration: 360, // 6 hours
      prerequisites: ['basic-counseling-theory'],
      relevanceFactors: ['ethics_hours', 'professional_development'],
    },
    {
      id: 'supervision-skills',
      type: 'workshop',
      title: 'Effective Supervision Strategies',
      description: 'Learn to maximize the value of your supervision sessions',
      url: 'https://example.com/supervision-workshop',
      tags: ['supervision', 'professional-growth', 'communication'],
      difficulty: 'beginner',
      estimatedDuration: 120, // 2 hours
      prerequisites: [],
      relevanceFactors: ['supervision_frequency', 'supervision_quality'],
    },
    {
      id: 'documentation-templates',
      type: 'tool',
      title: 'Session Documentation Templates',
      description: 'Professional templates for consistent session documentation',
      url: 'https://example.com/templates',
      tags: ['documentation', 'efficiency', 'compliance'],
      difficulty: 'beginner',
      estimatedDuration: 30,
      prerequisites: [],
      relevanceFactors: ['session_consistency', 'documentation_quality'],
    },
    {
      id: 'trauma-informed-care',
      type: 'article',
      title: 'Trauma-Informed Care Principles',
      description: 'Essential principles for working with trauma survivors',
      url: 'https://example.com/trauma-care',
      tags: ['trauma', 'care-principles', 'safety', 'therapeutic-relationship'],
      difficulty: 'intermediate',
      estimatedDuration: 45,
      prerequisites: ['basic-counseling-theory'],
      relevanceFactors: ['client_population', 'therapeutic_skills'],
    },
    {
      id: 'cbt-techniques',
      type: 'video',
      title: 'CBT Intervention Techniques',
      description: 'Practical demonstration of cognitive-behavioral interventions',
      url: 'https://example.com/cbt-video',
      tags: ['cbt', 'interventions', 'techniques', 'practical'],
      difficulty: 'intermediate',
      estimatedDuration: 90,
      prerequisites: ['cbt-foundations'],
      relevanceFactors: ['therapeutic_modalities', 'intervention_skills'],
    },
    {
      id: 'group-therapy-dynamics',
      type: 'course',
      title: 'Group Therapy Dynamics',
      description: 'Understanding and facilitating therapeutic groups',
      url: 'https://example.com/group-therapy',
      tags: ['group-therapy', 'dynamics', 'facilitation', 'process'],
      difficulty: 'advanced',
      estimatedDuration: 480, // 8 hours
      prerequisites: ['individual-therapy-skills', 'group-theory'],
      relevanceFactors: ['group_experience', 'facilitation_skills'],
    },
  ];

  /**
   * Generate personalized resource recommendations
   */
  static async generateRecommendations(
    userId: string,
    context: RecommendationContext,
    maxRecommendations: number = 5
  ): Promise<ResourceRecommendation[]> {
    // Score all available resources
    const scoredResources = await this.scoreResources(context);
    
    // Filter and sort by relevance
    const topResources = scoredResources
      .filter(resource => resource.score > 0.3) // Minimum relevance threshold
      .sort((a, b) => b.score - a.score)
      .slice(0, maxRecommendations);

    // Convert to recommendation objects
    const recommendations: ResourceRecommendation[] = [];
    
    for (const { resource, score, reason } of topResources) {
      recommendations.push({
        id: crypto.randomUUID(),
        userId,
        resourceType: resource.type,
        resourceId: resource.id,
        title: resource.title,
        description: resource.description,
        url: resource.url,
        relevanceScore: score,
        recommendationReason: reason,
        recommendedAt: new Date(),
        tags: resource.tags,
        createdAt: new Date(),
      });
    }

    return recommendations;
  }

  /**
   * Score resources based on user context
   */
  private static async scoreResources(
    context: RecommendationContext
  ): Promise<Array<{ resource: ResourceCatalog; score: number; reason: string }>> {
    const scoredResources: Array<{ resource: ResourceCatalog; score: number; reason: string }> = [];

    for (const resource of this.RESOURCE_CATALOG) {
      const score = await this.calculateResourceScore(resource, context);
      const reason = this.generateRecommendationReason(resource, context, score);
      
      scoredResources.push({ resource, score, reason });
    }

    return scoredResources;
  }

  /**
   * Calculate relevance score for a resource
   */
  private static async calculateResourceScore(
    resource: ResourceCatalog,
    context: RecommendationContext
  ): Promise<number> {
    let score = 0;

    // Base relevance from tags and current needs
    score += this.calculateBaseRelevance(resource, context) * 0.3;

    // Learning style compatibility
    if (context.learningProfile) {
      score += this.calculateLearningStyleMatch(resource, context.learningProfile) * 0.2;
    }

    // Progress-based relevance
    score += this.calculateProgressRelevance(resource, context) * 0.2;

    // Community popularity
    score += this.calculateCommunityRelevance(resource, context) * 0.15;

    // Difficulty appropriateness
    score += this.calculateDifficultyMatch(resource, context) * 0.1;

    // Timing appropriateness
    score += this.calculateTimingRelevance(resource, context) * 0.05;

    return Math.min(1, Math.max(0, score));
  }

  /**
   * Calculate base relevance from tags and needs
   */
  private static calculateBaseRelevance(
    resource: ResourceCatalog,
    context: RecommendationContext
  ): number {
    let relevance = 0;

    // Check struggling areas
    for (const area of context.strugglingAreas) {
      if (resource.tags.some(tag => tag.includes(area.toLowerCase()))) {
        relevance += 0.8;
      }
    }

    // Check competency gaps
    for (const gap of context.competencyGaps) {
      if (resource.tags.some(tag => tag.includes(gap.toLowerCase()))) {
        relevance += 0.7;
      }
    }

    // Check state-specific needs
    if (context.userProfile.stateRegion === 'Texas' && resource.tags.includes('ethics')) {
      relevance += 0.6; // Texas has specific ethics requirements
    }

    // Check professional development needs
    if (resource.tags.includes('professional-development') || resource.tags.includes('ethics')) {
      const ethicsProgress = context.currentProgress?.ethics || 0;
      if (ethicsProgress < 0.5) {
        relevance += 0.5;
      }
    }

    return Math.min(1, relevance);
  }

  /**
   * Calculate learning style compatibility
   */
  private static calculateLearningStyleMatch(
    resource: ResourceCatalog,
    learningProfile: UserLearningProfile
  ): number {
    if (!learningProfile.learningStyle) return 0.5; // Neutral if unknown

    const styleMatches: Record<string, string[]> = {
      visual: ['video', 'diagram', 'infographic'],
      auditory: ['podcast', 'audio', 'webinar'],
      kinesthetic: ['tool', 'exercise', 'interactive'],
      reading: ['article', 'book', 'text', 'course'],
    };

    const preferredTypes = styleMatches[learningProfile.learningStyle] || [];
    
    if (preferredTypes.includes(resource.type)) {
      return 1;
    }
    
    // Check if resource type is in user's preferred types
    if (learningProfile.preferredResourceTypes.includes(resource.type)) {
      return 0.8;
    }

    return 0.3;
  }

  /**
   * Calculate progress-based relevance
   */
  private static calculateProgressRelevance(
    resource: ResourceCatalog,
    context: RecommendationContext
  ): number {
    let relevance = 0;

    // Check supervision needs
    const supervisionProgress = context.currentProgress?.supervision || 0;
    if (supervisionProgress < 0.8 && resource.tags.includes('supervision')) {
      relevance += 0.8;
    }

    // Check ethics needs
    const ethicsProgress = context.currentProgress?.ethics || 0;
    if (ethicsProgress < 1 && resource.tags.includes('ethics')) {
      relevance += 0.7;
    }

    // Check documentation needs
    const recentSessions = context.recentEntries.length;
    if (recentSessions > 5 && resource.tags.includes('documentation')) {
      relevance += 0.6;
    }

    // Check overall progress stage
    const overallProgress = context.currentProgress?.overall || 0;
    if (overallProgress < 0.25 && resource.difficulty === 'beginner') {
      relevance += 0.5;
    } else if (overallProgress > 0.75 && resource.difficulty === 'advanced') {
      relevance += 0.5;
    } else if (overallProgress >= 0.25 && overallProgress <= 0.75 && resource.difficulty === 'intermediate') {
      relevance += 0.5;
    }

    return Math.min(1, relevance);
  }

  /**
   * Calculate community popularity relevance
   */
  private static calculateCommunityRelevance(
    resource: ResourceCatalog,
    context: RecommendationContext
  ): number {
    // Get popular resources from community
    const popularResources = CommunityIntelligenceService.getPopularResources(
      context.userProfile.stateRegion,
      'LPC'
    );

    const popularResource = popularResources.find(pr => pr.title === resource.title);
    
    if (popularResource) {
      // Scale based on success rate and usage
      return (popularResource.successRate * 0.7) + (Math.min(1, popularResource.usageCount / 100) * 0.3);
    }

    return 0.3; // Default for unknown resources
  }

  /**
   * Calculate difficulty appropriateness
   */
  private static calculateDifficultyMatch(
    resource: ResourceCatalog,
    context: RecommendationContext
  ): number {
    const overallProgress = context.currentProgress?.overall || 0;
    const experienceLevel = context.userProfile.yearsOfExperience;

    // Map experience and progress to difficulty preference
    let preferredDifficulty: string;
    
    if (overallProgress < 0.25 || experienceLevel === '0-1') {
      preferredDifficulty = 'beginner';
    } else if (overallProgress > 0.75 || experienceLevel === '3+') {
      preferredDifficulty = 'advanced';
    } else {
      preferredDifficulty = 'intermediate';
    }

    if (resource.difficulty === preferredDifficulty) {
      return 1;
    } else if (
      (resource.difficulty === 'beginner' && preferredDifficulty === 'intermediate') ||
      (resource.difficulty === 'intermediate' && preferredDifficulty === 'beginner') ||
      (resource.difficulty === 'intermediate' && preferredDifficulty === 'advanced') ||
      (resource.difficulty === 'advanced' && preferredDifficulty === 'intermediate')
    ) {
      return 0.6;
    }

    return 0.2;
  }

  /**
   * Calculate timing relevance
   */
  private static calculateTimingRelevance(
    resource: ResourceCatalog,
    context: RecommendationContext
  ): number {
    // Check if user has time for this resource
    if (context.learningProfile?.engagementPatterns) {
      const avgDuration = Object.values(context.learningProfile.engagementPatterns)
        .reduce((sum: number, pattern: any) => sum + (pattern.averageDuration || 0), 0) / 
        Object.keys(context.learningProfile.engagementPatterns).length;

      if (resource.estimatedDuration <= avgDuration * 1.5) {
        return 1;
      } else if (resource.estimatedDuration <= avgDuration * 3) {
        return 0.6;
      } else {
        return 0.3;
      }
    }

    // Default timing score for shorter resources
    if (resource.estimatedDuration <= 60) return 0.8;
    if (resource.estimatedDuration <= 180) return 0.6;
    return 0.4;
  }

  /**
   * Generate human-readable recommendation reason
   */
  private static generateRecommendationReason(
    resource: ResourceCatalog,
    context: RecommendationContext,
    score: number
  ): string {
    const reasons: string[] = [];

    // Primary reason based on highest scoring factor
    if (context.strugglingAreas.some(area => resource.tags.includes(area.toLowerCase()))) {
      reasons.push(`Addresses an area you've been working on: ${resource.tags.find(tag => 
        context.strugglingAreas.some(area => tag.includes(area.toLowerCase()))
      )}`);
    }

    if (context.learningProfile?.learningStyle) {
      const styleMatches: Record<string, string[]> = {
        visual: ['video', 'diagram'],
        auditory: ['podcast', 'audio'],
        kinesthetic: ['tool', 'exercise'],
        reading: ['article', 'course'],
      };
      
      if (styleMatches[context.learningProfile.learningStyle]?.includes(resource.type)) {
        reasons.push(`Matches your ${context.learningProfile.learningStyle} learning style`);
      }
    }

    // Progress-based reasons
    const ethicsProgress = context.currentProgress?.ethics || 0;
    if (ethicsProgress < 1 && resource.tags.includes('ethics')) {
      reasons.push('Helps complete your ethics training requirement');
    }

    const supervisionProgress = context.currentProgress?.supervision || 0;
    if (supervisionProgress < 0.8 && resource.tags.includes('supervision')) {
      reasons.push('Supports your supervision goals');
    }

    // Community-based reason
    const popularResources = CommunityIntelligenceService.getPopularResources(
      context.userProfile.stateRegion
    );
    if (popularResources.some(pr => pr.title === resource.title)) {
      reasons.push('Popular among professionals in your state');
    }

    // Fallback reason
    if (reasons.length === 0) {
      reasons.push(`Relevant to your current stage in the licensure process`);
    }

    return reasons.join('. ');
  }

  /**
   * Track resource engagement for future recommendations
   */
  static async trackResourceEngagement(
    recommendationId: string,
    engagementType: 'viewed' | 'started' | 'completed' | 'rated',
    metadata?: any
  ): Promise<void> {
    // This would update the recommendation record in the database
    console.log(`Tracking engagement: ${engagementType} for recommendation ${recommendationId}`);
    
    // Update learning profile based on engagement
    if (metadata?.userId) {
      await this.updateLearningProfileFromEngagement(metadata.userId, engagementType, metadata);
    }
  }

  /**
   * Update learning profile based on resource engagement
   */
  private static async updateLearningProfileFromEngagement(
    userId: string,
    engagementType: string,
    metadata: any
  ): Promise<void> {
    // This would analyze engagement patterns and update the user's learning profile
    console.log(`Updating learning profile for user ${userId} based on ${engagementType}`);
  }

  /**
   * Get resource effectiveness analytics
   */
  static getResourceAnalytics(): {
    mostEffective: ResourceCatalog[];
    leastEffective: ResourceCatalog[];
    byCategory: Record<string, { completionRate: number; averageRating: number }>;
  } {
    // This would analyze actual usage data in production
    return {
      mostEffective: this.RESOURCE_CATALOG.slice(0, 3),
      leastEffective: this.RESOURCE_CATALOG.slice(-2),
      byCategory: {
        course: { completionRate: 0.78, averageRating: 4.2 },
        article: { completionRate: 0.85, averageRating: 4.0 },
        video: { completionRate: 0.72, averageRating: 4.3 },
        tool: { completionRate: 0.91, averageRating: 4.5 },
      },
    };
  }
}