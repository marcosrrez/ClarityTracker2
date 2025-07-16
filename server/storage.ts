import { 
  feedbackTable, 
  userAnalyticsTable,
  supervisorTable,
  supervisionSessionTable,
  superviseeRelationshipTable,
  competencyAssessmentTable,
  complianceAlertTable,
  competencyFrameworkTable,
  knowledgeEntryTable,
  promptTable,
  reviewTable,
  userTherapyProfileTable,
  supervisionIntelligenceTable,
  competencyAnalysisTable,
  patternAnalysisTable,
  aiInsightsHistoryTable,
  privacySettingsTable,
  dataUsageTrackingTable,
  dataDeletionRequestTable,
  type Feedback, 
  type InsertFeedback, 
  type UserAnalytics, 
  type InsertUserAnalytics,
  type Supervisor,
  type InsertSupervisor,
  type SupervisionSession,
  type InsertSupervisionSession,
  type SuperviseeRelationship,
  type InsertSuperviseeRelationship,
  type CompetencyAssessment,
  type InsertCompetencyAssessment,
  type ComplianceAlert,
  type InsertComplianceAlert,
  type CompetencyFramework,
  type InsertCompetencyFramework,
  type KnowledgeEntry,
  type InsertKnowledgeEntry,
  type Prompt,
  type InsertPrompt,
  type Review,
  type InsertReview,
  type UserTherapyProfile,
  type InsertUserTherapyProfile,
  type SupervisionIntelligence,
  type InsertSupervisionIntelligence,
  type CompetencyAnalysis,
  type InsertCompetencyAnalysis,
  type PatternAnalysis,
  type InsertPatternAnalysis,
  type AiInsightsHistory,
  type InsertAiInsightsHistory,
  type PrivacySettings,
  type InsertPrivacySettings,
  type DataUsageTracking,
  type InsertDataUsageTracking,
  type DataDeletionRequest,
  type InsertDataDeletionRequest
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, gte, lte, isNull, sql } from "drizzle-orm";

export interface IStorage {
  healthCheck(): Promise<boolean>;
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  getFeedback(): Promise<Feedback[]>;
  updateFeedbackStatus(id: string, status: string): Promise<void>;
  trackUserEvent(analytics: InsertUserAnalytics): Promise<void>;
  getAnalytics(): Promise<any>;
  
  // Supervisor functionality
  createSupervisor(supervisor: InsertSupervisor): Promise<Supervisor>;
  getSupervisorsByUserId(userId: string): Promise<Supervisor[]>;
  updateSupervisor(id: string, updates: Partial<Supervisor>): Promise<void>;
  deleteSupervisor(id: string): Promise<void>;
  
  // Supervision functionality
  createSuperviseeRelationship(relationship: InsertSuperviseeRelationship): Promise<SuperviseeRelationship>;
  getSuperviseeRelationships(supervisorId: string): Promise<SuperviseeRelationship[]>;
  updateSuperviseeRelationship(id: string, updates: Partial<SuperviseeRelationship>): Promise<void>;
  
  createSupervisionSession(session: InsertSupervisionSession): Promise<SupervisionSession>;
  getSupervisionSessions(supervisorId: string, superviseeId?: string): Promise<SupervisionSession[]>;
  updateSupervisionSession(id: string, updates: Partial<SupervisionSession>): Promise<void>;
  
  createCompetencyAssessment(assessment: InsertCompetencyAssessment): Promise<CompetencyAssessment>;
  getCompetencyAssessments(supervisorId: string, superviseeId?: string): Promise<CompetencyAssessment[]>;
  updateCompetencyAssessment(id: string, updates: Partial<CompetencyAssessment>): Promise<void>;
  
  getSuperviseeProgress(superviseeId: string): Promise<any>;
  getSupervisionCompliance(supervisorId: string): Promise<any>;
  
  // Enhanced supervision features
  createComplianceAlert(alert: InsertComplianceAlert): Promise<ComplianceAlert>;
  getComplianceAlerts(supervisorId: string, unreadOnly?: boolean): Promise<ComplianceAlert[]>;
  updateComplianceAlert(id: string, updates: Partial<ComplianceAlert>): Promise<void>;
  resolveComplianceAlert(id: string, resolvedBy: string): Promise<void>;
  generateAutomatedAlerts(supervisorId: string): Promise<ComplianceAlert[]>;
  
  createCompetencyFramework(framework: InsertCompetencyFramework): Promise<CompetencyFramework>;
  getCompetencyFrameworks(category?: string): Promise<CompetencyFramework[]>;
  updateCompetencyFramework(id: string, updates: Partial<CompetencyFramework>): Promise<void>;
  
  generateCompetencyReport(superviseeId: string): Promise<any>;
  getSupervisionTrends(supervisorId: string, timeframe?: string): Promise<any>;
  
  // Knowledge Base and Spaced Repetition functionality
  createKnowledgeEntry(entry: InsertKnowledgeEntry): Promise<KnowledgeEntry>;
  getKnowledgeEntries(userId: string): Promise<KnowledgeEntry[]>;
  updateKnowledgeEntry(id: string, updates: Partial<KnowledgeEntry>): Promise<void>;
  deleteKnowledgeEntry(id: string): Promise<void>;
  
  createPrompt(prompt: InsertPrompt): Promise<Prompt>;
  getPrompts(userId: string, knowledgeEntryId?: string): Promise<Prompt[]>;
  getPromptsDueForReview(userId: string): Promise<(Prompt & { nextReviewDate: Date })[]>;
  
  createReview(review: InsertReview): Promise<Review>;
  getReviews(userId: string, promptId?: string): Promise<Review[]>;
  updateReview(id: string, updates: Partial<Review>): Promise<void>;
  
  generatePromptsFromContent(content: string, knowledgeEntryId: string, userId: string): Promise<Prompt[]>;
  
  // Enhanced AI Features
  getUserTherapyProfile(userId: string): Promise<UserTherapyProfile | undefined>;
  createUserTherapyProfile(profile: InsertUserTherapyProfile): Promise<UserTherapyProfile>;
  updateUserTherapyProfile(userId: string, updates: Partial<UserTherapyProfile>): Promise<void>;
  
  getSupervisionIntelligence(userId: string, weekStartDate?: Date): Promise<SupervisionIntelligence[]>;
  createSupervisionIntelligence(intelligence: InsertSupervisionIntelligence): Promise<SupervisionIntelligence>;
  
  getCompetencyAnalysis(userId: string, sessionId?: string): Promise<CompetencyAnalysis[]>;
  createCompetencyAnalysis(analysis: InsertCompetencyAnalysis): Promise<CompetencyAnalysis>;
  
  getPatternAnalysis(userId: string, alertType?: string): Promise<PatternAnalysis[]>;
  createPatternAnalysis(pattern: InsertPatternAnalysis): Promise<PatternAnalysis>;
  updatePatternAnalysis(id: string, updates: Partial<PatternAnalysis>): Promise<void>;
  
  // AI Insights History
  getAiInsightsHistory(userId: string, insightType?: string): Promise<AiInsightsHistory[]>;
  createAiInsight(insight: InsertAiInsightsHistory): Promise<AiInsightsHistory>;
  updateAiInsight(id: string, updates: Partial<AiInsightsHistory>): Promise<void>;
  
  // Session Recording Insights Integration
  generateSessionInsights(sessionRecordingId: string, userId: string): Promise<AiInsightsHistory[]>;
  getInsightCardsByUserId(userId: string, cardTypes?: string[]): Promise<AiInsightsHistory[]>;
  
  // Log Entries functionality
  createLogEntry(entry: any): Promise<any>;
  getLogEntries(userId: string): Promise<any[]>;
  
  // Privacy Settings functionality
  getPrivacySettings(userId: string): Promise<PrivacySettings | undefined>;
  createPrivacySettings(settings: InsertPrivacySettings): Promise<PrivacySettings>;
  updatePrivacySettings(userId: string, updates: Partial<PrivacySettings>): Promise<PrivacySettings>;
  
  // Data Usage Tracking
  getUserDataUsage(userId: string): Promise<any>;
  createDataUsageTracking(tracking: InsertDataUsageTracking): Promise<DataUsageTracking>;
  updateDataUsageTracking(id: string, updates: Partial<DataUsageTracking>): Promise<void>;
  
  // Data Deletion Management
  createDataDeletionRequest(request: InsertDataDeletionRequest): Promise<DataDeletionRequest>;
  updateDataDeletionRequest(id: string, updates: Partial<DataDeletionRequest>): Promise<void>;
  deleteUserRecordings(userId: string): Promise<{ itemsDeleted: number; bytesDeleted: number; auditLog: any[] }>;
  deleteUserTranscripts(userId: string): Promise<{ itemsDeleted: number; bytesDeleted: number; auditLog: any[] }>;
  deleteUserAnalytics(userId: string): Promise<{ itemsDeleted: number; bytesDeleted: number; auditLog: any[] }>;
  deleteAllUserData(userId: string): Promise<{ itemsDeleted: number; bytesDeleted: number; auditLog: any[] }>;
  
  // Data Export
  exportUserData(userId: string): Promise<any>;
  
  // Privacy Audit
  getPrivacyAuditLog(userId: string): Promise<any[]>;
  
  // Data Retention Policies
  applyDataRetentionPolicies(userId: string, retentionDays: number): Promise<{ itemsProcessed: number; itemsDeleted: number; nextReviewDate: Date }>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Database will be initialized through db.ts
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  async createFeedback(feedback: InsertFeedback): Promise<Feedback> {
    const { db } = await import("./db");
    const id = crypto.randomUUID();
    
    const [newFeedback] = await db
      .insert(feedbackTable)
      .values({
        id,
        ...feedback,
      })
      .returning();
    
    return newFeedback as any;
  }

  async getFeedback(): Promise<Feedback[]> {
    const { db } = await import("./db");
    return await db.select().from(feedbackTable).orderBy(feedbackTable.createdAt) as any;
  }

  async updateFeedbackStatus(id: string, status: string): Promise<void> {
    const { db } = await import("./db");
    const { eq } = await import("drizzle-orm");
    
    await db
      .update(feedbackTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(feedbackTable.id, id));
  }

  async trackUserEvent(analytics: InsertUserAnalytics): Promise<void> {
    const { db } = await import("./db");
    const id = crypto.randomUUID();
    
    await db
      .insert(userAnalyticsTable)
      .values({
        id,
        ...analytics,
      });
  }

  async getAnalytics(): Promise<any> {
    const { db } = await import("./db");
    const { sql, count } = await import("drizzle-orm");
    
    // Get comprehensive analytics data
    const [
      totalUsers,
      totalSessions,
      totalEvents,
      pageViews,
      topPages,
      userActivity,
      dailyActivity
    ] = await Promise.all([
      // Total unique users
      db.select({ count: sql`COUNT(DISTINCT user_id)` }).from(userAnalyticsTable),
      
      // Total unique sessions
      db.select({ count: sql`COUNT(DISTINCT session_id)` }).from(userAnalyticsTable),
      
      // Total events
      db.select({ count: count() }).from(userAnalyticsTable),
      
      // Page view events
      db.select({ count: count() }).from(userAnalyticsTable).where(sql`event = 'page_view'`),
      
      // Top pages by visits
      db.select({
        page: userAnalyticsTable.page,
        visits: count()
      }).from(userAnalyticsTable)
        .where(sql`event = 'page_view'`)
        .groupBy(userAnalyticsTable.page)
        .orderBy(sql`count(*) DESC`)
        .limit(10),
      
      // User activity breakdown
      db.select({
        event: userAnalyticsTable.event,
        count: count()
      }).from(userAnalyticsTable)
        .groupBy(userAnalyticsTable.event)
        .orderBy(sql`count(*) DESC`),
      
      // Daily activity for last 30 days
      db.select({
        date: sql`DATE(timestamp)`,
        events: count(),
        users: sql`COUNT(DISTINCT user_id)`
      }).from(userAnalyticsTable)
        .where(sql`timestamp >= NOW() - INTERVAL '30 days'`)
        .groupBy(sql`DATE(timestamp)`)
        .orderBy(sql`DATE(timestamp) DESC`)
    ]);

    return {
      summary: {
        totalUsers: totalUsers[0]?.count || 0,
        totalSessions: totalSessions[0]?.count || 0,
        totalEvents: totalEvents[0]?.count || 0,
        totalPageViews: pageViews[0]?.count || 0,
      },
      topPages,
      userActivity,
      dailyActivity: dailyActivity.slice(0, 30), // Last 30 days
    };
  }

  // Supervision functionality implementation
  async createSuperviseeRelationship(relationship: InsertSuperviseeRelationship): Promise<SuperviseeRelationship> {
    const { db } = await import("./db");
    const id = crypto.randomUUID();
    
    const [result] = await db.insert(superviseeRelationshipTable)
      .values({
        ...relationship,
        id,
        startDate: typeof relationship.startDate === 'string' ? new Date(relationship.startDate) : relationship.startDate,
        endDate: relationship.endDate ? (typeof relationship.endDate === 'string' ? new Date(relationship.endDate) : relationship.endDate) : null,
        requiredHours: (relationship.requiredHours || 0).toString(),
        completedHours: (relationship.completedHours || 0).toString(),
        contractSigned: (relationship.contractSigned || false).toString(),
        backgroundCheckCompleted: (relationship.backgroundCheckCompleted || false).toString(),
        licenseVerified: (relationship.licenseVerified || false).toString(),
      })
      .returning();
    
    return {
      ...result,
      requiredHours: parseInt(result.requiredHours),
      completedHours: parseInt(result.completedHours),
      contractSigned: result.contractSigned === 'true',
      backgroundCheckCompleted: result.backgroundCheckCompleted === 'true',
      licenseVerified: result.licenseVerified === 'true',
    };
  }

  // Supervisor methods
  async createSupervisor(supervisorData: InsertSupervisor): Promise<Supervisor> {
    const { db } = await import("./db");
    const id = Date.now().toString();
    
    const [supervisor] = await db
      .insert(supervisorTable)
      .values({
        ...supervisorData,
        id,
        specialties: JSON.stringify(supervisorData.specialties),
        isActive: supervisorData.isActive ? 'true' : 'false',
        totalHours: supervisorData.totalHours.toString(),
      })
      .returning();

    return {
      ...supervisor,
      specialties: JSON.parse(supervisor.specialties),
      isActive: supervisor.isActive === 'true',
      totalHours: parseInt(supervisor.totalHours),
    };
  }

  async getSupervisorsByUserId(userId: string): Promise<Supervisor[]> {
    const { db } = await import("./db");
    
    const results = await db
      .select()
      .from(supervisorTable)
      .where(eq(supervisorTable.userId, userId))
      .orderBy(desc(supervisorTable.createdAt));

    return results.map(result => ({
      ...result,
      specialties: JSON.parse(result.specialties),
      isActive: result.isActive === 'true',
      totalHours: parseInt(result.totalHours),
    }));
  }

  async updateSupervisor(id: string, updates: Partial<Supervisor>): Promise<void> {
    const { db } = await import("./db");
    
    const updateData: any = { ...updates };
    if (updates.specialties) {
      updateData.specialties = JSON.stringify(updates.specialties);
    }
    if (updates.isActive !== undefined) {
      updateData.isActive = updates.isActive ? 'true' : 'false';
    }
    if (updates.totalHours !== undefined) {
      updateData.totalHours = updates.totalHours.toString();
    }

    await db
      .update(supervisorTable)
      .set(updateData)
      .where(eq(supervisorTable.id, id));
  }

  async deleteSupervisor(id: string): Promise<void> {
    const { db } = await import("./db");
    
    await db
      .delete(supervisorTable)
      .where(eq(supervisorTable.id, id));
  }

  async getSuperviseeRelationships(supervisorId: string): Promise<SuperviseeRelationship[]> {
    const { db } = await import("./db");
    const { eq, desc } = await import("drizzle-orm");
    
    const results = await db.select()
      .from(superviseeRelationshipTable)
      .where(eq(superviseeRelationshipTable.supervisorId, supervisorId))
      .orderBy(desc(superviseeRelationshipTable.createdAt));

    return results.map(result => ({
      ...result,
      requiredHours: parseInt(result.requiredHours),
      completedHours: parseInt(result.completedHours),
      contractSigned: result.contractSigned === 'true',
      backgroundCheckCompleted: result.backgroundCheckCompleted === 'true',
      licenseVerified: result.licenseVerified === 'true',
    }));
  }

  async updateSuperviseeRelationship(id: string, updates: Partial<SuperviseeRelationship>): Promise<void> {
    const { db } = await import("./db");
    const { eq } = await import("drizzle-orm");
    
    const updateData: any = { ...updates };
    if (updates.requiredHours !== undefined) updateData.requiredHours = updates.requiredHours.toString();
    if (updates.completedHours !== undefined) updateData.completedHours = updates.completedHours.toString();
    if (updates.contractSigned !== undefined) updateData.contractSigned = updates.contractSigned.toString();
    if (updates.backgroundCheckCompleted !== undefined) updateData.backgroundCheckCompleted = updates.backgroundCheckCompleted.toString();
    if (updates.licenseVerified !== undefined) updateData.licenseVerified = updates.licenseVerified.toString();

    await db.update(superviseeRelationshipTable)
      .set(updateData)
      .where(eq(superviseeRelationshipTable.id, id));
  }

  async createSupervisionSession(session: InsertSupervisionSession): Promise<SupervisionSession> {
    const { db } = await import("./db");
    const id = crypto.randomUUID();
    
    const [result] = await db.insert(supervisionSessionTable)
      .values({
        ...session,
        id,
        durationMinutes: session.durationMinutes.toString(),
        topics: JSON.stringify(session.topics),
        competencyAreas: JSON.stringify(session.competencyAreas),
        actionItems: JSON.stringify(session.actionItems),
        superviseeGoals: JSON.stringify(session.superviseeGoals),
        isCompleted: session.isCompleted.toString(),
      })
      .returning();

    return {
      ...result,
      durationMinutes: parseInt(result.durationMinutes),
      topics: JSON.parse(result.topics || '[]'),
      competencyAreas: JSON.parse(result.competencyAreas || '[]'),
      actionItems: JSON.parse(result.actionItems || '[]'),
      superviseeGoals: JSON.parse(result.superviseeGoals || '[]'),
      isCompleted: result.isCompleted === 'true',
    };
  }

  async getSupervisionSessions(supervisorId: string, superviseeId?: string): Promise<SupervisionSession[]> {
    const { db } = await import("./db");
    const { eq, desc, and } = await import("drizzle-orm");
    
    let whereCondition = eq(supervisionSessionTable.supervisorId, supervisorId);
    if (superviseeId) {
      whereCondition = and(
        eq(supervisionSessionTable.supervisorId, supervisorId),
        eq(supervisionSessionTable.superviseeId, superviseeId)
      );
    }

    const results = await db.select()
      .from(supervisionSessionTable)
      .where(whereCondition)
      .orderBy(desc(supervisionSessionTable.sessionDate));

    return results.map(result => ({
      ...result,
      durationMinutes: parseInt(result.durationMinutes),
      topics: JSON.parse(result.topics || '[]'),
      competencyAreas: JSON.parse(result.competencyAreas || '[]'),
      actionItems: JSON.parse(result.actionItems || '[]'),
      superviseeGoals: JSON.parse(result.superviseeGoals || '[]'),
      isCompleted: result.isCompleted === 'true',
    }));
  }

  async updateSupervisionSession(id: string, updates: Partial<SupervisionSession>): Promise<void> {
    const { db } = await import("./db");
    const { eq } = await import("drizzle-orm");
    
    const updateData: any = { ...updates };
    if (updates.durationMinutes !== undefined) updateData.durationMinutes = updates.durationMinutes.toString();
    if (updates.topics !== undefined) updateData.topics = JSON.stringify(updates.topics);
    if (updates.competencyAreas !== undefined) updateData.competencyAreas = JSON.stringify(updates.competencyAreas);
    if (updates.actionItems !== undefined) updateData.actionItems = JSON.stringify(updates.actionItems);
    if (updates.superviseeGoals !== undefined) updateData.superviseeGoals = JSON.stringify(updates.superviseeGoals);
    if (updates.isCompleted !== undefined) updateData.isCompleted = updates.isCompleted.toString();

    await db.update(supervisionSessionTable)
      .set(updateData)
      .where(eq(supervisionSessionTable.id, id));
  }

  async createCompetencyAssessment(assessment: InsertCompetencyAssessment): Promise<CompetencyAssessment> {
    const { db } = await import("./db");
    const id = crypto.randomUUID();
    
    const [result] = await db.insert(competencyAssessmentTable)
      .values({
        ...assessment,
        id,
        isCompleted: assessment.isCompleted.toString(),
      })
      .returning();

    return {
      ...result,
      isCompleted: result.isCompleted === 'true',
    };
  }

  async getCompetencyAssessments(supervisorId: string, superviseeId?: string): Promise<CompetencyAssessment[]> {
    const { db } = await import("./db");
    const { eq, desc, and } = await import("drizzle-orm");
    
    let whereCondition = eq(competencyAssessmentTable.supervisorId, supervisorId);
    if (superviseeId) {
      whereCondition = and(
        eq(competencyAssessmentTable.supervisorId, supervisorId),
        eq(competencyAssessmentTable.superviseeId, superviseeId)
      );
    }

    const results = await db.select()
      .from(competencyAssessmentTable)
      .where(whereCondition)
      .orderBy(desc(competencyAssessmentTable.assessmentDate));

    return results.map(result => ({
      ...result,
      isCompleted: result.isCompleted === 'true',
    }));
  }

  async updateCompetencyAssessment(id: string, updates: Partial<CompetencyAssessment>): Promise<void> {
    const { db } = await import("./db");
    const { eq } = await import("drizzle-orm");
    
    const updateData: any = { ...updates };
    if (updates.isCompleted !== undefined) updateData.isCompleted = updates.isCompleted.toString();

    await db.update(competencyAssessmentTable)
      .set(updateData)
      .where(eq(competencyAssessmentTable.id, id));
  }

  async getSuperviseeProgress(superviseeId: string): Promise<any> {
    const sessions = await this.getSupervisionSessions('', superviseeId);
    const assessments = await this.getCompetencyAssessments('', superviseeId);

    const totalHours = sessions.reduce((sum, session) => 
      sum + session.durationMinutes, 0) / 60;

    return {
      totalSupervisionHours: totalHours,
      sessionCount: sessions.length,
      recentSessions: sessions.slice(0, 5),
      competencyAssessments: assessments,
      lastSessionDate: sessions[0]?.sessionDate || null,
    };
  }

  async getSupervisionCompliance(supervisorId: string): Promise<any> {
    const relationships = await this.getSuperviseeRelationships(supervisorId);
    const sessions = await this.getSupervisionSessions(supervisorId);
    
    const compliance = relationships.map(relationship => {
      const superviseeeSessions = sessions.filter(s => s.superviseeId === relationship.superviseeId);
      const totalHours = superviseeeSessions.reduce((sum, session) => sum + session.durationMinutes, 0) / 60;
      const progressPercentage = (totalHours / relationship.requiredHours) * 100;
      
      return {
        superviseeId: relationship.superviseeId,
        requiredHours: relationship.requiredHours,
        completedHours: totalHours,
        progressPercentage: Math.min(progressPercentage, 100),
        status: progressPercentage >= 100 ? 'completed' : progressPercentage >= 80 ? 'on-track' : 'at-risk',
        contractSigned: relationship.contractSigned,
        backgroundCheckCompleted: relationship.backgroundCheckCompleted,
        licenseVerified: relationship.licenseVerified,
      };
    });

    return {
      totalSupervisees: relationships.length,
      activeSupervisees: relationships.filter(r => r.status === 'active').length,
      complianceRate: compliance.length > 0 ? compliance.filter(c => c.status === 'completed' || c.status === 'on-track').length / compliance.length : 0,
      atRiskCount: compliance.filter(c => c.status === 'at-risk').length,
      compliance,
    };
  }

  // Enhanced supervision features implementation
  async createComplianceAlert(alert: InsertComplianceAlert): Promise<ComplianceAlert> {
    const { db } = await import("./db");
    const id = crypto.randomUUID();
    
    const [result] = await db.insert(complianceAlertTable)
      .values({
        ...alert,
        id,
        triggerData: alert.triggerData ? JSON.stringify(alert.triggerData) : undefined,
        isRead: alert.isRead.toString(),
        isResolved: alert.isResolved.toString(),
      })
      .returning();

    return {
      ...result,
      triggerData: result.triggerData ? JSON.parse(result.triggerData) : undefined,
      isRead: result.isRead === 'true',
      isResolved: result.isResolved === 'true',
    };
  }

  async getComplianceAlerts(supervisorId: string, unreadOnly?: boolean): Promise<ComplianceAlert[]> {
    const { db } = await import("./db");
    const { eq, desc, and } = await import("drizzle-orm");
    
    let whereCondition = eq(complianceAlertTable.supervisorId, supervisorId);
    if (unreadOnly) {
      whereCondition = and(
        eq(complianceAlertTable.supervisorId, supervisorId),
        eq(complianceAlertTable.isRead, 'false')
      );
    }

    const results = await db.select()
      .from(complianceAlertTable)
      .where(whereCondition)
      .orderBy(desc(complianceAlertTable.createdAt));

    return results.map(result => ({
      ...result,
      triggerData: result.triggerData ? JSON.parse(result.triggerData) : undefined,
      isRead: result.isRead === 'true',
      isResolved: result.isResolved === 'true',
    }));
  }

  async updateComplianceAlert(id: string, updates: Partial<ComplianceAlert>): Promise<void> {
    const { db } = await import("./db");
    const { eq } = await import("drizzle-orm");
    
    const updateData: any = { ...updates };
    if (updates.triggerData !== undefined) updateData.triggerData = JSON.stringify(updates.triggerData);
    if (updates.isRead !== undefined) updateData.isRead = updates.isRead.toString();
    if (updates.isResolved !== undefined) updateData.isResolved = updates.isResolved.toString();

    await db.update(complianceAlertTable)
      .set(updateData)
      .where(eq(complianceAlertTable.id, id));
  }

  async resolveComplianceAlert(id: string, resolvedBy: string): Promise<void> {
    await this.updateComplianceAlert(id, {
      isResolved: true,
      resolvedAt: new Date(),
      resolvedBy,
    });
  }

  async generateAutomatedAlerts(supervisorId: string): Promise<ComplianceAlert[]> {
    const relationships = await this.getSuperviseeRelationships(supervisorId);
    const sessions = await this.getSupervisionSessions(supervisorId);
    const alerts: InsertComplianceAlert[] = [];

    for (const relationship of relationships) {
      const superviseesSessions = sessions.filter(s => s.superviseeId === relationship.superviseeId);
      const totalHours = superviseesSessions.reduce((sum, session) => sum + session.durationMinutes, 0) / 60;
      const progressPercentage = (totalHours / relationship.requiredHours) * 100;

      // Check for hours behind schedule
      const expectedProgress = this.calculateExpectedProgress(relationship);
      if (progressPercentage < expectedProgress - 20) {
        alerts.push({
          supervisorId,
          superviseeId: relationship.superviseeId,
          alertType: 'hours_behind',
          severity: progressPercentage < expectedProgress - 40 ? 'critical' : 'high',
          title: 'Supervisee Behind on Hours',
          description: `Supervisee is ${Math.round(expectedProgress - progressPercentage)}% behind expected supervision hour progress.`,
          triggerData: {
            expectedProgress,
            actualProgress: progressPercentage,
            hoursDeficit: (expectedProgress - progressPercentage) * relationship.requiredHours / 100,
          },
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
        });
      }

      // Check for missed sessions
      const lastSession = superviseesSessions[0];
      const daysSinceLastSession = lastSession ? 
        Math.floor((Date.now() - lastSession.sessionDate.getTime()) / (1000 * 60 * 60 * 24)) : 999;
      
      const expectedFrequency = this.getFrequencyDays(relationship.frequency);
      if (daysSinceLastSession > expectedFrequency + 7) {
        alerts.push({
          supervisorId,
          superviseeId: relationship.superviseeId,
          alertType: 'missed_session',
          severity: daysSinceLastSession > expectedFrequency + 14 ? 'critical' : 'high',
          title: 'Missed Supervision Session',
          description: `No supervision session recorded for ${daysSinceLastSession} days. Expected frequency: ${relationship.frequency}.`,
          triggerData: {
            daysSinceLastSession,
            expectedFrequency,
            lastSessionDate: lastSession?.sessionDate,
          },
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        });
      }

      // Check for documentation overdue
      if (!relationship.contractSigned || !relationship.backgroundCheckCompleted || !relationship.licenseVerified) {
        alerts.push({
          supervisorId,
          superviseeId: relationship.superviseeId,
          alertType: 'documentation_overdue',
          severity: 'medium',
          title: 'Missing Documentation',
          description: 'Required documentation is incomplete for this supervisee.',
          triggerData: {
            contractSigned: relationship.contractSigned,
            backgroundCheckCompleted: relationship.backgroundCheckCompleted,
            licenseVerified: relationship.licenseVerified,
          },
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
        });
      }
    }

    // Create alerts in database
    const createdAlerts: ComplianceAlert[] = [];
    for (const alert of alerts) {
      try {
        const created = await this.createComplianceAlert(alert);
        createdAlerts.push(created);
      } catch (error) {
        // Skip duplicate alerts
        console.log('Skipping duplicate alert:', error);
      }
    }

    return createdAlerts;
  }

  private calculateExpectedProgress(relationship: SuperviseeRelationship): number {
    const startDate = new Date(relationship.startDate);
    const now = new Date();
    const totalDays = 365; // Assume 1 year supervision period
    const daysPassed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min((daysPassed / totalDays) * 100, 100);
  }

  private getFrequencyDays(frequency: string): number {
    switch (frequency) {
      case 'weekly': return 7;
      case 'biweekly': return 14;
      case 'monthly': return 30;
      default: return 7;
    }
  }

  async createCompetencyFramework(framework: InsertCompetencyFramework): Promise<CompetencyFramework> {
    const { db } = await import("./db");
    const id = crypto.randomUUID();
    
    const [result] = await db.insert(competencyFrameworkTable)
      .values({
        ...framework,
        id,
        developmentalMilestones: framework.developmentalMilestones ? JSON.stringify(framework.developmentalMilestones) : undefined,
        assessmentCriteria: framework.assessmentCriteria ? JSON.stringify(framework.assessmentCriteria) : undefined,
        isStandard: framework.isStandard.toString(),
      })
      .returning();

    return {
      ...result,
      developmentalMilestones: result.developmentalMilestones ? JSON.parse(result.developmentalMilestones) : undefined,
      assessmentCriteria: result.assessmentCriteria ? JSON.parse(result.assessmentCriteria) : undefined,
      isStandard: result.isStandard === 'true',
    };
  }

  async getCompetencyFrameworks(category?: string): Promise<CompetencyFramework[]> {
    const { db } = await import("./db");
    const { eq } = await import("drizzle-orm");
    
    let query = db.select().from(competencyFrameworkTable);
    if (category) {
      query = query.where(eq(competencyFrameworkTable.category, category));
    }

    const results = await query;

    return results.map(result => ({
      ...result,
      developmentalMilestones: result.developmentalMilestones ? JSON.parse(result.developmentalMilestones) : undefined,
      assessmentCriteria: result.assessmentCriteria ? JSON.parse(result.assessmentCriteria) : undefined,
      isStandard: result.isStandard === 'true',
    }));
  }

  async updateCompetencyFramework(id: string, updates: Partial<CompetencyFramework>): Promise<void> {
    const { db } = await import("./db");
    const { eq } = await import("drizzle-orm");
    
    const updateData: any = { ...updates };
    if (updates.developmentalMilestones !== undefined) updateData.developmentalMilestones = JSON.stringify(updates.developmentalMilestones);
    if (updates.assessmentCriteria !== undefined) updateData.assessmentCriteria = JSON.stringify(updates.assessmentCriteria);
    if (updates.isStandard !== undefined) updateData.isStandard = updates.isStandard.toString();

    await db.update(competencyFrameworkTable)
      .set(updateData)
      .where(eq(competencyFrameworkTable.id, id));
  }

  async generateCompetencyReport(superviseeId: string): Promise<any> {
    const assessments = await this.getCompetencyAssessments('', superviseeId);
    const frameworks = await this.getCompetencyFrameworks();
    
    // Group assessments by competency area
    const assessmentsByArea = assessments.reduce((acc, assessment) => {
      if (!acc[assessment.competencyArea]) {
        acc[assessment.competencyArea] = [];
      }
      acc[assessment.competencyArea].push(assessment);
      return acc;
    }, {} as Record<string, CompetencyAssessment[]>);

    // Calculate progress for each area
    const competencyProgress = Object.entries(assessmentsByArea).map(([area, areaAssessments]) => {
      const latestAssessment = areaAssessments[0]; // Assuming sorted by date
      const progressHistory = areaAssessments.reverse(); // Chronological order
      
      const levelMap = { novice: 1, advanced_beginner: 2, competent: 3, proficient: 4, expert: 5 };
      const currentLevel = levelMap[latestAssessment.currentLevel as keyof typeof levelMap] || 1;
      const targetLevel = levelMap[latestAssessment.targetLevel as keyof typeof levelMap] || 5;
      
      return {
        competencyArea: area,
        currentLevel: latestAssessment.currentLevel,
        targetLevel: latestAssessment.targetLevel,
        progressPercentage: (currentLevel / targetLevel) * 100,
        progressHistory,
        strengths: latestAssessment.strengths,
        areasForGrowth: latestAssessment.areasForGrowth,
        actionPlan: latestAssessment.actionPlan,
      };
    });

    return {
      superviseeId,
      totalAssessments: assessments.length,
      competencyAreas: competencyProgress.length,
      averageProgress: competencyProgress.reduce((sum, comp) => sum + comp.progressPercentage, 0) / competencyProgress.length,
      competencyProgress,
      lastAssessmentDate: assessments[0]?.assessmentDate,
      frameworks,
    };
  }

  async getSupervisionTrends(supervisorId: string, timeframe = '6months'): Promise<any> {
    const { db } = await import("./db");
    const { sql, gte } = await import("drizzle-orm");
    
    const months = timeframe === '1year' ? 12 : 6;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Get session trends
    const sessionTrends = await db.select({
      month: sql`DATE_TRUNC('month', session_date)`,
      sessionCount: sql`COUNT(*)`,
      totalHours: sql`SUM(CAST(duration_minutes AS INTEGER)) / 60.0`,
      avgSessionLength: sql`AVG(CAST(duration_minutes AS INTEGER))`,
    })
    .from(supervisionSessionTable)
    .where(sql`supervisor_id = ${supervisorId} AND session_date >= ${startDate}`)
    .groupBy(sql`DATE_TRUNC('month', session_date)`)
    .orderBy(sql`DATE_TRUNC('month', session_date)`);

    // Get compliance trends
    const relationships = await this.getSuperviseeRelationships(supervisorId);
    const complianceData = await Promise.all(
      relationships.map(async (rel) => {
        const sessions = await this.getSupervisionSessions(supervisorId, rel.superviseeId);
        const totalHours = sessions.reduce((sum, s) => sum + s.durationMinutes, 0) / 60;
        return {
          superviseeId: rel.superviseeId,
          progressPercentage: (totalHours / rel.requiredHours) * 100,
        };
      })
    );

    return {
      timeframe,
      sessionTrends,
      averageComplianceRate: complianceData.reduce((sum, c) => sum + c.progressPercentage, 0) / complianceData.length,
      superviseeCount: relationships.length,
      totalSessions: sessionTrends.reduce((sum, trend) => sum + parseInt(trend.sessionCount), 0),
      totalHours: sessionTrends.reduce((sum, trend) => sum + parseFloat(trend.totalHours), 0),
    };
  }

  // Knowledge Base and Spaced Repetition Methods
  async createKnowledgeEntry(entry: InsertKnowledgeEntry): Promise<KnowledgeEntry> {
    const id = crypto.randomUUID();
    const now = new Date();
    
    const [created] = await db
      .insert(knowledgeEntryTable)
      .values({
        id,
        ...entry,
        tags: entry.tags ? JSON.stringify(entry.tags) : null,
        createdAt: now,
        updatedAt: now
      })
      .returning();

    return {
      ...created,
      tags: created.tags ? JSON.parse(created.tags) : []
    } as KnowledgeEntry;
  }

  async getKnowledgeEntries(userId: string): Promise<KnowledgeEntry[]> {
    const entries = await db
      .select()
      .from(knowledgeEntryTable)
      .where(eq(knowledgeEntryTable.userId, userId))
      .orderBy(desc(knowledgeEntryTable.createdAt));

    return entries.map(entry => ({
      ...entry,
      tags: entry.tags ? JSON.parse(entry.tags) : []
    })) as KnowledgeEntry[];
  }

  async updateKnowledgeEntry(id: string, updates: Partial<KnowledgeEntry>): Promise<void> {
    const updateData = {
      ...updates,
      tags: updates.tags ? JSON.stringify(updates.tags) : undefined,
      updatedAt: new Date()
    };

    await db
      .update(knowledgeEntryTable)
      .set(updateData)
      .where(eq(knowledgeEntryTable.id, id));
  }

  async deleteKnowledgeEntry(id: string): Promise<void> {
    const prompts = await db
      .select({ id: promptTable.id })
      .from(promptTable)
      .where(eq(promptTable.knowledgeEntryId, id));

    for (const prompt of prompts) {
      await db
        .delete(reviewTable)
        .where(eq(reviewTable.promptId, prompt.id));
    }

    await db
      .delete(promptTable)
      .where(eq(promptTable.knowledgeEntryId, id));

    await db
      .delete(knowledgeEntryTable)
      .where(eq(knowledgeEntryTable.id, id));
  }

  async createPrompt(prompt: InsertPrompt): Promise<Prompt> {
    const id = crypto.randomUUID();
    const now = new Date();
    
    const [created] = await db
      .insert(promptTable)
      .values({
        id,
        ...prompt,
        createdAt: now
      })
      .returning();

    // Create initial review record for immediate review
    await this.createReview({
      promptId: id,
      userId: prompt.userId,
      difficulty: 0, // 0 = again, schedule first review immediately
      nextReviewDate: now, // Schedule for immediate review
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0
    });

    return created as Prompt;
  }

  async getPrompts(userId: string, knowledgeEntryId?: string): Promise<Prompt[]> {
    let query = db
      .select()
      .from(promptTable)
      .where(eq(promptTable.userId, userId));

    if (knowledgeEntryId) {
      query = query.where(eq(promptTable.knowledgeEntryId, knowledgeEntryId));
    }

    const prompts = await query.orderBy(desc(promptTable.createdAt));
    return prompts as Prompt[];
  }

  async getPromptsDueForReview(userId: string): Promise<(Prompt & { nextReviewDate: Date })[]> {
    const now = new Date();
    
    const duePrompts = await db
      .select({
        id: promptTable.id,
        knowledgeEntryId: promptTable.knowledgeEntryId,
        userId: promptTable.userId,
        question: promptTable.question,
        answer: promptTable.answer,
        imageUrl: promptTable.imageUrl,
        createdAt: promptTable.createdAt,
        nextReviewDate: reviewTable.nextReviewDate
      })
      .from(promptTable)
      .innerJoin(reviewTable, eq(promptTable.id, reviewTable.promptId))
      .where(
        and(
          eq(promptTable.userId, userId),
          lte(reviewTable.nextReviewDate, now)
        )
      )
      .orderBy(asc(reviewTable.nextReviewDate));

    return duePrompts as (Prompt & { nextReviewDate: Date })[];
  }

  async createReview(review: InsertReview): Promise<Review> {
    const id = crypto.randomUUID();
    const now = new Date();
    
    const [created] = await db
      .insert(reviewTable)
      .values({
        id,
        ...review,
        reviewedAt: now
      })
      .returning();

    return created as Review;
  }

  async getReviews(userId: string, promptId?: string): Promise<Review[]> {
    let query = db
      .select()
      .from(reviewTable)
      .where(eq(reviewTable.userId, userId));

    if (promptId) {
      query = query.where(eq(reviewTable.promptId, promptId));
    }

    const reviews = await query.orderBy(desc(reviewTable.reviewedAt));
    return reviews as Review[];
  }

  async updateReview(id: string, updates: Partial<Review>): Promise<void> {
    await db
      .update(reviewTable)
      .set(updates)
      .where(eq(reviewTable.id, id));
  }

  async generatePromptsFromContent(content: string, knowledgeEntryId: string, userId: string): Promise<Prompt[]> {
    try {
      // Try OpenAI first
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert educational content creator specializing in counseling and therapy. Generate 3-5 high-quality study prompts from the given content. Each prompt should test understanding, application, or critical thinking. Respond with valid JSON in this exact format: { \"prompts\": [{ \"question\": \"...\", \"answer\": \"...\" }] }"
          },
          {
            role: "user",
            content: `Generate study prompts from this content:\n\n${content}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
        temperature: 0.7,
      });

      const result = JSON.parse(response.choices[0].message.content);
      const generatedPrompts: Prompt[] = [];

      for (const promptData of result.prompts || []) {
        const prompt = await this.createPrompt({
          knowledgeEntryId,
          userId,
          question: promptData.question,
          answer: promptData.answer,
        });
        generatedPrompts.push(prompt);
      }

      return generatedPrompts;
    } catch (openaiError) {
      console.error('OpenAI failed, trying Google AI:', openaiError);
      
      try {
        // Fallback to Google AI
        console.log('Attempting Google AI fallback...');
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.VITE_GOOGLE_AI_API_KEY;
        console.log('Google AI API key available:', !!apiKey);
        
        if (!apiKey) {
          throw new Error('Google AI API key not found');
        }
        
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `You are an expert educational content creator specializing in counseling and therapy. Generate 3-5 high-quality study prompts from the given content. Each prompt should test understanding, application, or critical thinking. Respond with valid JSON in this exact format: { "prompts": [{ "question": "...", "answer": "..." }] }

Content to analyze:
${content}`;

        console.log('Sending request to Google AI...');
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log('Google AI response received:', text.substring(0, 200) + '...');
        
        // Extract JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error('No JSON found in response:', text);
          throw new Error('No valid JSON found in Google AI response');
        }
        
        const parsedResult = JSON.parse(jsonMatch[0]);
        console.log('Parsed prompts:', parsedResult.prompts?.length || 0);
        const generatedPrompts: Prompt[] = [];

        for (const promptData of parsedResult.prompts || []) {
          const prompt = await this.createPrompt({
            knowledgeEntryId,
            userId,
            question: promptData.question,
            answer: promptData.answer,
          });
          generatedPrompts.push(prompt);
        }

        console.log('Successfully generated', generatedPrompts.length, 'prompts');
        return generatedPrompts;
      } catch (googleError) {
        console.error('Google AI error details:', googleError);
        throw new Error('Failed to generate study prompts. Please check your API configuration for OpenAI or Google AI.');
      }
    }
  }

  // Enhanced AI Features Implementation

  async getUserTherapyProfile(userId: string): Promise<UserTherapyProfile | undefined> {
    const { db } = await import("./db");
    const [profile] = await db
      .select()
      .from(userTherapyProfileTable)
      .where(eq(userTherapyProfileTable.userId, userId));
    
    return profile || undefined;
  }

  async createUserTherapyProfile(profile: InsertUserTherapyProfile): Promise<UserTherapyProfile> {
    const { db } = await import("./db");
    const id = crypto.randomUUID();
    
    const [created] = await db
      .insert(userTherapyProfileTable)
      .values({
        id,
        ...profile,
        competencyLevels: profile.competencyLevels || {
          therapeuticRelationship: 3,
          assessmentSkills: 3,
          interventionPlanning: 3,
          ethicalDecisionMaking: 3,
          culturalCompetence: 3,
          lastUpdated: new Date()
        }
      })
      .returning();
    
    return created as UserTherapyProfile;
  }

  async updateUserTherapyProfile(userId: string, updates: Partial<UserTherapyProfile>): Promise<void> {
    const { db } = await import("./db");
    await db
      .update(userTherapyProfileTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userTherapyProfileTable.userId, userId));
  }

  async getSupervisionIntelligence(userId: string, weekStartDate?: Date): Promise<SupervisionIntelligence[]> {
    const { db } = await import("./db");
    let query = db
      .select()
      .from(supervisionIntelligenceTable)
      .where(eq(supervisionIntelligenceTable.userId, userId));
    
    if (weekStartDate) {
      query = query.where(eq(supervisionIntelligenceTable.weekStartDate, weekStartDate));
    }
    
    const results = await query.orderBy(desc(supervisionIntelligenceTable.weekStartDate));
    return results as SupervisionIntelligence[];
  }

  async createSupervisionIntelligence(intelligence: InsertSupervisionIntelligence): Promise<SupervisionIntelligence> {
    const { db } = await import("./db");
    const id = crypto.randomUUID();
    
    const [created] = await db
      .insert(supervisionIntelligenceTable)
      .values({
        id,
        ...intelligence
      })
      .returning();
    
    return created as SupervisionIntelligence;
  }

  async getCompetencyAnalysis(userId: string, sessionId?: string): Promise<CompetencyAnalysis[]> {
    const { db } = await import("./db");
    let query = db
      .select()
      .from(competencyAnalysisTable)
      .where(eq(competencyAnalysisTable.userId, userId));
    
    if (sessionId) {
      query = query.where(eq(competencyAnalysisTable.sessionId, sessionId));
    }
    
    const results = await query.orderBy(desc(competencyAnalysisTable.analyzedAt));
    return results as CompetencyAnalysis[];
  }

  async createCompetencyAnalysis(analysis: InsertCompetencyAnalysis): Promise<CompetencyAnalysis> {
    const { db } = await import("./db");
    const id = crypto.randomUUID();
    
    const [created] = await db
      .insert(competencyAnalysisTable)
      .values({
        id,
        ...analysis
      })
      .returning();
    
    return created as CompetencyAnalysis;
  }

  async getPatternAnalysis(userId: string, alertType?: string): Promise<PatternAnalysis[]> {
    const { db } = await import("./db");
    let query = db
      .select()
      .from(patternAnalysisTable)
      .where(eq(patternAnalysisTable.userId, userId));
    
    if (alertType) {
      query = query.where(eq(patternAnalysisTable.alertType, alertType as any));
    }
    
    const results = await query.orderBy(desc(patternAnalysisTable.createdAt));
    return results as PatternAnalysis[];
  }

  async createPatternAnalysis(pattern: InsertPatternAnalysis): Promise<PatternAnalysis> {
    const { db } = await import("./db");
    const id = crypto.randomUUID();
    
    const [created] = await db
      .insert(patternAnalysisTable)
      .values({
        id,
        ...pattern
      })
      .returning();
    
    return created as PatternAnalysis;
  }

  async updatePatternAnalysis(id: string, updates: Partial<PatternAnalysis>): Promise<void> {
    const { db } = await import("./db");
    await db
      .update(patternAnalysisTable)
      .set(updates)
      .where(eq(patternAnalysisTable.id, id));
  }

  // AI Insights History methods
  async getAiInsightsHistory(userId: string, insightType?: string): Promise<AiInsightsHistory[]> {
    const { db } = await import("./db");
    const query = db
      .select()
      .from(aiInsightsHistoryTable)
      .where(eq(aiInsightsHistoryTable.userId, userId))
      .orderBy(desc(aiInsightsHistoryTable.createdAt));
    
    if (insightType) {
      query.where(and(
        eq(aiInsightsHistoryTable.userId, userId),
        eq(aiInsightsHistoryTable.insightType, insightType)
      ));
    }
    
    return await query;
  }

  async createAiInsight(insight: InsertAiInsightsHistory): Promise<AiInsightsHistory> {
    const { db } = await import("./db");
    const id = `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const [created] = await db
      .insert(aiInsightsHistoryTable)
      .values({
        id,
        ...insight,
      })
      .returning();
    
    return created;
  }

  async updateAiInsight(id: string, updates: Partial<AiInsightsHistory>): Promise<void> {
    const { db } = await import("./db");
    await db
      .update(aiInsightsHistoryTable)
      .set(updates)
      .where(eq(aiInsightsHistoryTable.id, id));
  }

  // Log Entries functionality
  async createLogEntry(entry: any): Promise<any> {
    // For now, return a simple mock response since this is for onboarding
    // In production, this would integrate with the actual log entries table
    const id = `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      id,
      ...entry,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async getLogEntries(userId: string): Promise<any[]> {
    // For now, return empty array since this is primarily for onboarding
    // In production, this would query the actual log entries table
    return [];
  }

  // Privacy Settings functionality
  async getPrivacySettings(userId: string): Promise<PrivacySettings | undefined> {
    const { db } = await import("./db");
    const [settings] = await db
      .select()
      .from(privacySettingsTable)
      .where(eq(privacySettingsTable.userId, userId))
      .limit(1);
    return settings;
  }

  async createPrivacySettings(settings: InsertPrivacySettings): Promise<PrivacySettings> {
    const { db } = await import("./db");
    const id = `privacy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const [created] = await db
      .insert(privacySettingsTable)
      .values({
        id,
        ...settings,
      })
      .returning();
    return created;
  }

  async updatePrivacySettings(userId: string, updates: Partial<PrivacySettings>): Promise<PrivacySettings> {
    const { db } = await import("./db");
    const [updated] = await db
      .update(privacySettingsTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(privacySettingsTable.userId, userId))
      .returning();
    return updated;
  }

  // Data Usage Tracking
  async getUserDataUsage(userId: string): Promise<any> {
    const { db } = await import("./db");
    
    // Get data usage tracking records
    const usageRecords = await db
      .select()
      .from(dataUsageTrackingTable)
      .where(eq(dataUsageTrackingTable.userId, userId));

    // Calculate aggregated usage
    const totalSessions = usageRecords.filter(r => r.dataType === 'recordings').length;
    const storageUsedMB = Math.round(usageRecords.reduce((sum, r) => sum + r.sizeBytes, 0) / (1024 * 1024));
    
    const dataTypes = {
      insights: usageRecords.filter(r => r.dataType === 'insights').length,
      transcripts: usageRecords.filter(r => r.dataType === 'transcripts').length,
      recordings: usageRecords.filter(r => r.dataType === 'recordings').length,
      analytics: usageRecords.filter(r => r.dataType === 'analytics').length,
    };

    // Group by category for retention breakdown
    const categoryGroups = usageRecords.reduce((acc, record) => {
      if (!acc[record.category]) {
        acc[record.category] = {
          count: 0,
          sizeKB: 0,
          oldestDate: record.createdAt,
        };
      }
      acc[record.category].count += record.itemCount;
      acc[record.category].sizeKB += Math.round(record.sizeBytes / 1024);
      if (record.createdAt < acc[record.category].oldestDate) {
        acc[record.category].oldestDate = record.createdAt;
      }
      return acc;
    }, {} as any);

    const retentionBreakdown = Object.keys(categoryGroups).map(category => ({
      category,
      count: categoryGroups[category].count,
      sizeKB: categoryGroups[category].sizeKB,
      oldestDate: categoryGroups[category].oldestDate.toISOString(),
    }));

    return {
      totalSessions,
      storageUsedMB,
      dataTypes,
      retentionBreakdown,
    };
  }

  async createDataUsageTracking(tracking: InsertDataUsageTracking): Promise<DataUsageTracking> {
    const { db } = await import("./db");
    const id = `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const [created] = await db
      .insert(dataUsageTrackingTable)
      .values({
        id,
        ...tracking,
      })
      .returning();
    return created;
  }

  async updateDataUsageTracking(id: string, updates: Partial<DataUsageTracking>): Promise<void> {
    const { db } = await import("./db");
    await db
      .update(dataUsageTrackingTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(dataUsageTrackingTable.id, id));
  }

  // Data Deletion Management
  async createDataDeletionRequest(request: InsertDataDeletionRequest): Promise<DataDeletionRequest> {
    const { db } = await import("./db");
    const id = `deletion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const [created] = await db
      .insert(dataDeletionRequestTable)
      .values({
        id,
        ...request,
      })
      .returning();
    return created;
  }

  async updateDataDeletionRequest(id: string, updates: Partial<DataDeletionRequest>): Promise<void> {
    const { db } = await import("./db");
    await db
      .update(dataDeletionRequestTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(dataDeletionRequestTable.id, id));
  }

  async deleteUserRecordings(userId: string): Promise<{ itemsDeleted: number; bytesDeleted: number; auditLog: any[] }> {
    const { db } = await import("./db");
    
    // Get recordings to delete for audit log
    const recordings = await db
      .select()
      .from(dataUsageTrackingTable)
      .where(and(
        eq(dataUsageTrackingTable.userId, userId),
        eq(dataUsageTrackingTable.dataType, 'recordings')
      ));

    const itemsDeleted = recordings.length;
    const bytesDeleted = recordings.reduce((sum, r) => sum + r.sizeBytes, 0);
    
    // Delete the records
    await db
      .delete(dataUsageTrackingTable)
      .where(and(
        eq(dataUsageTrackingTable.userId, userId),
        eq(dataUsageTrackingTable.dataType, 'recordings')
      ));

    const auditLog = [
      {
        action: 'delete_recordings',
        timestamp: new Date().toISOString(),
        itemsDeleted,
        bytesDeleted,
        details: `Deleted ${itemsDeleted} recording entries totaling ${Math.round(bytesDeleted / 1024)} KB`
      }
    ];

    return { itemsDeleted, bytesDeleted, auditLog };
  }

  async deleteUserTranscripts(userId: string): Promise<{ itemsDeleted: number; bytesDeleted: number; auditLog: any[] }> {
    const { db } = await import("./db");
    
    const transcripts = await db
      .select()
      .from(dataUsageTrackingTable)
      .where(and(
        eq(dataUsageTrackingTable.userId, userId),
        eq(dataUsageTrackingTable.dataType, 'transcripts')
      ));

    const itemsDeleted = transcripts.length;
    const bytesDeleted = transcripts.reduce((sum, r) => sum + r.sizeBytes, 0);
    
    await db
      .delete(dataUsageTrackingTable)
      .where(and(
        eq(dataUsageTrackingTable.userId, userId),
        eq(dataUsageTrackingTable.dataType, 'transcripts')
      ));

    const auditLog = [
      {
        action: 'delete_transcripts',
        timestamp: new Date().toISOString(),
        itemsDeleted,
        bytesDeleted,
        details: `Deleted ${itemsDeleted} transcript entries totaling ${Math.round(bytesDeleted / 1024)} KB`
      }
    ];

    return { itemsDeleted, bytesDeleted, auditLog };
  }

  async deleteUserAnalytics(userId: string): Promise<{ itemsDeleted: number; bytesDeleted: number; auditLog: any[] }> {
    const { db } = await import("./db");
    
    const analytics = await db
      .select()
      .from(dataUsageTrackingTable)
      .where(and(
        eq(dataUsageTrackingTable.userId, userId),
        eq(dataUsageTrackingTable.dataType, 'analytics')
      ));

    const itemsDeleted = analytics.length;
    const bytesDeleted = analytics.reduce((sum, r) => sum + r.sizeBytes, 0);
    
    await db
      .delete(dataUsageTrackingTable)
      .where(and(
        eq(dataUsageTrackingTable.userId, userId),
        eq(dataUsageTrackingTable.dataType, 'analytics')
      ));

    const auditLog = [
      {
        action: 'delete_analytics',
        timestamp: new Date().toISOString(),
        itemsDeleted,
        bytesDeleted,
        details: `Deleted ${itemsDeleted} analytics entries totaling ${Math.round(bytesDeleted / 1024)} KB`
      }
    ];

    return { itemsDeleted, bytesDeleted, auditLog };
  }

  async deleteAllUserData(userId: string): Promise<{ itemsDeleted: number; bytesDeleted: number; auditLog: any[] }> {
    const { db } = await import("./db");
    
    const allData = await db
      .select()
      .from(dataUsageTrackingTable)
      .where(eq(dataUsageTrackingTable.userId, userId));

    const itemsDeleted = allData.length;
    const bytesDeleted = allData.reduce((sum, r) => sum + r.sizeBytes, 0);
    
    // Delete all user data across tables
    await db
      .delete(dataUsageTrackingTable)
      .where(eq(dataUsageTrackingTable.userId, userId));

    await db
      .delete(privacySettingsTable)
      .where(eq(privacySettingsTable.userId, userId));

    const auditLog = [
      {
        action: 'delete_all_data',
        timestamp: new Date().toISOString(),
        itemsDeleted,
        bytesDeleted,
        details: `Complete data deletion: ${itemsDeleted} items totaling ${Math.round(bytesDeleted / 1024)} KB`
      }
    ];

    return { itemsDeleted, bytesDeleted, auditLog };
  }

  // Data Export
  async exportUserData(userId: string): Promise<any> {
    const { db } = await import("./db");
    
    const privacySettings = await this.getPrivacySettings(userId);
    const dataUsage = await this.getUserDataUsage(userId);
    
    // Get other user data for export
    const sessionData = await db
      .select()
      .from(dataUsageTrackingTable)
      .where(eq(dataUsageTrackingTable.userId, userId));

    return {
      privacySettings,
      sessionData,
      clinicalInsights: [], // Would include actual insights in production
      hourLogs: [], // Would include actual hour logs in production
      supervisionRecords: [], // Would include actual supervision data in production
      dataUsageStatistics: dataUsage,
    };
  }

  // Privacy Audit
  async getPrivacyAuditLog(userId: string): Promise<any[]> {
    const { db } = await import("./db");
    
    const auditEntries = await db
      .select()
      .from(dataDeletionRequestTable)
      .where(eq(dataDeletionRequestTable.userId, userId))
      .orderBy(desc(dataDeletionRequestTable.createdAt));

    return auditEntries.map(entry => ({
      timestamp: entry.createdAt.toISOString(),
      action: entry.requestType,
      status: entry.status,
      details: entry.reason || 'User-initiated data management action',
      itemsAffected: entry.itemsDeleted,
      bytesAffected: entry.bytesDeleted,
    }));
  }

  // Data Retention Policies
  async applyDataRetentionPolicies(userId: string, retentionDays: number): Promise<{ itemsProcessed: number; itemsDeleted: number; nextReviewDate: Date }> {
    const { db } = await import("./db");
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    // Find items past retention period
    const expiredItems = await db
      .select()
      .from(dataUsageTrackingTable)
      .where(and(
        eq(dataUsageTrackingTable.userId, userId),
        lte(dataUsageTrackingTable.createdAt, cutoffDate)
      ));

    const itemsProcessed = expiredItems.length;
    
    // Update retention status for expired items
    await db
      .update(dataUsageTrackingTable)
      .set({ storageTier: 'deletion_queue', retentionDate: new Date() })
      .where(and(
        eq(dataUsageTrackingTable.userId, userId),
        lte(dataUsageTrackingTable.createdAt, cutoffDate)
      ));

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + 30); // Review monthly

    return {
      itemsProcessed,
      itemsDeleted: 0, // Items marked for deletion, not immediately deleted
      nextReviewDate,
    };
  }

  // Privacy Settings Methods
  async getPrivacySettings(userId: string): Promise<any> {
    const { db } = await import("./db");
    const { eq } = await import("drizzle-orm");
    
    const settings = await db
      .select()
      .from(privacySettingsTable)
      .where(eq(privacySettingsTable.userId, userId))
      .limit(1);
    
    return settings[0] || null;
  }

  async createPrivacySettings(settings: any): Promise<any> {
    const { db } = await import("./db");
    const id = crypto.randomUUID();
    
    const newSettings = {
      id,
      ...settings,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.insert(privacySettingsTable).values(newSettings);
    return newSettings;
  }

  async updatePrivacySettings(userId: string, updates: any): Promise<any> {
    const { db } = await import("./db");
    const { eq } = await import("drizzle-orm");
    
    // Check if settings exist
    const existing = await this.getPrivacySettings(userId);
    
    if (!existing) {
      // Create new settings if none exist
      return await this.createPrivacySettings({ userId, ...updates });
    }
    
    // Update existing settings
    const updatedSettings = {
      ...updates,
      updatedAt: new Date(),
    };
    
    await db
      .update(privacySettingsTable)
      .set(updatedSettings)
      .where(eq(privacySettingsTable.userId, userId));
    
    return { ...existing, ...updatedSettings };
  }

  // Session Recording Insights Integration Implementation
  async generateSessionInsights(sessionRecordingId: string, userId: string): Promise<AiInsightsHistory[]> {
    const { db } = await import("./db");
    
    // Get session analysis data (this would come from the session recording analysis)
    const sessionAnalysis = await db
      .select()
      .from(sessionIntelligenceTable)
      .where(eq(sessionIntelligenceTable.sessionId, sessionRecordingId))
      .limit(1);

    if (!sessionAnalysis.length) {
      return [];
    }

    const analysis = sessionAnalysis[0];
    const insights: InsertAiInsightsHistory[] = [];

    // Generate Pattern Recognition Card
    if (analysis.clinicalInsights) {
      const clinicalData = analysis.clinicalInsights as any;
      if (clinicalData?.patterns?.length > 0) {
        insights.push({
          userId,
          insightType: 'session_pattern',
          title: 'Pattern Detected in Session',
          content: `I noticed you frequently used ${clinicalData.patterns[0]} technique. This shows strong consistency in your therapeutic approach.`,
          sourceType: 'session_recording',
          sessionRecordingId,
          cardStyle: 'coaching',
          priority: 'medium',
          metadata: {
            confidenceScore: 0.85,
            ebpTechniques: clinicalData.patterns || []
          }
        });
      }
    }

    // Generate Therapeutic Alliance Card
    if (analysis.engagementScore && analysis.engagementScore > 0.7) {
      insights.push({
        userId,
        insightType: 'therapeutic_alliance',
        title: 'Strong Alliance Building',
        content: `Your engagement score of ${Math.round(analysis.engagementScore * 100)}% shows excellent rapport building. Consider discussing this technique in supervision.`,
        sourceType: 'alliance_tracking',
        sessionRecordingId,
        cardStyle: 'growth',
        priority: 'medium',
        metadata: {
          therapeuticAlliance: {
            score: analysis.engagementScore,
            trend: 'improving'
          }
        }
      });
    }

    // Generate Risk Assessment Card if needed
    if (analysis.riskAssessment) {
      const riskData = analysis.riskAssessment as any;
      if (riskData?.level && riskData.level !== 'low') {
        insights.push({
          userId,
          insightType: 'risk_assessment',
          title: 'Risk Indicators Detected',
          content: `Session analysis identified ${riskData.level} risk indicators. Review session notes and prepare for supervision discussion.`,
          sourceType: 'session_recording',
          sessionRecordingId,
          cardStyle: 'risk',
          priority: riskData.level === 'high' ? 'urgent' : 'high',
          metadata: {
            riskIndicators: riskData.indicators || []
          }
        });
      }
    }

    // Generate Supervision Focus Card
    if (analysis.complianceScore && analysis.complianceScore < 70) {
      insights.push({
        userId,
        insightType: 'supervision_prep',
        title: 'Supervision Focus Area',
        content: `Compliance score of ${analysis.complianceScore}% suggests reviewing documentation standards. Great opportunity for skill development.`,
        sourceType: 'ebp_analysis',
        sessionRecordingId,
        cardStyle: 'supervision',
        priority: 'medium',
        metadata: {
          supervisionMarkers: ['documentation_review', 'ebp_adherence']
        }
      });
    }

    // Save all generated insights
    const createdInsights: AiInsightsHistory[] = [];
    for (const insight of insights) {
      const created = await this.createAiInsight(insight);
      createdInsights.push(created);
    }

    return createdInsights;
  }

  async getInsightCardsByUserId(userId: string, cardTypes?: string[]): Promise<AiInsightsHistory[]> {
    const { db } = await import("./db");
    
    let query = db
      .select()
      .from(aiInsightsHistoryTable)
      .where(eq(aiInsightsHistoryTable.userId, userId));

    if (cardTypes && cardTypes.length > 0) {
      // Filter by card types if specified
      query = query.where(
        and(
          eq(aiInsightsHistoryTable.userId, userId),
          sql`${aiInsightsHistoryTable.cardStyle} = ANY(${cardTypes})`
        )
      );
    }

    const results = await query
      .orderBy(desc(aiInsightsHistoryTable.createdAt))
      .limit(50); // Limit for performance

    return results as AiInsightsHistory[];
  }
}

export const storage = new DatabaseStorage();
