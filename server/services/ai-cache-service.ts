import crypto from 'crypto';
import type { AiAnalysisCache } from '../../shared/schema';

interface CacheEntry {
  id: string;
  contentHash: string;
  analysisType: string;
  result: any;
  usageCount: number;
  lastUsed: Date;
  expiresAt?: Date;
}

interface CacheConfig {
  defaultTTL: number; // Time to live in hours
  maxUsageCount: number;
  cleanupInterval: number; // Hours between cleanup
}

export class AiCacheService {
  private static readonly CONFIG: CacheConfig = {
    defaultTTL: 168, // 7 days
    maxUsageCount: 100,
    cleanupInterval: 24, // Daily cleanup
  };

  private static cache: Map<string, CacheEntry> = new Map();
  private static lastCleanup: Date = new Date();

  /**
   * Generate content hash for caching
   */
  private static generateContentHash(content: string, analysisType: string): string {
    const combined = `${analysisType}:${content}`;
    return crypto.createHash('sha256').update(combined).digest('hex');
  }

  /**
   * Check if cache entry is valid
   */
  private static isValidEntry(entry: CacheEntry): boolean {
    const now = new Date();
    
    // Check expiration
    if (entry.expiresAt && now > entry.expiresAt) {
      return false;
    }
    
    // Check usage count
    if (entry.usageCount > this.CONFIG.maxUsageCount) {
      return false;
    }
    
    return true;
  }

  /**
   * Get cached analysis result
   */
  static async getCachedResult(
    content: string, 
    analysisType: string
  ): Promise<any | null> {
    const hash = this.generateContentHash(content, analysisType);
    const entry = this.cache.get(hash);
    
    if (!entry || !this.isValidEntry(entry)) {
      return null;
    }
    
    // Update usage statistics
    entry.usageCount++;
    entry.lastUsed = new Date();
    this.cache.set(hash, entry);
    
    return entry.result;
  }

  /**
   * Store analysis result in cache
   */
  static async cacheResult(
    content: string,
    analysisType: string,
    result: any,
    customTTL?: number
  ): Promise<void> {
    const hash = this.generateContentHash(content, analysisType);
    const ttlHours = customTTL || this.CONFIG.defaultTTL;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + ttlHours);
    
    const entry: CacheEntry = {
      id: crypto.randomUUID(),
      contentHash: hash,
      analysisType,
      result,
      usageCount: 1,
      lastUsed: new Date(),
      expiresAt,
    };
    
    this.cache.set(hash, entry);
    
    // Trigger cleanup if needed
    this.maybeCleanup();
  }

  /**
   * Check if content is similar enough to use cached result
   */
  static async findSimilarCached(
    content: string,
    analysisType: string,
    similarityThreshold: number = 0.85
  ): Promise<any | null> {
    // For session notes, check for similar patterns
    if (analysisType === 'session_analysis') {
      return this.findSimilarSessionAnalysis(content, similarityThreshold);
    }
    
    // For other types, use exact matching for now
    return this.getCachedResult(content, analysisType);
  }

  /**
   * Find similar session analysis based on content patterns
   */
  private static findSimilarSessionAnalysis(
    content: string,
    threshold: number
  ): any | null {
    const contentWords = this.extractKeywords(content.toLowerCase());
    let bestMatch: CacheEntry | null = null;
    let bestSimilarity = 0;
    
    const entries = Array.from(this.cache.entries());
    for (const [hash, entry] of entries) {
      if (entry.analysisType !== 'session_analysis' || !this.isValidEntry(entry)) {
        continue;
      }
      
      // Get original content from stored data (would need to be stored)
      // For now, skip similarity matching and rely on exact matches
      continue;
    }
    
    if (bestMatch && bestSimilarity >= threshold) {
      bestMatch.usageCount++;
      bestMatch.lastUsed = new Date();
      return bestMatch.result;
    }
    
    return null;
  }

  /**
   * Extract keywords from content for similarity matching
   */
  private static extractKeywords(content: string): Set<string> {
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    return new Set(words);
  }

  /**
   * Calculate similarity between two keyword sets
   */
  private static calculateSimilarity(set1: Set<string>, set2: Set<string>): number {
    const arr1 = Array.from(set1);
    const arr2 = Array.from(set2);
    const intersection = new Set(arr1.filter(x => set2.has(x)));
    const union = new Set(arr1.concat(arr2));
    
    return intersection.size / union.size; // Jaccard similarity
  }

  /**
   * Get cache statistics
   */
  static getCacheStats() {
    const validEntries = Array.from(this.cache.values()).filter(this.isValidEntry);
    const totalUsage = validEntries.reduce((sum, entry) => sum + entry.usageCount, 0);
    
    const typeStats = validEntries.reduce((stats, entry) => {
      stats[entry.analysisType] = (stats[entry.analysisType] || 0) + 1;
      return stats;
    }, {} as Record<string, number>);
    
    return {
      totalEntries: validEntries.length,
      totalUsage,
      averageUsage: totalUsage / Math.max(1, validEntries.length),
      typeBreakdown: typeStats,
      cacheHitRate: this.calculateHitRate(),
      estimatedSavings: this.calculateEstimatedSavings(totalUsage),
    };
  }

  /**
   * Calculate cache hit rate (simplified)
   */
  private static calculateHitRate(): number {
    // Would track actual hit/miss ratios in production
    const validEntries = Array.from(this.cache.values()).filter(this.isValidEntry);
    const reusedEntries = validEntries.filter(entry => entry.usageCount > 1);
    
    return reusedEntries.length / Math.max(1, validEntries.length);
  }

  /**
   * Calculate estimated cost savings from caching
   */
  private static calculateEstimatedSavings(totalUsage: number): number {
    // Assuming $0.02 per AI analysis call
    const costPerCall = 0.02;
    const cacheMisses = Array.from(this.cache.values()).length;
    const cacheHits = totalUsage - cacheMisses;
    
    return cacheHits * costPerCall;
  }

  /**
   * Clean up expired and overused cache entries
   */
  private static cleanup(): void {
    const now = new Date();
    let removedCount = 0;
    
    for (const [hash, entry] of this.cache) {
      if (!this.isValidEntry(entry)) {
        this.cache.delete(hash);
        removedCount++;
      }
    }
    
    this.lastCleanup = now;
    console.log(`AI Cache cleanup completed. Removed ${removedCount} expired entries.`);
  }

  /**
   * Maybe run cleanup if enough time has passed
   */
  private static maybeCleanup(): void {
    const now = new Date();
    const hoursSinceCleanup = (now.getTime() - this.lastCleanup.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceCleanup >= this.CONFIG.cleanupInterval) {
      this.cleanup();
    }
  }

  /**
   * Batch process multiple contents for analysis
   */
  static async batchProcess(
    requests: Array<{ content: string; analysisType: string }>,
    processor: (content: string, type: string) => Promise<any>
  ): Promise<Array<{ content: string; result: any; fromCache: boolean }>> {
    const results: Array<{ content: string; result: any; fromCache: boolean }> = [];
    const toProcess: Array<{ content: string; analysisType: string; index: number }> = [];
    
    // Check cache for each request
    for (let i = 0; i < requests.length; i++) {
      const { content, analysisType } = requests[i];
      const cached = await this.getCachedResult(content, analysisType);
      
      if (cached) {
        results[i] = { content, result: cached, fromCache: true };
      } else {
        toProcess.push({ content, analysisType, index: i });
      }
    }
    
    // Process uncached requests in batch
    const processPromises = toProcess.map(async ({ content, analysisType, index }) => {
      const result = await processor(content, analysisType);
      await this.cacheResult(content, analysisType, result);
      results[index] = { content, result, fromCache: false };
    });
    
    await Promise.all(processPromises);
    
    return results;
  }

  /**
   * Preload cache with common patterns
   */
  static async preloadCommonPatterns(): Promise<void> {
    const commonPatterns = [
      {
        content: "Client presented with anxiety symptoms during today's session.",
        analysisType: 'session_analysis',
        result: {
          themes: ['anxiety', 'symptom presentation'],
          ccsrCategory: 'Mental Health Counseling',
          potentialBlindSpots: ['underlying trauma', 'medication considerations']
        }
      },
      {
        content: "Discussed coping strategies and homework assignments.",
        analysisType: 'session_analysis',
        result: {
          themes: ['coping skills', 'therapeutic homework'],
          ccsrCategory: 'Treatment Planning',
          potentialBlindSpots: ['client readiness', 'homework compliance']
        }
      }
    ];
    
    for (const pattern of commonPatterns) {
      await this.cacheResult(pattern.content, pattern.analysisType, pattern.result, 720); // 30 days
    }
  }

  /**
   * Clear cache (for testing or reset)
   */
  static clearCache(): void {
    this.cache.clear();
    this.lastCleanup = new Date();
  }

  /**
   * Export cache for persistence
   */
  static exportCache(): AiAnalysisCache[] {
    return Array.from(this.cache.values()).map(entry => ({
      id: entry.id,
      contentHash: entry.contentHash,
      analysisType: entry.analysisType,
      inputData: '', // Would store original input for similarity matching
      result: JSON.stringify(entry.result),
      usageCount: entry.usageCount,
      lastUsed: entry.lastUsed,
      expiresAt: entry.expiresAt,
      createdAt: new Date(),
    }));
  }

  /**
   * Import cache from persistence
   */
  static importCache(cacheData: AiAnalysisCache[]): void {
    for (const data of cacheData) {
      if (data.expiresAt && new Date() > data.expiresAt) {
        continue; // Skip expired entries
      }
      
      const entry: CacheEntry = {
        id: data.id,
        contentHash: data.contentHash,
        analysisType: data.analysisType,
        result: JSON.parse(data.result),
        usageCount: data.usageCount,
        lastUsed: data.lastUsed,
        expiresAt: data.expiresAt,
      };
      
      this.cache.set(data.contentHash, entry);
    }
  }
}