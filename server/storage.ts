import { 
  feedbackTable, 
  userAnalyticsTable,
  supervisionSessionTable,
  superviseeRelationshipTable,
  competencyAssessmentTable,
  complianceAlertTable,
  competencyFrameworkTable,
  knowledgeEntryTable,
  promptTable,
  reviewTable,
  type Feedback, 
  type InsertFeedback, 
  type UserAnalytics, 
  type InsertUserAnalytics,
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
  type InsertReview
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
    // Placeholder for OpenAI integration - will be implemented in API routes
    return [];
  }
}

export const storage = new DatabaseStorage();
