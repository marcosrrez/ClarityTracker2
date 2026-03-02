import type { UserProfile } from '../../shared/schema';

export class CommunityIntelligenceService {
  
  /**
   * Generate community insights including insight card patterns
   */
  static async generateCommunityInsights(
    userId: string,
    userProfile: UserProfile,
    insightCards?: any[]
  ): Promise<any> {
    return {
      benchmarks: await this.generateBenchmarks(userProfile, insightCards),
      trends: await this.identifyTrends(insightCards),
      popularResources: await this.getPopularResources()
    };
  }

  private static async generateBenchmarks(userProfile: UserProfile, insightCards?: any[]): Promise<any[]> {
    // Generate benchmarks based on user profile and insight patterns
    return [
      {
        metric: 'reflective_practice',
        userScore: insightCards?.length || 0,
        averageScore: 12,
        percentile: Math.min(95, ((insightCards?.length || 0) / 12) * 100)
      },
      {
        metric: 'competency_development',
        userScore: this.calculateCompetencyScore(insightCards),
        averageScore: 8,
        percentile: 75
      }
    ];
  }

  private static async identifyTrends(insightCards?: any[]): Promise<any[]> {
    if (!insightCards) return [];

    const trends = [];
    const recentCards = insightCards.slice(-10);
    
    // Analyze therapeutic modality trends
    const modalityTrends = this.analyzeTrendingModalities(recentCards);
    if (modalityTrends.length > 0) {
      trends.push({
        type: 'therapeutic_modalities',
        title: 'Trending Approaches',
        data: modalityTrends
      });
    }

    return trends;
  }

  private static async getPopularResources(): Promise<any[]> {
    return [
      {
        title: 'Reflective Practice Guide',
        type: 'article',
        popularity: 85
      },
      {
        title: 'Supervision Best Practices',
        type: 'course',
        popularity: 78
      }
    ];
  }

  private static calculateCompetencyScore(insightCards?: any[]): number {
    if (!insightCards) return 0;
    
    const uniqueCompetencies = new Set();
    insightCards.forEach(card => {
      const competencies = card.analysis?.competencyAreas || [];
      competencies.forEach((comp: string) => uniqueCompetencies.add(comp));
    });
    
    return uniqueCompetencies.size;
  }

  private static analyzeTrendingModalities(cards: any[]): string[] {
    const modalityCount = new Map();
    
    cards.forEach(card => {
      const modalities = card.analysis?.therapeuticModalities || [];
      modalities.forEach((modality: string) => {
        modalityCount.set(modality, (modalityCount.get(modality) || 0) + 1);
      });
    });
    
    return Array.from(modalityCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([modality]) => modality);
  }
}