/**
 * Authentication Endpoint Examples for ClarityTracker 2
 *
 * This file demonstrates concrete implementation patterns for adding
 * authentication to various types of endpoints.
 *
 * Import the middleware from server/middleware/auth.ts:
 * - verifyToken: Validates JWT and adds user to request
 * - requireRole: Checks if user has required role(s)
 * - verifyOwnership: Checks if user owns the resource
 * - optionalAuth: Adds user if token present, continues without if not
 */

import type { Express } from "express";
import express from "express";
import {
  verifyToken,
  requireRole,
  verifyOwnership,
  optionalAuth,
  type AuthRequest
} from "../middleware/auth";

/**
 * PATTERN 1: ADMIN-ONLY ENDPOINT
 *
 * Use case: Administrative operations that only admins should access
 * Middleware: verifyToken + requireRole(['admin'])
 * Order matters: Authenticate first, then check role
 */
export function exampleAdminEndpoint(app: Express) {
  // ❌ BEFORE (No authentication)
  app.get("/api/admin/analytics", async (req, res) => {
    try {
      // Anyone can access this - SECURITY RISK!
      const analytics = await getSystemAnalytics();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // ✅ AFTER (With authentication)
  app.get("/api/admin/analytics",
    verifyToken,                    // 1. Validate JWT token
    requireRole(['admin']),         // 2. Check if user is admin
    async (req: AuthRequest, res) => {
      try {
        // Only admins can access this
        // req.user contains: { id, email, role }
        console.log(`Admin ${req.user?.email} accessed analytics`);
        const analytics = await getSystemAnalytics();
        res.json(analytics);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch analytics" });
      }
    }
  );

  // Multiple admin endpoints with same pattern
  app.get("/api/admin/feedback",
    verifyToken,
    requireRole(['admin']),
    async (req: AuthRequest, res) => {
      const feedback = await getAllFeedback();
      res.json(feedback);
    }
  );

  app.patch("/api/admin/feedback/:id/status",
    express.json(),
    verifyToken,
    requireRole(['admin']),
    async (req: AuthRequest, res) => {
      const { id } = req.params;
      const { status } = req.body;
      await updateFeedbackStatus(id, status);
      res.json({ success: true });
    }
  );

  app.post("/api/admin/disaster-recovery/test",
    express.json(),
    verifyToken,
    requireRole(['admin']),
    async (req: AuthRequest, res) => {
      const result = await runDisasterRecoveryTest(req.body);
      res.json(result);
    }
  );
}

/**
 * PATTERN 2: RESOURCE OWNERSHIP
 *
 * Use case: User accessing their own data (therapist viewing their clients)
 * Middleware: verifyToken + verifyOwnership('paramName')
 * The middleware checks if req.user.id matches the resource ID
 * Admins automatically bypass ownership check
 */
export function exampleOwnershipEndpoint(app: Express) {
  // ❌ BEFORE (No authentication)
  app.get("/api/clients/:therapistId", async (req, res) => {
    try {
      const { therapistId } = req.params;
      // Any user can access any therapist's clients - SECURITY RISK!
      const clients = await getClientsForTherapist(therapistId);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  // ✅ AFTER (With ownership verification)
  app.get("/api/clients/:therapistId",
    verifyToken,                        // 1. Validate JWT token
    verifyOwnership('therapistId'),     // 2. Check if user owns this resource
    async (req: AuthRequest, res) => {
      try {
        const { therapistId } = req.params;
        // req.user.id must equal therapistId (or user must be admin)
        console.log(`User ${req.user?.id} accessing their clients`);
        const clients = await getClientsForTherapist(therapistId);
        res.json(clients);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch clients" });
      }
    }
  );

  // Multiple ownership-based endpoints
  app.get("/api/entries/:userId",
    verifyToken,
    verifyOwnership('userId'),
    async (req: AuthRequest, res) => {
      const { userId } = req.params;
      const entries = await getUserEntries(userId);
      res.json(entries);
    }
  );

  app.get("/api/intelligence/dashboard/:userId",
    verifyToken,
    verifyOwnership('userId'),
    async (req: AuthRequest, res) => {
      const { userId } = req.params;
      const dashboard = await getIntelligenceDashboard(userId);
      res.json(dashboard);
    }
  );

  app.get("/api/ai/therapy-profile/:userId",
    verifyToken,
    verifyOwnership('userId'),
    async (req: AuthRequest, res) => {
      const { userId } = req.params;
      const profile = await getTherapyProfile(userId);
      res.json(profile);
    }
  );
}

/**
 * PATTERN 3: SUPERVISION WITH OWNERSHIP
 *
 * Use case: Supervisor accessing supervision-related data
 * Middleware: verifyToken + verifyOwnership('supervisorId')
 * Ensures only the supervisor (or admin) can access their supervision data
 */
export function exampleSupervisionEndpoint(app: Express) {
  // ❌ BEFORE (No authentication)
  app.get("/api/supervision/sessions/:supervisorId", async (req, res) => {
    try {
      const { supervisorId } = req.params;
      // Anyone can view any supervisor's sessions - SECURITY RISK!
      const sessions = await getSupervisionSessions(supervisorId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  // ✅ AFTER (With ownership verification)
  app.get("/api/supervision/sessions/:supervisorId",
    verifyToken,
    verifyOwnership('supervisorId'),
    async (req: AuthRequest, res) => {
      try {
        const { supervisorId } = req.params;
        // Only this supervisor (or admin) can access
        console.log(`Supervisor ${req.user?.id} accessing their sessions`);
        const sessions = await getSupervisionSessions(supervisorId);
        res.json(sessions);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch sessions" });
      }
    }
  );

  // POST with supervision data
  app.post("/api/supervision/relationships",
    express.json(),
    verifyToken,
    verifyOwnership('supervisorId'),  // Check body.supervisorId
    async (req: AuthRequest, res) => {
      try {
        const relationship = await createSupervisionRelationship(req.body);
        res.json(relationship);
      } catch (error) {
        res.status(500).json({ error: "Failed to create relationship" });
      }
    }
  );

  // Supervision alerts
  app.get("/api/supervision/alerts/:supervisorId",
    verifyToken,
    verifyOwnership('supervisorId'),
    async (req: AuthRequest, res) => {
      const { supervisorId } = req.params;
      const alerts = await getSupervisionAlerts(supervisorId);
      res.json(alerts);
    }
  );

  app.get("/api/supervision/compliance/:supervisorId",
    verifyToken,
    verifyOwnership('supervisorId'),
    async (req: AuthRequest, res) => {
      const { supervisorId } = req.params;
      const compliance = await getSupervisionCompliance(supervisorId);
      res.json(compliance);
    }
  );
}

/**
 * PATTERN 4: ANY AUTHENTICATED USER
 *
 * Use case: AI analysis, general features available to all logged-in users
 * Middleware: verifyToken only
 * No role or ownership check - any authenticated user can access
 */
export function exampleAuthenticatedEndpoint(app: Express) {
  // ❌ BEFORE (No authentication)
  app.post("/api/ai/analyze-session", express.json(), async (req, res) => {
    try {
      // Anyone can use expensive AI operations - COST RISK!
      const analysis = await analyzeSession(req.body);
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ error: "Analysis failed" });
    }
  });

  // ✅ AFTER (Require authentication)
  app.post("/api/ai/analyze-session",
    express.json(),
    verifyToken,                    // Only need to verify token
    async (req: AuthRequest, res) => {
      try {
        // Any authenticated user can access
        // Track who's using the feature
        console.log(`User ${req.user?.id} requested AI analysis`);
        const analysis = await analyzeSession(req.body);
        res.json(analysis);
      } catch (error) {
        res.status(500).json({ error: "Analysis failed" });
      }
    }
  );

  // Multiple authenticated-only endpoints
  app.post("/api/ai/chat",
    express.json(),
    verifyToken,
    async (req: AuthRequest, res) => {
      const response = await processChatMessage(req.body, req.user?.id);
      res.json(response);
    }
  );

  app.post("/api/research/search",
    express.json(),
    verifyToken,
    async (req: AuthRequest, res) => {
      const results = await searchResearch(req.body.query);
      res.json(results);
    }
  );

  app.post("/api/session/transcribe",
    express.json(),
    verifyToken,
    async (req: AuthRequest, res) => {
      const transcript = await transcribeSession(req.body);
      res.json(transcript);
    }
  );
}

/**
 * PATTERN 5: OPTIONAL AUTHENTICATION
 *
 * Use case: Public endpoints that enhance experience if authenticated
 * Middleware: optionalAuth
 * Continues without error if no token provided
 */
export function exampleOptionalAuthEndpoint(app: Express) {
  // Use case: Health check that shows more info if authenticated
  app.get("/api/health/detailed",
    optionalAuth,                   // Adds user if authenticated, continues if not
    async (req: AuthRequest, res) => {
      const health = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        // Show detailed info only if authenticated
        details: req.user ? await getDetailedHealth() : undefined,
        userId: req.user?.id,
      };
      res.json(health);
    }
  );

  // Analytics tracking with optional user identification
  app.post("/api/analytics/track",
    express.json(),
    optionalAuth,
    async (req: AuthRequest, res) => {
      await trackEvent({
        ...req.body,
        userId: req.user?.id || 'anonymous',  // Track user if authenticated
      });
      res.json({ success: true });
    }
  );
}

/**
 * PATTERN 6: MULTI-ROLE ACCESS
 *
 * Use case: Endpoints accessible to multiple roles
 * Middleware: verifyToken + requireRole(['role1', 'role2'])
 * User must have at least one of the specified roles
 */
export function exampleMultiRoleEndpoint(app: Express) {
  // Accessible to both admins and supervisors
  app.get("/api/supervision/frameworks",
    verifyToken,
    requireRole(['admin', 'supervisor']),
    async (req: AuthRequest, res) => {
      const frameworks = await getSupervisionFrameworks();
      res.json(frameworks);
    }
  );

  // Accessible to therapists and supervisors
  app.post("/api/clinical/measurement-scales",
    express.json(),
    verifyToken,
    requireRole(['therapist', 'supervisor', 'admin']),
    async (req: AuthRequest, res) => {
      const result = await processMeasurementScale(req.body);
      res.json(result);
    }
  );
}

/**
 * PATTERN 7: PRIVACY & DATA EXPORT
 *
 * Use case: HIPAA-critical privacy operations
 * Middleware: verifyToken + verifyOwnership + dataExportRateLimit
 * Combines authentication, ownership, and rate limiting
 */
export function examplePrivacyEndpoint(app: Express) {
  const dataExportRateLimit = require('../rate-limiting').dataExportRateLimit;

  // ❌ BEFORE (No authentication)
  app.get("/api/privacy/export-data", async (req, res) => {
    // Anyone can export anyone's data - CRITICAL SECURITY RISK!
    const userId = req.query.userId as string;
    const data = await exportUserData(userId);
    res.json(data);
  });

  // ✅ AFTER (Full protection)
  app.get("/api/privacy/export-data",
    verifyToken,                    // 1. Authenticate
    verifyOwnership('userId'),      // 2. Check ownership (from query params)
    dataExportRateLimit,            // 3. Rate limit (expensive operation)
    async (req: AuthRequest, res) => {
      try {
        const userId = req.query.userId as string;
        // User can only export their own data
        console.log(`User ${req.user?.id} exporting their data`);
        const data = await exportUserData(userId);
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: "Export failed" });
      }
    }
  );

  // Privacy settings access
  app.get("/api/privacy/settings",
    verifyToken,
    verifyOwnership('userId'),
    async (req: AuthRequest, res) => {
      const userId = req.query.userId as string;
      const settings = await getPrivacySettings(userId);
      res.json(settings);
    }
  );

  // Data deletion - critical operation
  app.post("/api/privacy/delete-data",
    express.json(),
    verifyToken,
    verifyOwnership('userId'),
    async (req: AuthRequest, res) => {
      const { userId } = req.body;
      await deleteUserData(userId);
      res.json({ success: true, message: "Data deletion initiated" });
    }
  );
}

/**
 * PATTERN 8: RATE-LIMITED AI OPERATIONS
 *
 * Use case: Expensive AI operations that need both auth and rate limiting
 * Middleware: verifyToken + aiAnalysisRateLimit
 * Protects against abuse and controls costs
 */
export function exampleRateLimitedAIEndpoint(app: Express) {
  const aiAnalysisRateLimit = require('../rate-limiting').aiAnalysisRateLimit;

  // ✅ Authentication + Rate Limiting
  app.post("/api/ai/analyze-content",
    express.json(),
    verifyToken,                    // 1. Authenticate first
    aiAnalysisRateLimit,            // 2. Then apply rate limit (per user)
    async (req: AuthRequest, res) => {
      try {
        // Rate limit is per-user because we authenticated first
        console.log(`User ${req.user?.id} using AI analysis`);
        const analysis = await analyzeContent(req.body);
        res.json(analysis);
      } catch (error) {
        res.status(500).json({ error: "Analysis failed" });
      }
    }
  );

  // Multiple AI endpoints with same pattern
  app.post("/api/ai/generate-progress-note",
    express.json(),
    verifyToken,
    aiAnalysisRateLimit,
    async (req: AuthRequest, res) => {
      const note = await generateProgressNote(req.body);
      res.json(note);
    }
  );

  app.post("/api/ai/assess-alliance",
    express.json(),
    verifyToken,
    aiAnalysisRateLimit,
    async (req: AuthRequest, res) => {
      const assessment = await assessTherapeuticAlliance(req.body);
      res.json(assessment);
    }
  );
}

/**
 * PATTERN 9: COMPLEX OWNERSHIP CHECK
 *
 * Use case: Resources that require custom ownership logic
 * Middleware: verifyToken + custom middleware
 * Use when verifyOwnership isn't sufficient
 */
export function exampleComplexOwnershipEndpoint(app: Express) {
  // Custom middleware for client access
  const verifyClientAccess = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    const clientId = req.params.id || req.params.clientId;
    const userId = req.user?.id;

    // Admin bypass
    if (req.user?.role === 'admin') {
      return next();
    }

    // Check if user is therapist of this client
    const client = await getClient(clientId);
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    if (client.therapistId !== userId && client.id !== userId) {
      return res.status(403).json({
        error: "Access denied - not your client",
        code: "NOT_AUTHORIZED"
      });
    }

    next();
  };

  // ✅ Using custom middleware
  app.get("/api/clients/:id/progress",
    verifyToken,
    verifyClientAccess,         // Custom middleware for complex check
    async (req: AuthRequest, res) => {
      const { id } = req.params;
      const progress = await getClientProgress(id);
      res.json(progress);
    }
  );

  app.patch("/api/clients/:id",
    express.json(),
    verifyToken,
    verifyClientAccess,
    async (req: AuthRequest, res) => {
      const { id } = req.params;
      await updateClient(id, req.body);
      res.json({ success: true });
    }
  );
}

/**
 * PATTERN 10: FEATURE FLAGS (ADMIN ONLY)
 *
 * Use case: Critical feature flag operations
 * Middleware: verifyToken + requireRole(['admin']) + adminRateLimit
 * High security for system-critical operations
 */
export function exampleFeatureFlagEndpoint(app: Express) {
  const adminRateLimit = require('../rate-limiting').adminRateLimit;

  // ✅ Maximum security for critical operations
  app.post("/api/feature-flags/emergency-disable-all",
    express.json(),
    adminRateLimit,                 // 1. Rate limit first (cheaper check)
    verifyToken,                    // 2. Then authenticate
    requireRole(['admin']),         // 3. Then check role
    async (req: AuthRequest, res) => {
      try {
        console.log(`CRITICAL: Admin ${req.user?.email} disabling all feature flags`);
        await emergencyDisableAllFlags();
        res.json({ success: true, message: "All feature flags disabled" });
      } catch (error) {
        res.status(500).json({ error: "Failed to disable flags" });
      }
    }
  );

  // Less critical feature flag operations
  app.get("/api/feature-flags",
    adminRateLimit,
    verifyToken,
    requireRole(['admin']),
    async (req: AuthRequest, res) => {
      const flags = await getFeatureFlags();
      res.json(flags);
    }
  );

  app.post("/api/feature-flags/update",
    express.json(),
    adminRateLimit,
    verifyToken,
    requireRole(['admin']),
    async (req: AuthRequest, res) => {
      await updateFeatureFlag(req.body);
      res.json({ success: true });
    }
  );
}

/**
 * ERROR HANDLING EXAMPLES
 *
 * Show how to properly handle authentication errors
 */
export function exampleErrorHandling(app: Express) {
  // Example endpoint with comprehensive error handling
  app.get("/api/sensitive-data/:userId",
    verifyToken,
    verifyOwnership('userId'),
    async (req: AuthRequest, res) => {
      try {
        const { userId } = req.params;

        // Business logic here
        const data = await getSensitiveData(userId);

        if (!data) {
          return res.status(404).json({
            error: "Data not found",
            code: "NOT_FOUND"
          });
        }

        res.json(data);
      } catch (error) {
        console.error("Error fetching sensitive data:", error);
        res.status(500).json({
          error: "Internal server error",
          code: "INTERNAL_ERROR"
        });
      }
    }
  );

  // Note: Authentication middleware already handles these errors:
  // - 401 NO_TOKEN: No Authorization header
  // - 401 TOKEN_EXPIRED: JWT token has expired
  // - 401 INVALID_TOKEN: JWT token is invalid
  // - 401 AUTH_FAILED: General authentication failure
  // - 403 FORBIDDEN: User doesn't have required role
  // - 403 NOT_OWNER: User doesn't own the resource
}

/**
 * MIGRATION GUIDE: Converting Existing Endpoints
 */
export function migrationExamples(app: Express) {
  // STEP 1: Identify endpoint sensitivity
  // - Admin operations? Use requireRole(['admin'])
  // - User-specific data? Use verifyOwnership
  // - Any authenticated user? Use verifyToken only

  // STEP 2: Add imports at top of file
  // import { verifyToken, requireRole, verifyOwnership } from './middleware/auth';

  // STEP 3: Add middleware in correct order
  // Order: [rate limiting] -> verifyToken -> [requireRole/verifyOwnership] -> handler

  // STEP 4: Update handler signature to use AuthRequest
  // async (req: AuthRequest, res) => { ... }

  // STEP 5: Access user info from req.user
  // req.user.id, req.user.email, req.user.role

  // STEP 6: Test all error scenarios
  // - No token
  // - Invalid token
  // - Wrong role
  // - Not owner
  // - Valid access
}

// Mock functions for examples (not actual implementations)
async function getSystemAnalytics() { return {}; }
async function getAllFeedback() { return []; }
async function updateFeedbackStatus(id: string, status: string) {}
async function runDisasterRecoveryTest(data: any) { return {}; }
async function getClientsForTherapist(therapistId: string) { return []; }
async function getUserEntries(userId: string) { return []; }
async function getIntelligenceDashboard(userId: string) { return {}; }
async function getTherapyProfile(userId: string) { return {}; }
async function getSupervisionSessions(supervisorId: string) { return []; }
async function createSupervisionRelationship(data: any) { return {}; }
async function getSupervisionAlerts(supervisorId: string) { return []; }
async function getSupervisionCompliance(supervisorId: string) { return {}; }
async function analyzeSession(data: any) { return {}; }
async function processChatMessage(data: any, userId?: string) { return {}; }
async function searchResearch(query: string) { return []; }
async function transcribeSession(data: any) { return {}; }
async function getDetailedHealth() { return {}; }
async function trackEvent(data: any) {}
async function getSupervisionFrameworks() { return []; }
async function processMeasurementScale(data: any) { return {}; }
async function exportUserData(userId: string) { return {}; }
async function getPrivacySettings(userId: string) { return {}; }
async function deleteUserData(userId: string) {}
async function analyzeContent(data: any) { return {}; }
async function generateProgressNote(data: any) { return {}; }
async function assessTherapeuticAlliance(data: any) { return {}; }
async function getClient(clientId: string) { return null; }
async function getClientProgress(clientId: string) { return {}; }
async function updateClient(id: string, data: any) {}
async function emergencyDisableAllFlags() {}
async function getFeatureFlags() { return []; }
async function updateFeatureFlag(data: any) {}
async function getSensitiveData(userId: string) { return {}; }

/**
 * QUICK REFERENCE SUMMARY
 *
 * Pattern 1: Admin Only
 *   verifyToken, requireRole(['admin'])
 *
 * Pattern 2: Ownership
 *   verifyToken, verifyOwnership('paramName')
 *
 * Pattern 3: Any Authenticated
 *   verifyToken
 *
 * Pattern 4: Optional Auth
 *   optionalAuth
 *
 * Pattern 5: Multi-Role
 *   verifyToken, requireRole(['role1', 'role2'])
 *
 * Pattern 6: Complex Ownership
 *   verifyToken, customMiddleware
 *
 * Pattern 7: With Rate Limiting
 *   verifyToken, rateLimit, [authorization]
 *
 * Always remember:
 * - Authenticate BEFORE authorization
 * - Use AuthRequest type for req parameter
 * - Access user via req.user
 * - Admin users bypass ownership checks
 * - Test all error scenarios
 */
