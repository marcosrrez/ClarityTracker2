import { z } from "zod";
import { pgTable, text, timestamp, varchar, integer, real, jsonb, serial } from 'drizzle-orm/pg-core';

// User Profile Schema
export const userProfileSchema = z.object({
  preferredName: z.string().min(1, "Preferred name is required"),
  displayName: z.string().optional(),
  focus: z.enum(["licensure", "renewal"]),
  accountType: z.enum(["individual", "supervisor", "enterprise"]).default("individual"),
  organizationName: z.string().optional(),
  supervisorId: z.string().optional(),
  stateRegion: z.string().min(1, "State/region is required"),
  licenseStage: z.string().optional(),
  licensureGoalDate: z.date().optional(),
  trackingChallenge: z.string().optional(),
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
  clientContactHours: z.number().min(0).max(24).default(0),
  indirectHours: z.boolean().default(false),
  supervisionHours: z.number().min(0).max(8).default(0),
  supervisionType: z.enum(["none", "individual", "dyadic", "group"]).default("none"),
  supervisionDate: z.date().optional(),
  techAssistedSupervision: z.boolean().default(false),
  professionalDevelopmentHours: z.number().min(0).default(0),
  professionalDevelopmentType: z.enum([
    "none", "ethics", "workshop", "conference", "webinar", 
    "reading", "research", "consultation", "training"
  ]).default("none"),
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
  type: z.enum(["note", "articleSummary", "image"]),
  title: z.string(),
  content: z.string(), // HTML content from Tiptap
  tags: z.array(z.string()).default([]),
  originalUrl: z.string().optional(), // For article summaries
  imageData: z.string().optional(), // Base64 encoded image
  visualAnalysis: z.object({
    extractedText: z.string(),
    objects: z.array(z.string()),
    colors: z.array(z.string()),
    brands: z.array(z.string()),
    categories: z.array(z.string()),
    description: z.string(),
    keywords: z.array(z.string()),
    searchableContent: z.string(),
    confidence: z.number()
  }).optional(),
  searchTags: z.array(z.string()).optional(), // Generated search tags
  analysis: z.any().optional(), // AI analysis results (session or conversation)
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
  page: varchar('page', { length: 100 }), // dashboard, add-entry,insights, etc.
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

// Supervisor Profile Schema - for managing supervisor information
export const supervisorTable = pgTable('supervisors', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  specialties: text('specialties').notNull(), // JSON array of specialties
  supervisionType: varchar('supervision_type', { length: 50 }).notNull(), // individual, group, both
  sessionFrequency: varchar('session_frequency', { length: 50 }).notNull(), // weekly, biweekly, monthly, asNeeded
  sessionDuration: varchar('session_duration', { length: 10 }).notNull(),
  notes: text('notes'),
  isActive: varchar('is_active', { length: 10 }).default('true'),
  totalHours: varchar('total_hours', { length: 10 }).default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

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

// Supervisor Schema and Types
export const supervisorSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().min(1, "Name is required"),
  title: z.string().min(1, "Title is required"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  specialties: z.array(z.string()).min(1, "At least one specialty is required"),
  supervisionType: z.enum(['individual', 'group', 'both']),
  sessionFrequency: z.enum(['weekly', 'biweekly', 'monthly', 'asNeeded']),
  sessionDuration: z.string(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
  totalHours: z.number().default(0),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const insertSupervisorSchema = supervisorSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Supervisor = z.infer<typeof supervisorSchema>;
export type InsertSupervisor = z.infer<typeof insertSupervisorSchema>;

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

// State Requirements Schema - for licensure requirements by state
export const stateRequirementsTable = pgTable('state_requirements', {
  id: varchar('id', { length: 255 }).primaryKey(),
  state: varchar('state', { length: 50 }).notNull(),
  licenseType: varchar('license_type', { length: 50 }).notNull(), // LPC, LMFT, LCDC, etc.
  totalCCH: integer('total_cch').notNull(),
  directCCH: integer('direct_cch').notNull(),
  supervisionHours: integer('supervision_hours').notNull(),
  ethicsHours: integer('ethics_hours').notNull(),
  groupSupervisionRatio: real('group_supervision_ratio').default(2), // group to individual ratio
  maxGroupParticipants: integer('max_group_participants').default(6),
  renewalCEHours: integer('renewal_ce_hours').default(40),
  renewalPeriodMonths: integer('renewal_period_months').default(24),
  specialRequirements: text('special_requirements'), // JSON array of special requirements
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
});

export const stateRequirementsSchema = z.object({
  id: z.string(),
  state: z.string(),
  licenseType: z.string(),
  totalCCH: z.number(),
  directCCH: z.number(),
  supervisionHours: z.number(),
  ethicsHours: z.number(),
  groupSupervisionRatio: z.number().default(2),
  maxGroupParticipants: z.number().default(6),
  renewalCEHours: z.number().default(40),
  renewalPeriodMonths: z.number().default(24),
  specialRequirements: z.array(z.string()).default([]),
  lastUpdated: z.date(),
});

export type StateRequirements = z.infer<typeof stateRequirementsSchema>;

// User Learning Profile Schema - tracks how users learn and engage
export const userLearningProfileTable = pgTable('user_learning_profiles', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  learningStyle: varchar('learning_style', { length: 50 }), // visual, auditory, kinesthetic, reading
  preferredResourceTypes: text('preferred_resource_types'), // JSON array
  engagementPatterns: text('engagement_patterns'), // JSON object with usage patterns
  optimalNotificationTiming: text('optimal_notification_timing'), // JSON object
  responseToCoachingStyles: text('response_to_coaching_styles'), // JSON object
  completionRates: text('completion_rates'), // JSON object with completion rates by type
  strugglingAreas: text('struggling_areas'), // JSON array
  strengthAreas: text('strength_areas'), // JSON array
  lastAnalyzed: timestamp('last_analyzed').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const userLearningProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  learningStyle: z.enum(['visual', 'auditory', 'kinesthetic', 'reading']).optional(),
  preferredResourceTypes: z.array(z.string()).default([]),
  engagementPatterns: z.record(z.any()).default({}),
  optimalNotificationTiming: z.record(z.any()).default({}),
  responseToCoachingStyles: z.record(z.any()).default({}),
  completionRates: z.record(z.number()).default({}),
  strugglingAreas: z.array(z.string()).default([]),
  strengthAreas: z.array(z.string()).default([]),
  lastAnalyzed: z.date(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type UserLearningProfile = z.infer<typeof userLearningProfileSchema>;

// AI Analysis Cache Schema - stores and reuses AI results
export const aiAnalysisCacheTable = pgTable('ai_analysis_cache', {
  id: varchar('id', { length: 255 }).primaryKey(),
  contentHash: varchar('content_hash', { length: 255 }).notNull(), // Hash of input content
  analysisType: varchar('analysis_type', { length: 50 }).notNull(), // session_analysis, pattern_detection, etc.
  inputData: text('input_data').notNull(), // Original input
  result: text('result').notNull(), // JSON result from AI
  usageCount: integer('usage_count').default(1),
  lastUsed: timestamp('last_used').defaultNow(),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Dinger Conversation Memory Schema - for contextual AI conversations
export const dingerConversationMemoryTable = pgTable('dinger_conversation_memory', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  sessionId: varchar('session_id', { length: 255 }).notNull(),
  query: text('query').notNull(),
  response: text('response').notNull(),
  mode: varchar('mode', { length: 50 }).notNull(), // supervisor, peer, clinician, researcher
  reasoningType: varchar('reasoning_type', { length: 50 }).notNull(),
  competencyAreas: text('competency_areas'), // JSON array
  emotionalTone: varchar('emotional_tone', { length: 50 }), // confident, uncertain, frustrated, etc.
  complexity: integer('complexity').notNull(), // 1-100 scale
  confidence: integer('confidence').notNull(), // AI confidence in response
  outcomeRating: integer('outcome_rating'), // User rating of helpfulness
  followUpNeeded: integer('follow_up_needed').default(0), // boolean as int
  tags: text('tags'), // JSON array of categorization tags
  resourcesProvided: text('resources_provided'), // JSON array of resources
  supervisionItems: text('supervision_items'), // JSON array of supervision prep items
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const dingerConversationMemorySchema = z.object({
  id: z.string(),
  userId: z.string(),
  sessionId: z.string(),
  query: z.string(),
  response: z.string(),
  mode: z.enum(['supervisor', 'peer', 'clinician', 'researcher']),
  reasoningType: z.enum(['chain-of-thought', 'tree-of-thought', 'direct']),
  competencyAreas: z.array(z.string()).default([]),
  emotionalTone: z.enum(['confident', 'uncertain', 'frustrated', 'curious', 'overwhelmed']).optional(),
  complexity: z.number().min(1).max(100),
  confidence: z.number().min(1).max(100),
  outcomeRating: z.number().min(1).max(5).optional(),
  followUpNeeded: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  resourcesProvided: z.array(z.any()).default([]),
  supervisionItems: z.array(z.string()).default([]),
  timestamp: z.date().default(() => new Date()),
  createdAt: z.date().default(() => new Date()),
});

export type DingerConversationMemory = z.infer<typeof dingerConversationMemorySchema>;

// Session Intelligence Tables for Phase 1 Implementation
export const sessionRecordingTable = pgTable('session_recordings', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  logEntryId: varchar('log_entry_id', { length: 255 }).notNull(),
  sessionDate: timestamp('session_date').notNull(),
  duration: integer('duration').notNull(), // in minutes
  transcriptPath: varchar('transcript_path', { length: 500 }),
  transcript: text('transcript'),
  status: varchar('status', { length: 20 }).notNull().default('recording'),
  aiAnalysis: text('ai_analysis'), // JSON object
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const progressNoteTable = pgTable('progress_notes', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  logEntryId: varchar('log_entry_id', { length: 255 }).notNull(),
  sessionRecordingId: varchar('session_recording_id', { length: 255 }),
  noteType: varchar('note_type', { length: 20 }).notNull().default('manual'),
  content: text('content').notNull(),
  aiSuggestions: text('ai_suggestions'), // JSON object
  timeToComplete: integer('time_to_complete'), // in minutes
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const supervisionAnalyticsTable = pgTable('supervision_analytics', {
  id: varchar('id', { length: 255 }).primaryKey(),
  supervisorId: varchar('supervisor_id', { length: 255 }).notNull(),
  superviseeId: varchar('supervisee_id', { length: 255 }).notNull(),
  analysisDate: timestamp('analysis_date').notNull(),
  period: varchar('period', { length: 20 }).notNull().default('monthly'),
  metrics: text('metrics').notNull(), // JSON object
  supervisionNotes: text('supervision_notes'),
  actionItems: text('action_items'), // JSON array
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const riskAssessmentTable = pgTable('risk_assessments', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  sessionRecordingId: varchar('session_recording_id', { length: 255 }),
  logEntryId: varchar('log_entry_id', { length: 255 }).notNull(),
  assessmentType: varchar('assessment_type', { length: 20 }).notNull().default('automated'),
  riskLevel: varchar('risk_level', { length: 20 }).notNull().default('low'),
  indicators: text('indicators').notNull(), // JSON object
  immediateActions: text('immediate_actions'), // JSON array
  supervisionRequired: integer('supervision_required').default(0), // boolean as int
  followUpDate: timestamp('follow_up_date'),
  resolution: text('resolution'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Session Intelligence Schemas
export const sessionRecordingSchema = z.object({
  id: z.string(),
  userId: z.string(),
  logEntryId: z.string(),
  sessionDate: z.date(),
  duration: z.number(), // in minutes
  transcriptPath: z.string().optional(),
  transcript: z.string().optional(),
  status: z.enum(["recording", "processing", "completed", "error"]).default("recording"),
  aiAnalysis: z.object({
    themes: z.array(z.string()),
    interventions: z.array(z.string()),
    riskIndicators: z.array(z.string()),
    therapeuticAlliance: z.number().min(1).max(10),
    ebpUsage: z.array(z.string()),
    suggestedNotes: z.string(),
    confidenceScore: z.number().min(0).max(1)
  }).optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const insertSessionRecordingSchema = sessionRecordingSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export type SessionRecording = z.infer<typeof sessionRecordingSchema>;
export type InsertSessionRecording = z.infer<typeof insertSessionRecordingSchema>;

export const progressNoteSchema = z.object({
  id: z.string(),
  userId: z.string(),
  logEntryId: z.string(),
  sessionRecordingId: z.string().optional(),
  noteType: z.enum(["manual", "ai_assisted", "auto_generated"]).default("manual"),
  content: z.string(),
  aiSuggestions: z.object({
    originalContent: z.string(),
    suggestedImprovements: z.array(z.string()),
    complianceChecks: z.array(z.object({
      rule: z.string(),
      status: z.enum(["pass", "warning", "fail"]),
      suggestion: z.string()
    })),
    billingCodes: z.array(z.string())
  }).optional(),
  timeToComplete: z.number().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const insertProgressNoteSchema = progressNoteSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export type ProgressNote = z.infer<typeof progressNoteSchema>;
export type InsertProgressNote = z.infer<typeof insertProgressNoteSchema>;

// Risk Assessment Schemas
export const riskAssessmentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  sessionRecordingId: z.string().optional(),
  logEntryId: z.string(),
  assessmentType: z.enum(["automated", "manual", "triggered"]).default("automated"),
  riskLevel: z.enum(["low", "medium", "high", "critical"]).default("low"),
  indicators: z.object({
    suicidalIdeation: z.boolean().default(false),
    homicidalIdeation: z.boolean().default(false),
    substanceAbuse: z.boolean().default(false),
    domesticViolence: z.boolean().default(false),
    childAbuse: z.boolean().default(false),
    psychosis: z.boolean().default(false),
    selfHarm: z.boolean().default(false)
  }),
  immediateActions: z.array(z.string()).default([]),
  supervisionRequired: z.boolean().default(false),
  followUpDate: z.date().optional(),
  resolution: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const insertRiskAssessmentSchema = riskAssessmentSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export type RiskAssessment = z.infer<typeof riskAssessmentSchema>;
export type InsertRiskAssessment = z.infer<typeof insertRiskAssessmentSchema>;

// Dinger User Profile Schema - for personalized AI coaching
export const dingerUserProfileTable = pgTable('dinger_user_profiles', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().unique(),
  experienceLevel: varchar('experience_level', { length: 50 }).notNull(),
  monthsOfExperience: integer('months_of_experience').notNull(),
  primaryModalities: text('primary_modalities'), // JSON array
  clientPopulations: text('client_populations'), // JSON array
  strengthAreas: text('strength_areas'), // JSON array
  challengeAreas: text('challenge_areas'), // JSON array
  learningStyle: varchar('learning_style', { length: 50 }),
  communicationPreference: varchar('communication_preference', { length: 50 }),
  recentFocusAreas: text('recent_focus_areas'), // JSON array
  confidenceLevel: integer('confidence_level').notNull(), // 1-100
  preferredMode: varchar('preferred_mode', { length: 50 }),
  adaptiveSettings: text('adaptive_settings'), // JSON object with personalization settings
  conversationCount: integer('conversation_count').default(0),
  averageSessionLength: integer('average_session_length').default(0), // in minutes
  lastInteraction: timestamp('last_interaction').defaultNow(),
  profileVersion: integer('profile_version').default(1), // for profile evolution tracking
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const dingerUserProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  experienceLevel: z.enum(['novice', 'developing', 'proficient', 'expert']),
  monthsOfExperience: z.number().min(0),
  primaryModalities: z.array(z.string()).default([]),
  clientPopulations: z.array(z.string()).default([]),
  strengthAreas: z.array(z.string()).default([]),
  challengeAreas: z.array(z.string()).default([]),
  learningStyle: z.enum(['visual', 'auditory', 'kinesthetic', 'reading']).optional(),
  communicationPreference: z.enum(['direct', 'supportive', 'collaborative', 'analytical']).optional(),
  recentFocusAreas: z.array(z.string()).default([]),
  confidenceLevel: z.number().min(1).max(100),
  preferredMode: z.enum(['supervisor', 'peer', 'clinician', 'researcher']).optional(),
  adaptiveSettings: z.record(z.any()).default({}),
  conversationCount: z.number().default(0),
  averageSessionLength: z.number().default(0),
  lastInteraction: z.date().default(() => new Date()),
  profileVersion: z.number().default(1),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const insertDingerUserProfileSchema = dingerUserProfileSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type DingerUserProfile = z.infer<typeof dingerUserProfileSchema>;
export type InsertDingerUserProfile = z.infer<typeof insertDingerUserProfileSchema>;

// Research Collections Schema - organize and save research papers
export const researchCollectionsTable = pgTable('research_collections', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  color: varchar('color', { length: 7 }).default('#3B82F6'), // hex color
  isPrivate: integer('is_private').default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Saved Research Papers Schema - individual research papers
export const savedResearchTable = pgTable('saved_research', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  collectionId: varchar('collection_id', { length: 255 }),
  title: text('title').notNull(),
  url: text('url').notNull(),
  domain: varchar('domain', { length: 255 }).notNull(),
  source: varchar('source', { length: 100 }).notNull(), // pubmed, scholar, etc
  snippet: text('snippet'),
  authors: text('authors'), // JSON array
  publishDate: varchar('publish_date', { length: 50 }),
  citationApa: text('citation_apa'),
  tags: text('tags'), // JSON array
  notes: text('notes'),
  summaryGenerated: text('summary_generated'),
  summaryType: varchar('summary_type', { length: 50 }), // key_findings, clinical_applications, etc
  isFavorite: integer('is_favorite').default(0),
  accessedCount: integer('accessed_count').default(0),
  lastAccessed: timestamp('last_accessed'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Research History Schema - track all research queries
export const researchHistoryTable = pgTable('research_history', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  query: text('query').notNull(),
  resultsCount: integer('results_count').default(0),
  searchContext: varchar('search_context', { length: 100 }), // ai_coach, manual_search, etc
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Research Collections Zod Schemas
export const researchCollectionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().min(1, "Collection name is required"),
  description: z.string().optional(),
  color: z.string().default('#3B82F6'),
  isPrivate: z.boolean().default(true),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const insertResearchCollectionSchema = researchCollectionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const savedResearchSchema = z.object({
  id: z.string(),
  userId: z.string(),
  collectionId: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Valid URL is required"),
  domain: z.string(),
  source: z.string(),
  snippet: z.string().optional(),
  authors: z.array(z.string()).default([]),
  publishDate: z.string().optional(),
  citationApa: z.string().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  summaryGenerated: z.string().optional(),
  summaryType: z.enum(['key_findings', 'clinical_applications', 'limitations', 'methodology']).optional(),
  isFavorite: z.boolean().default(false),
  accessedCount: z.number().default(0),
  lastAccessed: z.date().optional(),
  createdAt: z.date().default(() => new Date()),
});

export const insertSavedResearchSchema = savedResearchSchema.omit({
  id: true,
  accessedCount: true,
  lastAccessed: true,
  createdAt: true,
});

export const researchHistorySchema = z.object({
  id: z.string(),
  userId: z.string(),
  query: z.string(),
  resultsCount: z.number().default(0),
  searchContext: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
});

export const insertResearchHistorySchema = researchHistorySchema.omit({
  id: true,
  createdAt: true,
});

export type ResearchCollection = z.infer<typeof researchCollectionSchema>;
export type InsertResearchCollection = z.infer<typeof insertResearchCollectionSchema>;
export type SavedResearch = z.infer<typeof savedResearchSchema>;
export type InsertSavedResearch = z.infer<typeof insertSavedResearchSchema>;
export type ResearchHistory = z.infer<typeof researchHistorySchema>;
export type InsertResearchHistory = z.infer<typeof insertResearchHistorySchema>;

export const aiAnalysisCacheSchema = z.object({
  id: z.string(),
  contentHash: z.string(),
  analysisType: z.string(),
  inputData: z.string(),
  result: z.string(),
  usageCount: z.number().default(1),
  lastUsed: z.date(),
  expiresAt: z.date().optional(),
  createdAt: z.date().default(() => new Date()),
});

export type AiAnalysisCache = z.infer<typeof aiAnalysisCacheSchema>;

// Predictive Milestones Schema - tracks predicted completion dates and bottlenecks
export const predictiveMilestonesTable = pgTable('predictive_milestones', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  milestoneType: varchar('milestone_type', { length: 50 }).notNull(), // cch_completion, supervision_completion, etc.
  currentProgress: real('current_progress').notNull(), // percentage complete
  projectedCompletionDate: timestamp('projected_completion_date'),
  confidenceLevel: real('confidence_level').default(0.7), // 0-1 confidence in prediction
  identifiedBottlenecks: text('identified_bottlenecks'), // JSON array of potential issues
  suggestedActions: text('suggested_actions'), // JSON array of recommended steps
  lastCalculated: timestamp('last_calculated').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const predictiveMilestonesSchema = z.object({
  id: z.string(),
  userId: z.string(),
  milestoneType: z.string(),
  currentProgress: z.number().min(0).max(1),
  projectedCompletionDate: z.date().optional(),
  confidenceLevel: z.number().min(0).max(1).default(0.7),
  identifiedBottlenecks: z.array(z.string()).default([]),
  suggestedActions: z.array(z.string()).default([]),
  lastCalculated: z.date(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type PredictiveMilestones = z.infer<typeof predictiveMilestonesSchema>;

// Compliance Monitoring Schema - tracks ongoing compliance requirements
export const complianceMonitoringTable = pgTable('compliance_monitoring', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  requirementType: varchar('requirement_type', { length: 50 }).notNull(), // ce_credits, supervision_hours, etc.
  currentStatus: varchar('current_status', { length: 20 }).notNull(), // compliant, warning, overdue
  dueDate: timestamp('due_date'),
  completedAmount: real('completed_amount').default(0),
  requiredAmount: real('required_amount').notNull(),
  lastAlertSent: timestamp('last_alert_sent'),
  alertFrequency: varchar('alert_frequency', { length: 20 }).default('weekly'),
  autoAlerts: varchar('auto_alerts', { length: 10 }).default('true'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const complianceMonitoringSchema = z.object({
  id: z.string(),
  userId: z.string(),
  requirementType: z.string(),
  currentStatus: z.enum(['compliant', 'warning', 'overdue']),
  dueDate: z.date().optional(),
  completedAmount: z.number().default(0),
  requiredAmount: z.number(),
  lastAlertSent: z.date().optional(),
  alertFrequency: z.enum(['daily', 'weekly', 'monthly']).default('weekly'),
  autoAlerts: z.boolean().default(true),
  notes: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type ComplianceMonitoring = z.infer<typeof complianceMonitoringSchema>;

// Community Intelligence Schema - aggregate insights without personal data
export const communityIntelligenceTable = pgTable('community_intelligence', {
  id: varchar('id', { length: 255 }).primaryKey(),
  metric: varchar('metric', { length: 100 }).notNull(), // avg_completion_time, popular_resources, etc.
  state: varchar('state', { length: 50 }), // optional state filter
  licenseType: varchar('license_type', { length: 50 }), // optional license type filter
  timeframe: varchar('timeframe', { length: 20 }).notNull(), // week, month, quarter, year
  value: text('value').notNull(), // JSON value of the metric
  sampleSize: integer('sample_size').notNull(),
  lastUpdated: timestamp('last_updated').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const communityIntelligenceSchema = z.object({
  id: z.string(),
  metric: z.string(),
  state: z.string().optional(),
  licenseType: z.string().optional(),
  timeframe: z.enum(['week', 'month', 'quarter', 'year']),
  value: z.any(), // Flexible for different metric types
  sampleSize: z.number(),
  lastUpdated: z.date(),
  createdAt: z.date().default(() => new Date()),
});

export type CommunityIntelligence = z.infer<typeof communityIntelligenceSchema>;

// Resource Recommendation Schema - tracks and optimizes resource suggestions
export const resourceRecommendationTable = pgTable('resource_recommendations', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  resourceType: varchar('resource_type', { length: 50 }).notNull(), // article, course, tool, etc.
  resourceId: varchar('resource_id', { length: 255 }), // external resource identifier
  title: text('title').notNull(),
  description: text('description'),
  url: text('url'),
  relevanceScore: real('relevance_score').notNull(), // 0-1 relevance
  recommendationReason: text('recommendation_reason'), // why this was recommended
  recommendedAt: timestamp('recommended_at').defaultNow(),
  viewedAt: timestamp('viewed_at'),
  completedAt: timestamp('completed_at'),
  userRating: integer('user_rating'), // 1-5 star rating
  wasHelpful: varchar('was_helpful', { length: 10 }), // true, false, null
  tags: text('tags'), // JSON array of tags
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const resourceRecommendationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  resourceType: z.string(),
  resourceId: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  url: z.string().optional(),
  relevanceScore: z.number().min(0).max(1),
  recommendationReason: z.string().optional(),
  recommendedAt: z.date(),
  viewedAt: z.date().optional(),
  completedAt: z.date().optional(),
  userRating: z.number().min(1).max(5).optional(),
  wasHelpful: z.boolean().optional(),
  tags: z.array(z.string()).default([]),
  createdAt: z.date().default(() => new Date()),
});

export type ResourceRecommendation = z.infer<typeof resourceRecommendationSchema>;

// Compliance Alert Schema - for automated supervision alerts
export const complianceAlertTable = pgTable('compliance_alerts', {
  id: varchar('id', { length: 255 }).primaryKey(),
  supervisorId: varchar('supervisor_id', { length: 255 }).notNull(),
  superviseeId: varchar('supervisee_id', { length: 255 }).notNull(),
  alertType: varchar('alert_type', { length: 50 }).notNull(), // missed_session, hours_behind, documentation_overdue, risk_escalation
  severity: varchar('severity', { length: 20 }).notNull(), // low, medium, high, critical
  title: text('title').notNull(),
  description: text('description').notNull(),
  triggerData: text('trigger_data'), // JSON data about what triggered the alert
  isRead: varchar('is_read', { length: 10 }).default('false'),
  isResolved: varchar('is_resolved', { length: 10 }).default('false'),
  resolvedAt: timestamp('resolved_at'),
  resolvedBy: varchar('resolved_by', { length: 255 }),
  dueDate: timestamp('due_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const complianceAlertSchema = z.object({
  id: z.string(),
  supervisorId: z.string(),
  superviseeId: z.string(),
  alertType: z.enum(['missed_session', 'hours_behind', 'documentation_overdue', 'risk_escalation', 'contract_expiring', 'competency_concern']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  title: z.string(),
  description: z.string(),
  triggerData: z.record(z.any()).optional(),
  isRead: z.boolean().default(false),
  isResolved: z.boolean().default(false),
  resolvedAt: z.date().optional(),
  resolvedBy: z.string().optional(),
  dueDate: z.date().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const insertComplianceAlertSchema = complianceAlertSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ComplianceAlert = z.infer<typeof complianceAlertSchema>;
export type InsertComplianceAlert = z.infer<typeof insertComplianceAlertSchema>;

// Competency Framework Schema - standardized competency areas
export const competencyFrameworkTable = pgTable('competency_frameworks', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: text('name').notNull(),
  category: varchar('category', { length: 100 }).notNull(), // clinical, ethical, professional, cultural
  description: text('description'),
  developmentalMilestones: text('developmental_milestones'), // JSON array of milestones for each level
  assessmentCriteria: text('assessment_criteria'), // JSON object with criteria for each level
  isStandard: varchar('is_standard', { length: 10 }).default('true'), // standard vs custom competencies
  createdBy: varchar('created_by', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const competencyFrameworkSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(['clinical', 'ethical', 'professional', 'cultural', 'administrative']),
  description: z.string().optional(),
  developmentalMilestones: z.record(z.array(z.string())).optional(), // keyed by proficiency level
  assessmentCriteria: z.record(z.array(z.string())).optional(), // keyed by proficiency level
  isStandard: z.boolean().default(true),
  createdBy: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const insertCompetencyFrameworkSchema = competencyFrameworkSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CompetencyFramework = z.infer<typeof competencyFrameworkSchema>;
export type InsertCompetencyFramework = z.infer<typeof insertCompetencyFrameworkSchema>;

// Knowledge Base and Spaced Repetition Tables
export const knowledgeEntryTable = pgTable('knowledge_entries', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  sourceType: varchar('source_type', { length: 50 }).notNull(), // 'CE' or 'Book'
  sourceTitle: text('source_title').notNull(),
  tags: text('tags'), // JSON array as text
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const promptTable = pgTable('prompts', {
  id: varchar('id', { length: 255 }).primaryKey(),
  knowledgeEntryId: varchar('knowledge_entry_id', { length: 255 }).references(() => knowledgeEntryTable.id).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const reviewTable = pgTable('reviews', {
  id: varchar('id', { length: 255 }).primaryKey(),
  promptId: varchar('prompt_id', { length: 255 }).references(() => promptTable.id).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  difficulty: integer('difficulty').notNull(), // 0-5 scale
  easeFactor: real('ease_factor').default(2.5).notNull(),
  interval: integer('interval').default(1).notNull(), // days
  repetitions: integer('repetitions').default(0).notNull(),
  nextReviewDate: timestamp('next_review_date').notNull(),
  reviewedAt: timestamp('reviewed_at').defaultNow().notNull()
});

export const knowledgeEntrySchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  content: z.string(),
  sourceType: z.enum(['CE', 'Book']),
  sourceTitle: z.string(),
  tags: z.array(z.string()).optional(),
  imageUrl: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const insertKnowledgeEntrySchema = knowledgeEntrySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const promptSchema = z.object({
  id: z.string(),
  knowledgeEntryId: z.string(),
  userId: z.string(),
  question: z.string(),
  answer: z.string(),
  imageUrl: z.string().optional(),
  createdAt: z.date()
});

export const insertPromptSchema = promptSchema.omit({
  id: true,
  createdAt: true
});

export const reviewSchema = z.object({
  id: z.string(),
  promptId: z.string(),
  userId: z.string(),
  difficulty: z.number().min(0).max(5),
  easeFactor: z.number(),
  interval: z.number(),
  repetitions: z.number(),
  nextReviewDate: z.date(),
  reviewedAt: z.date()
});

export const insertReviewSchema = reviewSchema.omit({
  id: true,
  reviewedAt: true
});

export type KnowledgeEntry = z.infer<typeof knowledgeEntrySchema>;
export type InsertKnowledgeEntry = z.infer<typeof insertKnowledgeEntrySchema>;
export type Prompt = z.infer<typeof promptSchema>;
export type InsertPrompt = z.infer<typeof insertPromptSchema>;
export type Review = z.infer<typeof reviewSchema>;
export type InsertReview = z.infer<typeof insertReviewSchema>;

// Progressive User Therapy Profile Schema
export const userTherapyProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  primaryModalities: z.array(z.string()).default([]), // CBT, DBT, EMDR, etc.
  clientPopulations: z.array(z.string()).default([]), // anxiety, depression, trauma, etc.
  commonInterventions: z.array(z.string()).default([]), // techniques user frequently mentions
  challengePatterns: z.array(z.string()).default([]), // recurring difficulties identified by AI
  strengthPatterns: z.array(z.string()).default([]), // consistent strengths noted
  supervisorFeedbackThemes: z.array(z.string()).default([]), // common supervision topics
  competencyLevels: z.object({
    therapeuticRelationship: z.number().min(1).max(5),
    assessmentSkills: z.number().min(1).max(5),
    interventionPlanning: z.number().min(1).max(5),
    ethicalDecisionMaking: z.number().min(1).max(5),
    culturalCompetence: z.number().min(1).max(5),
    lastUpdated: z.date()
  }),
  learningPreferences: z.array(z.string()).default([]), // visual, case-based, theoretical
  sessionCount: z.number().default(0),
  lastAnalyzed: z.date(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

export const insertUserTherapyProfileSchema = userTherapyProfileSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Supervision Intelligence Schema
export const supervisionIntelligenceSchema = z.object({
  id: z.string(),
  userId: z.string(),
  weekStartDate: z.date(),
  weeklyAnalysis: z.object({
    patternAlerts: z.array(z.string()),
    skillGrowthOpportunities: z.array(z.string()),
    ethicalConsiderations: z.array(z.string()),
    interventionEffectiveness: z.array(z.string()),
    challengingCasesSummary: z.array(z.string())
  }),
  suggestedAgenda: z.object({
    discussionTopics: z.array(z.string()),
    specificCasesToReview: z.array(z.string()),
    skillDevelopmentGoals: z.array(z.string()),
    resourceRecommendations: z.array(z.string())
  }),
  sessionDataAnalyzed: z.number().default(0),
  generatedAt: z.date().default(() => new Date()),
  createdAt: z.date().default(() => new Date())
});

export const insertSupervisionIntelligenceSchema = supervisionIntelligenceSchema.omit({
  id: true,
  generatedAt: true,
  createdAt: true
});

// Competency Analysis Schema
export const competencyAnalysisSchema = z.object({
  id: z.string(),
  userId: z.string(),
  sessionId: z.string().optional(), // linked to specific session if applicable
  competencyScores: z.object({
    therapeuticRelationship: z.object({
      score: z.number().min(1).max(5),
      evidence: z.array(z.string()),
      growthAreas: z.array(z.string())
    }),
    assessmentSkills: z.object({
      score: z.number().min(1).max(5),
      evidence: z.array(z.string()),
      growthAreas: z.array(z.string())
    }),
    interventionPlanning: z.object({
      score: z.number().min(1).max(5),
      evidence: z.array(z.string()),
      growthAreas: z.array(z.string())
    }),
    ethicalDecisionMaking: z.object({
      score: z.number().min(1).max(5),
      evidence: z.array(z.string()),
      growthAreas: z.array(z.string())
    }),
    culturalCompetence: z.object({
      score: z.number().min(1).max(5),
      evidence: z.array(z.string()),
      growthAreas: z.array(z.string())
    })
  }),
  supervisionDiscussionPoints: z.array(z.string()),
  nextDevelopmentSteps: z.array(z.string()),
  analyzedAt: z.date().default(() => new Date()),
  createdAt: z.date().default(() => new Date())
});

export const insertCompetencyAnalysisSchema = competencyAnalysisSchema.omit({
  id: true,
  analyzedAt: true,
  createdAt: true
});

// Pattern Analysis Schema
export const patternAnalysisSchema = z.object({
  id: z.string(),
  userId: z.string(),
  alertType: z.enum(['concern', 'growth', 'success', 'supervision_needed']),
  pattern: z.string(),
  frequency: z.number(),
  timeline: z.string(),
  recommendation: z.string(),
  urgency: z.enum(['low', 'medium', 'high']),
  isRead: z.boolean().default(false),
  isResolved: z.boolean().default(false),
  resolvedAt: z.date().optional(),
  createdAt: z.date().default(() => new Date())
});

export const insertPatternAnalysisSchema = patternAnalysisSchema.omit({
  id: true,
  createdAt: true
});

// AI Insights History Schema - stores generated AI coaching insights
export const aiInsightsHistorySchema = z.object({
  id: z.string(),
  userId: z.string(),
  insightType: z.enum(['coaching', 'competency', 'pattern', 'supervision_prep', 'cross_session']),
  title: z.string(),
  content: z.string(),
  sourceType: z.enum(['dashboard_coaching', 'competency_analysis', 'pattern_detection', 'supervision_intelligence', 'cross_session_analysis']),
  sourceData: z.record(z.any()).optional(), // Original AI response data
  metadata: z.object({
    sessionsAnalyzed: z.number().optional(),
    triggerConditions: z.array(z.string()).optional(),
    confidenceScore: z.number().optional()
  }).optional(),
  helpful: z.boolean().optional(),
  actionTaken: z.string().optional(),
  userFeedback: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

export const insertAiInsightsHistorySchema = aiInsightsHistorySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// AI Insights History Table
export const aiInsightsHistoryTable = pgTable('ai_insights_history', {
  id: varchar('id', { length: 255 }).primaryKey().notNull().$defaultFn(() => `insight_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`),
  userId: varchar('user_id', { length: 255 }).notNull(),
  insightType: varchar('insight_type', { length: 50 }).notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  sourceType: varchar('source_type', { length: 50 }).notNull(),
  sourceData: jsonb('source_data'),
  metadata: jsonb('metadata'),
  helpful: varchar('helpful', { length: 10 }), // stores 'true', 'false', or null
  actionTaken: text('action_taken'),
  userFeedback: text('user_feedback'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export type UserTherapyProfile = z.infer<typeof userTherapyProfileSchema>;
export type InsertUserTherapyProfile = z.infer<typeof insertUserTherapyProfileSchema>;
export type SupervisionIntelligence = z.infer<typeof supervisionIntelligenceSchema>;
export type InsertSupervisionIntelligence = z.infer<typeof insertSupervisionIntelligenceSchema>;
export type CompetencyAnalysis = z.infer<typeof competencyAnalysisSchema>;
export type InsertCompetencyAnalysis = z.infer<typeof insertCompetencyAnalysisSchema>;
export type PatternAnalysis = z.infer<typeof patternAnalysisSchema>;
export type InsertPatternAnalysis = z.infer<typeof insertPatternAnalysisSchema>;
export type AiInsightsHistory = z.infer<typeof aiInsightsHistorySchema>;
export type InsertAiInsightsHistory = z.infer<typeof insertAiInsightsHistorySchema>;

// Database Tables for AI Features
export const userTherapyProfileTable = pgTable('user_therapy_profiles', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  primaryModalities: jsonb('primary_modalities').default([]).notNull(),
  clientPopulations: jsonb('client_populations').default([]).notNull(),
  commonInterventions: jsonb('common_interventions').default([]).notNull(),
  challengePatterns: jsonb('challenge_patterns').default([]).notNull(),
  strengthPatterns: jsonb('strength_patterns').default([]).notNull(),
  supervisorFeedbackThemes: jsonb('supervisor_feedback_themes').default([]).notNull(),
  competencyLevels: jsonb('competency_levels').notNull(),
  learningPreferences: jsonb('learning_preferences').default([]).notNull(),
  sessionCount: integer('session_count').default(0).notNull(),
  lastAnalyzed: timestamp('last_analyzed').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const supervisionIntelligenceTable = pgTable('supervision_intelligence', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  weekStartDate: timestamp('week_start_date').notNull(),
  weeklyAnalysis: jsonb('weekly_analysis').notNull(),
  suggestedAgenda: jsonb('suggested_agenda').notNull(),
  sessionDataAnalyzed: integer('session_data_analyzed').default(0).notNull(),
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const competencyAnalysisTable = pgTable('competency_analysis', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  sessionId: varchar('session_id', { length: 255 }),
  competencyScores: jsonb('competency_scores').notNull(),
  supervisionDiscussionPoints: jsonb('supervision_discussion_points').default([]).notNull(),
  nextDevelopmentSteps: jsonb('next_development_steps').default([]).notNull(),
  analyzedAt: timestamp('analyzed_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const patternAnalysisTable = pgTable('pattern_analysis', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  alertType: varchar('alert_type', { length: 50 }).notNull(),
  pattern: text('pattern').notNull(),
  frequency: integer('frequency').notNull(),
  timeline: text('timeline').notNull(),
  recommendation: text('recommendation').notNull(),
  urgency: varchar('urgency', { length: 20 }).notNull(),
  isRead: varchar('is_read', { length: 10 }).default('false').notNull(),
  isResolved: varchar('is_resolved', { length: 10 }).default('false').notNull(),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Progressive Disclosure System Tables

// Educational Content Table - for tips, explanations, and guidance
export const educationalContentTable = pgTable('educational_content', {
  id: varchar('id', { length: 255 }).primaryKey(),
  category: varchar('category', { length: 100 }).notNull(), // supervision, direct_hours, ethics, etc.
  contentType: varchar('content_type', { length: 50 }).notNull(), // tip, explanation, guide, definition
  title: text('title').notNull(),
  content: text('content').notNull(), // markdown content
  level: integer('level').notNull().default(1), // 1=basic, 2=intermediate, 3=advanced
  tags: text('tags'), // JSON array of searchable tags
  targetAudience: varchar('target_audience', { length: 50 }).notNull().default('all'), // all, lac, lpc, supervisor
  orderIndex: integer('order_index').default(0),
  isActive: varchar('is_active', { length: 10 }).default('true'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const educationalContentSchema = z.object({
  id: z.string(),
  category: z.string(),
  contentType: z.enum(['tip', 'explanation', 'guide', 'definition']),
  title: z.string(),
  content: z.string(),
  level: z.number().min(1).max(3).default(1),
  tags: z.array(z.string()).default([]),
  targetAudience: z.enum(['all', 'lac', 'lpc', 'supervisor']).default('all'),
  orderIndex: z.number().default(0),
  isActive: z.boolean().default(true),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const insertEducationalContentSchema = educationalContentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type EducationalContent = z.infer<typeof educationalContentSchema>;
export type InsertEducationalContent = z.infer<typeof insertEducationalContentSchema>;

// User Progress Insights Table - for tracking and displaying progress messages
export const userProgressInsightTable = pgTable('user_progress_insights', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(), // supervision_hours, direct_hours, etc.
  insightType: varchar('insight_type', { length: 50 }).notNull(), // progress, milestone, trend, encouragement
  message: text('message').notNull(),
  data: text('data'), // JSON object with supporting data
  priority: integer('priority').default(1), // 1=low, 2=medium, 3=high
  isRead: varchar('is_read', { length: 10 }).default('false'),
  validUntil: timestamp('valid_until'), // when this insight expires
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userProgressInsightSchema = z.object({
  id: z.string(),
  userId: z.string(),
  category: z.string(),
  insightType: z.enum(['progress', 'milestone', 'trend', 'encouragement']),
  message: z.string(),
  data: z.any().optional(), // JSON object with supporting data
  priority: z.number().min(1).max(3).default(1),
  isRead: z.boolean().default(false),
  validUntil: z.date().optional(),
  createdAt: z.date().default(() => new Date()),
});

export const insertUserProgressInsightSchema = userProgressInsightSchema.omit({
  id: true,
  createdAt: true,
});

export type UserProgressInsight = z.infer<typeof userProgressInsightSchema>;
export type InsertUserProgressInsight = z.infer<typeof insertUserProgressInsightSchema>;

// Dashboard Interaction Table - for tracking user interactions with dashboard components
export const dashboardInteractionTable = pgTable('dashboard_interactions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  componentType: varchar('component_type', { length: 100 }).notNull(), // supervision_card, direct_hours_card, etc.
  interactionType: varchar('interaction_type', { length: 50 }).notNull(), // click, drill_down, educational_view
  level: integer('level').notNull().default(1), // 1=first level, 2=second level, 3=third level
  metadata: text('metadata'), // JSON with additional context
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

export const dashboardInteractionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  componentType: z.string(),
  interactionType: z.enum(['click', 'drill_down', 'educational_view']),
  level: z.number().min(1).max(3).default(1),
  metadata: z.any().optional(),
  timestamp: z.date().default(() => new Date()),
});

export const insertDashboardInteractionSchema = dashboardInteractionSchema.omit({
  id: true,
  timestamp: true,
});

export type DashboardInteraction = z.infer<typeof dashboardInteractionSchema>;
export type InsertDashboardInteraction = z.infer<typeof insertDashboardInteractionSchema>;