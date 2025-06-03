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
  id: varchar('id', { length: 255 }).primaryKey(),
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