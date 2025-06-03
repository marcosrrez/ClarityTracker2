/**
 * Usage Limiter for AI API calls
 * Tracks daily usage and switches to counseling dataset when limits are reached
 */

interface UserUsage {
  userId: string;
  date: string;
  aiCallsUsed: number;
  lastReset: Date;
}

// In-memory storage for usage tracking (could be moved to database)
const usageStore = new Map<string, UserUsage>();

// Configuration
const DAILY_AI_LIMIT = 50; // Free tier: 50 AI responses per day
const PREMIUM_AI_LIMIT = 200; // Premium tier: 200 AI responses per day
const RESET_HOUR = 0; // Reset at midnight UTC

export class UsageLimiter {
  
  /**
   * Check if user can make an AI call
   */
  static canUseAI(userId: string, isPremium: boolean = false): boolean {
    const usage = this.getUserUsage(userId);
    const limit = isPremium ? PREMIUM_AI_LIMIT : DAILY_AI_LIMIT;
    
    return usage.aiCallsUsed < limit;
  }
  
  /**
   * Record an AI API call
   */
  static recordAICall(userId: string): void {
    const usage = this.getUserUsage(userId);
    usage.aiCallsUsed += 1;
    usageStore.set(userId, usage);
  }
  
  /**
   * Get remaining AI calls for user
   */
  static getRemainingCalls(userId: string, isPremium: boolean = false): number {
    const usage = this.getUserUsage(userId);
    const limit = isPremium ? PREMIUM_AI_LIMIT : DAILY_AI_LIMIT;
    
    return Math.max(0, limit - usage.aiCallsUsed);
  }
  
  /**
   * Get or create user usage record
   */
  private static getUserUsage(userId: string): UserUsage {
    const today = new Date().toISOString().split('T')[0];
    const existing = usageStore.get(userId);
    
    // Reset if new day or no existing record
    if (!existing || existing.date !== today || this.shouldReset(existing.lastReset)) {
      const newUsage: UserUsage = {
        userId,
        date: today,
        aiCallsUsed: 0,
        lastReset: new Date()
      };
      usageStore.set(userId, newUsage);
      return newUsage;
    }
    
    return existing;
  }
  
  /**
   * Check if usage should be reset (daily reset)
   */
  private static shouldReset(lastReset: Date): boolean {
    const now = new Date();
    const resetTime = new Date(now);
    resetTime.setHours(RESET_HOUR, 0, 0, 0);
    
    // If current time is past reset time and last reset was before today's reset time
    if (now >= resetTime && lastReset < resetTime) {
      return true;
    }
    
    // If it's past midnight and last reset was yesterday
    if (now.getDate() !== lastReset.getDate()) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Get usage statistics for user
   */
  static getUsageStats(userId: string, isPremium: boolean = false): {
    used: number;
    remaining: number;
    limit: number;
    resetTime: string;
  } {
    const usage = this.getUserUsage(userId);
    const limit = isPremium ? PREMIUM_AI_LIMIT : DAILY_AI_LIMIT;
    const remaining = this.getRemainingCalls(userId, isPremium);
    
    // Calculate next reset time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(RESET_HOUR, 0, 0, 0);
    
    return {
      used: usage.aiCallsUsed,
      remaining,
      limit,
      resetTime: tomorrow.toISOString()
    };
  }
  
  /**
   * Force reset for user (admin function)
   */
  static forceReset(userId: string): void {
    usageStore.delete(userId);
  }
}