import { db } from './db';
import { 
  educationalContentTable, 
  userProgressInsightTable, 
  dashboardInteractionTable,
  type EducationalContent,
  type InsertEducationalContent,
  type UserProgressInsight,
  type InsertUserProgressInsight,
  type InsertDashboardInteraction
} from '@shared/schema';
import { eq, and, desc, asc, gte, lte } from 'drizzle-orm';

export class ProgressiveDisclosureService {
  
  /**
   * Generate progress insights for a user based on their log entries
   */
  async generateProgressInsights(userId: string, logEntries: any[]): Promise<UserProgressInsight[]> {
    const insights: InsertUserProgressInsight[] = [];
    
    if (logEntries.length === 0) {
      return [];
    }

    // Calculate current totals
    const totals = this.calculateTotals(logEntries);
    
    // Generate supervision hours insights
    const supervisionInsights = this.generateSupervisionInsights(userId, totals, logEntries);
    insights.push(...supervisionInsights);
    
    // Generate direct hours insights
    const directHoursInsights = this.generateDirectHoursInsights(userId, totals, logEntries);
    insights.push(...directHoursInsights);
    
    // Generate professional development insights
    const pdInsights = this.generateProfessionalDevelopmentInsights(userId, totals, logEntries);
    insights.push(...pdInsights);
    
    // Save insights to database
    const savedInsights: UserProgressInsight[] = [];
    for (const insight of insights) {
      const [saved] = await db.insert(userProgressInsightTable)
        .values({
          id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...insight,
          data: insight.data ? JSON.stringify(insight.data) : null,
          isRead: 'false',
          validUntil: insight.validUntil || null
        })
        .returning();
      
      // Transform back for return type
      const transformedSaved = {
        ...saved,
        data: saved.data ? JSON.parse(saved.data) : undefined,
        isRead: saved.isRead === 'true',
        validUntil: saved.validUntil || undefined
      };
      savedInsights.push(transformedSaved as UserProgressInsight);
    }
    
    return savedInsights;
  }

  /**
   * Get educational content for a specific category
   */
  async getEducationalContent(category: string, level: number = 1, targetAudience: string = 'all'): Promise<EducationalContent[]> {
    const results = await db.select()
      .from(educationalContentTable)
      .where(and(
        eq(educationalContentTable.category, category),
        eq(educationalContentTable.level, level),
        eq(educationalContentTable.targetAudience, targetAudience),
        eq(educationalContentTable.isActive, 'true')
      ))
      .orderBy(asc(educationalContentTable.orderIndex));
    
    // Transform database results to match schema types
    return results.map(result => ({
      ...result,
      tags: result.tags ? JSON.parse(result.tags) : [],
      isActive: result.isActive === 'true',
      contentType: result.contentType as 'tip' | 'explanation' | 'guide' | 'definition',
      targetAudience: result.targetAudience as 'all' | 'lac' | 'lpc' | 'supervisor',
      orderIndex: result.orderIndex || 0
    }));
  }

  /**
   * Track dashboard interaction
   */
  async trackDashboardInteraction(userId: string, componentType: string, interactionType: 'click' | 'drill_down' | 'educational_view', level: number = 1, metadata?: any): Promise<void> {
    await db.insert(dashboardInteractionTable).values({
      id: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      componentType,
      interactionType,
      level,
      metadata: metadata ? JSON.stringify(metadata) : null
    });
  }

  /**
   * Get recent progress insights for a user
   */
  async getUserProgressInsights(userId: string, category?: string, limit: number = 10): Promise<UserProgressInsight[]> {
    const baseWhere = eq(userProgressInsightTable.userId, userId);
    const whereClause = category 
      ? and(baseWhere, eq(userProgressInsightTable.category, category))
      : baseWhere;
    
    const results = await db.select()
      .from(userProgressInsightTable)
      .where(whereClause)
      .orderBy(desc(userProgressInsightTable.createdAt))
      .limit(limit);
    
    // Transform database results to match schema types
    return results.map(result => ({
      ...result,
      data: result.data ? JSON.parse(result.data) : undefined,
      isRead: result.isRead === 'true',
      validUntil: result.validUntil || undefined,
      insightType: result.insightType as 'progress' | 'milestone' | 'trend' | 'encouragement',
      priority: result.priority || 1
    }));
  }

  /**
   * Seed educational content for the progressive disclosure system
   */
  async seedEducationalContent(): Promise<void> {
    const educationalContent: InsertEducationalContent[] = [
      // Supervision content
      {
        category: 'supervision_hours',
        contentType: 'explanation',
        title: 'Understanding Supervision Requirements',
        content: `Supervision is a critical component of your journey to licensure. Most states require **100-200 hours** of clinical supervision.

**Types of supervision include:**
- **Individual supervision**: One-on-one meetings with your supervisor
- **Group supervision**: Sessions with other supervisees (may count at a different ratio)
- **Triadic supervision**: You plus one other supervisee with the supervisor

**What counts as supervision:**
- Discussion of cases and clinical work
- Professional development planning
- Review of documentation and treatment plans
- Skills development and feedback`,
        level: 1,
        tags: ['supervision', 'requirements', 'licensure'],
        targetAudience: 'lac',
        orderIndex: 1,
        isActive: true
      },
      {
        category: 'supervision_hours',
        contentType: 'tip',
        title: 'Maximizing Your Supervision Experience',
        content: `**Preparation tips for supervision:**
- Bring specific cases or situations you want to discuss
- Prepare questions about interventions or treatment approaches
- Review your documentation before the session
- Set professional development goals with your supervisor

**During supervision:**
- Take notes on feedback and recommendations
- Ask for clarification when needed
- Discuss challenging cases openly
- Request resources for continued learning`,
        level: 2,
        tags: ['supervision', 'tips', 'preparation'],
        targetAudience: 'lac',
        orderIndex: 2,
        isActive: true
      },
      
      // Direct hours content
      {
        category: 'direct_hours',
        contentType: 'explanation',
        title: 'What Counts as Direct Client Contact',
        content: `Direct client contact hours are the foundation of your clinical experience. These hours involve **face-to-face interaction** with clients.

**Direct hours include:**
- Individual therapy sessions
- Group therapy sessions
- Family therapy sessions
- Couples therapy sessions
- Crisis interventions with clients
- Intake assessments

**What does NOT count:**
- Documentation time
- Treatment planning (unless with client)
- Phone calls (unless specifically allowed by your state)
- Administrative tasks
- Travel time`,
        level: 1,
        tags: ['direct_hours', 'client_contact', 'requirements'],
        targetAudience: 'lac',
        orderIndex: 1,
        isActive: true
      },
      {
        category: 'direct_hours',
        contentType: 'tip',
        title: 'Building Your Direct Hours Efficiently',
        content: `**Strategies to accumulate direct hours:**
- Maintain a consistent schedule with regular clients
- Consider group therapy sessions (often count at full value)
- Look for opportunities to co-facilitate groups
- Volunteer for crisis coverage when appropriate
- Seek diverse clinical experiences

**Time management:**
- Block schedule similar types of sessions
- Use templates for common documentation
- Prepare session materials in advance
- Set boundaries to prevent burnout`,
        level: 2,
        tags: ['direct_hours', 'efficiency', 'time_management'],
        targetAudience: 'lac',
        orderIndex: 2,
        isActive: true
      },
      
      // Professional development content
      {
        category: 'professional_development',
        contentType: 'explanation',
        title: 'Professional Development Requirements',
        content: `Professional development helps you grow as a clinician and often counts toward licensure requirements.

**What typically counts:**
- **Ethics training** (often required separately)
- Workshops and conferences
- Webinars and online training
- Professional reading and research
- Consultation with other professionals
- Specialized training programs

**Benefits beyond requirements:**
- Enhanced clinical skills
- Professional networking
- Specialty area development
- Career advancement opportunities`,
        level: 1,
        tags: ['professional_development', 'continuing_education', 'ethics'],
        targetAudience: 'lac',
        orderIndex: 1,
        isActive: true
      }
    ];

    // Insert educational content
    for (const content of educationalContent) {
      const { tags, isActive, ...contentData } = content;
      await db.insert(educationalContentTable).values({
        id: `edu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...contentData,
        tags: JSON.stringify(tags),
        isActive: isActive ? 'true' : 'false'
      });
    }
  }

  private calculateTotals(logEntries: any[]) {
    return logEntries.reduce((totals, entry) => ({
      totalClientHours: totals.totalClientHours + (entry.clientContactHours || 0),
      totalSupervisionHours: totals.totalSupervisionHours + (entry.supervisionHours || 0),
      totalProfessionalDevelopmentHours: totals.totalProfessionalDevelopmentHours + (entry.professionalDevelopmentHours || 0),
      entriesThisMonth: totals.entriesThisMonth + (this.isThisMonth(entry.dateOfContact) ? 1 : 0),
      entriesLastMonth: totals.entriesLastMonth + (this.isLastMonth(entry.dateOfContact) ? 1 : 0)
    }), {
      totalClientHours: 0,
      totalSupervisionHours: 0,
      totalProfessionalDevelopmentHours: 0,
      entriesThisMonth: 0,
      entriesLastMonth: 0
    });
  }

  private generateSupervisionInsights(userId: string, totals: any, logEntries: any[]): InsertUserProgressInsight[] {
    const insights: InsertUserProgressInsight[] = [];
    const targetSupervisionHours = 100; // Default target
    
    // Progress insight
    const progressPercentage = Math.round((totals.totalSupervisionHours / targetSupervisionHours) * 100);
    insights.push({
      userId,
      category: 'supervision_hours',
      insightType: 'progress',
      message: `You're ${progressPercentage}% of the way to your supervision goal (${totals.totalSupervisionHours}/${targetSupervisionHours} hours)`,
      data: {
        current: totals.totalSupervisionHours,
        target: targetSupervisionHours,
        percentage: progressPercentage
      },
      priority: progressPercentage >= 75 ? 3 : progressPercentage >= 50 ? 2 : 1,
      isRead: false
    });

    // Recent activity insight
    const recentSupervisionEntries = logEntries
      .filter(entry => entry.supervisionHours > 0 && this.isWithinDays(entry.dateOfContact, 30))
      .sort((a, b) => new Date(b.dateOfContact).getTime() - new Date(a.dateOfContact).getTime());
      
    if (recentSupervisionEntries.length > 0) {
      const latestEntry = recentSupervisionEntries[0];
      const recentHours = recentSupervisionEntries.reduce((sum, entry) => sum + entry.supervisionHours, 0);
      
      insights.push({
        userId,
        category: 'supervision_hours',
        insightType: 'trend',
        message: `You've logged ${recentHours} supervision hours in the last 30 days. Most recent: ${latestEntry.supervisionHours} hours on ${new Date(latestEntry.dateOfContact).toLocaleDateString()}`,
        data: {
          recentHours,
          latestDate: latestEntry.dateOfContact,
          latestHours: latestEntry.supervisionHours
        },
        priority: 2,
        isRead: false
      });
    }

    return insights;
  }

  private generateDirectHoursInsights(userId: string, totals: any, logEntries: any[]): InsertUserProgressInsight[] {
    const insights: InsertUserProgressInsight[] = [];
    const targetDirectHours = 1500; // Default target
    
    // Progress insight
    const progressPercentage = Math.round((totals.totalClientHours / targetDirectHours) * 100);
    insights.push({
      userId,
      category: 'direct_hours',
      insightType: 'progress',
      message: `You've completed ${totals.totalClientHours} of ${targetDirectHours} direct client hours (${progressPercentage}%)`,
      data: {
        current: totals.totalClientHours,
        target: targetDirectHours,
        percentage: progressPercentage
      },
      priority: progressPercentage >= 75 ? 3 : progressPercentage >= 50 ? 2 : 1,
      isRead: false
    });

    // Monthly comparison
    if (totals.entriesThisMonth > 0 && totals.entriesLastMonth > 0) {
      const trend = totals.entriesThisMonth > totals.entriesLastMonth ? 'increased' : 'decreased';
      const difference = Math.abs(totals.entriesThisMonth - totals.entriesLastMonth);
      
      insights.push({
        userId,
        category: 'direct_hours',
        insightType: 'trend',
        message: `Your activity has ${trend} this month: ${totals.entriesThisMonth} entries vs ${totals.entriesLastMonth} last month (${difference} entry difference)`,
        data: {
          thisMonth: totals.entriesThisMonth,
          lastMonth: totals.entriesLastMonth,
          trend,
          difference
        },
        priority: 2,
        isRead: false
      });
    }

    return insights;
  }

  private generateProfessionalDevelopmentInsights(userId: string, totals: any, logEntries: any[]): InsertUserProgressInsight[] {
    const insights: InsertUserProgressInsight[] = [];
    const targetPDHours = 20; // Default ethics/PD target
    
    if (totals.totalProfessionalDevelopmentHours > 0) {
      const progressPercentage = Math.round((totals.totalProfessionalDevelopmentHours / targetPDHours) * 100);
      insights.push({
        userId,
        category: 'professional_development',
        insightType: 'progress',
        message: `Professional development: ${totals.totalProfessionalDevelopmentHours} of ${targetPDHours} hours completed (${progressPercentage}%)`,
        data: {
          current: totals.totalProfessionalDevelopmentHours,
          target: targetPDHours,
          percentage: progressPercentage
        },
        priority: progressPercentage >= 100 ? 3 : 2,
        isRead: false
      });
    }

    return insights;
  }

  private isThisMonth(date: Date | string): boolean {
    const entryDate = new Date(date);
    const now = new Date();
    return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
  }

  private isLastMonth(date: Date | string): boolean {
    const entryDate = new Date(date);
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
    return entryDate.getMonth() === lastMonth.getMonth() && entryDate.getFullYear() === lastMonth.getFullYear();
  }

  private isWithinDays(date: Date | string, days: number): boolean {
    const entryDate = new Date(date);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return entryDate >= cutoff;
  }
}

export const progressiveDisclosureService = new ProgressiveDisclosureService();