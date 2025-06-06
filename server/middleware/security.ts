import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import helmet from 'helmet';
import cors from 'cors';
import { body, query, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

/**
 * Rate limiting configuration for different endpoint types
 */
export const createRateLimit = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: message || 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.round(windowMs / 1000),
        message: message || 'Too many requests from this IP, please try again later.'
      });
    }
  });
};

/**
 * Rate limiters for different API categories
 */
export const rateLimiters = {
  // General API rate limiting - 100 requests per 15 minutes
  general: createRateLimit(15 * 60 * 1000, 100),
  
  // AI endpoints - more restrictive due to computational cost
  ai: createRateLimit(15 * 60 * 1000, 30, 'AI analysis rate limit exceeded. Please wait before making more requests.'),
  
  // Authentication endpoints - very restrictive
  auth: createRateLimit(15 * 60 * 1000, 5, 'Too many authentication attempts. Please wait before trying again.'),
  
  // File upload endpoints
  upload: createRateLimit(15 * 60 * 1000, 10, 'Upload rate limit exceeded. Please wait before uploading more files.'),
  
  // Data export endpoints
  export: createRateLimit(60 * 60 * 1000, 3, 'Export rate limit exceeded. Please wait before generating more exports.'),
  
  // Supervision and analytics - moderate limiting
  supervision: createRateLimit(15 * 60 * 1000, 50),
};

/**
 * Speed limiters to gradually slow down repeated requests
 */
export const speedLimiters = {
  // Slow down AI requests after 10 requests
  ai: slowDown({
    windowMs: 15 * 60 * 1000,
    delayAfter: 10,
    delayMs: () => 500,
    maxDelayMs: 20000,
    validate: { delayMs: false },
  }),
  
  // Slow down general API after 50 requests
  general: slowDown({
    windowMs: 15 * 60 * 1000,
    delayAfter: 50,
    delayMs: () => 100,
    maxDelayMs: 5000,
    validate: { delayMs: false },
  }),
};

/**
 * CORS configuration for production
 */
export const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5000',
      'https://claritylog.replit.app',
      /\.replit\.app$/,
      /\.replit\.dev$/,
      // Add production domains here
      'https://claritylog.com',
      'https://www.claritylog.com',
    ];
    
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      }
      return allowedOrigin.test(origin);
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
  ],
  exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
  maxAge: 86400, // 24 hours
};

/**
 * Helmet security configuration - development-friendly
 */
export const helmetConfig = helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      connectSrc: ["'self'", "https://api.openai.com", "https://generativelanguage.googleapis.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  } : false, // Disable CSP in development
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  } : false,
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

/**
 * Input validation schemas
 */
export const validationSchemas = {
  // User ID validation
  userId: param('userId').isAlphanumeric().isLength({ min: 1, max: 100 }),
  
  // Log entry validation
  logEntry: [
    body('clientContactHours').isFloat({ min: 0, max: 24 }).toFloat(),
    body('dateOfContact').isISO8601().toDate(),
    body('notes').trim().isLength({ max: 5000 }).escape(),
    body('clientInitials').optional().trim().isLength({ max: 10 }).escape(),
    body('sessionType').optional().isIn(['individual', 'group', 'family', 'couples']),
    body('supervisionNotes').optional().trim().isLength({ max: 2000 }).escape(),
  ],
  
  // AI request validation
  aiRequest: [
    body('message').trim().isLength({ min: 1, max: 2000 }).escape(),
    body('userId').isAlphanumeric().isLength({ min: 1, max: 100 }),
    body('conversationHistory').optional().isArray({ max: 20 }),
  ],
  
  // Search validation
  search: [
    query('q').trim().isLength({ min: 1, max: 200 }).escape(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
  ],
  
  // Supervision validation
  supervision: [
    body('supervisorId').isAlphanumeric().isLength({ min: 1, max: 100 }),
    body('superviseeId').isAlphanumeric().isLength({ min: 1, max: 100 }),
    body('sessionDate').isISO8601().toDate(),
    body('durationMinutes').isInt({ min: 1, max: 480 }).toInt(),
    body('notes').optional().trim().isLength({ max: 3000 }).escape(),
  ],
};

/**
 * Validation error handler middleware
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(error => ({
        field: error.type === 'field' ? error.path : 'unknown',
        message: error.msg,
        value: error.type === 'field' ? error.value : undefined,
      })),
    });
  }
  next();
};

/**
 * Sanitize HTML content to prevent XSS
 */
export const sanitizeHtml = (html: string): string => {
  // Basic HTML sanitization - remove script tags and dangerous attributes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:/gi, '');
};

/**
 * Request sanitization middleware
 */
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  
  next();
};

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeHtml(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Security headers middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Remove server signature
  res.removeHeader('X-Powered-By');
  
  // Add custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
};

/**
 * Error handling middleware for security-related errors
 */
export const securityErrorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Security error:', error.message);
  
  // Don't expose internal error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (error.message.includes('CORS')) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Origin not allowed by CORS policy',
    });
  }
  
  if (error.message.includes('rate limit') || error.message.includes('Too many')) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Please slow down your requests',
    });
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: isDevelopment ? error.message : 'Something went wrong',
  });
};