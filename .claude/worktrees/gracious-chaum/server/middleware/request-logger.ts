import { Request, Response, NextFunction } from 'express';
import { logger, logRequest, logResponse } from '../lib/logger';
import { AuthRequest } from './auth';

/**
 * Request logging middleware
 * Logs all incoming requests and their responses
 */
export const requestLogger = (req: AuthRequest, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Log incoming request
  logRequest({
    method: req.method,
    path: req.path,
    ip: req.ip,
    user: req.user
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - start;

    logResponse({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      user: req.user
    });

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Error logging middleware
 * Should be added after all other middleware/routes
 */
export const errorLogger = (
  err: Error,
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    userId: req.user?.id,
    ip: req.ip
  });

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  } else {
    res.status(500).json({
      error: err.message,
      stack: err.stack,
      code: 'INTERNAL_ERROR'
    });
  }
};
