import { 
  feedbackTable, 
  userAnalyticsTable,
  supervisionSessionTable,
  superviseeRelationshipTable,
  competencyAssessmentTable,
  complianceAlertTable,
  competencyFrameworkTable,
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
  type InsertCompetencyFramework
} from "@shared/schema";

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
        requiredHours: relationship.requiredHours.toString(),
        completedHours: relationship.completedHours.toString(),
        contractSigned: relationship.contractSigned.toString(),
        backgroundCheckCompleted: relationship.backgroundCheckCompleted.toString(),
        licenseVerified: relationship.licenseVerified.toString(),
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
}

export const storage = new DatabaseStorage();
