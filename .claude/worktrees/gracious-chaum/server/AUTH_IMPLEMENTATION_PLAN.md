# Authentication Implementation Plan for ClarityTracker 2

## Executive Summary

**Current State:** 263 API endpoints with 95% lacking authentication
**Goal:** Implement comprehensive authentication across all endpoints
**Authentication Middleware:** `/server/middleware/auth.ts` (already created)

---

## Authentication Levels

### Level 0: Public (No Auth Required)
Endpoints that should remain publicly accessible or have optional auth.

### Level 1: Authenticated (Any User)
Requires valid JWT token. Any authenticated user can access.

### Level 2: Role-Based Access
Requires specific role(s): `admin`, `supervisor`, `therapist`, `supervisee`

### Level 3: Ownership-Based Access
User must own the resource (or be admin). Checks resource ID against user ID.

### Level 4: Relationship-Based Access
User must have a specific relationship (e.g., supervisor-supervisee connection).

---

## Endpoint Authentication Mapping

### 1. PUBLIC ENDPOINTS (Level 0)

#### Health & System Status
| Endpoint | Method | Auth Level | Middleware | Notes |
|----------|--------|------------|------------|-------|
| `/api/health` | GET | Public | `optionalAuth` | Basic health check |
| `/api/health/detailed` | GET | Public | `optionalAuth` | Detailed health, could show more if authenticated |
| `/api/download-extension` | GET | Public | None | Public download |

**Rationale:** Health checks should be accessible for monitoring systems.

---

### 2. ADMIN ENDPOINTS (Level 2 - Admin Only)

**Priority: CRITICAL - Fix First**

All admin endpoints MUST be protected with:
```typescript
verifyToken, requireRole(['admin'])
```

#### Analytics & Monitoring (39 endpoints)
| Endpoint | Method | Current Auth | Required Auth | Priority |
|----------|--------|--------------|---------------|----------|
| `/api/admin/analytics` | GET | None | Admin | HIGH |
| `/api/admin/feedback` | GET | None | Admin | HIGH |
| `/api/admin/feedback/:id/status` | PATCH | None | Admin | HIGH |
| `/api/admin/cost-analytics` | GET | `adminRateLimit` | Admin | HIGH |
| `/api/admin/product-analytics` | GET | None | Admin | HIGH |
| `/api/admin/system-health` | GET | `adminRateLimit` | Admin | HIGH |
| `/api/admin/rate-limit/stats` | GET | `adminRateLimit` | Admin | HIGH |
| `/api/admin/rate-limit/cleanup` | POST | `adminRateLimit` | Admin | HIGH |

#### Backup & Disaster Recovery
| Endpoint | Method | Current Auth | Required Auth | Priority |
|----------|--------|--------------|---------------|----------|
| `/api/admin/backup-verification` | POST | `adminRateLimit` | Admin | HIGH |
| `/api/admin/backup-status` | GET | `adminRateLimit` | Admin | HIGH |
| `/api/admin/backup-history` | GET | `adminRateLimit` | Admin | HIGH |
| `/api/admin/backup-sync` | POST | `adminRateLimit` | Admin | HIGH |
| `/api/admin/disaster-recovery/plan` | GET | `adminRateLimit` | Admin | HIGH |
| `/api/admin/disaster-recovery/test` | POST | `adminRateLimit` | Admin | HIGH |
| `/api/admin/disaster-recovery/test-all` | POST | `adminRateLimit` | Admin | HIGH |
| `/api/admin/disaster-recovery/runbook` | GET | `adminRateLimit` | Admin | HIGH |
| `/api/admin/disaster-recovery/test-history` | GET | `adminRateLimit` | Admin | HIGH |

#### Infrastructure Management
| Endpoint | Method | Current Auth | Required Auth | Priority |
|----------|--------|--------------|---------------|----------|
| `/api/admin/deployment-plan` | GET | `adminRateLimit` | Admin | HIGH |
| `/api/admin/cross-region-latency` | GET | `adminRateLimit` | Admin | HIGH |
| `/api/admin/geographic-status` | GET | `adminRateLimit` | Admin | HIGH |
| `/api/admin/regional-health` | GET | `adminRateLimit` | Admin | HIGH |
| `/api/admin/replication-status` | GET | `adminRateLimit` | Admin | HIGH |
| `/api/admin/failover-test` | POST | `adminRateLimit` | Admin | HIGH |

#### Performance & Optimization
| Endpoint | Method | Current Auth | Required Auth | Priority |
|----------|--------|--------------|---------------|----------|
| `/api/admin/performance-optimization` | GET | `adminRateLimit` | Admin | HIGH |
| `/api/admin/implement-performance-optimization` | POST | `adminRateLimit` | Admin | HIGH |
| `/api/admin/cost-optimization` | GET | `adminRateLimit` | Admin | HIGH |
| `/api/admin/implement-cost-optimization` | POST | `adminRateLimit` | Admin | HIGH |

#### Runbooks & Compliance
| Endpoint | Method | Current Auth | Required Auth | Priority |
|----------|--------|--------------|---------------|----------|
| `/api/admin/runbooks` | GET | `adminRateLimit` | Admin | HIGH |
| `/api/admin/runbooks/:id` | GET | `adminRateLimit` | Admin | HIGH |
| `/api/admin/runbooks/:id/execute` | POST | `adminRateLimit` | Admin | HIGH |
| `/api/admin/runbooks/:id/test` | POST | `adminRateLimit` | Admin | HIGH |
| `/api/admin/compliance-check` | GET | `adminRateLimit` | Admin | HIGH |
| `/api/admin/production-readiness` | GET | `adminRateLimit` | Admin | HIGH |
| `/api/admin/executions` | GET | `adminRateLimit` | Admin | HIGH |
| `/api/admin/finalize-implementation` | POST | `adminRateLimit` | Admin | HIGH |

#### Feature Flags (Admin Only)
| Endpoint | Method | Current Auth | Required Auth | Priority |
|----------|--------|--------------|---------------|----------|
| `/api/feature-flags` | GET | `adminRateLimit` | Admin | HIGH |
| `/api/feature-flags/update` | POST | `adminRateLimit` | Admin | HIGH |
| `/api/feature-flags/metrics` | GET | `adminRateLimit` | Admin | HIGH |
| `/api/feature-flags/metrics` | POST | `adminRateLimit` | Admin | HIGH |
| `/api/feature-flags/rollback-status` | GET | `adminRateLimit` | Admin | HIGH |
| `/api/feature-flags/emergency-disable` | POST | `adminRateLimit` | Admin | CRITICAL |
| `/api/feature-flags/emergency-disable-all` | POST | `adminRateLimit` | Admin | CRITICAL |
| `/api/feature-flags/gradual-rollout` | POST | `adminRateLimit` | Admin | HIGH |

**Implementation Note:** Admin endpoints currently have rate limiting but NO authentication. This is a critical security vulnerability.

---

### 3. SUPERVISION ENDPOINTS (Level 3/4 - Ownership/Relationship)

**Priority: HIGH - Critical Business Logic**

#### Supervisee Relationships (35 endpoints)
| Endpoint | Method | Auth Required | Middleware Pattern | Priority |
|----------|--------|---------------|-------------------|----------|
| `/api/supervision/relationships` | POST | Ownership | `verifyToken, verifyOwnership('supervisorId')` | HIGH |
| `/api/supervision/relationships/:supervisorId` | GET | Ownership | `verifyToken, verifyOwnership('supervisorId')` | HIGH |
| `/api/supervision/relationships/:id` | PATCH | Ownership + ID check | `verifyToken, verifyRelationshipOwnership` | HIGH |
| `/api/supervisees` | POST | Ownership | `verifyToken, verifyOwnership('supervisorId')` | HIGH |
| `/api/supervisees` | GET | Authenticated | `verifyToken` | HIGH |
| `/api/supervisees/:id` | GET | Ownership | `verifyToken, verifySuperviseeAccess` | HIGH |
| `/api/supervisees/:id` | DELETE | Ownership | `verifyToken, verifySuperviseeAccess` | HIGH |

#### Supervision Sessions
| Endpoint | Method | Auth Required | Middleware Pattern | Priority |
|----------|--------|---------------|-------------------|----------|
| `/api/supervision/sessions` | POST | Ownership | `verifyToken, verifyOwnership('supervisorId')` | HIGH |
| `/api/supervision/sessions/:supervisorId` | GET | Ownership | `verifyToken, verifyOwnership('supervisorId')` | HIGH |
| `/api/supervision/sessions/:id` | PATCH | Ownership + Check | `verifyToken, verifySessionOwnership` | HIGH |
| `/api/supervision/analyze-session` | POST | Authenticated | `verifyToken` | HIGH |

#### Assessments & Progress
| Endpoint | Method | Auth Required | Middleware Pattern | Priority |
|----------|--------|---------------|-------------------|----------|
| `/api/supervision/assessments` | POST | Ownership | `verifyToken, verifyOwnership('supervisorId')` | HIGH |
| `/api/supervision/assessments/:supervisorId` | GET | Ownership | `verifyToken, verifyOwnership('supervisorId')` | HIGH |
| `/api/supervision/compliance/:supervisorId` | GET | Ownership | `verifyToken, verifyOwnership('supervisorId')` | HIGH |
| `/api/supervision/progress/:superviseeId` | GET | Ownership | `verifyToken, verifySuperviseeAccess` | HIGH |
| `/api/supervision/competency-report/:superviseeId` | GET | Ownership | `verifyToken, verifySuperviseeAccess` | HIGH |
| `/api/supervision/trends/:supervisorId` | GET | Ownership | `verifyToken, verifyOwnership('supervisorId')` | HIGH |

#### Supervision Alerts
| Endpoint | Method | Auth Required | Middleware Pattern | Priority |
|----------|--------|---------------|-------------------|----------|
| `/api/supervision/alerts` | POST | Ownership | `verifyToken, verifyOwnership('supervisorId')` | HIGH |
| `/api/supervision/alerts/:supervisorId` | GET | Ownership | `verifyToken, verifyOwnership('supervisorId')` | HIGH |
| `/api/supervision/alerts/:id` | PATCH | Ownership Check | `verifyToken, verifyAlertOwnership` | HIGH |
| `/api/supervision/alerts/:id/resolve` | POST | Ownership Check | `verifyToken, verifyAlertOwnership` | HIGH |
| `/api/supervision/alerts/generate/:supervisorId` | POST | Ownership | `verifyToken, verifyOwnership('supervisorId')` | HIGH |

#### Supervision Intelligence
| Endpoint | Method | Auth Required | Middleware Pattern | Priority |
|----------|--------|---------------|-------------------|----------|
| `/api/supervision/frameworks` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/supervision/frameworks` | GET | Authenticated | `verifyToken` | MEDIUM |
| `/api/supervision/request-connection` | POST | Authenticated | `verifyToken` | HIGH |
| `/api/supervision/competency-areas` | GET | Authenticated | `verifyToken` | MEDIUM |
| `/api/supervision/metrics-summary` | GET | Authenticated | `verifyToken` | MEDIUM |
| `/api/supervision/metrics/:userId` | GET | Ownership | `verifyToken, verifyOwnership('userId')` | HIGH |
| `/api/supervision/session-analyses` | GET | Authenticated | `verifyToken` | MEDIUM |
| `/api/supervision/session-analyses/:analysisId/review` | POST | Ownership Check | `verifyToken, verifyAnalysisAccess` | HIGH |

#### Supervisor Management
| Endpoint | Method | Auth Required | Middleware Pattern | Priority |
|----------|--------|---------------|-------------------|----------|
| `/api/supervisors/:userId` | GET | Ownership | `verifyToken, verifyOwnership('userId')` | HIGH |
| `/api/supervisors` | POST | Authenticated | `verifyToken` | HIGH |
| `/api/supervisors/:supervisorId` | PUT | Ownership | `verifyToken, verifyOwnership('supervisorId')` | HIGH |
| `/api/supervisors/:supervisorId` | DELETE | Ownership | `verifyToken, verifyOwnership('supervisorId')` | HIGH |
| `/api/supervisor/:supervisorId/supervisees` | GET | Ownership | `verifyToken, verifyOwnership('supervisorId')` | HIGH |
| `/api/supervisor/:supervisorId/analytics` | GET | Ownership | `verifyToken, verifyOwnership('supervisorId')` | HIGH |
| `/api/supervisor/:supervisorId/compliance` | GET | Ownership | `verifyToken, verifyOwnership('supervisorId')` | HIGH |
| `/api/supervisor/:supervisorId/trends` | GET | Ownership | `verifyToken, verifyOwnership('supervisorId')` | HIGH |
| `/api/supervisor/:supervisorId/shared-progress` | GET | Ownership | `verifyToken, verifyOwnership('supervisorId')` | HIGH |

#### Supervisor Insights
| Endpoint | Method | Auth Required | Middleware Pattern | Priority |
|----------|--------|---------------|-------------------|----------|
| `/api/supervisor-insights` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/supervisor-insights/:id` | PATCH | Ownership Check | `verifyToken, verifyInsightOwnership` | MEDIUM |
| `/api/supervisor-insights/:id` | DELETE | Ownership Check | `verifyToken, verifyInsightOwnership` | MEDIUM |
| `/api/supervisor-insights/:id/read` | PATCH | Ownership Check | `verifyToken, verifyInsightOwnership` | MEDIUM |
| `/api/supervisor-insights/supervisee/:superviseeId` | GET | Relationship | `verifyToken, verifySuperviseeAccess` | HIGH |
| `/api/supervisor-insights/supervisor/:supervisorId` | GET | Ownership | `verifyToken, verifyOwnership('supervisorId')` | HIGH |
| `/api/supervisor-insights/:insightId/save-as-card` | POST | Ownership Check | `verifyToken, verifyInsightOwnership` | MEDIUM |

#### Supervisee Hours
| Endpoint | Method | Auth Required | Middleware Pattern | Priority |
|----------|--------|---------------|-------------------|----------|
| `/api/supervisee-hours/:superviseeId` | GET | Ownership | `verifyToken, verifySuperviseeAccess` | HIGH |
| `/api/supervisee-hours/update` | POST | Ownership | `verifyToken, verifySuperviseeOwnership` | HIGH |

---

### 4. CLIENT DATA ENDPOINTS (Level 3 - Ownership)

**Priority: HIGH - HIPAA Compliance Critical**

#### Client Management (18 endpoints)
| Endpoint | Method | Auth Required | Middleware Pattern | Priority |
|----------|--------|---------------|-------------------|----------|
| `/api/clients/:therapistId` | GET | Ownership | `verifyToken, verifyOwnership('therapistId')` | CRITICAL |
| `/api/clients` | POST | Authenticated | `verifyToken` | HIGH |
| `/api/clients/:id` | PATCH | Ownership + Check | `verifyToken, verifyClientAccess` | HIGH |
| `/api/clients/:clientId` | PUT | Ownership + Check | `verifyToken, verifyClientAccess` | HIGH |
| `/api/clients/invite` | POST | Authenticated | `verifyToken` | HIGH |
| `/api/clients/:id/progress` | GET | Ownership + Check | `verifyToken, verifyClientAccess` | CRITICAL |

#### Client Progress & Insights
| Endpoint | Method | Auth Required | Middleware Pattern | Priority |
|----------|--------|---------------|-------------------|----------|
| `/api/client-progress/:therapistId` | GET | Ownership | `verifyToken, verifyOwnership('therapistId')` | CRITICAL |
| `/api/progress/:clientId` | GET | Ownership + Check | `verifyToken, verifyClientAccess` | CRITICAL |
| `/api/progress` | POST | Authenticated | `verifyToken` | HIGH |
| `/api/progress/share` | POST | Ownership + Check | `verifyToken, verifyProgressOwnership` | HIGH |
| `/api/insights/client/:clientId` | GET | Ownership + Check | `verifyToken, verifyClientAccess` | CRITICAL |
| `/api/insights/therapist/:therapistId` | GET | Ownership | `verifyToken, verifyOwnership('therapistId')` | HIGH |
| `/api/insights` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/insights/:insightId/read` | PUT | Ownership Check | `verifyToken, verifyInsightOwnership` | MEDIUM |
| `/api/insights/:insightId/save-as-card` | POST | Ownership Check | `verifyToken, verifyInsightOwnership` | MEDIUM |
| `/api/insights/share` | POST | Ownership Check | `verifyToken, verifyInsightOwnership` | HIGH |
| `/api/insights/email-history` | POST | Authenticated | `verifyToken` | MEDIUM |

#### Client Invitations
| Endpoint | Method | Auth Required | Middleware Pattern | Priority |
|----------|--------|---------------|-------------------|----------|
| `/api/client-invitation` | POST | Authenticated | `verifyToken` | HIGH |
| `/api/client-invitation/:token` | GET | Public/Token | `optionalAuth, verifyInvitationToken` | MEDIUM |
| `/api/client-invitation/:token/accept` | POST | Token | `verifyInvitationToken` | MEDIUM |

#### Client Onboarding & Registration
| Endpoint | Method | Auth Required | Middleware Pattern | Priority |
|----------|--------|---------------|-------------------|----------|
| `/api/client-registration` | POST | Token | `verifyInvitationToken` | MEDIUM |
| `/api/client/onboarding` | POST | Authenticated | `verifyToken` | MEDIUM |

---

### 5. AI & ANALYSIS ENDPOINTS (Level 1/3 - Authenticated/Ownership)

**Priority: MEDIUM - Resource Protection**

#### AI Analysis (45 endpoints)
| Endpoint | Method | Auth Required | Middleware Pattern | Priority |
|----------|--------|---------------|-------------------|----------|
| `/api/ai/analyze-content` | POST | Authenticated | `verifyToken, aiAnalysisRateLimit` | MEDIUM |
| `/api/ai/analyze-conversation` | POST | Authenticated | `verifyToken, aiAnalysisRateLimit` | MEDIUM |
| `/api/ai/analyze-ebp` | POST | Authenticated | `verifyToken, aiAnalysisRateLimit` | MEDIUM |
| `/api/ai/assess-alliance` | POST | Authenticated | `verifyToken, aiAnalysisRateLimit` | MEDIUM |
| `/api/ai/generate-progress-note` | POST | Authenticated | `verifyToken, aiAnalysisRateLimit` | MEDIUM |
| `/api/ai/chat` | POST | Authenticated | `verifyToken, aiAnalysisRateLimit` | MEDIUM |
| `/api/ai/coaching-chat` | POST | Authenticated | `verifyToken, aiAnalysisRateLimit` | MEDIUM |
| `/api/ai/counseling-fallback` | POST | Authenticated | `verifyToken, aiAnalysisRateLimit` | MEDIUM |
| `/api/ai/suggest-resources` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/ai/analyze-session-description` | POST | Authenticated | `verifyToken, aiAnalysisRateLimit` | MEDIUM |
| `/api/ai/analyze-realtime-engagement` | POST | Authenticated | `verifyToken, aiAnalysisRateLimit` | MEDIUM |

#### AI User-Specific Data
| Endpoint | Method | Auth Required | Middleware Pattern | Priority |
|----------|--------|---------------|-------------------|----------|
| `/api/ai/clinical-metrics` | GET | Authenticated | `verifyToken` | MEDIUM |
| `/api/ai/clinical-metrics/:userId` | GET | Ownership | `verifyToken, verifyOwnership('userId')` | MEDIUM |
| `/api/ai/competency-analysis/:userId` | GET | Ownership | `verifyToken, verifyOwnership('userId')` | MEDIUM |
| `/api/ai/competency-analysis/analyze` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/ai/conversation-patterns/:userId` | GET | Ownership | `verifyToken, verifyOwnership('userId')` | MEDIUM |
| `/api/ai/enhanced-coaching-insights/:userId` | GET | Ownership | `verifyToken, verifyOwnership('userId')` | MEDIUM |
| `/api/ai/enhanced-competency-data/:userId` | GET | Ownership | `verifyToken, verifyOwnership('userId')` | MEDIUM |
| `/api/ai/enhanced-smart-insights/:userId` | GET | Ownership | `verifyToken, verifyOwnership('userId')` | MEDIUM |
| `/api/ai/insights-history/:userId` | GET | Ownership | `verifyToken, verifyOwnership('userId')` | MEDIUM |
| `/api/ai/insights-history` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/ai/insights-history/:id` | PATCH | Ownership Check | `verifyToken, verifyInsightOwnership` | MEDIUM |
| `/api/ai/pattern-analysis/:userId` | GET | Ownership | `verifyToken, verifyOwnership('userId')` | MEDIUM |
| `/api/ai/pattern-analysis/:id` | PATCH | Ownership Check | `verifyToken, verifyPatternOwnership` | MEDIUM |
| `/api/ai/pattern-analysis/detect` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/ai/supervision-intelligence/:userId` | GET | Ownership | `verifyToken, verifyOwnership('userId')` | MEDIUM |
| `/api/ai/supervision-intelligence/generate` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/ai/therapy-profile/:userId` | GET | Ownership | `verifyToken, verifyOwnership('userId')` | MEDIUM |
| `/api/ai/therapy-profile/analyze-session` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/ai/usage-stats/:userId` | GET | Ownership | `verifyToken, verifyOwnership('userId')` | MEDIUM |
| `/api/ai/integration-status` | GET | Authenticated | `verifyToken` | LOW |
| `/api/ai/integration-status/:userId` | GET | Ownership | `verifyToken, verifyOwnership('userId')` | MEDIUM |

---

### 6. SESSION INTELLIGENCE ENDPOINTS (Level 1/3 - Authenticated/Ownership)

**Priority: MEDIUM - Session Data Protection**

| Endpoint | Method | Auth Required | Middleware Pattern | Priority |
|----------|--------|---------------|-------------------|----------|
| `/api/session-intelligence/:sessionId` | GET | Ownership | `verifyToken, verifySessionOwnership` | MEDIUM |
| `/api/session-intelligence/sessions` | GET | Authenticated | `verifyToken` | MEDIUM |
| `/api/session-intelligence/sessions/:id` | GET | Ownership | `verifyToken, verifySessionOwnership` | MEDIUM |
| `/api/session-intelligence/sessions/:id` | PATCH | Ownership | `verifyToken, verifySessionOwnership` | MEDIUM |
| `/api/session-intelligence/sessions/:id` | DELETE | Ownership | `verifyToken, verifySessionOwnership` | MEDIUM |
| `/api/session-intelligence/analyze-transcript` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/session-intelligence/analyze-video-frame` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/session-intelligence/clear-session` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/session-intelligence/export/:id` | POST | Ownership | `verifyToken, verifySessionOwnership` | MEDIUM |
| `/api/session-intelligence/finalize` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/session-intelligence/finalize-session` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/session-intelligence/generate-insights` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/session-intelligence/generate-soap` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/session-intelligence/save-session` | POST | Authenticated | `verifyToken` | MEDIUM |

#### Session Analysis
| Endpoint | Method | Auth Required | Middleware Pattern | Priority |
|----------|--------|---------------|-------------------|----------|
| `/api/session/analyze` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/session/ebp-analysis` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/session/full-analysis` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/session/progress-note-assist` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/session/risk-assessment` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/session/transcribe` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/sessions/:sessionId/generate-insights` | POST | Ownership | `verifyToken, verifySessionOwnership` | MEDIUM |
| `/api/sessions/upload` | POST | Authenticated | `verifyToken` | MEDIUM |

---

### 7. PRIVACY & DATA ENDPOINTS (Level 3 - Ownership Critical)

**Priority: CRITICAL - HIPAA/GDPR Compliance**

| Endpoint | Method | Auth Required | Middleware Pattern | Priority |
|----------|--------|---------------|-------------------|----------|
| `/api/privacy/settings` | GET | Ownership | `verifyToken, verifyPrivacyAccess` | CRITICAL |
| `/api/privacy/settings` | POST | Ownership | `verifyToken, verifyPrivacyAccess` | CRITICAL |
| `/api/privacy/data-usage` | GET | Ownership | `verifyToken, verifyPrivacyAccess` | CRITICAL |
| `/api/privacy/audit-log` | GET | Ownership | `verifyToken, verifyPrivacyAccess` | CRITICAL |
| `/api/privacy/export-data` | GET | Ownership | `verifyToken, verifyPrivacyAccess, dataExportRateLimit` | CRITICAL |
| `/api/privacy/delete-data` | POST | Ownership | `verifyToken, verifyPrivacyAccess` | CRITICAL |
| `/api/privacy/apply-retention-policies` | POST | Ownership | `verifyToken, verifyPrivacyAccess` | CRITICAL |
| `/api/privacy-settings/:userId` | GET | Ownership | `verifyToken, verifyOwnership('userId')` | CRITICAL |
| `/api/privacy-settings/:userId` | POST | Ownership | `verifyToken, verifyOwnership('userId')` | CRITICAL |
| `/api/privacy/anonymize-demo` | POST | Admin | `verifyToken, requireRole(['admin'])` | MEDIUM |
| `/api/privacy/test-anonymization` | POST | Admin | `verifyToken, requireRole(['admin'])` | MEDIUM |

---

### 8. INTELLIGENCE & ANALYTICS ENDPOINTS (Level 1/3 - Authenticated/Ownership)

**Priority: MEDIUM**

| Endpoint | Method | Auth Required | Middleware Pattern | Priority |
|----------|--------|---------------|-------------------|----------|
| `/api/intelligence/status` | GET | Authenticated | `verifyToken` | LOW |
| `/api/intelligence/dashboard/:userId` | GET | Ownership | `verifyToken, verifyOwnership('userId')` | MEDIUM |
| `/api/intelligence/progress/:userId` | GET | Ownership | `verifyToken, verifyOwnership('userId')` | MEDIUM |
| `/api/intelligence/compliance/:userId` | GET | Ownership | `verifyToken, verifyOwnership('userId')` | MEDIUM |
| `/api/intelligence/report/:userId` | GET | Ownership | `verifyToken, verifyOwnership('userId')` | MEDIUM |
| `/api/intelligence/weekly-summary/:userId` | GET | Ownership | `verifyToken, verifyOwnership('userId')` | MEDIUM |
| `/api/intelligence/requirements/:state/:licenseType?` | GET | Authenticated | `verifyToken` | LOW |
| `/api/intelligence/initialize` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/intelligence/ai-analysis` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/intelligence/batch-analysis` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/intelligence/compare-states` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/intelligence/recommendations` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/intelligence/validate-progress` | POST | Authenticated | `verifyToken` | MEDIUM |

---

### 9. KNOWLEDGE & ENTRIES ENDPOINTS (Level 3 - Ownership)

**Priority: MEDIUM**

| Endpoint | Method | Auth Required | Middleware Pattern | Priority |
|----------|--------|---------------|-------------------|----------|
| `/api/entries/:userId` | GET | Ownership | `verifyToken, verifyOwnership('userId')` | MEDIUM |
| `/api/entries` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/knowledge-entries/:userId` | GET | Ownership | `verifyToken, verifyOwnership('userId')` | MEDIUM |
| `/api/knowledge-entries` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/knowledge-entries/:id/generate-prompts` | POST | Ownership | `verifyToken, verifyKnowledgeOwnership` | MEDIUM |
| `/api/prompts/due/:userId` | GET | Ownership | `verifyToken, verifyOwnership('userId')` | MEDIUM |
| `/api/prompts/:id/review` | POST | Ownership | `verifyToken, verifyPromptOwnership` | MEDIUM |

---

### 10. RESEARCH ENDPOINTS (Level 1/3 - Authenticated/Ownership)

**Priority: MEDIUM**

| Endpoint | Method | Auth Required | Middleware Pattern | Priority |
|----------|--------|---------------|-------------------|----------|
| `/api/research/search` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/research/scrape` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/research/summarize` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/research/save` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/research/saved/:userId` | GET | Ownership | `verifyToken, verifyOwnership('userId')` | MEDIUM |
| `/api/research/collections` | GET | Authenticated | `verifyToken` | MEDIUM |
| `/api/research/collections` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/research/history/:userId` | GET | Ownership | `verifyToken, verifyOwnership('userId')` | MEDIUM |

---

### 11. DINGER (AI ASSISTANT) ENDPOINTS (Level 3 - Ownership)

**Priority: MEDIUM**

| Endpoint | Method | Auth Required | Middleware Pattern | Priority |
|----------|--------|---------------|-------------------|----------|
| `/api/dinger/enhanced-chat` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/dinger/profile` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/dinger/rate-response` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/dinger/profile/:userId` | GET | Ownership | `verifyToken, verifyOwnership('userId')` | MEDIUM |
| `/api/dinger/conversation-history/:userId` | GET | Ownership | `verifyToken, verifyOwnership('userId')` | MEDIUM |
| `/api/dinger/analytics/:userId` | GET | Ownership | `verifyToken, verifyOwnership('userId')` | MEDIUM |

---

### 12. AZURE SPEECH & CLINICAL VIDEO ENDPOINTS (Level 1 - Authenticated)

**Priority: MEDIUM**

| Endpoint | Method | Auth Required | Middleware Pattern | Priority |
|----------|--------|---------------|-------------------|----------|
| `/api/azure-speech/config` | GET | Authenticated | `verifyToken` | MEDIUM |
| `/api/azure/speech-config` | GET | Authenticated | `verifyToken` | MEDIUM |
| `/api/azure/start-speech-recognition` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/azure/process-recorded-audio` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/azure/process-uploaded-audio` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/azure/analyze-clinical-video` | POST | Authenticated | `verifyToken` | MEDIUM |

---

### 13. PROGRESSIVE DISCLOSURE ENDPOINTS (Level 1/3 - Authenticated/Ownership)

**Priority: LOW**

| Endpoint | Method | Auth Required | Middleware Pattern | Priority |
|----------|--------|---------------|-------------------|----------|
| `/api/progressive-disclosure/insights/:userId` | GET | Ownership | `verifyToken, verifyOwnership('userId')` | LOW |
| `/api/progressive-disclosure/detailed-metrics/:userId/:category` | GET | Ownership | `verifyToken, verifyOwnership('userId')` | LOW |
| `/api/progressive-disclosure/educational-content/:category` | GET | Authenticated | `verifyToken` | LOW |
| `/api/progressive-disclosure/educational-content/:topic` | POST | Admin | `verifyToken, requireRole(['admin'])` | LOW |
| `/api/progressive-disclosure/generate-insights/:userId` | POST | Ownership | `verifyToken, verifyOwnership('userId')` | LOW |
| `/api/progressive-disclosure/data-analysis/:userId` | POST | Ownership | `verifyToken, verifyOwnership('userId')` | LOW |
| `/api/progressive-disclosure/track-interaction` | POST | Authenticated | `verifyToken` | LOW |
| `/api/progressive-disclosure/seed-content` | POST | Admin | `verifyToken, requireRole(['admin'])` | LOW |

---

### 14. MY MIND (INSIGHT CARDS) ENDPOINTS (Level 3 - Ownership)

**Priority: MEDIUM**

| Endpoint | Method | Auth Required | Middleware Pattern | Priority |
|----------|--------|---------------|-------------------|----------|
| `/api/my-mind/insight-cards/:userId` | GET | Ownership | `verifyToken, verifyOwnership('userId')` | MEDIUM |
| `/api/my-mind/insight-cards/:cardId/feedback` | POST | Ownership | `verifyToken, verifyCardOwnership` | MEDIUM |

---

### 15. FEEDBACK & COMMUNICATIONS ENDPOINTS (Level 1 - Authenticated)

**Priority: MEDIUM**

| Endpoint | Method | Auth Required | Middleware Pattern | Priority |
|----------|--------|---------------|-------------------|----------|
| `/api/feedback` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/replit/feedback` | GET | Admin | `verifyToken, requireRole(['admin'])` | MEDIUM |
| `/api/messages` | POST | Authenticated | `verifyToken` | MEDIUM |
| `/api/welcome-email` | POST | Authenticated | `verifyToken` | LOW |

---

### 16. ANALYTICS & TRACKING ENDPOINTS (Level 1 - Authenticated)

**Priority: MEDIUM**

| Endpoint | Method | Auth Required | Middleware Pattern | Priority |
|----------|--------|---------------|-------------------|----------|
| `/api/analytics/track` | POST | Optional Auth | `optionalAuth` | LOW |
| `/api/analytics/performance` | POST | Optional Auth | `optionalAuth` | LOW |
| `/api/analytics/track-feature` | POST | Authenticated | `verifyToken` | LOW |

---

### 17. CLINICAL ENDPOINTS (Level 1 - Authenticated)

**Priority: MEDIUM**

| Endpoint | Method | Auth Required | Middleware Pattern | Priority |
|----------|--------|---------------|-------------------|----------|
| `/api/clinical/measurement-scales` | POST | Authenticated | `verifyToken` | MEDIUM |

---

### 18. NOTES ENHANCEMENT ENDPOINTS (Level 1 - Authenticated)

**Priority: MEDIUM**

| Endpoint | Method | Auth Required | Middleware Pattern | Priority |
|----------|--------|---------------|-------------------|----------|
| `/api/notes/ai-enhance` | POST | Authenticated | `verifyToken` | MEDIUM |

---

### 19. PHASE 3A ENDPOINTS (Level 1 - Authenticated)

**Priority: MEDIUM**

| Endpoint | Method | Auth Required | Middleware Pattern | Priority |
|----------|--------|---------------|-------------------|----------|
| `/api/phase3a/status` | GET | Authenticated | `verifyToken, basicRateLimit` | LOW |
| `/api/phase3a/analyze-session` | POST | Authenticated | `verifyToken, basicRateLimit` | MEDIUM |
| `/api/phase3a/check-compliance` | POST | Authenticated | `verifyToken, basicRateLimit` | MEDIUM |
| `/api/phase3a/sync-mobile` | POST | Authenticated | `verifyToken, basicRateLimit` | MEDIUM |

---

### 20. AUTHENTICATION ENDPOINTS (Level 0 - Public with Special Handling)

**Priority: Already Implemented**

| Endpoint | Method | Auth Required | Middleware Pattern | Priority |
|----------|--------|---------------|-------------------|----------|
| `/api/auth/client-login` | POST | Public | `authRateLimit` | N/A |
| `/api/auth/client-signup` | POST | Public | `authRateLimit` | N/A |

---

### 21. SMS WEBHOOK ENDPOINT (Level 0 - Public with Validation)

**Priority: LOW - External Service**

| Endpoint | Method | Auth Required | Middleware Pattern | Priority |
|----------|--------|---------------|-------------------|----------|
| `/api/sms/webhook` | POST | Twilio Validation | `validateTwilioSignature` | LOW |

---

## Priority Implementation Order

### PHASE 1: CRITICAL SECURITY (Week 1)
**Impact: Prevent unauthorized access to sensitive systems**

1. **All Admin Endpoints** (39 endpoints)
   - Add: `verifyToken, requireRole(['admin'])`
   - These control critical system operations
   - Currently only have rate limiting, no auth

2. **Privacy & Data Endpoints** (10 endpoints)
   - Add: `verifyToken, verifyOwnership` or custom privacy middleware
   - HIPAA/GDPR compliance critical
   - Handle sensitive user data export/deletion

3. **Client Data Endpoints** (18 endpoints)
   - Add: `verifyToken, verifyOwnership` or custom client access middleware
   - Protect PHI (Protected Health Information)
   - Critical for HIPAA compliance

### PHASE 2: HIGH BUSINESS LOGIC (Week 2)
**Impact: Protect core application functionality**

4. **Supervision Endpoints** (35 endpoints)
   - Add: `verifyToken, verifyOwnership` + custom relationship checks
   - Core business logic for supervision tracking
   - Requires complex ownership validation

5. **Supervisor Management** (13 endpoints)
   - Add: `verifyToken, verifyOwnership`
   - Protect supervisor-supervisee relationships
   - Critical for application integrity

### PHASE 3: RESOURCE PROTECTION (Week 3)
**Impact: Prevent abuse and protect AI resources**

6. **AI Analysis Endpoints** (45 endpoints)
   - Add: `verifyToken, aiAnalysisRateLimit`
   - Expensive AI operations
   - Already have some rate limiting

7. **Session Intelligence** (16 endpoints)
   - Add: `verifyToken, verifyOwnership` where applicable
   - Protect session data and analysis
   - Medium sensitivity

### PHASE 4: USER DATA (Week 4)
**Impact: Complete user data protection**

8. **Knowledge & Entries** (7 endpoints)
   - Add: `verifyToken, verifyOwnership`
   - User-generated content protection

9. **Research Endpoints** (8 endpoints)
   - Add: `verifyToken, verifyOwnership`
   - User research data protection

10. **Dinger (AI Assistant)** (6 endpoints)
    - Add: `verifyToken, verifyOwnership`
    - User conversation history

11. **Intelligence & Analytics** (13 endpoints)
    - Add: `verifyToken, verifyOwnership`
    - User analytics and insights

### PHASE 5: SUPPORTING FEATURES (Week 5)
**Impact: Complete authentication coverage**

12. **Azure Speech & Video** (6 endpoints)
    - Add: `verifyToken`
    - Service configuration and processing

13. **My Mind (Insight Cards)** (2 endpoints)
    - Add: `verifyToken, verifyOwnership`
    - User insight cards

14. **Feedback & Communications** (4 endpoints)
    - Add: `verifyToken` or `optionalAuth`
    - User feedback and communications

15. **Progressive Disclosure** (8 endpoints)
    - Add: `verifyToken, verifyOwnership` or admin
    - Educational content and insights

16. **Clinical & Notes** (2 endpoints)
    - Add: `verifyToken`
    - Clinical tools

17. **Phase 3A** (4 endpoints)
    - Add: `verifyToken`
    - Phase 3A features

### PHASE 6: LOW PRIORITY (As Needed)
**Impact: Complete coverage for analytics**

18. **Analytics & Tracking** (3 endpoints)
    - Add: `optionalAuth`
    - Anonymous analytics allowed

---

## Custom Middleware Needed

Beyond the existing middleware in `/server/middleware/auth.ts`, you'll need to create additional middleware for complex ownership checks:

### 1. Supervision Relationship Middleware

```typescript
// server/middleware/supervision-auth.ts

export const verifySuperviseeAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Check if user is supervisor of supervisee OR is the supervisee OR is admin
  const superviseeId = req.params.superviseeId || req.params.id;
  const userId = req.user?.id;

  // Admin bypass
  if (req.user?.role === 'admin') {
    return next();
  }

  // Check if user is the supervisee
  if (userId === superviseeId) {
    return next();
  }

  // Check if user is supervisor of this supervisee
  const relationship = await storage.getSuperviseeRelationship(superviseeId);
  if (relationship && relationship.supervisorId === userId) {
    return next();
  }

  return res.status(403).json({
    error: 'Access denied - not authorized for this supervisee',
    code: 'FORBIDDEN'
  });
};

export const verifySessionOwnership = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Similar logic for session ownership
};

export const verifyAlertOwnership = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Similar logic for alert ownership
};
```

### 2. Client Access Middleware

```typescript
// server/middleware/client-auth.ts

export const verifyClientAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Check if user is therapist of client OR is the client OR is admin
  const clientId = req.params.clientId || req.params.id;
  const userId = req.user?.id;

  // Admin bypass
  if (req.user?.role === 'admin') {
    return next();
  }

  // Check if user is the client
  if (userId === clientId) {
    return next();
  }

  // Check if user is therapist of this client
  const client = await storage.getClient(clientId);
  if (client && client.therapistId === userId) {
    return next();
  }

  return res.status(403).json({
    error: 'Access denied - not authorized for this client',
    code: 'FORBIDDEN'
  });
};
```

### 3. Privacy Access Middleware

```typescript
// server/middleware/privacy-auth.ts

export const verifyPrivacyAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Ensure user can only access their own privacy data
  // Extract userId from query params or body
  const targetUserId = req.query.userId || req.body.userId || req.params.userId;
  const currentUserId = req.user?.id;

  // Admin bypass
  if (req.user?.role === 'admin') {
    return next();
  }

  // Must be accessing own data
  if (currentUserId !== targetUserId) {
    return res.status(403).json({
      error: 'Access denied - can only access your own privacy data',
      code: 'FORBIDDEN'
    });
  }

  next();
};
```

### 4. Resource Ownership Middleware (Generic)

```typescript
// server/middleware/resource-auth.ts

export const verifyInsightOwnership = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Check insight ownership
};

export const verifyKnowledgeOwnership = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Check knowledge entry ownership
};

export const verifyPromptOwnership = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Check prompt ownership
};

export const verifyCardOwnership = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Check insight card ownership
};

export const verifyPatternOwnership = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Check pattern analysis ownership
};
```

---

## Implementation Guidelines

### Step-by-Step Process

1. **Review Endpoint**
   - Understand what data it accesses
   - Identify the sensitivity level
   - Determine ownership model

2. **Choose Authentication Pattern**
   - Public: No auth or `optionalAuth`
   - Any user: `verifyToken`
   - Role-based: `verifyToken, requireRole(['admin'])`
   - Ownership: `verifyToken, verifyOwnership('paramName')`
   - Complex: Create custom middleware

3. **Add Middleware**
   ```typescript
   // Before
   app.get("/api/clients/:therapistId", async (req, res) => {

   // After
   app.get("/api/clients/:therapistId",
     verifyToken,
     verifyOwnership('therapistId'),
     async (req, res) => {
   ```

4. **Test Authentication**
   - No token → 401
   - Invalid token → 401
   - Valid token, wrong role → 403
   - Valid token, not owner → 403
   - Valid token, correct access → 200

5. **Document Changes**
   - Update API documentation
   - Note breaking changes
   - Provide migration guide for frontend

### Breaking Changes Notice

Adding authentication to previously unprotected endpoints is a **breaking change**. Frontend code will need to:

1. **Include JWT tokens** in requests
   ```typescript
   headers: {
     'Authorization': `Bearer ${token}`
   }
   ```

2. **Handle new error codes**
   - 401: Redirect to login
   - 403: Show "Access Denied" message
   - Handle token expiration

3. **Implement token refresh** if needed

### Rate Limiting Strategy

Many endpoints already have rate limiting. The order should be:
```typescript
app.post("/api/ai/analyze",
  verifyToken,              // 1. Authenticate first
  aiAnalysisRateLimit,      // 2. Then apply rate limiting
  async (req, res) => {     // 3. Then execute handler
```

Rate limiting is more effective AFTER authentication because:
- Rate limits can be per-user
- Prevents anonymous abuse
- Better tracking and monitoring

---

## Success Metrics

### Security Improvements
- 0% unprotected admin endpoints (currently 100%)
- 0% unprotected client data endpoints (currently ~95%)
- 100% authentication coverage on sensitive endpoints

### Compliance
- HIPAA compliance for all PHI-accessing endpoints
- GDPR compliance for privacy/data export endpoints
- Audit trail for all authenticated requests

### Performance
- No significant latency increase (<50ms per request)
- JWT verification is fast (~1-2ms)
- Rate limiting already in place for expensive operations

---

## Testing Strategy

See `AUTH_TESTING_CHECKLIST.md` for comprehensive testing scenarios.

### Key Test Areas
1. **Authentication Tests** - Token validation
2. **Authorization Tests** - Role and ownership checks
3. **Rate Limiting Tests** - Combined with auth
4. **Error Handling Tests** - Proper error responses
5. **Integration Tests** - End-to-end flows
6. **Security Tests** - Penetration testing

---

## Rollout Strategy

### Option A: Big Bang (Not Recommended)
- Deploy all changes at once
- High risk of breaking changes
- Difficult to debug issues

### Option B: Phased Rollout (Recommended)
- Deploy one category at a time (e.g., Admin endpoints first)
- Monitor for issues
- Adjust frontend as needed
- Continue to next category

### Option C: Feature Flag Rollout (Most Sophisticated)
- Use feature flags to enable auth per endpoint
- Gradually roll out to users
- Easy rollback if issues arise
- Requires feature flag infrastructure

### Recommended Approach: Phased Rollout
1. Week 1: Admin + Privacy endpoints
2. Week 2: Client data + Supervision endpoints
3. Week 3: AI + Session intelligence endpoints
4. Week 4: Knowledge + Research + remaining endpoints
5. Week 5: Testing, documentation, cleanup

---

## Documentation Updates Needed

1. **API Documentation**
   - Update all endpoint docs with auth requirements
   - Add authentication guide
   - Document error codes

2. **Frontend Integration Guide**
   - How to include JWT tokens
   - Error handling patterns
   - Token refresh implementation

3. **Developer Onboarding**
   - Authentication quick reference
   - Common patterns and examples
   - Testing guide

---

## Conclusion

This plan provides a comprehensive roadmap for implementing authentication across all 263 endpoints in ClarityTracker 2. By following the phased approach and priority order, you can systematically secure the application while minimizing disruption to existing functionality.

The existing middleware in `/server/middleware/auth.ts` provides a solid foundation, but additional custom middleware will be needed for complex ownership and relationship checks.

**Next Steps:**
1. Review this plan with the team
2. Create custom middleware for complex checks
3. Begin Phase 1 implementation (Admin + Privacy endpoints)
4. Update frontend authentication handling
5. Test thoroughly before moving to next phase

---

**Document Version:** 1.0
**Last Updated:** 2025-10-28
**Author:** Authentication Implementation Agent
**Status:** Ready for Implementation
