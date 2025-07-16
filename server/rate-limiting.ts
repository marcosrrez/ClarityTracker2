import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

interface RateLimitLogEntry {
  id: string;
  ip: string;
  userId?: string;
  endpoint: string;
  method: string;
  status: 'allowed' | 'rate_limited' | 'blocked';
  requestCount: number;
  windowStart: Date;
  windowEnd: Date;
  userAgent?: string;
  timestamp: Date;
}

class RateLimitingService {
  private logQueue: RateLimitLogEntry[] = [];
  private isProcessingQueue = false;

  // Basic rate limiter for public endpoints
  public createBasicRateLimiter(config: Partial<RateLimitConfig> = {}): any {
    return rateLimit({
      windowMs: config.windowMs || 15 * 60 * 1000, // 15 minutes
      max: config.max || 100, // 100 requests per window
      message: config.message || 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      keyGenerator: (req: Request) => {
        // Use authenticated user ID if available, otherwise IP
        const userId = req.headers['user-id'] as string;
        return userId || req.ip;
      },
      handler: (req: Request, res: Response) => {
        this.logRateLimitEvent(req, 'rate_limited');
        console.warn(`Rate limit reached for ${req.ip} on ${req.path}`);
        res.status(429).json({
          error: 'Too many requests',
          message: 'You have made too many requests. Please try again later.',
          retryAfter: Math.ceil(config.windowMs! / 1000) || 900
        });
      }
    });
  }

  // Authenticated user rate limiter with higher limits
  public createAuthenticatedRateLimiter(config: Partial<RateLimitConfig> = {}): any {
    return rateLimit({
      windowMs: config.windowMs || 15 * 60 * 1000, // 15 minutes
      max: config.max || 500, // 500 requests per window for authenticated users
      message: config.message || 'Too many requests, please slow down.',
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req: Request) => {
        const userId = req.headers['user-id'] as string;
        return userId || req.ip;
      },
      handler: (req: Request, res: Response) => {
        this.logRateLimitEvent(req, 'rate_limited');
        res.status(429).json({
          error: 'Too many requests',
          message: 'You have exceeded your request limit. Please try again later.',
          retryAfter: Math.ceil(config.windowMs! / 1000) || 900
        });
      }
    });
  }

  // AI analysis rate limiter with lower limits
  public createAIAnalysisRateLimiter(config: Partial<RateLimitConfig> = {}): any {
    return rateLimit({
      windowMs: config.windowMs || 60 * 1000, // 1 minute
      max: config.max || 10, // 10 AI requests per minute
      message: config.message || 'AI analysis rate limit exceeded.',
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req: Request) => {
        const userId = req.headers['user-id'] as string;
        return userId || req.ip;
      },
      handler: (req: Request, res: Response) => {
        this.logRateLimitEvent(req, 'rate_limited');
        res.status(429).json({
          error: 'AI analysis rate limit exceeded',
          message: 'You have exceeded the AI analysis rate limit. Please wait before making another request.',
          retryAfter: 60
        });
      }
    });
  }

  // Admin endpoints rate limiter with strict limits
  public createAdminRateLimiter(config: Partial<RateLimitConfig> = {}): any {
    return rateLimit({
      windowMs: config.windowMs || 60 * 60 * 1000, // 1 hour
      max: config.max || 50, // 50 admin requests per hour
      message: config.message || 'Admin rate limit exceeded.',
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req: Request) => {
        const userId = req.headers['user-id'] as string;
        return userId || req.ip;
      },
      handler: (req: Request, res: Response) => {
        this.logRateLimitEvent(req, 'rate_limited');
        res.status(429).json({
          error: 'Admin rate limit exceeded',
          message: 'You have exceeded the admin rate limit. Please wait before making another request.',
          retryAfter: 3600
        });
      }
    });
  }

  // Data export rate limiter with very strict limits
  public createDataExportRateLimiter(): any {
    return rateLimit({
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
      max: 5, // 5 exports per day
      message: 'Data export rate limit exceeded.',
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req: Request) => {
        const userId = req.headers['user-id'] as string;
        return userId || req.ip;
      },
      handler: (req: Request, res: Response) => {
        this.logRateLimitEvent(req, 'rate_limited');
        res.status(429).json({
          error: 'Data export rate limit exceeded',
          message: 'You have exceeded the daily data export limit. Please try again tomorrow.',
          retryAfter: 86400
        });
      }
    });
  }

  // Middleware to log successful requests
  public createRequestLogger(): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      const originalSend = res.send;
      
      res.send = function(data: any) {
        if (res.statusCode < 400) {
          rateLimitingService.logRateLimitEvent(req, 'allowed');
        }
        return originalSend.call(this, data);
      };
      
      next();
    };
  }

  // Log rate limiting events
  private logRateLimitEvent(req: Request, status: 'allowed' | 'rate_limited' | 'blocked'): void {
    const userId = req.headers['user-id'] as string;
    const now = new Date();
    const windowStart = new Date(now.getTime() - (15 * 60 * 1000)); // 15 minutes ago
    
    const logEntry: RateLimitLogEntry = {
      id: `rate_limit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ip: req.ip,
      userId,
      endpoint: req.path,
      method: req.method,
      status,
      requestCount: 1, // This would be calculated based on current window
      windowStart,
      windowEnd: now,
      userAgent: req.get('User-Agent'),
      timestamp: now
    };

    this.logQueue.push(logEntry);
    this.processLogQueue();
  }

  // Process the log queue in batches
  private async processLogQueue(): Promise<void> {
    if (this.isProcessingQueue || this.logQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    
    try {
      const batch = this.logQueue.splice(0, 50); // Process 50 entries at a time
      
      if (batch.length > 0) {
        await this.saveBatchToDatabase(batch);
      }
    } catch (error) {
      console.error('Error processing rate limit log queue:', error);
    } finally {
      this.isProcessingQueue = false;
      
      // If there are more entries, schedule another processing
      if (this.logQueue.length > 0) {
        setTimeout(() => this.processLogQueue(), 1000);
      }
    }
  }

  // Save batch of log entries to database
  private async saveBatchToDatabase(batch: RateLimitLogEntry[]): Promise<void> {
    try {
      const { db } = await import('./db');
      const { sql } = await import('drizzle-orm');
      
      for (const entry of batch) {
        await db.execute(sql`
          INSERT INTO rate_limit_logs 
          (endpoint, client_id, ip_address, user_agent, request_method, status_code, event_type, rate_limit_exceeded, timestamp)
          VALUES (${entry.endpoint}, ${entry.clientId}, ${entry.ip}, ${entry.userAgent}, ${entry.method}, ${entry.statusCode}, ${entry.status}, ${entry.status === 'rate_limited'}, ${entry.timestamp})
        `);
      }
    } catch (error) {
      console.error('Error saving rate limit logs to database:', error);
    }
  }

  // Get rate limiting statistics
  public async getRateLimitStats(timeRange: '1h' | '24h' | '7d' = '24h'): Promise<any> {
    try {
      const { db } = await import('./db');
      const { sql } = await import('drizzle-orm');
      
      const hours = timeRange === '1h' ? 1 : timeRange === '24h' ? 24 : 168;
      const since = new Date(Date.now() - (hours * 60 * 60 * 1000));
      
      const results = await db.execute(sql`
        SELECT endpoint, ip_address, event_type, request_method, status_code, timestamp
        FROM rate_limit_logs 
        WHERE timestamp >= ${since}
        ORDER BY timestamp DESC 
        LIMIT 1000
      `);
      
      // Calculate statistics
      const totalRequests = results.length;
      const rateLimitedRequests = results.filter((r: any) => r.event_type === 'rate_limited').length;
      const blockedRequests = results.filter((r: any) => r.event_type === 'blocked').length;
      const allowedRequests = results.filter((r: any) => r.event_type === 'allowed').length;
      
      const topIPs = this.getTopIPs(results);
      const topEndpoints = this.getTopEndpoints(results);
      
      return {
        timeRange,
        totalRequests,
        allowedRequests,
        rateLimitedRequests,
        blockedRequests,
        rateLimitedPercentage: totalRequests > 0 ? (rateLimitedRequests / totalRequests) * 100 : 0,
        topIPs,
        topEndpoints
      };
    } catch (error) {
      console.error('Error getting rate limit stats:', error);
      return null;
    }
  }

  private getTopIPs(results: any[]): any[] {
    const ipCounts: { [key: string]: number } = {};
    results.forEach(r => {
      ipCounts[r.ip_address] = (ipCounts[r.ip_address] || 0) + 1;
    });
    
    return Object.entries(ipCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));
  }

  private getTopEndpoints(results: any[]): any[] {
    const endpointCounts: { [key: string]: number } = {};
    results.forEach(r => {
      endpointCounts[r.endpoint] = (endpointCounts[r.endpoint] || 0) + 1;
    });
    
    return Object.entries(endpointCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }));
  }

  // Clean up old rate limit logs
  public async cleanupOldLogs(daysToKeep: number = 30): Promise<{ deletedCount: number }> {
    try {
      const { db } = await import('./db');
      const { rateLimitLogTable } = await import('../shared/schema');
      
      const cutoffDate = new Date(Date.now() - (daysToKeep * 24 * 60 * 60 * 1000));
      
      const result = await db
        .delete(rateLimitLogTable)
        .where(`timestamp < $1`)
        .returning();
      
      return { deletedCount: result.length };
    } catch (error) {
      console.error('Error cleaning up rate limit logs:', error);
      return { deletedCount: 0 };
    }
  }
}

export const rateLimitingService = new RateLimitingService();

// Export pre-configured rate limiters
export const basicRateLimit = rateLimitingService.createBasicRateLimiter();
export const authRateLimit = rateLimitingService.createAuthenticatedRateLimiter();
export const aiAnalysisRateLimit = rateLimitingService.createAIAnalysisRateLimiter();
export const adminRateLimit = rateLimitingService.createAdminRateLimiter();
export const dataExportRateLimit = rateLimitingService.createDataExportRateLimiter();
export const requestLogger = rateLimitingService.createRequestLogger();