import { db } from '../db';
import { logEntryTable, supervisionSessionTable, sessionAnalysisTable, aiAnalysisCacheTable, supervisorTable } from '../../shared/schema';
import { eq, desc, and, gte, lte, isNotNull, sql } from 'drizzle-orm';

export interface UnifiedDashboardMetrics {
  // Session Data
  totalSessions: number;
  validSessions: number;
  totalClientHours: number;
  directClientHours: number;
  indirectClientHours: number;
  
  // Supervision Data
  totalSupervisionHours: number;
  activeSupervisors: number;
  supervisionSessions: number;
  supervisionProgress: number;
  
  // Weekly Trends
  thisWeekSessions: number;
  thisWeekClientHours: number;
  thisWeekSupervisionHours: number;
  lastWeekSessions: number;
  lastWeekClientHours: number;
  lastWeekSupervisionHours: number;
  sessionTrend: 'up' | 'down' | 'neutral';
  clientHoursTrend: 'up' | 'down' | 'neutral';
  supervisionTrend: 'up' | 'down' | 'neutral';
  
  // AI Analysis Data
  totalAiAnalyses: number;
  validSessionsWithAnalysis: number;
  analysisCompletionRate: number;
  
  // Clinical Metrics
  overallScore: number;
  clinicalTrend: 'improving' | 'stable' | 'needs_attention';
  
  // Data Quality Indicators
  hasValidData: boolean;
  lastUpdated: string;
  dataQualityScore: number;
}

export class UnifiedDashboardService {
  /**
   * Get comprehensive dashboard metrics for a user
   * This is the single source of truth for all dashboard calculations
   */
  static async getDashboardMetrics(userId: string): Promise<UnifiedDashboardMetrics> {
    try {
      // The app uses Firestore for log entries, so we'll use the storage service instead
      // Get log entries from storage (Firestore)
      const { default: storage } = await import('../storage');
      const logEntries = await storage.getEntriesByUserId(userId) || [];
      
      // Try to fetch from database tables, fallback gracefully if they don't exist
      let supervisionSessions: any[] = [];
      let sessionAnalyses: any[] = [];
      let supervisors: any[] = [];

      try {
        supervisionSessions = await db.select()
          .from(supervisionSessionTable)
          .where(eq(supervisionSessionTable.superviseeId, userId))
          .orderBy(desc(supervisionSessionTable.sessionDate));
      } catch (error) {
        console.log('Supervision sessions table not available, using Firestore data only');
      }

      try {
        sessionAnalyses = await db.select()
          .from(sessionAnalysisTable)
          .where(eq(sessionAnalysisTable.userId, userId));
      } catch (error) {
        console.log('Session analyses table not available, using Firestore data only');
      }

      try {
        supervisors = await db.select()
          .from(supervisorTable)
          .where(eq(supervisorTable.isActive, 'true'));
      } catch (error) {
        console.log('Supervisors table not available, using storage service');
        // Fallback to storage service for supervisors
        try {
          supervisors = await storage.getSupervisorsByUserId(userId);
        } catch (storageError) {
          console.log('Storage supervisors not available either');
        }
      }

      // Calculate session metrics from Firestore log entries
      const validEntries = logEntries.filter(entry => entry.clientContactHours > 0);
      const totalClientHours = logEntries.reduce((sum, entry) => sum + (entry.clientContactHours || 0), 0);
      const directClientHours = logEntries
        .filter(entry => !entry.indirectHours)
        .reduce((sum, entry) => sum + (entry.clientContactHours || 0), 0);
      const indirectClientHours = logEntries
        .filter(entry => entry.indirectHours)
        .reduce((sum, entry) => sum + (entry.clientContactHours || 0), 0);

      // Calculate supervision metrics - consolidate both sources
      const logSupervisionHours = logEntries.reduce((sum, entry) => sum + (entry.supervisionHours || 0), 0);
      const sessionSupervisionHours = supervisionSessions.reduce((sum, session) => {
        const minutes = parseInt(session.durationMinutes) || 0;
        return sum + (minutes / 60);
      }, 0);
      
      // Use the higher value as the authoritative source
      const totalSupervisionHours = Math.max(logSupervisionHours, sessionSupervisionHours);
      
      // Count unique active supervisors from supervision sessions
      const sessionSupervisorIds = new Set(
        supervisionSessions
          .filter(session => session.isCompleted === 'true')
          .map(session => session.supervisorId)
      );
      
      const activeSupervisors = Array.from(sessionSupervisorIds).length;

      // Calculate weekly trends from Firestore entries
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      
      const thisWeekEntries = logEntries.filter(entry => {
        const entryDate = entry.dateOfContact instanceof Date ? entry.dateOfContact : new Date(entry.dateOfContact);
        return entryDate >= weekAgo;
      });
      const lastWeekEntries = logEntries.filter(entry => {
        const entryDate = entry.dateOfContact instanceof Date ? entry.dateOfContact : new Date(entry.dateOfContact);
        return entryDate >= twoWeeksAgo && entryDate < weekAgo;
      });
      
      const thisWeekValidEntries = thisWeekEntries.filter(entry => entry.clientContactHours > 0);
      const lastWeekValidEntries = lastWeekEntries.filter(entry => entry.clientContactHours > 0);
      
      const thisWeekClientHours = thisWeekEntries.reduce((sum, entry) => sum + (entry.clientContactHours || 0), 0);
      const lastWeekClientHours = lastWeekEntries.reduce((sum, entry) => sum + (entry.clientContactHours || 0), 0);
      const thisWeekSupervisionHours = thisWeekEntries.reduce((sum, entry) => sum + (entry.supervisionHours || 0), 0);
      const lastWeekSupervisionHours = lastWeekEntries.reduce((sum, entry) => sum + (entry.supervisionHours || 0), 0);

      // Calculate trends
      const sessionTrend = thisWeekValidEntries.length > lastWeekValidEntries.length ? 'up' : 
                          thisWeekValidEntries.length < lastWeekValidEntries.length ? 'down' : 'neutral';
      const clientHoursTrend = thisWeekClientHours > lastWeekClientHours ? 'up' : 
                              thisWeekClientHours < lastWeekClientHours ? 'down' : 'neutral';
      const supervisionTrend = thisWeekSupervisionHours > lastWeekSupervisionHours ? 'up' : 
                              thisWeekSupervisionHours < lastWeekSupervisionHours ? 'down' : 'neutral';

      // Calculate AI analysis metrics
      const validSessionsWithAnalysis = sessionAnalyses.length;
      const analysisCompletionRate = validEntries.length > 0 
        ? (validSessionsWithAnalysis / validEntries.length) * 100 
        : 0;

      // Calculate supervision progress (assuming 200 hours required)
      const requiredSupervisionHours = 200;
      const supervisionProgress = Math.min((totalSupervisionHours / requiredSupervisionHours) * 100, 100);

      // Calculate clinical metrics - weighted average of various factors
      const sessionQualityScore = validEntries.length > 0 ? 70 : 0; // Base score for having sessions
      const supervisionQualityScore = totalSupervisionHours > 0 ? 85 : 0; // Higher score for supervision
      const aiAnalysisScore = analysisCompletionRate > 50 ? 90 : analysisCompletionRate * 1.8; // Scale analysis completion
      const consistencyScore = sessionTrend !== 'down' ? 80 : 60; // Consistency bonus
      
      const overallScore = Math.round(
        (sessionQualityScore * 0.3 + 
         supervisionQualityScore * 0.3 + 
         aiAnalysisScore * 0.25 + 
         consistencyScore * 0.15)
      );

      const clinicalTrend = overallScore >= 80 ? 'improving' : 
                           overallScore >= 60 ? 'stable' : 'needs_attention';

      // Data quality assessment
      const hasValidData = validEntries.length > 0 || totalSupervisionHours > 0;
      const dataQualityScore = Math.round(
        (validEntries.length > 0 ? 25 : 0) +
        (totalSupervisionHours > 0 ? 25 : 0) +
        (validSessionsWithAnalysis > 0 ? 25 : 0) +
        (activeSupervisors > 0 ? 25 : 0)
      );

      return {
        // Session Data
        totalSessions: logEntries.length,
        validSessions: validEntries.length,
        totalClientHours: Math.round(totalClientHours * 10) / 10,
        directClientHours: Math.round(directClientHours * 10) / 10,
        indirectClientHours: Math.round(indirectClientHours * 10) / 10,
        
        // Supervision Data
        totalSupervisionHours: Math.round(totalSupervisionHours * 10) / 10,
        activeSupervisors,
        supervisionSessions: supervisionSessions.length,
        supervisionProgress: Math.round(supervisionProgress),
        
        // Weekly Trends
        thisWeekSessions: thisWeekValidEntries.length,
        thisWeekClientHours: Math.round(thisWeekClientHours * 10) / 10,
        thisWeekSupervisionHours: Math.round(thisWeekSupervisionHours * 10) / 10,
        lastWeekSessions: lastWeekValidEntries.length,
        lastWeekClientHours: Math.round(lastWeekClientHours * 10) / 10,
        lastWeekSupervisionHours: Math.round(lastWeekSupervisionHours * 10) / 10,
        sessionTrend,
        clientHoursTrend,
        supervisionTrend,
        
        // AI Analysis Data
        totalAiAnalyses: sessionAnalyses.length,
        validSessionsWithAnalysis,
        analysisCompletionRate: Math.round(analysisCompletionRate),
        
        // Clinical Metrics
        overallScore,
        clinicalTrend,
        
        // Data Quality Indicators
        hasValidData,
        lastUpdated: new Date().toISOString(),
        dataQualityScore
      };

    } catch (error) {
      console.error('Error calculating unified dashboard metrics:', error);
      
      // Return safe fallback data
      return {
        totalSessions: 0,
        validSessions: 0,
        totalClientHours: 0,
        directClientHours: 0,
        indirectClientHours: 0,
        totalSupervisionHours: 0,
        activeSupervisors: 0,
        supervisionSessions: 0,
        supervisionProgress: 0,
        thisWeekSessions: 0,
        thisWeekClientHours: 0,
        thisWeekSupervisionHours: 0,
        lastWeekSessions: 0,
        lastWeekClientHours: 0,
        lastWeekSupervisionHours: 0,
        sessionTrend: 'neutral',
        clientHoursTrend: 'neutral',
        supervisionTrend: 'neutral',
        totalAiAnalyses: 0,
        validSessionsWithAnalysis: 0,
        analysisCompletionRate: 0,
        overallScore: 0,
        clinicalTrend: 'needs_attention',
        hasValidData: false,
        lastUpdated: new Date().toISOString(),
        dataQualityScore: 0
      };
    }
  }

  /**
   * Validate that AI coaching insights only reference existing session data
   */
  static async validateAiCoachingData(userId: string): Promise<{
    hasValidSessions: boolean;
    sessionCount: number;
    analysisCount: number;
    canGenerateInsights: boolean;
    minimumDataThreshold: boolean;
  }> {
    try {
      // Use Firestore for log entries and database for session analyses
      const { default: storage } = await import('../storage');
      const logEntries = await storage.getEntriesByUserId(userId) || [];
      const validSessions = logEntries.filter(entry => entry.clientContactHours > 0);
      
      const sessionAnalyses = await db.select()
        .from(sessionAnalysisTable)
        .where(eq(sessionAnalysisTable.userId, userId));

      const sessionCount = validSessions.length;
      const analysisCount = sessionAnalyses.length;
      const minimumDataThreshold = sessionCount >= 3; // Need at least 3 sessions for meaningful insights
      const canGenerateInsights = sessionCount > 0 && analysisCount > 0;

      return {
        hasValidSessions: sessionCount > 0,
        sessionCount,
        analysisCount,
        canGenerateInsights,
        minimumDataThreshold
      };

    } catch (error) {
      console.error('Error validating AI coaching data:', error);
      return {
        hasValidSessions: false,
        sessionCount: 0,
        analysisCount: 0,
        canGenerateInsights: false,
        minimumDataThreshold: false
      };
    }
  }

  /**
   * Get supervision metrics with consistent calculation logic
   */
  static async getSupervisionMetrics(userId: string): Promise<{
    totalHours: number;
    sessionsThisMonth: number;
    activeSupervisors: number;
    progressPercentage: number;
    dataSource: 'unified' | 'fallback';
  }> {
    try {
      // Get data from unified metrics to ensure consistency
      const unifiedMetrics = await this.getDashboardMetrics(userId);
      
      // Calculate sessions this month from supervision sessions
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const monthSessions = await db.select()
        .from(supervisionSessionTable)
        .where(and(
          eq(supervisionSessionTable.superviseeId, userId),
          gte(supervisionSessionTable.sessionDate, startOfMonth),
          lte(supervisionSessionTable.sessionDate, endOfMonth)
        ));

      return {
        totalHours: unifiedMetrics.totalSupervisionHours,
        sessionsThisMonth: monthSessions.length,
        activeSupervisors: unifiedMetrics.activeSupervisors,
        progressPercentage: unifiedMetrics.supervisionProgress,
        dataSource: 'unified'
      };

    } catch (error) {
      console.error('Error getting supervision metrics:', error);
      return {
        totalHours: 0,
        sessionsThisMonth: 0,
        activeSupervisors: 0,
        progressPercentage: 0,
        dataSource: 'fallback'
      };
    }
  }
}