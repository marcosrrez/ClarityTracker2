import { feedbackTable, type Feedback, type InsertFeedback } from "@shared/schema";

export interface IStorage {
  healthCheck(): Promise<boolean>;
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  getFeedback(): Promise<Feedback[]>;
  updateFeedbackStatus(id: string, status: string): Promise<void>;
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
}

export const storage = new DatabaseStorage();
