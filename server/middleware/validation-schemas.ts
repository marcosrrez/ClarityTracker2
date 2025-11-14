/**
 * Comprehensive Validation Schemas for ClarityTracker 2
 *
 * This file contains all validation schemas for API endpoints using express-validator.
 * Each schema includes field validation, sanitization, and clear error messages.
 *
 * Usage:
 * import { validationSchemas } from './middleware/validation-schemas';
 * app.post('/api/endpoint', validationSchemas.schemaName, handleValidationErrors, handler);
 */

import { body, param, query, ValidationChain } from 'express-validator';

/**
 * =============================================================================
 * USER DATA VALIDATION SCHEMAS
 * =============================================================================
 */

export const userSchemas = {
  // User ID validation - used in params
  userId: [
    param('userId')
      .trim()
      .notEmpty().withMessage('User ID is required')
      .isLength({ min: 1, max: 255 }).withMessage('User ID must be between 1 and 255 characters')
      .matches(/^[a-zA-Z0-9_\-@.]+$/).withMessage('User ID contains invalid characters'),
  ],

  // Email validation
  email: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail()
      .isLength({ max: 255 }).withMessage('Email must not exceed 255 characters'),
  ],

  // Password validation (registration/update)
  password: [
    body('password')
      .trim()
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 8, max: 128 }).withMessage('Password must be between 8 and 128 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  ],

  // Optional password validation (for updates)
  optionalPassword: [
    body('password')
      .optional()
      .trim()
      .isLength({ min: 8, max: 128 }).withMessage('Password must be between 8 and 128 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  ],

  // User registration
  registration: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail()
      .isLength({ max: 255 }).withMessage('Email must not exceed 255 characters'),
    body('password')
      .trim()
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 8, max: 128 }).withMessage('Password must be between 8 and 128 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('preferredName')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Preferred name must not exceed 100 characters')
      .escape(),
    body('accountType')
      .optional()
      .isIn(['student', 'professional', 'supervisor']).withMessage('Invalid account type'),
  ],

  // User login
  login: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail(),
    body('password')
      .trim()
      .notEmpty().withMessage('Password is required'),
  ],

  // User profile update
  profileUpdate: [
    body('preferredName')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Preferred name must not exceed 100 characters')
      .escape(),
    body('licenseState')
      .optional()
      .trim()
      .isLength({ min: 2, max: 2 }).withMessage('License state must be a 2-letter code')
      .isAlpha().withMessage('License state must contain only letters')
      .toUpperCase(),
    body('licenseType')
      .optional()
      .isIn(['LPC', 'LMFT', 'LCSW', 'BCBA', 'PsyD', 'PhD', 'Other']).withMessage('Invalid license type'),
    body('practiceSettings')
      .optional()
      .isArray().withMessage('Practice settings must be an array'),
    body('clientPopulations')
      .optional()
      .isArray().withMessage('Client populations must be an array'),
  ],
};

/**
 * =============================================================================
 * SESSION/LOG ENTRY VALIDATION SCHEMAS
 * =============================================================================
 */

export const sessionSchemas = {
  // Basic session entry validation
  sessionEntry: [
    body('clientContactHours')
      .notEmpty().withMessage('Client contact hours is required')
      .isFloat({ min: 0, max: 24 }).withMessage('Client contact hours must be between 0 and 24')
      .toFloat(),
    body('dateOfContact')
      .notEmpty().withMessage('Date of contact is required')
      .isISO8601().withMessage('Invalid date format')
      .toDate()
      .custom((value) => {
        const date = new Date(value);
        const now = new Date();
        if (date > now) {
          throw new Error('Date of contact cannot be in the future');
        }
        const tenYearsAgo = new Date();
        tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
        if (date < tenYearsAgo) {
          throw new Error('Date of contact cannot be more than 10 years ago');
        }
        return true;
      }),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 10000 }).withMessage('Notes must not exceed 10000 characters')
      .escape(),
    body('clientInitials')
      .optional()
      .trim()
      .isLength({ min: 1, max: 10 }).withMessage('Client initials must be between 1 and 10 characters')
      .matches(/^[A-Za-z.]+$/).withMessage('Client initials must contain only letters and periods')
      .escape(),
    body('sessionType')
      .optional()
      .isIn(['individual', 'group', 'family', 'couples', 'assessment', 'consultation']).withMessage('Invalid session type'),
    body('modality')
      .optional()
      .isIn(['in-person', 'telehealth', 'phone']).withMessage('Invalid modality'),
  ],

  // Session update validation
  sessionUpdate: [
    param('entryId')
      .trim()
      .notEmpty().withMessage('Entry ID is required')
      .isLength({ min: 1, max: 255 }).withMessage('Entry ID is invalid'),
    body('clientContactHours')
      .optional()
      .isFloat({ min: 0, max: 24 }).withMessage('Client contact hours must be between 0 and 24')
      .toFloat(),
    body('dateOfContact')
      .optional()
      .isISO8601().withMessage('Invalid date format')
      .toDate(),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 10000 }).withMessage('Notes must not exceed 10000 characters')
      .escape(),
  ],

  // Session deletion validation
  sessionDelete: [
    param('entryId')
      .trim()
      .notEmpty().withMessage('Entry ID is required')
      .isLength({ min: 1, max: 255 }).withMessage('Entry ID is invalid'),
  ],

  // Date range query validation
  dateRange: [
    query('startDate')
      .optional()
      .isISO8601().withMessage('Invalid start date format')
      .toDate(),
    query('endDate')
      .optional()
      .isISO8601().withMessage('Invalid end date format')
      .toDate()
      .custom((endDate, { req }) => {
        if (req.query.startDate && endDate) {
          const start = new Date(req.query.startDate as string);
          const end = new Date(endDate);
          if (end < start) {
            throw new Error('End date must be after start date');
          }
        }
        return true;
      }),
  ],

  // Supervision notes
  supervisionNotes: [
    body('supervisionNotes')
      .optional()
      .trim()
      .isLength({ max: 5000 }).withMessage('Supervision notes must not exceed 5000 characters')
      .escape(),
    body('supervisorFeedback')
      .optional()
      .trim()
      .isLength({ max: 3000 }).withMessage('Supervisor feedback must not exceed 3000 characters')
      .escape(),
  ],
};

/**
 * =============================================================================
 * CLIENT DATA VALIDATION SCHEMAS
 * =============================================================================
 */

export const clientSchemas = {
  // Client creation
  clientCreate: [
    body('clientInitials')
      .trim()
      .notEmpty().withMessage('Client initials are required')
      .isLength({ min: 1, max: 10 }).withMessage('Client initials must be between 1 and 10 characters')
      .matches(/^[A-Za-z.]+$/).withMessage('Client initials must contain only letters and periods')
      .escape(),
    body('age')
      .optional()
      .isInt({ min: 0, max: 150 }).withMessage('Age must be between 0 and 150')
      .toInt(),
    body('gender')
      .optional()
      .isIn(['male', 'female', 'non-binary', 'other', 'prefer-not-to-say']).withMessage('Invalid gender'),
    body('primaryDiagnosis')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Primary diagnosis must not exceed 500 characters')
      .escape(),
    body('treatmentGoals')
      .optional()
      .trim()
      .isLength({ max: 2000 }).withMessage('Treatment goals must not exceed 2000 characters')
      .escape(),
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'discharged', 'referred']).withMessage('Invalid status'),
  ],

  // Client update
  clientUpdate: [
    param('clientId')
      .trim()
      .notEmpty().withMessage('Client ID is required'),
    body('clientInitials')
      .optional()
      .trim()
      .isLength({ min: 1, max: 10 }).withMessage('Client initials must be between 1 and 10 characters')
      .matches(/^[A-Za-z.]+$/).withMessage('Client initials must contain only letters and periods')
      .escape(),
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'discharged', 'referred']).withMessage('Invalid status'),
  ],

  // Client ID validation
  clientId: [
    param('clientId')
      .trim()
      .notEmpty().withMessage('Client ID is required')
      .isLength({ min: 1, max: 255 }).withMessage('Client ID is invalid'),
  ],
};

/**
 * =============================================================================
 * SUPERVISOR DATA VALIDATION SCHEMAS
 * =============================================================================
 */

export const supervisorSchemas = {
  // Supervisee relationship creation
  superviseeCreate: [
    body('supervisorId')
      .trim()
      .notEmpty().withMessage('Supervisor ID is required'),
    body('superviseeId')
      .trim()
      .notEmpty().withMessage('Supervisee ID is required')
      .custom((value, { req }) => {
        if (value === req.body.supervisorId) {
          throw new Error('Supervisor and supervisee cannot be the same person');
        }
        return true;
      }),
    body('startDate')
      .notEmpty().withMessage('Start date is required')
      .isISO8601().withMessage('Invalid start date format')
      .toDate(),
    body('endDate')
      .optional()
      .isISO8601().withMessage('Invalid end date format')
      .toDate()
      .custom((endDate, { req }) => {
        if (req.body.startDate && endDate) {
          const start = new Date(req.body.startDate);
          const end = new Date(endDate);
          if (end < start) {
            throw new Error('End date must be after start date');
          }
        }
        return true;
      }),
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'completed', 'terminated']).withMessage('Invalid status'),
    body('supervisionType')
      .optional()
      .isIn(['direct', 'indirect', 'group', 'peer']).withMessage('Invalid supervision type'),
    body('requiredHours')
      .optional()
      .isInt({ min: 0, max: 10000 }).withMessage('Required hours must be between 0 and 10000')
      .toInt(),
  ],

  // Supervisee relationship update
  superviseeUpdate: [
    param('relationshipId')
      .trim()
      .notEmpty().withMessage('Relationship ID is required'),
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'completed', 'terminated']).withMessage('Invalid status'),
    body('completedHours')
      .optional()
      .isFloat({ min: 0 }).withMessage('Completed hours must be non-negative')
      .toFloat(),
  ],

  // Supervision session scheduling
  supervisionSession: [
    body('supervisorId')
      .trim()
      .notEmpty().withMessage('Supervisor ID is required'),
    body('superviseeId')
      .trim()
      .notEmpty().withMessage('Supervisee ID is required'),
    body('sessionDate')
      .notEmpty().withMessage('Session date is required')
      .isISO8601().withMessage('Invalid session date format')
      .toDate(),
    body('durationMinutes')
      .notEmpty().withMessage('Duration is required')
      .isInt({ min: 15, max: 480 }).withMessage('Duration must be between 15 and 480 minutes')
      .toInt(),
    body('sessionType')
      .optional()
      .isIn(['individual', 'group', 'case-review', 'administrative']).withMessage('Invalid session type'),
    body('sessionFormat')
      .optional()
      .isIn(['in-person', 'video', 'phone']).withMessage('Invalid session format'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 5000 }).withMessage('Notes must not exceed 5000 characters')
      .escape(),
  ],

  // Supervisor assessment
  supervisorAssessment: [
    body('superviseeId')
      .trim()
      .notEmpty().withMessage('Supervisee ID is required'),
    body('assessmentType')
      .notEmpty().withMessage('Assessment type is required')
      .isIn(['competency', 'progress', 'quarterly', 'final']).withMessage('Invalid assessment type'),
    body('assessmentDate')
      .notEmpty().withMessage('Assessment date is required')
      .isISO8601().withMessage('Invalid assessment date format')
      .toDate(),
    body('overallRating')
      .optional()
      .isInt({ min: 1, max: 5 }).withMessage('Overall rating must be between 1 and 5')
      .toInt(),
    body('comments')
      .optional()
      .trim()
      .isLength({ max: 10000 }).withMessage('Comments must not exceed 10000 characters')
      .escape(),
    body('recommendations')
      .optional()
      .trim()
      .isLength({ max: 3000 }).withMessage('Recommendations must not exceed 3000 characters')
      .escape(),
  ],
};

/**
 * =============================================================================
 * AI/ANALYSIS REQUEST VALIDATION SCHEMAS
 * =============================================================================
 */

export const aiSchemas = {
  // AI analysis request
  aiAnalysisRequest: [
    body('userId')
      .trim()
      .notEmpty().withMessage('User ID is required'),
    body('message')
      .trim()
      .notEmpty().withMessage('Message is required')
      .isLength({ min: 1, max: 5000 }).withMessage('Message must be between 1 and 5000 characters')
      .escape(),
    body('conversationHistory')
      .optional()
      .isArray({ max: 50 }).withMessage('Conversation history must be an array with maximum 50 messages'),
    body('context')
      .optional()
      .trim()
      .isLength({ max: 2000 }).withMessage('Context must not exceed 2000 characters')
      .escape(),
  ],

  // Session intelligence analysis
  sessionAnalysisRequest: [
    body('sessionId')
      .optional()
      .trim()
      .notEmpty().withMessage('Session ID cannot be empty'),
    body('transcript')
      .optional()
      .trim()
      .isLength({ max: 50000 }).withMessage('Transcript must not exceed 50000 characters'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 10000 }).withMessage('Notes must not exceed 10000 characters'),
    body('sessionType')
      .optional()
      .isIn(['individual', 'group', 'family', 'couples', 'assessment', 'consultation']).withMessage('Invalid session type'),
    body('analysisTypes')
      .optional()
      .isArray().withMessage('Analysis types must be an array'),
  ],

  // Image analysis request
  imageAnalysisRequest: [
    body('userId')
      .trim()
      .notEmpty().withMessage('User ID is required'),
    body('imageData')
      .notEmpty().withMessage('Image data is required')
      .matches(/^data:image\/(png|jpeg|jpg|gif|webp);base64,/).withMessage('Invalid image format'),
    body('analysisType')
      .optional()
      .isIn(['emotion', 'gesture', 'environment', 'general']).withMessage('Invalid analysis type'),
  ],

  // Research query
  researchQuery: [
    body('query')
      .trim()
      .notEmpty().withMessage('Query is required')
      .isLength({ min: 3, max: 500 }).withMessage('Query must be between 3 and 500 characters')
      .escape(),
    body('researchType')
      .optional()
      .isIn(['clinical', 'evidence-based', 'treatment', 'diagnosis', 'intervention']).withMessage('Invalid research type'),
    body('filters')
      .optional()
      .isObject().withMessage('Filters must be an object'),
  ],
};

/**
 * =============================================================================
 * SEARCH AND PAGINATION VALIDATION SCHEMAS
 * =============================================================================
 */

export const searchSchemas = {
  // Basic search
  search: [
    query('q')
      .trim()
      .notEmpty().withMessage('Search query is required')
      .isLength({ min: 1, max: 200 }).withMessage('Search query must be between 1 and 200 characters')
      .escape(),
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Page must be a positive integer')
      .toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
      .toInt(),
  ],

  // Pagination
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1, max: 10000 }).withMessage('Page must be between 1 and 10000')
      .toInt()
      .default(1),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
      .toInt()
      .default(20),
    query('offset')
      .optional()
      .isInt({ min: 0 }).withMessage('Offset must be non-negative')
      .toInt(),
  ],

  // Advanced search with filters
  advancedSearch: [
    query('q')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('Search query must not exceed 200 characters')
      .escape(),
    query('startDate')
      .optional()
      .isISO8601().withMessage('Invalid start date format')
      .toDate(),
    query('endDate')
      .optional()
      .isISO8601().withMessage('Invalid end date format')
      .toDate(),
    query('sessionType')
      .optional()
      .isIn(['individual', 'group', 'family', 'couples', 'assessment', 'consultation']).withMessage('Invalid session type'),
    query('sortBy')
      .optional()
      .isIn(['date', 'hours', 'type', 'client']).withMessage('Invalid sort field'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
  ],
};

/**
 * =============================================================================
 * FEEDBACK AND COMMUNICATION VALIDATION SCHEMAS
 * =============================================================================
 */

export const feedbackSchemas = {
  // Feedback submission
  feedback: [
    body('type')
      .notEmpty().withMessage('Feedback type is required')
      .isIn(['bug', 'feature', 'general']).withMessage('Invalid feedback type'),
    body('subject')
      .trim()
      .notEmpty().withMessage('Subject is required')
      .isLength({ min: 3, max: 200 }).withMessage('Subject must be between 3 and 200 characters')
      .escape(),
    body('description')
      .trim()
      .notEmpty().withMessage('Description is required')
      .isLength({ min: 10, max: 5000 }).withMessage('Description must be between 10 and 5000 characters')
      .escape(),
    body('email')
      .optional()
      .trim()
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail(),
    body('userId')
      .optional()
      .trim(),
  ],

  // Email notification
  emailNotification: [
    body('userEmail')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail(),
    body('subject')
      .trim()
      .notEmpty().withMessage('Subject is required')
      .isLength({ max: 200 }).withMessage('Subject must not exceed 200 characters')
      .escape(),
    body('message')
      .trim()
      .notEmpty().withMessage('Message is required')
      .isLength({ max: 10000 }).withMessage('Message must not exceed 10000 characters'),
  ],
};

/**
 * =============================================================================
 * PRIVACY AND DATA EXPORT VALIDATION SCHEMAS
 * =============================================================================
 */

export const privacySchemas = {
  // Data export request
  dataExportRequest: [
    body('userId')
      .trim()
      .notEmpty().withMessage('User ID is required'),
    body('exportFormat')
      .optional()
      .isIn(['json', 'csv', 'pdf']).withMessage('Invalid export format'),
    body('includeAnalytics')
      .optional()
      .isBoolean().withMessage('Include analytics must be boolean')
      .toBoolean(),
    body('dateRange')
      .optional()
      .isObject().withMessage('Date range must be an object'),
  ],

  // Data deletion request
  dataDeleteRequest: [
    body('userId')
      .trim()
      .notEmpty().withMessage('User ID is required'),
    body('confirmDelete')
      .notEmpty().withMessage('Delete confirmation is required')
      .isBoolean().withMessage('Confirm delete must be boolean')
      .toBoolean()
      .custom((value) => {
        if (value !== true) {
          throw new Error('Delete confirmation must be true');
        }
        return true;
      }),
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Reason must not exceed 1000 characters')
      .escape(),
  ],

  // Anonymization request
  anonymizationRequest: [
    body('dataType')
      .notEmpty().withMessage('Data type is required')
      .isIn(['session', 'client', 'all']).withMessage('Invalid data type'),
    body('removeIdentifiers')
      .optional()
      .isBoolean().withMessage('Remove identifiers must be boolean')
      .toBoolean(),
  ],
};

/**
 * =============================================================================
 * ADMIN OPERATIONS VALIDATION SCHEMAS
 * =============================================================================
 */

export const adminSchemas = {
  // System configuration update
  systemConfig: [
    body('configKey')
      .trim()
      .notEmpty().withMessage('Config key is required')
      .matches(/^[a-zA-Z0-9_\-\.]+$/).withMessage('Config key contains invalid characters'),
    body('configValue')
      .notEmpty().withMessage('Config value is required'),
    body('environment')
      .optional()
      .isIn(['development', 'staging', 'production']).withMessage('Invalid environment'),
  ],

  // User management
  userManagement: [
    param('userId')
      .trim()
      .notEmpty().withMessage('User ID is required'),
    body('action')
      .notEmpty().withMessage('Action is required')
      .isIn(['activate', 'deactivate', 'suspend', 'delete', 'reset-password']).withMessage('Invalid action'),
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Reason must not exceed 1000 characters')
      .escape(),
  ],

  // Backup and restore
  backupOperation: [
    body('operation')
      .notEmpty().withMessage('Operation is required')
      .isIn(['backup', 'restore', 'verify']).withMessage('Invalid operation'),
    body('backupId')
      .optional()
      .trim()
      .notEmpty().withMessage('Backup ID cannot be empty'),
    body('includeUserData')
      .optional()
      .isBoolean().withMessage('Include user data must be boolean')
      .toBoolean(),
  ],

  // Analytics query
  analyticsQuery: [
    query('metric')
      .optional()
      .isIn(['users', 'sessions', 'revenue', 'engagement', 'errors']).withMessage('Invalid metric'),
    query('startDate')
      .optional()
      .isISO8601().withMessage('Invalid start date format')
      .toDate(),
    query('endDate')
      .optional()
      .isISO8601().withMessage('Invalid end date format')
      .toDate(),
    query('aggregation')
      .optional()
      .isIn(['day', 'week', 'month', 'year']).withMessage('Invalid aggregation period'),
  ],

  // Feature flag management
  featureFlag: [
    body('flagName')
      .trim()
      .notEmpty().withMessage('Flag name is required')
      .matches(/^[a-zA-Z0-9_\-]+$/).withMessage('Flag name contains invalid characters'),
    body('enabled')
      .notEmpty().withMessage('Enabled status is required')
      .isBoolean().withMessage('Enabled must be boolean')
      .toBoolean(),
    body('rolloutPercentage')
      .optional()
      .isInt({ min: 0, max: 100 }).withMessage('Rollout percentage must be between 0 and 100')
      .toInt(),
  ],
};

/**
 * =============================================================================
 * COMBINED SCHEMAS FOR COMMON PATTERNS
 * =============================================================================
 */

export const combinedSchemas = {
  // User-owned resource
  userOwnedResource: [
    param('userId').trim().notEmpty().withMessage('User ID is required'),
    param('resourceId').trim().notEmpty().withMessage('Resource ID is required'),
  ],

  // Date range with user ID
  userDateRange: [
    param('userId').trim().notEmpty().withMessage('User ID is required'),
    query('startDate')
      .optional()
      .isISO8601().withMessage('Invalid start date format')
      .toDate(),
    query('endDate')
      .optional()
      .isISO8601().withMessage('Invalid end date format')
      .toDate(),
  ],

  // Bulk operations
  bulkOperation: [
    body('ids')
      .isArray({ min: 1, max: 100 }).withMessage('IDs must be an array with 1 to 100 items'),
    body('operation')
      .notEmpty().withMessage('Operation is required')
      .isIn(['delete', 'update', 'export', 'archive']).withMessage('Invalid operation'),
  ],
};

/**
 * Export all schemas as a single object for easy importing
 */
export const validationSchemas = {
  ...userSchemas,
  ...sessionSchemas,
  ...clientSchemas,
  ...supervisorSchemas,
  ...aiSchemas,
  ...searchSchemas,
  ...feedbackSchemas,
  ...privacySchemas,
  ...adminSchemas,
  ...combinedSchemas,
};

// Also export individual schema groups for modular use
export {
  userSchemas,
  sessionSchemas,
  clientSchemas,
  supervisorSchemas,
  aiSchemas,
  searchSchemas,
  feedbackSchemas,
  privacySchemas,
  adminSchemas,
  combinedSchemas,
};
