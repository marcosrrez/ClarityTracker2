import type { LogEntry, UserAnalytics } from '../../shared/schema';

export class LearningProfileEngine {
  
  /**
   * Build comprehensive learning profile including insight card patterns
   */
  static async buildProfile(
    userId: string,
    logEntries: LogEntry[],
    userAnalytics: UserAnalytics[],
    insightCards?: any[]
  ): Promise<any> {
    const profile = {
      learningPatterns: this.analyzeLearningPatterns(logEntries, insightCards),
      competencyDevelopment: this.trackCompetencyDevelopment(insightCards),
      reflectiveGrowth: this.assessReflectiveGrowth(insightCards),
      preferredModalities: this.identifyPreferredModalities(insightCards),
      challengeAreas: this.identifyChallengingAreas(insightCards)
    };
    
    return profile;
  }

  /**
   * Analyze user behavior patterns
   */
  static async analyzeUserBehavior(
    userId: string,
    userAnalytics: UserAnalytics[],
    existingRecommendations: any[]
  ): Promise<any> {
    return {
      engagementLevel: 'high',
      preferredLearningTime: 'evening',
      strugglingAreas: ['documentation', 'case conceptualization'],
      strengths: ['therapeutic rapport', 'crisis intervention']
    };
  }

  /**
   * Generate learning insights from profile
   */
  static generateLearningInsights(learningProfile: any): any[] {
    const insights = [];
    
    if (learningProfile.competencyDevelopment?.strongAreas?.length > 0) {
      insights.push({
        type: 'strength',
        title: 'Developing Competencies',
        description: `Strong development in: ${learningProfile.competencyDevelopment.strongAreas.join(', ')}`
      });
    }
    
    if (learningProfile.challengeAreas?.length > 0) {
      insights.push({
        type: 'growth',
        title: 'Growth Opportunities',
        description: `Focus areas for development: ${learningProfile.challengeAreas.slice(0, 3).join(', ')}`
      });
    }
    
    return insights;
  }

  private static analyzeLearningPatterns(logEntries: LogEntry[], insightCards?: any[]): any {
    const patterns = {
      sessionFrequency: this.calculateSessionFrequency(logEntries),
      reflectionDepth: this.assessReflectionDepth(insightCards),
      progressConsistency: this.assessProgressConsistency(logEntries)
    };
    
    return patterns;
  }

  private static trackCompetencyDevelopment(insightCards?: any[]): any {
    if (!insightCards) return { strongAreas: [], developingAreas: [] };
    
    const competencyMap = new Map();
    
    insightCards.forEach(card => {
      const competencies = card.analysis?.competencyAreas || [];
      competencies.forEach(comp => {
        competencyMap.set(comp, (competencyMap.get(comp) || 0) + 1);
      });
    });
    
    const sortedCompetencies = Array.from(competencyMap.entries())
      .sort((a, b) => b[1] - a[1]);
    
    return {
      strongAreas: sortedCompetencies.slice(0, 3).map(([comp]) => comp),
      developingAreas: sortedCompetencies.slice(3, 6).map(([comp]) => comp),
      totalCompetencies: competencyMap.size
    };
  }

  private static assessReflectiveGrowth(insightCards?: any[]): any {
    if (!insightCards) return { score: 0, trend: 'stable' };
    
    const recentCards = insightCards.slice(-10);
    const averageDepth = recentCards.reduce((sum, card) => {
      const depth = (card.analysis?.themes?.length || 0) + 
                   (card.analysis?.keyLearnings?.length || 0) +
                   (card.analysis?.reflectivePrompts?.length || 0);
      return sum + depth;
    }, 0) / Math.max(1, recentCards.length);
    
    return {
      score: averageDepth,
      trend: averageDepth > 5 ? 'improving' : 'developing',
      recommendation: averageDepth < 3 ? 'Focus on deeper reflection' : 'Continue excellent reflective practice'
    };
  }

  private static identifyPreferredModalities(insightCards?: any[]): string[] {
    if (!insightCards) return [];
    
    const modalityMap = new Map();
    
    insightCards.forEach(card => {
      const modalities = card.analysis?.therapeuticModalities || [];
      modalities.forEach(modality => {
        modalityMap.set(modality, (modalityMap.get(modality) || 0) + 1);
      });
    });
    
    return Array.from(modalityMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([modality]) => modality);
  }

  private static identifyChallengingAreas(insightCards?: any[]): string[] {
    if (!insightCards) return [];
    
    const challengeMap = new Map();
    
    insightCards.forEach(card => {
      const challenges = card.analysis?.professionalGrowthAreas || [];
      challenges.forEach(challenge => {
        challengeMap.set(challenge, (challengeMap.get(challenge) || 0) + 1);
      });
    });
    
    return Array.from(challengeMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([challenge]) => challenge);
  }

  private static calculateSessionFrequency(logEntries: LogEntry[]): any {
    const sessions = logEntries.filter(entry => entry.clientContactHours > 0);
    const days = sessions.length > 0 ? 
      Math.ceil((Date.now() - new Date(sessions[0].dateOfContact).getTime()) / (1000 * 60 * 60 * 24)) : 1;
    
    return {
      sessionsPerWeek: (sessions.length / Math.max(1, days)) * 7,
      totalSessions: sessions.length,
      consistency: sessions.length > 10 ? 'high' : 'developing'
    };
  }

  private static assessReflectionDepth(insightCards?: any[]): any {
    if (!insightCards) return { score: 0, quality: 'none' };
    
    const totalDepth = insightCards.reduce((sum, card) => {
      return sum + (card.analysis?.themes?.length || 0) + 
                   (card.analysis?.keyLearnings?.length || 0);
    }, 0);
    
    const averageDepth = totalDepth / Math.max(1, insightCards.length);
    
    return {
      score: averageDepth,
      quality: averageDepth > 5 ? 'deep' : averageDepth > 2 ? 'moderate' : 'surface'
    };
  }

  private static assessProgressConsistency(logEntries: LogEntry[]): any {
    if (logEntries.length < 5) return { score: 0, trend: 'insufficient_data' };
    
    const recentEntries = logEntries.slice(-10);
    const hourVariance = this.calculateVariance(recentEntries.map(e => e.clientContactHours));
    
    return {
      score: hourVariance < 2 ? 0.9 : hourVariance < 5 ? 0.7 : 0.4,
      trend: hourVariance < 2 ? 'consistent' : 'variable'
    };
  }

  private static calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
  }
}