import { feedbackTable, userAnalyticsTable, type Feedback, type InsertFeedback, type UserAnalytics, type InsertUserAnalytics } from "@shared/schema";

export interface IStorage {
  healthCheck(): Promise<boolean>;
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  getFeedback(): Promise<Feedback[]>;
  updateFeedbackStatus(id: string, status: string): Promise<void>;
  trackUserEvent(analytics: InsertUserAnalytics): Promise<void>;
  getAnalytics(): Promise<any>;
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
}

export const storage = new DatabaseStorage();
