import winston from 'winston';
import path from 'path';

// Determine log level from environment
const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// Create logs directory path
const logsDir = path.join(process.cwd(), 'logs');

// Custom format for better readability
const customFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}] ${message}`;

  // Add metadata if present
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }

  return msg;
});

// Create logger instance
export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'claritytracker-api',
    env: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Error logs - only errors
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),

    // Combined logs - all levels
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),

    // Separate file for authentication events
    new winston.transports.File({
      filename: path.join(logsDir, 'auth.log'),
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 3,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format((info) => {
          // Only log auth-related events
          return info.category === 'auth' ? info : false;
        })(),
        winston.format.json()
      )
    })
  ],
  // Don't exit on error
  exitOnError: false
});

// Console logging for non-production environments
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        customFormat
      )
    })
  );
}

// Helper functions for common logging patterns

/**
 * Log API request
 */
export const logRequest = (req: {
  method: string;
  path: string;
  ip?: string;
  user?: { id: string };
}) => {
  logger.info('API Request', {
    category: 'request',
    method: req.method,
    path: req.path,
    ip: req.ip,
    userId: req.user?.id
  });
};

/**
 * Log API response
 */
export const logResponse = (req: {
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  user?: { id: string };
}) => {
  logger.info('API Response', {
    category: 'response',
    method: req.method,
    path: req.path,
    statusCode: req.statusCode,
    duration: `${req.duration}ms`,
    userId: req.user?.id
  });
};

/**
 * Log authentication events
 */
export const logAuth = (event: 'login' | 'logout' | 'signup' | 'token_refresh' | 'auth_failed', data: {
  userId?: string;
  email?: string;
  ip?: string;
  reason?: string;
}) => {
  logger.info(`Auth: ${event}`, {
    category: 'auth',
    event,
    ...data
  });
};

/**
 * Log database operations
 */
export const logDB = (operation: string, data: {
  table?: string;
  duration?: number;
  error?: Error;
}) => {
  if (data.error) {
    logger.error('Database Error', {
      category: 'database',
      operation,
      ...data,
      error: data.error.message,
      stack: data.error.stack
    });
  } else {
    logger.debug('Database Operation', {
      category: 'database',
      operation,
      ...data
    });
  }
};

/**
 * Log AI API calls
 */
export const logAI = (provider: 'openai' | 'google' | 'anthropic', data: {
  operation: string;
  model?: string;
  tokens?: number;
  duration?: number;
  cost?: number;
  error?: Error;
}) => {
  if (data.error) {
    logger.error(`AI API Error: ${provider}`, {
      category: 'ai',
      provider,
      ...data,
      error: data.error.message
    });
  } else {
    logger.info(`AI API Call: ${provider}`, {
      category: 'ai',
      provider,
      ...data
    });
  }
};

/**
 * Log security events
 */
export const logSecurity = (event: string, data: {
  userId?: string;
  ip?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
}) => {
  logger.warn('Security Event', {
    category: 'security',
    event,
    ...data
  });
};

// Export logger as default
export default logger;
