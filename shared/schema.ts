import { z } from "zod";
import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

// User Profile Schema
export const userProfileSchema = z.object({
  preferredName: z.string().min(1, "Preferred name is required"),
  focus: z.enum(["licensure", "renewal"]),
  accountType: z.enum(["individual", "supervisor", "enterprise"]).default("individual"),
  organizationName: z.string().optional(),
  supervisorId: z.string().optional(),
  stateRegion: z.string().min(1, "State/region is required"),
  licenseStage: z.string().optional(),
  specialties: z.array(z.string()).default([]),
  professionalGoals: z.string().optional(),
  yearsOfExperience: z.string().optional(),
  hasCompletedOnboarding: z.boolean().default(false),
  mainOnboardingCompleted: z.boolean().default(false),
  highlightOnboardingCompleted: z.boolean().default(false),
  subscriptionTier: z.enum(["free", "individual", "supervisor", "enterprise"]).default("free"),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type UserProfile = z.infer<typeof userProfileSchema>;
export type InsertUserProfile = z.infer<typeof userProfileSchema>;

// Log Entry Schema
export const logEntrySchema = z.object({
  id: z.string(),
  userId: z.string(),
  dateOfContact: z.date(),
  clientContactHours: z.number().min(0).max(24),
  indirectHours: z.boolean().default(false),
  supervisionDate: z.date().optional(),
  supervisionHours: z.number().min(0).max(8).default(0),
  supervisionType: z.enum(["none", "individual", "dyadic", "group"]).default("none"),
  techAssistedSupervision: z.boolean().default(false),
  notes: z.string().default(""),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const insertLogEntrySchema = logEntrySchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export type LogEntry = z.infer<typeof logEntrySchema>;
export type InsertLogEntry = z.infer<typeof insertLogEntrySchema>;

// App Settings Schema
export const appSettingsSchema = z.object({
  goals: z.object({
    totalCCH: z.number().min(0).default(2000),
    directCCH: z.number().min(0).default(1500),
    supervisionHours: z.number().min(0).default(200),
    ethicsHours: z.number().min(0).default(20),
    stateRegion: z.string().default(""),
  }),
  importedHours: z.object({
    totalCCH: z.number().min(0).default(0),
    directCCH: z.number().min(0).default(0),
    supervisionHours: z.number().min(0).default(0),
    ethicsHours: z.number().min(0).default(0),
  }),
  licenseInfo: z.object({
    lacLicenseDate: z.date().optional(),
    supervisionCheckInInterval: z.number().min(1).default(30),
  }),

  updatedAt: z.date().default(() => new Date()),
});

export const insertAppSettingsSchema = appSettingsSchema.omit({
  updatedAt: true,
});

export type AppSettings = z.infer<typeof appSettingsSchema>;
export type InsertAppSettings = z.infer<typeof insertAppSettingsSchema>;

// Insight Card Schema
export const insightCardSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(["note", "articleSummary"]),
  title: z.string(),
  content: z.string(), // HTML content from Tiptap
  tags: z.array(z.string()).default([]),
  originalUrl: z.string().optional(), // For article summaries
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const insertInsightCardSchema = insightCardSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export type InsightCard = z.infer<typeof insightCardSchema>;
export type InsertInsightCard = z.infer<typeof insertInsightCardSchema>;

// AI Analysis Schema
export const aiAnalysisSchema = z.object({
  id: z.string(),
  userId: z.string(),
  logEntryId: z.string(),
  originalNotesSnapshot: z.string(),
  summary: z.string(),
  themes: z.array(z.string()),
  potentialBlindSpots: z.array(z.string()),
  reflectivePrompts: z.array(z.string()),
  keyLearnings: z.array(z.string()),
  ccsrCategory: z.string(),
  createdAt: z.date().default(() => new Date()),
});

export const insertAiAnalysisSchema = aiAnalysisSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
});

export type AiAnalysis = z.infer<typeof aiAnalysisSchema>;
export type InsertAiAnalysis = z.infer<typeof insertAiAnalysisSchema>;

// Milestone Schema
export const milestoneSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(["cch_25", "cch_100", "cch_500", "cch_1000", "goal_completion"]),
  achieved: z.boolean().default(false),
  achievedAt: z.date().optional(),
  createdAt: z.date().default(() => new Date()),
});

export type Milestone = z.infer<typeof milestoneSchema>;

// Feedback Schema
// Database table for feedback
export const feedbackTable = pgTable('feedback', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }),
  type: varchar('type', { length: 20 }).notNull(),
  subject: text('subject').notNull(),
  description: text('description').notNull(),
  email: varchar('email', { length: 255 }),
  status: varchar('status', { length: 20 }).notNull().default('new'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Database table for user analytics tracking
export const userAnalyticsTable = pgTable('user_analytics', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  sessionId: varchar('session_id', { length: 255 }).notNull(),
  event: varchar('event', { length: 100 }).notNull(), // page_view, entry_added, ai_analysis, etc.
  page: varchar('page', { length: 100 }), // dashboard, add-entry, insights, etc.
  metadata: text('metadata'), // JSON string for additional data
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

export const feedbackSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  type: z.enum(["bug", "feature", "general"]),
  subject: z.string().min(1),
  description: z.string().min(1),
  email: z.string().email().optional(),
  status: z.enum(["new", "in_progress", "resolved"]).default("new"),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const insertFeedbackSchema = feedbackSchema.omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export type Feedback = z.infer<typeof feedbackSchema>;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;

// User Analytics Schema
export const userAnalyticsSchema = z.object({
  id: z.string(),
  userId: z.string(),
  sessionId: z.string(),
  event: z.string(),
  page: z.string().optional(),
  metadata: z.string().optional(),
  timestamp: z.date(),
});

export const insertUserAnalyticsSchema = userAnalyticsSchema.omit({
  id: true,
  timestamp: true,
});

export type UserAnalytics = z.infer<typeof userAnalyticsSchema>;
export type InsertUserAnalytics = z.infer<typeof insertUserAnalyticsSchema>;

// Supervision Session Schema - for tracking supervision meetings
export const supervisionSessionTable = pgTable('supervision_sessions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  supervisorId: varchar('supervisor_id', { length: 255 }).notNull(),
  superviseeId: varchar('supervisee_id', { length: 255 }).notNull(),
  sessionDate: timestamp('session_date').notNull(),
  durationMinutes: varchar('duration_minutes', { length: 10 }).notNull(),
  sessionType: varchar('session_type', { length: 50 }).notNull(), // individual, group, case_consultation
  topics: text('topics'), // JSON array of discussion topics
  notes: text('notes'),
  competencyAreas: text('competency_areas'), // JSON array of competency areas addressed
  actionItems: text('action_items'), // JSON array of follow-up items
  superviseeGoals: text('supervisee_goals'), // JSON array of goals discussed
  riskAssessment: varchar('risk_assessment', { length: 20 }).default('low'), // low, medium, high
  nextSessionDate: timestamp('next_session_date'),
  isCompleted: varchar('is_completed', { length: 10 }).default('false'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const supervisionSessionSchema = z.object({
  id: z.string(),
  supervisorId: z.string(),
  superviseeId: z.string(),
  sessionDate: z.date(),
  durationMinutes: z.number().min(1).max(480), // 1-8 hours max
  sessionType: z.enum(['individual', 'group', 'case_consultation']),
  topics: z.array(z.string()).default([]),
  notes: z.string().optional(),
  competencyAreas: z.array(z.string()).default([]),
  actionItems: z.array(z.string()).default([]),
  superviseeGoals: z.array(z.string()).default([]),
  riskAssessment: z.enum(['low', 'medium', 'high']).default('low'),
  nextSessionDate: z.date().optional(),
  isCompleted: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const insertSupervisionSessionSchema = supervisionSessionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type SupervisionSession = z.infer<typeof supervisionSessionSchema>;
export type InsertSupervisionSession = z.infer<typeof insertSupervisionSessionSchema>;

// Supervisee Relationship Schema - for tracking supervisor-supervisee relationships
export const superviseeRelationshipTable = pgTable('supervisee_relationships', {
  id: varchar('id', { length: 255 }).primaryKey(),
  supervisorId: varchar('supervisor_id', { length: 255 }).notNull(),
  superviseeId: varchar('supervisee_id', { length: 255 }).notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  status: varchar('status', { length: 20 }).notNull().default('active'), // active, inactive, completed
  supervisionType: varchar('supervision_type', { length: 50 }).notNull(), // direct, indirect, consultation
  requiredHours: varchar('required_hours', { length: 10 }).notNull().default('100'),
  completedHours: varchar('completed_hours', { length: 10 }).notNull().default('0'),
  frequency: varchar('frequency', { length: 20 }).notNull().default('weekly'), // weekly, biweekly, monthly
  contractSigned: varchar('contract_signed', { length: 10 }).default('false'),
  backgroundCheckCompleted: varchar('background_check_completed', { length: 10 }).default('false'),
  licenseVerified: varchar('license_verified', { length: 10 }).default('false'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const superviseeRelationshipSchema = z.object({
  id: z.string(),
  supervisorId: z.string(),
  superviseeId: z.string(),
  startDate: z.date(),
  endDate: z.date().optional(),
  status: z.enum(['active', 'inactive', 'completed']).default('active'),
  supervisionType: z.enum(['direct', 'indirect', 'consultation']),
  requiredHours: z.number().min(1).default(100),
  completedHours: z.number().min(0).default(0),
  frequency: z.enum(['weekly', 'biweekly', 'monthly']).default('weekly'),
  contractSigned: z.boolean().default(false),
  backgroundCheckCompleted: z.boolean().default(false),
  licenseVerified: z.boolean().default(false),
  notes: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const insertSuperviseeRelationshipSchema = superviseeRelationshipSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type SuperviseeRelationship = z.infer<typeof superviseeRelationshipSchema>;
export type InsertSuperviseeRelationship = z.infer<typeof insertSuperviseeRelationshipSchema>;

// Competency Assessment Schema - for tracking supervisee development
export const competencyAssessmentTable = pgTable('competency_assessments', {
  id: varchar('id', { length: 255 }).primaryKey(),
  supervisorId: varchar('supervisor_id', { length: 255 }).notNull(),
  superviseeId: varchar('supervisee_id', { length: 255 }).notNull(),
  assessmentDate: timestamp('assessment_date').notNull(),
  competencyArea: varchar('competency_area', { length: 100 }).notNull(),
  currentLevel: varchar('current_level', { length: 20 }).notNull(), // novice, advanced_beginner, competent, proficient, expert
  targetLevel: varchar('target_level', { length: 20 }).notNull(),
  strengths: text('strengths'),
  areasForGrowth: text('areas_for_growth'),
  actionPlan: text('action_plan'),
  timeframe: varchar('timeframe', { length: 50 }),
  progressNotes: text('progress_notes'),
  isCompleted: varchar('is_completed', { length: 10 }).default('false'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const competencyAssessmentSchema = z.object({
  id: z.string(),
  supervisorId: z.string(),
  superviseeId: z.string(),
  assessmentDate: z.date(),
  competencyArea: z.string(),
  currentLevel: z.enum(['novice', 'advanced_beginner', 'competent', 'proficient', 'expert']),
  targetLevel: z.enum(['novice', 'advanced_beginner', 'competent', 'proficient', 'expert']),
  strengths: z.string().optional(),
  areasForGrowth: z.string().optional(),
  actionPlan: z.string().optional(),
  timeframe: z.string().optional(),
  progressNotes: z.string().optional(),
  isCompleted: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const insertCompetencyAssessmentSchema = competencyAssessmentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CompetencyAssessment = z.infer<typeof competencyAssessmentSchema>;
export type InsertCompetencyAssessment = z.infer<typeof insertCompetencyAssessmentSchema>;
