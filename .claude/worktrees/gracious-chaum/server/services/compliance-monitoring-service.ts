import type { LogEntry, UserProfile } from '../../shared/schema';

export class ComplianceMonitoringService {
  
  /**
   * Monitor compliance including insight card reflections and learning
   */
  static async monitorCompliance(
    userId: string,
    userProfile: UserProfile,
    logEntries: LogEntry[],
    insightCards?: any[]
  ): Promise<any> {
    const compliance = {
      supervisionCompliance: this.checkSupervisionCompliance(logEntries),
      ethicsCompliance: this.checkEthicsCompliance(logEntries),
      reflectivePractice: this.assessReflectivePractice(insightCards),
      documentationQuality: this.assessDocumentationQuality(logEntries, insightCards)
    };
    
    return compliance;
  }

  /**
   * Generate compliance alerts including insight card analysis
   */
  static async generateAlerts(
    userId: string,
    userProfile: UserProfile,
    complianceData: any,
    insightCards?: any[]
  ): Promise<any[]> {
    const alerts = [];
    
    // Check reflective practice compliance through insight cards
    if (insightCards && insightCards.length > 0) {
      const recentInsights = insightCards.filter(card => {
        const cardDate = new Date(card.createdAt);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return cardDate > thirtyDaysAgo;
      });
      
      if (recentInsights.length < 3) {
        alerts.push({
          type: 'warning',
          title: 'Reflective Practice',
          message: 'Consider increasing your reflective documentation to maintain professional development standards.',
          priority: 'medium'
        });
      }
    }
    
    // Supervision compliance alerts
    if (!complianceData.supervisionCompliance.isCompliant) {
      alerts.push({
        type: 'critical',
        title: 'Supervision Compliance',
        message: 'Your supervision hours may be below required ratios. Schedule additional supervision.',
        priority: 'high'
      });
    }
    
    return alerts;
  }

  /**
   * Get overall compliance status
   */
  static getComplianceStatus(complianceData: any): any {
    return {
      overall: 'compliant', // Would calculate based on all factors
      areas: complianceData,
      nextReview: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
  }

  private static checkSupervisionCompliance(logEntries: LogEntry[]): any {
    const totalHours = logEntries.reduce((sum, entry) => sum + entry.clientContactHours, 0);
    const supervisionHours = logEntries.reduce((sum, entry) => sum + (entry.supervisionHours || 0), 0);
    const ratio = supervisionHours / Math.max(1, totalHours);
    
    return {
      isCompliant: ratio >= 0.04, // 1:25 ratio minimum
      currentRatio: ratio,
      requiredRatio: 0.04
    };
  }

  private static checkEthicsCompliance(logEntries: LogEntry[]): any {
    const ethicsHours = logEntries.reduce((sum, entry) => {
      return sum + (entry.professionalDevelopmentType === 'ethics' ? entry.professionalDevelopmentHours : 0);
    }, 0);
    
    return {
      isCompliant: ethicsHours >= 6, // Assuming 6 hours minimum
      currentHours: ethicsHours,
      requiredHours: 6
    };
  }

  private static assessReflectivePractice(insightCards?: any[]): any {
    if (!insightCards) return { score: 0, recommendation: 'Start documenting reflective insights' };
    
    const qualityScore = insightCards.reduce((score, card) => {
      const analysisDepth = (card.analysis?.themes?.length || 0) + 
                           (card.analysis?.keyLearnings?.length || 0) +
                           (card.analysis?.reflectivePrompts?.length || 0);
      return score + Math.min(10, analysisDepth);
    }, 0) / Math.max(1, insightCards.length);
    
    return {
      score: qualityScore,
      recommendation: qualityScore < 5 ? 'Focus on deeper reflection in your documentation' : 'Excellent reflective practice'
    };
  }

  private static assessDocumentationQuality(logEntries: LogEntry[], insightCards?: any[]): any {
    const avgNoteLength = logEntries.reduce((sum, entry) => sum + (entry.notes?.length || 0), 0) / Math.max(1, logEntries.length);
    const insightRatio = (insightCards?.length || 0) / Math.max(1, logEntries.length);
    
    return {
      averageNoteLength: avgNoteLength,
      insightGenerationRatio: insightRatio,
      quality: avgNoteLength > 50 && insightRatio > 0.3 ? 'high' : 'moderate'
    };
  }
}