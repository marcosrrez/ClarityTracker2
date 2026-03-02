import { db } from "../db";
import { supervisionSessionTable } from "@shared/schema";
import { eq, desc, and, gte, lte, count } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface SupervisionMetrics {
  totalHours: number;
  sessionsThisMonth: number;
  activeSupervisors: number;
  progressPercentage: number;
}

export interface SupervisionSession {
  id: string;
  supervisorId: string;
  sessionDate: Date;
  durationMinutes: string;
  sessionType: string;
  topics: string;
  notes: string;
  competencyAreas: string;
  actionItems: string;
  superviseeGoals: string;
  riskAssessment: string;
  nextSessionDate?: Date;
  isCompleted: string;
  createdAt: Date;
  updatedAt: Date;
}

export class SupervisionService {
  static async getSupervisionMetrics(userId: string): Promise<SupervisionMetrics> {
    try {
      // Get all sessions for the user
      const sessions = await db
        .select()
        .from(supervisionSessionTable)
        .where(eq(supervisionSessionTable.superviseeId, userId))
        .orderBy(desc(supervisionSessionTable.sessionDate));

      // Calculate total hours
      const totalHours = sessions.reduce((sum, session) => {
        const minutes = parseInt(session.durationMinutes) || 0;
        return sum + (minutes / 60);
      }, 0);

      // Calculate sessions this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const sessionsThisMonth = sessions.filter(session => {
        const sessionDate = new Date(session.sessionDate);
        return sessionDate >= startOfMonth && sessionDate <= endOfMonth;
      }).length;

      // Count unique active supervisors
      const activeSupervisors = new Set(
        sessions
          .filter(session => session.isCompleted === 'true')
          .map(session => session.supervisorId)
      ).size;

      // Calculate progress percentage (assuming 100 hours required for example)
      const requiredHours = 100;
      const progressPercentage = Math.min(Math.round((totalHours / requiredHours) * 100), 100);

      return {
        totalHours: Math.round(totalHours * 10) / 10, // Round to 1 decimal
        sessionsThisMonth,
        activeSupervisors,
        progressPercentage
      };
    } catch (error) {
      console.error('Error getting supervision metrics:', error);
      return {
        totalHours: 0,
        sessionsThisMonth: 0,
        activeSupervisors: 0,
        progressPercentage: 0
      };
    }
  }

  static async logSupervisionSession(
    userId: string,
    sessionData: {
      supervisorId: string;
      sessionDate: Date;
      durationMinutes: number;
      sessionType: string;
      topics: string;
      notes: string;
      competencyAreas?: string[];
      actionItems?: string[];
      superviseeGoals?: string[];
      riskAssessment?: string;
      nextSessionDate?: Date;
    }
  ): Promise<string> {
    try {
      const sessionId = randomUUID();

      const newSession = {
        id: sessionId,
        supervisorId: sessionData.supervisorId,
        superviseeId: userId,
        sessionDate: sessionData.sessionDate,
        durationMinutes: sessionData.durationMinutes.toString(),
        sessionType: sessionData.sessionType,
        topics: sessionData.topics,
        notes: sessionData.notes,
        competencyAreas: JSON.stringify(sessionData.competencyAreas || []),
        actionItems: JSON.stringify(sessionData.actionItems || []),
        superviseeGoals: JSON.stringify(sessionData.superviseeGoals || []),
        riskAssessment: sessionData.riskAssessment || 'low',
        nextSessionDate: sessionData.nextSessionDate,
        isCompleted: 'true'
      };

      await db.insert(supervisionSessionTable).values(newSession);
      return sessionId;
    } catch (error) {
      console.error('Error logging supervision session:', error);
      throw new Error('Failed to log supervision session');
    }
  }

  static async getRecentSessions(userId: string, limit: number = 10): Promise<SupervisionSession[]> {
    try {
      const sessions = await db
        .select()
        .from(supervisionSessionTable)
        .where(eq(supervisionSessionTable.superviseeId, userId))
        .orderBy(desc(supervisionSessionTable.sessionDate))
        .limit(limit);

      return sessions.map(session => ({
        ...session,
        sessionDate: new Date(session.sessionDate),
        nextSessionDate: session.nextSessionDate ? new Date(session.nextSessionDate) : undefined,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt)
      })) as SupervisionSession[];
    } catch (error) {
      console.error('Error getting recent sessions:', error);
      return [];
    }
  }

  static async getUniqueSupervisors(userId: string): Promise<Array<{id: string, name: string}>> {
    try {
      const sessions = await db
        .select()
        .from(supervisionSessionTable)
        .where(eq(supervisionSessionTable.superviseeId, userId));

      // Get unique supervisors
      const supervisorMap = new Map();
      sessions.forEach(session => {
        if (!supervisorMap.has(session.supervisorId)) {
          supervisorMap.set(session.supervisorId, {
            id: session.supervisorId,
            name: session.supervisorId // In a real app, you'd have a supervisors table
          });
        }
      });

      return Array.from(supervisorMap.values());
    } catch (error) {
      console.error('Error getting supervisors:', error);
      return [];
    }
  }
}