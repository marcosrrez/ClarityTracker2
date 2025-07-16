import { db } from '../db';
import { 
  logEntriesTable, 
  sessionAnalysisTable, 
  supervisionSessionTable,
  insightCardsTable 
} from '../../shared/schema';
import { eq, desc, and, gte, isNotNull } from 'drizzle-orm';
import { calculateDashboardMetrics } from '../../client/src/lib/dashboard-calculations';
import { storage } from '../storage';

export interface UnifiedDashboardData {
  // Core metrics
  totalClientHours: number;
  directClientHours: number;
  supervisionHours: number;
  ethicsHours: number;
  
  // Progress calculations
  totalCCHProgress: number;
  directCCHProgress: number;
  supervisionProgress: number;
  ethicsProgress: number;
  
  // Supervision metrics
  activeSupervisors: number;
  supervisionTotalHours: number;
  sessionsThisMonth: number;
  supervisionProgressPercentage: number;
  
  // AI metrics (only when real data exists)
  aiInsightCount: number;
  sessionAnalysisCount: number;
  competencyDataAvailable: boolean;
  
  // Data quality indicators
  dataQuality: {
    hasRealSessionData: boolean;
    hasSupervisionData: boolean;
    hasAIAnalysis: boolean;
    sufficientForInsights: boolean;
  };
  
  // Timestamps
  lastUpdated: Date;
  dataVersion: string;
}

export class UnifiedDashboardService {
  /**
   * Get log entries from Firebase (temporary until database migration)
   */
  private static async getLogEntriesFromFirebase(userId: string): Promise<any[]> {
    try {
      // Firebase admin requires proper credentials which aren't available in development
      // For now, return empty array and let the frontend handle Firebase data
      // This is a temporary solution until proper Firebase Admin setup or database migration
      console.log('Firebase admin not configured, returning empty array for log entries');
      return [];
    } catch (error) {
      console.error('Error getting log entries from Firebase:', error);
      return [];
    }
  }

  /**
   * Get comprehensive dashboard data for a user
   * This is the single source of truth for all dashboard metrics
   */
  static async getDashboardData(userId: string): Promise<UnifiedDashboardData> {
    try {
      // CRITICAL: Firebase Admin requires proper credentials not available in development
      // For now, use database storage and let the frontend handle Firebase data directly
      // This maintains data integrity while allowing the unified dashboard to work
      const [logEntries, userProfile, supervisors, sessionAnalyses, insightCards] = await Promise.all([
        storage.getLogEntries(userId),
        storage.getUserTherapyProfile(userId),
        storage.getSupervisorsByUserId(userId),
        this.getSessionAnalyses(userId),
        storage.getInsightCardsByUserId(userId) || []
      ]);

      // Calculate core metrics using existing dashboard calculations
      const coreMetrics = calculateDashboardMetrics(logEntries);
      
      // Get user settings for goals and imported hours (try Firebase first, then database)
      let settings = userProfile || {};
      
      // If database doesn't have settings, try Firebase
      if (!settings || Object.keys(settings).length === 0) {
        try {
          const { getAppSettings } = await import('../lib/firebase-admin');
          const firebaseSettings = await getAppSettings(userId);
          settings = firebaseSettings || {};
        } catch (error) {
          console.error('Error getting settings from Firebase:', error);
        }
      }
      
      // Calculate imported hours
      const importedTotalCCH = settings?.importedHours?.totalCCH || 0;
      const importedDirectCCH = settings?.importedHours?.directCCH || 0;
      const importedSupervisionHours = settings?.importedHours?.supervisionHours || 0;
      const importedEthicsHours = settings?.importedHours?.ethicsHours || 0;
      
      // Final totals
      const totalClientHours = coreMetrics.totalClientHours + importedTotalCCH;
      const directClientHours = coreMetrics.directClientHours + importedDirectCCH;
      const supervisionHours = coreMetrics.totalSupervisionHours + importedSupervisionHours;
      const ethicsHours = importedEthicsHours;
      
      // Goals
      const goalTotalCCH = settings?.goals?.totalCCH || 2000;
      const goalDirectCCH = settings?.goals?.directCCH || 1500;
      const goalSupervisionHours = settings?.goals?.supervisionHours || 200;
      const goalEthicsHours = settings?.goals?.ethicsHours || 20;
      
      // Progress percentages
      const totalCCHProgress = Math.min((totalClientHours / goalTotalCCH) * 100, 100);
      const directCCHProgress = Math.min((directClientHours / goalDirectCCH) * 100, 100);
      const supervisionProgress = Math.min((supervisionHours / goalSupervisionHours) * 100, 100);
      const ethicsProgress = Math.min((ethicsHours / goalEthicsHours) * 100, 100);
      
      // Supervision metrics (unified calculation)
      const activeSupervisors = supervisors.filter((s: any) => s.isActive === true).length;
      const supervisionTotalHours = supervisors.reduce((sum: number, supervisor: any) => {
        return sum + (supervisor.totalHours || 0);
      }, 0);
      
      // Sessions this month calculation
      const currentMonth = new Date();
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const sessionsThisMonth = await this.getSessionsThisMonth(userId, startOfMonth, endOfMonth);
      const supervisionProgressPercentage = Math.min((supervisionTotalHours / 50) * 100, 100);
      
      // AI metrics (only count real data)
      const aiInsightCount = insightCards.length;
      const sessionAnalysisCount = sessionAnalyses.length;
      const competencyDataAvailable = sessionAnalyses.some(analysis => 
        analysis.analysisData && 
        JSON.parse(analysis.analysisData).professionalDevelopment?.competencyScores
      );
      
      // Data quality assessment
      const dataQuality = {
        hasRealSessionData: logEntries.length > 0,
        hasSupervisionData: supervisors.length > 0,
        hasAIAnalysis: sessionAnalyses.length > 0,
        sufficientForInsights: logEntries.length >= 3 && sessionAnalyses.length >= 2
      };
      
      return {
        // Core metrics
        totalClientHours,
        directClientHours,
        supervisionHours,
        ethicsHours,
        
        // Progress calculations
        totalCCHProgress,
        directCCHProgress,
        supervisionProgress,
        ethicsProgress,
        
        // Supervision metrics
        activeSupervisors,
        supervisionTotalHours,
        sessionsThisMonth,
        supervisionProgressPercentage,
        
        // AI metrics
        aiInsightCount,
        sessionAnalysisCount,
        competencyDataAvailable,
        
        // Data quality
        dataQuality,
        
        // Metadata
        lastUpdated: new Date(),
        dataVersion: '1.0.0'
      };
      
    } catch (error) {
      console.error('Error generating unified dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get session analyses for a user
   */
  private static async getSessionAnalyses(userId: string) {
    try {
      return await db.select()
        .from(sessionAnalysisTable)
        .where(eq(sessionAnalysisTable.userId, userId))
        .orderBy(desc(sessionAnalysisTable.sessionDate))
        .limit(50);
    } catch (error) {
      console.error('Error fetching session analyses:', error);
      return [];
    }
  }

  /**
   * Get sessions this month count
   */
  private static async getSessionsThisMonth(userId: string, startOfMonth: Date, endOfMonth: Date): Promise<number> {
    try {
      const supervisionSessions = await db.select()
        .from(supervisionSessionTable)
        .where(
          and(
            eq(supervisionSessionTable.superviseeId, userId),
            gte(supervisionSessionTable.sessionDate, startOfMonth),
            gte(supervisionSessionTable.sessionDate, endOfMonth)
          )
        );
      
      return supervisionSessions.length;
    } catch (error) {
      console.error('Error fetching sessions this month:', error);
      return 0;
    }
  }

  /**
   * Validate that AI coaching insights should be generated
   */
  static async validateAIInsightGeneration(userId: string): Promise<{
    shouldGenerate: boolean;
    reason?: string;
    fallbackMessage?: string;
  }> {
    try {
      const dashboardData = await this.getDashboardData(userId);
      
      // Check if user has sufficient data for meaningful insights
      if (!dashboardData.dataQuality.hasRealSessionData) {
        return {
          shouldGenerate: false,
          reason: 'insufficient_session_data',
          fallbackMessage: 'Complete a few sessions to receive personalized AI insights.'
        };
      }
      
      if (!dashboardData.dataQuality.hasAIAnalysis) {
        return {
          shouldGenerate: false,
          reason: 'no_ai_analysis',
          fallbackMessage: 'Record sessions with AI analysis to receive coaching insights.'
        };
      }
      
      if (!dashboardData.dataQuality.sufficientForInsights) {
        return {
          shouldGenerate: false,
          reason: 'insufficient_data_quality',
          fallbackMessage: 'Continue logging sessions to build your professional development profile.'
        };
      }
      
      return {
        shouldGenerate: true
      };
      
    } catch (error) {
      console.error('Error validating AI insight generation:', error);
      return {
        shouldGenerate: false,
        reason: 'validation_error',
        fallbackMessage: 'Unable to generate insights at this time.'
      };
    }
  }

  /**
   * Get competency data validation
   */
  static async validateCompetencyData(userId: string): Promise<{
    hasCompetencyData: boolean;
    competencyScores: any[];
    evidenceCount: number;
  }> {
    try {
      const dashboardData = await this.getDashboardData(userId);
      const sessionAnalyses = await this.getSessionAnalyses(userId);
      
      const competencyScores: any[] = [];
      let evidenceCount = 0;
      
      sessionAnalyses.forEach(analysis => {
        if (analysis.analysisData) {
          const data = JSON.parse(analysis.analysisData);
          if (data.professionalDevelopment?.competencyScores) {
            competencyScores.push({
              date: analysis.analysisDate,
              scores: data.professionalDevelopment.competencyScores
            });
            evidenceCount++;
          }
        }
      });
      
      return {
        hasCompetencyData: dashboardData.competencyDataAvailable,
        competencyScores,
        evidenceCount
      };
      
    } catch (error) {
      console.error('Error validating competency data:', error);
      return {
        hasCompetencyData: false,
        competencyScores: [],
        evidenceCount: 0
      };
    }
  }

  /**
   * Get clinical metrics with validation
   */
  static async getValidatedClinicalMetrics(userId: string): Promise<{
    metrics: any;
    dataQuality: any;
    basedOnRealData: boolean;
  }> {
    try {
      const dashboardData = await this.getDashboardData(userId);
      const sessionAnalyses = await this.getSessionAnalyses(userId);
      
      // Base clinical metrics
      let clinicalMetrics = {
        overallScore: 75,
        trend: "improving",
        sessionCount: dashboardData.dataQuality.hasRealSessionData ? 
          Math.max(sessionAnalyses.length, 1) : 0,
        breakdown: {
          therapeuticAlliance: 78,
          interventionEffectiveness: 72,
          professionalDevelopment: 80,
          clinicalDocumentation: 75,
          ethicalPractice: 85
        }
      };
      
      // If we have real session analysis data, use it
      if (dashboardData.dataQuality.hasAIAnalysis && sessionAnalyses.length > 0) {
        // Calculate metrics from real session analysis
        const analysisData = sessionAnalyses.map(analysis => {
          try {
            return JSON.parse(analysis.analysisData);
          } catch {
            return null;
          }
        }).filter(Boolean);
        
        if (analysisData.length > 0) {
          // Use real data for clinical metrics
          clinicalMetrics = this.calculateRealClinicalMetrics(analysisData);
          clinicalMetrics.sessionCount = sessionAnalyses.length;
        }
      }
      
      return {
        metrics: clinicalMetrics,
        dataQuality: dashboardData.dataQuality,
        basedOnRealData: dashboardData.dataQuality.hasAIAnalysis
      };
      
    } catch (error) {
      console.error('Error getting validated clinical metrics:', error);
      throw error;
    }
  }

  /**
   * Calculate clinical metrics from real session analysis data
   */
  private static calculateRealClinicalMetrics(analysisData: any[]): any {
    const scores = {
      therapeuticAlliance: [],
      interventionEffectiveness: [],
      professionalDevelopment: [],
      clinicalDocumentation: [],
      ethicalPractice: []
    };
    
    analysisData.forEach(data => {
      if (data.therapeuticAlliance?.score) {
        scores.therapeuticAlliance.push(data.therapeuticAlliance.score);
      }
      if (data.evidenceBasedPractice?.overallEffectiveness) {
        scores.interventionEffectiveness.push(data.evidenceBasedPractice.overallEffectiveness);
      }
      if (data.professionalDevelopment?.overallScore) {
        scores.professionalDevelopment.push(data.professionalDevelopment.overallScore);
      }
      if (data.clinicalDocumentation?.score) {
        scores.clinicalDocumentation.push(data.clinicalDocumentation.score);
      }
      if (data.ethicalConsiderations?.score) {
        scores.ethicalPractice.push(data.ethicalConsiderations.score);
      }
    });
    
    // Calculate averages
    const breakdown = {
      therapeuticAlliance: this.calculateAverage(scores.therapeuticAlliance, 78),
      interventionEffectiveness: this.calculateAverage(scores.interventionEffectiveness, 72),
      professionalDevelopment: this.calculateAverage(scores.professionalDevelopment, 80),
      clinicalDocumentation: this.calculateAverage(scores.clinicalDocumentation, 75),
      ethicalPractice: this.calculateAverage(scores.ethicalPractice, 85)
    };
    
    const overallScore = Math.round(
      Object.values(breakdown).reduce((sum, score) => sum + score, 0) / Object.values(breakdown).length
    );
    
    return {
      overallScore,
      trend: analysisData.length >= 3 ? "actively_developing" : "improving",
      breakdown
    };
  }

  private static calculateAverage(scores: number[], fallback: number): number {
    if (scores.length === 0) return fallback;
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }
}