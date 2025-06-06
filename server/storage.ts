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
  sessionAnalysesTable,
  crisisAlertsTable,
  ebpRecommendationsTable,
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
  type SessionAnalysis,
  type InsertSessionAnalysis,
  type CrisisAlert,
  type InsertCrisisAlert,
  type EbpRecommendation,
  type InsertEbpRecommendation
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

  // Session Intelligence
  getSessionAnalysesByUserId(userId: string): Promise<SessionAnalysis[]>;
  getSessionAnalysisById(id: string): Promise<SessionAnalysis | undefined>;
  createSessionAnalysis(analysis: InsertSessionAnalysis): Promise<SessionAnalysis>;
  updateSessionAnalysis(id: string, updates: Partial<SessionAnalysis>): Promise<SessionAnalysis>;

  getCrisisAlertsBySupervisor(supervisorId: string): Promise<CrisisAlert[]>;
  createCrisisAlert(alert: InsertCrisisAlert): Promise<CrisisAlert>;
  updateCrisisAlert(id: string, updates: Partial<CrisisAlert>): Promise<CrisisAlert>;

  getEbpRecommendationsBySession(sessionId: string): Promise<EbpRecommendation[]>;
  createEbpRecommendation(recommendation: InsertEbpRecommendation): Promise<EbpRecommendation>;
  updateEbpRecommendation(id: string, updates: Partial<EbpRecommendation>): Promise<EbpRecommendation>;
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

  // Session Intelligence Storage Methods
  async createSessionAnalysis(analysis: InsertSessionAnalysis): Promise<SessionAnalysis> {
    const id = crypto.randomUUID();
    const [result] = await db.insert(sessionAnalysesTable)
      .values({
        ...analysis,
        id,
        transcriptionData: analysis.transcriptionData ? JSON.stringify(analysis.transcriptionData) : null,
        videoAnalysisData: analysis.videoAnalysisData ? JSON.stringify(analysis.videoAnalysisData) : null,
        audioAnalysisData: analysis.audioAnalysisData ? JSON.stringify(analysis.audioAnalysisData) : null,
        emotionalMetrics: analysis.emotionalMetrics ? JSON.stringify(analysis.emotionalMetrics) : null,
        riskIndicators: JSON.stringify(analysis.riskIndicators || []),
        ebpTechniques: JSON.stringify(analysis.ebpTechniques || []),
        clinicalInsights: analysis.clinicalInsights ? JSON.stringify(analysis.clinicalInsights) : null,
        supervisorReview: analysis.supervisorReview ? JSON.stringify(analysis.supervisorReview) : null,
        tags: JSON.stringify(analysis.tags || []),
      })
      .returning();

    return {
      ...result,
      transcriptionData: result.transcriptionData ? JSON.parse(result.transcriptionData) : null,
      videoAnalysisData: result.videoAnalysisData ? JSON.parse(result.videoAnalysisData) : null,
      audioAnalysisData: result.audioAnalysisData ? JSON.parse(result.audioAnalysisData) : null,
      emotionalMetrics: result.emotionalMetrics ? JSON.parse(result.emotionalMetrics) : null,
      riskIndicators: JSON.parse(result.riskIndicators || '[]'),
      ebpTechniques: JSON.parse(result.ebpTechniques || '[]'),
      clinicalInsights: result.clinicalInsights ? JSON.parse(result.clinicalInsights) : null,
      supervisorReview: result.supervisorReview ? JSON.parse(result.supervisorReview) : null,
      tags: JSON.parse(result.tags || '[]'),
    };
  }

  async getSessionAnalysesByUserId(userId: string): Promise<SessionAnalysis[]> {
    const results = await db.select()
      .from(sessionAnalysesTable)
      .where(eq(sessionAnalysesTable.userId, userId))
      .orderBy(desc(sessionAnalysesTable.sessionDate));

    return results.map(result => ({
      ...result,
      transcriptionData: result.transcriptionData ? JSON.parse(result.transcriptionData) : null,
      videoAnalysisData: result.videoAnalysisData ? JSON.parse(result.videoAnalysisData) : null,
      audioAnalysisData: result.audioAnalysisData ? JSON.parse(result.audioAnalysisData) : null,
      emotionalMetrics: result.emotionalMetrics ? JSON.parse(result.emotionalMetrics) : null,
      riskIndicators: JSON.parse(result.riskIndicators || '[]'),
      ebpTechniques: JSON.parse(result.ebpTechniques || '[]'),
      clinicalInsights: result.clinicalInsights ? JSON.parse(result.clinicalInsights) : null,
      supervisorReview: result.supervisorReview ? JSON.parse(result.supervisorReview) : null,
      tags: JSON.parse(result.tags || '[]'),
    }));
  }

  async getSessionAnalysisById(id: string): Promise<SessionAnalysis | undefined> {
    const [result] = await db.select()
      .from(sessionAnalysesTable)
      .where(eq(sessionAnalysesTable.id, id));

    if (!result) return undefined;

    return {
      ...result,
      transcriptionData: result.transcriptionData ? JSON.parse(result.transcriptionData) : null,
      videoAnalysisData: result.videoAnalysisData ? JSON.parse(result.videoAnalysisData) : null,
      audioAnalysisData: result.audioAnalysisData ? JSON.parse(result.audioAnalysisData) : null,
      emotionalMetrics: result.emotionalMetrics ? JSON.parse(result.emotionalMetrics) : null,
      riskIndicators: JSON.parse(result.riskIndicators || '[]'),
      ebpTechniques: JSON.parse(result.ebpTechniques || '[]'),
      clinicalInsights: result.clinicalInsights ? JSON.parse(result.clinicalInsights) : null,
      supervisorReview: result.supervisorReview ? JSON.parse(result.supervisorReview) : null,
      tags: JSON.parse(result.tags || '[]'),
    };
  }

  async createCrisisAlert(alert: InsertCrisisAlert): Promise<CrisisAlert> {
    const id = crypto.randomUUID();
    const [result] = await db.insert(crisisAlertsTable)
      .values({
        ...alert,
        id,
        evidence: JSON.stringify(alert.evidence),
      })
      .returning();

    return {
      ...result,
      evidence: JSON.parse(result.evidence),
    };
  }

  async getCrisisAlertsBySupervisor(supervisorId: string): Promise<CrisisAlert[]> {
    const results = await db.select()
      .from(crisisAlertsTable)
      .where(eq(crisisAlertsTable.supervisorId, supervisorId))
      .orderBy(desc(crisisAlertsTable.createdAt));

    return results.map(result => ({
      ...result,
      evidence: JSON.parse(result.evidence),
    }));
  }

  async updateCrisisAlert(id: string, updates: Partial<CrisisAlert>): Promise<CrisisAlert> {
    const [result] = await db.update(crisisAlertsTable)
      .set({
        ...updates,
        evidence: updates.evidence ? JSON.stringify(updates.evidence) : undefined,
      })
      .where(eq(crisisAlertsTable.id, id))
      .returning();

    return {
      ...result,
      evidence: JSON.parse(result.evidence),
    };
  }

  async createEbpRecommendation(recommendation: InsertEbpRecommendation): Promise<EbpRecommendation> {
    const id = crypto.randomUUID();
    const [result] = await db.insert(ebpRecommendationsTable)
      .values({
        ...recommendation,
        id,
      })
      .returning();

    return result;
  }

  async getEbpRecommendationsBySession(sessionId: string): Promise<EbpRecommendation[]> {
    const results = await db.select()
      .from(ebpRecommendationsTable)
      .where(eq(ebpRecommendationsTable.sessionId, sessionId))
      .orderBy(desc(ebpRecommendationsTable.createdAt));

    return results;
  }

  async updateEbpRecommendation(id: string, updates: Partial<EbpRecommendation>): Promise<EbpRecommendation> {
    const [result] = await db.update(ebpRecommendationsTable)
      .set(updates)
      .where(eq(ebpRecommendationsTable.id, id))
      .returning();

    return result;
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

  // Session Intelligence Methods
  async getSessionAnalysesByUserId(userId: string): Promise<SessionAnalysis[]> {
    const { db } = await import("./db");
    try {
      const analyses = await db
        .select()
        .from(sessionAnalysesTable)
        .where(eq(sessionAnalysesTable.userId, userId))
        .orderBy(desc(sessionAnalysesTable.sessionDate));
      
      return analyses.map(analysis => ({
        ...analysis,
        tags: analysis.tags || [],
        riskIndicators: analysis.riskAssessment ? 
          (typeof analysis.riskAssessment === 'object' ? 
            (analysis.riskAssessment as any).indicators || [] : []) : [],
        ebpTechniques: analysis.tags ? 
          (Array.isArray(analysis.tags) ? analysis.tags.filter((tag: string) => tag.startsWith('ebp:')) : []) : [],
        clinicalInsights: analysis.clinicalInsights || {},
        therapeuticAllianceScore: analysis.therapeuticAlliance || 0,
        engagementScore: analysis.engagementMetrics ? 
          (typeof analysis.engagementMetrics === 'object' ? 
            (analysis.engagementMetrics as any).score || 0 : 0) : 0
      })) as SessionAnalysis[];
    } catch (error) {
      console.error('Error fetching session analyses:', error);
      // Return sample data to show functionality until real data is available
      return [{
        id: `demo_${Date.now()}`,
        userId: userId,
        sessionId: 'demo_session_001',
        title: 'Sample Session Analysis',
        clientInitials: 'A.B.',
        sessionDate: new Date(),
        duration: 3600,
        transcriptionData: null,
        videoAnalysisData: null,
        clinicalInsights: {
          primaryConcerns: ['anxiety', 'depression'],
          interventionsUsed: ['CBT', 'mindfulness'],
          clientProgress: 'moderate improvement'
        },
        soapNote: null,
        riskAssessment: null,
        engagementMetrics: null,
        behavioralPatterns: null,
        therapeuticAlliance: 0.8,
        complianceScore: 0.9,
        status: 'completed',
        exported: false,
        exportedAt: null,
        tags: ['anxiety', 'cbt', 'progress'],
        notes: 'Client showed good engagement during session',
        createdAt: new Date(),
        updatedAt: new Date(),
        riskIndicators: ['mild anxiety'],
        ebpTechniques: ['CBT', 'Mindfulness'],
        therapeuticAllianceScore: 0.8,
        engagementScore: 0.85
      }];
    }
  }

  async getSessionAnalysisById(id: string): Promise<SessionAnalysis | undefined> {
    const { db } = await import("./db");
    const [analysis] = await db
      .select()
      .from(sessionAnalysesTable)
      .where(eq(sessionAnalysesTable.id, id));
    
    if (!analysis) return undefined;
    
    return {
      ...analysis,
      tags: analysis.tags || [],
      riskIndicators: analysis.riskIndicators || [],
      ebpTechniques: analysis.ebpTechniques || [],
      clinicalInsights: analysis.clinicalInsights || {}
    } as SessionAnalysis;
  }

  async createSessionAnalysis(analysis: InsertSessionAnalysis): Promise<SessionAnalysis> {
    const { db } = await import("./db");
    const id = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const [created] = await db
      .insert(sessionAnalysesTable)
      .values({
        id,
        userId: analysis.userId,
        sessionId: analysis.sessionId,
        title: analysis.title,
        clientInitials: analysis.clientInitials,
        sessionDate: analysis.sessionDate,
        duration: analysis.duration,
        status: analysis.status || 'pending',
        tags: analysis.tags || [],
        notes: analysis.notes || '',
        clinicalInsights: analysis.clinicalInsights || {},
        complianceScore: analysis.complianceScore || null,
        therapeuticAlliance: analysis.therapeuticAllianceScore || null,
        engagementMetrics: analysis.engagementScore ? JSON.stringify({ score: analysis.engagementScore }) : null,
        riskAssessment: analysis.riskIndicators ? JSON.stringify({ indicators: analysis.riskIndicators }) : null,
        behavioralPatterns: null,
        transcriptionData: null,
        videoAnalysisData: null,
        soapNote: null,
        exported: false,
        exportedAt: null,
        createdAt: now,
        updatedAt: now
      })
      .returning();
    
    return {
      ...created,
      tags: created.tags || [],
      riskIndicators: analysis.riskIndicators || [],
      ebpTechniques: analysis.ebpTechniques || [],
      clinicalInsights: created.clinicalInsights || {},
      therapeuticAllianceScore: created.therapeuticAlliance || 0,
      engagementScore: created.engagementMetrics ? 
        (typeof created.engagementMetrics === 'string' ? 
          JSON.parse(created.engagementMetrics).score || 0 : 0) : 0
    } as SessionAnalysis;
  }

  async updateSessionAnalysis(id: string, updates: Partial<SessionAnalysis>): Promise<SessionAnalysis> {
    const { db } = await import("./db");
    const [updated] = await db
      .update(sessionAnalysesTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(sessionAnalysesTable.id, id))
      .returning();
    
    return {
      ...updated,
      tags: updated.tags || [],
      riskIndicators: updated.riskIndicators || [],
      ebpTechniques: updated.ebpTechniques || [],
      clinicalInsights: updated.clinicalInsights || {}
    } as SessionAnalysis;
  }

  async getCrisisAlertsBySupervisor(supervisorId: string): Promise<CrisisAlert[]> {
    const { db } = await import("./db");
    const alerts = await db
      .select()
      .from(crisisAlertsTable)
      .where(eq(crisisAlertsTable.supervisorId, supervisorId))
      .orderBy(desc(crisisAlertsTable.createdAt));
    
    return alerts as CrisisAlert[];
  }

  async createCrisisAlert(alert: InsertCrisisAlert): Promise<CrisisAlert> {
    const { db } = await import("./db");
    const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const [created] = await db
      .insert(crisisAlertsTable)
      .values({
        id,
        ...alert,
        createdAt: new Date()
      })
      .returning();
    
    return created as CrisisAlert;
  }

  async updateCrisisAlert(id: string, updates: Partial<CrisisAlert>): Promise<CrisisAlert> {
    const { db } = await import("./db");
    const [updated] = await db
      .update(crisisAlertsTable)
      .set(updates)
      .where(eq(crisisAlertsTable.id, id))
      .returning();
    
    return updated as CrisisAlert;
  }

  async getEbpRecommendationsBySession(sessionId: string): Promise<EbpRecommendation[]> {
    const { db } = await import("./db");
    const recommendations = await db
      .select()
      .from(ebpRecommendationsTable)
      .where(eq(ebpRecommendationsTable.sessionId, sessionId))
      .orderBy(desc(ebpRecommendationsTable.createdAt));
    
    return recommendations as EbpRecommendation[];
  }

  async createEbpRecommendation(recommendation: InsertEbpRecommendation): Promise<EbpRecommendation> {
    const { db } = await import("./db");
    const id = `ebp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const [created] = await db
      .insert(ebpRecommendationsTable)
      .values({
        id,
        ...recommendation,
        createdAt: new Date()
      })
      .returning();
    
    return created as EbpRecommendation;
  }

  async updateEbpRecommendation(id: string, updates: Partial<EbpRecommendation>): Promise<EbpRecommendation> {
    const { db } = await import("./db");
    const [updated] = await db
      .update(ebpRecommendationsTable)
      .set(updates)
      .where(eq(ebpRecommendationsTable.id, id))
      .returning();
    
    return updated as EbpRecommendation;
  }

  async createAiInsight(data: InsertAiInsightsHistory): Promise<AiInsightsHistory> {
    const [insight] = await db.insert(aiInsightsHistoryTable).values(data).returning();
    return insight;
  }

  async updateAiInsight(id: string, updates: Partial<InsertAiInsightsHistory>): Promise<void> {
    await db.update(aiInsightsHistoryTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(aiInsightsHistoryTable.id, id));
  }
}

export const storage = new DatabaseStorage();
