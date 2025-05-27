import { z } from "zod";

// User Profile Schema
export const userProfileSchema = z.object({
  preferredName: z.string().min(1, "Preferred name is required"),
  focus: z.enum(["licensure", "renewal"]),
  stateRegion: z.string().min(1, "State/region is required"),
  licenseStage: z.string().optional(),
  specialties: z.array(z.string()).default([]),
  professionalGoals: z.string().optional(),
  yearsOfExperience: z.string().optional(),
  hasCompletedOnboarding: z.boolean().default(false),
  mainOnboardingCompleted: z.boolean().default(false),
  highlightOnboardingCompleted: z.boolean().default(false),
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
  personalPreferences: z.object({
    userDefinedGrowthAreas: z.array(z.string()).default([]),
    favoriteTherapeuticModalities: z.array(z.string()).default([]),
  }),
  interfacePreferences: z.object({
    smartFeaturesEnabled: z.boolean().default(true),
    enabledCards: z.object({
      personalizedAICoaching: z.boolean().default(true),
      competencyTracker: z.boolean().default(true),
      achievementCelebration: z.boolean().default(true),
      crossSessionAnalysis: z.boolean().default(true),
      aiInsights: z.boolean().default(true),
      milestoneTracking: z.boolean().default(true),
      progressVisualization: z.boolean().default(true),
      quickStats: z.boolean().default(true),
      recentEntries: z.boolean().default(true),
    }).default({}),
    dashboardTemplate: z.enum(['essentials', 'professional', 'full_ai']).default('full_ai'),
  }).default({}),
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
