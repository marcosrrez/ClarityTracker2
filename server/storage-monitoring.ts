import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

interface StorageMetrics {
  id: string;
  timestamp: Date;
  storageType: 'backup' | 'database' | 'system';
  totalSpaceGB: number;
  usedSpaceGB: number;
  availableSpaceGB: number;
  usagePercentage: number;
  alertLevel: 'normal' | 'warning' | 'critical';
  cleanupActions: string[];
  retentionPolicyEnforced: boolean;
}

interface StorageAlert {
  level: 'warning' | 'critical';
  message: string;
  recommendedActions: string[];
  timestamp: Date;
}

export class StorageMonitoringService {
  private readonly WARNING_THRESHOLD = 0.8;  // 80%
  private readonly CRITICAL_THRESHOLD = 0.9; // 90%
  private readonly BACKUP_DIR = process.env.BACKUP_DIR || './backups';
  private isHealthy: boolean = true;
  private lastHealthCheck: Date = new Date();
  private readonly RETENTION_POLICY = {
    daily: 7,    // Keep 7 daily backups
    weekly: 4,   // Keep 4 weekly backups
    monthly: 12, // Keep 12 monthly backups
    yearly: 2    // Keep 2 yearly backups
  };

  constructor() {
    this.ensureBackupDirectoryExists();
  }

  private async ensureBackupDirectoryExists(): Promise<void> {
    try {
      await fs.mkdir(this.BACKUP_DIR, { recursive: true });
    } catch (error) {
      console.error('Failed to create backup directory:', error);
    }
  }

  async monitorAllStorage(): Promise<StorageMetrics[]> {
    const results: StorageMetrics[] = [];
    
    try {
      // Monitor backup directory storage
      const backupStorage = await this.monitorBackupStorage();
      results.push(backupStorage);
      
      // Monitor database storage
      const dbStorage = await this.monitorDatabaseStorage();
      results.push(dbStorage);
      
      // Monitor system storage
      const systemStorage = await this.monitorSystemStorage();
      results.push(systemStorage);
      
      // Store results in database
      await this.storeStorageMetrics(results);
      
      // Check for alerts and take action
      await this.processStorageAlerts(results);
      
      return results;
      
    } catch (error) {
      console.error('Storage monitoring failed:', error);
      return [];
    }
  }

  private async monitorBackupStorage(): Promise<StorageMetrics> {
    try {
      const stats = await this.getDirectoryStorageStats(this.BACKUP_DIR);
      const usagePercentage = stats.usedSpaceGB / stats.totalSpaceGB;
      
      return {
        id: this.generateMetricId('backup'),
        timestamp: new Date(),
        storageType: 'backup',
        totalSpaceGB: stats.totalSpaceGB,
        usedSpaceGB: stats.usedSpaceGB,
        availableSpaceGB: stats.availableSpaceGB,
        usagePercentage,
        alertLevel: this.calculateAlertLevel(usagePercentage),
        cleanupActions: [],
        retentionPolicyEnforced: false
      };
    } catch (error) {
      console.error('Failed to monitor backup storage:', error);
      return this.createErrorMetric('backup', error);
    }
  }

  private async monitorDatabaseStorage(): Promise<StorageMetrics> {
    try {
      // Get database size information
      const { db } = await import('./db');
      const { sql } = await import('drizzle-orm');
      
      const result = await db.execute(sql`
        SELECT 
          pg_database_size(current_database()) as db_size,
          pg_size_pretty(pg_database_size(current_database())) as db_size_pretty
      `);
      
      const dbSizeBytes = result[0]?.db_size || 0;
      const dbSizeGB = dbSizeBytes / (1024 * 1024 * 1024);
      
      // For serverless databases, we'll estimate based on current usage
      const estimatedTotalGB = Math.max(dbSizeGB * 2, 1); // Conservative estimate
      const usagePercentage = dbSizeGB / estimatedTotalGB;
      
      return {
        id: this.generateMetricId('database'),
        timestamp: new Date(),
        storageType: 'database',
        totalSpaceGB: estimatedTotalGB,
        usedSpaceGB: dbSizeGB,
        availableSpaceGB: estimatedTotalGB - dbSizeGB,
        usagePercentage,
        alertLevel: this.calculateAlertLevel(usagePercentage),
        cleanupActions: [],
        retentionPolicyEnforced: false
      };
    } catch (error) {
      console.error('Failed to monitor database storage:', error);
      return this.createErrorMetric('database', error);
    }
  }

  private async monitorSystemStorage(): Promise<StorageMetrics> {
    try {
      const stats = await this.getSystemStorageStats();
      const usagePercentage = stats.usedSpaceGB / stats.totalSpaceGB;
      
      return {
        id: this.generateMetricId('system'),
        timestamp: new Date(),
        storageType: 'system',
        totalSpaceGB: stats.totalSpaceGB,
        usedSpaceGB: stats.usedSpaceGB,
        availableSpaceGB: stats.availableSpaceGB,
        usagePercentage,
        alertLevel: this.calculateAlertLevel(usagePercentage),
        cleanupActions: [],
        retentionPolicyEnforced: false
      };
    } catch (error) {
      console.error('Failed to monitor system storage:', error);
      return this.createErrorMetric('system', error);
    }
  }

  private async getDirectoryStorageStats(dirPath: string): Promise<{
    totalSpaceGB: number;
    usedSpaceGB: number;
    availableSpaceGB: number;
  }> {
    try {
      const { stdout } = await execAsync(`df -BG "${dirPath}" | tail -1`);
      const parts = stdout.trim().split(/\s+/);
      
      const totalSpaceGB = parseInt(parts[1].replace('G', ''));
      const usedSpaceGB = parseInt(parts[2].replace('G', ''));
      const availableSpaceGB = parseInt(parts[3].replace('G', ''));
      
      return { totalSpaceGB, usedSpaceGB, availableSpaceGB };
    } catch (error) {
      console.error('Failed to get directory storage stats:', error);
      return { totalSpaceGB: 100, usedSpaceGB: 0, availableSpaceGB: 100 };
    }
  }

  private async getSystemStorageStats(): Promise<{
    totalSpaceGB: number;
    usedSpaceGB: number;
    availableSpaceGB: number;
  }> {
    try {
      const { stdout } = await execAsync('df -BG / | tail -1');
      const parts = stdout.trim().split(/\s+/);
      
      const totalSpaceGB = parseInt(parts[1].replace('G', ''));
      const usedSpaceGB = parseInt(parts[2].replace('G', ''));
      const availableSpaceGB = parseInt(parts[3].replace('G', ''));
      
      return { totalSpaceGB, usedSpaceGB, availableSpaceGB };
    } catch (error) {
      console.error('Failed to get system storage stats:', error);
      return { totalSpaceGB: 100, usedSpaceGB: 0, availableSpaceGB: 100 };
    }
  }

  private calculateAlertLevel(usagePercentage: number): 'normal' | 'warning' | 'critical' {
    if (usagePercentage >= this.CRITICAL_THRESHOLD) {
      return 'critical';
    } else if (usagePercentage >= this.WARNING_THRESHOLD) {
      return 'warning';
    }
    return 'normal';
  }

  private generateMetricId(type: string): string {
    return `storage_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createErrorMetric(type: 'backup' | 'database' | 'system', error: any): StorageMetrics {
    return {
      id: this.generateMetricId(type),
      timestamp: new Date(),
      storageType: type,
      totalSpaceGB: 0,
      usedSpaceGB: 0,
      availableSpaceGB: 0,
      usagePercentage: 0,
      alertLevel: 'critical',
      cleanupActions: [`Error monitoring ${type} storage: ${error.message}`],
      retentionPolicyEnforced: false
    };
  }

  private async storeStorageMetrics(metrics: StorageMetrics[]): Promise<void> {
    try {
      const { db } = await import('./db');
      const { sql } = await import('drizzle-orm');
      
      for (const metric of metrics) {
        await db.execute(sql`
          INSERT INTO storage_monitoring_logs 
          (timestamp, storage_type, total_space_gb, used_space_gb, available_space_gb, 
           usage_percentage, alert_level, cleanup_actions, retention_policy_enforced)
          VALUES (${metric.timestamp}, ${metric.storageType}, ${metric.totalSpaceGB}, 
                  ${metric.usedSpaceGB}, ${metric.availableSpaceGB}, ${metric.usagePercentage},
                  ${metric.alertLevel}, ${JSON.stringify(metric.cleanupActions)}, 
                  ${metric.retentionPolicyEnforced})
        `);
      }
    } catch (error) {
      console.error('Failed to store storage metrics:', error);
    }
  }

  private async processStorageAlerts(metrics: StorageMetrics[]): Promise<void> {
    const alerts: StorageAlert[] = [];
    
    for (const metric of metrics) {
      if (metric.alertLevel === 'critical') {
        alerts.push({
          level: 'critical',
          message: `CRITICAL: ${metric.storageType} storage at ${(metric.usagePercentage * 100).toFixed(1)}% capacity`,
          recommendedActions: await this.generateRecommendedActions(metric),
          timestamp: new Date()
        });
        
        // Take immediate action for critical alerts
        await this.takeImmediateAction(metric);
        
      } else if (metric.alertLevel === 'warning') {
        alerts.push({
          level: 'warning',
          message: `WARNING: ${metric.storageType} storage at ${(metric.usagePercentage * 100).toFixed(1)}% capacity`,
          recommendedActions: await this.generateRecommendedActions(metric),
          timestamp: new Date()
        });
      }
    }
    
    if (alerts.length > 0) {
      await this.sendStorageAlerts(alerts);
    }
  }

  private async generateRecommendedActions(metric: StorageMetrics): Promise<string[]> {
    const actions: string[] = [];
    
    if (metric.storageType === 'backup') {
      actions.push('Enforce backup retention policy');
      actions.push('Compress old backup files');
      actions.push('Move old backups to archive storage');
      
      if (metric.usagePercentage >= this.CRITICAL_THRESHOLD) {
        actions.push('IMMEDIATE: Delete oldest backup files');
      }
    } else if (metric.storageType === 'database') {
      actions.push('Analyze database for unnecessary data');
      actions.push('Optimize database indexes');
      actions.push('Archive old log entries');
    } else if (metric.storageType === 'system') {
      actions.push('Clean system temporary files');
      actions.push('Remove old log files');
      actions.push('Clear package caches');
    }
    
    return actions;
  }

  private async takeImmediateAction(metric: StorageMetrics): Promise<void> {
    console.log(`Taking immediate action for critical storage: ${metric.storageType}`);
    
    if (metric.storageType === 'backup') {
      await this.enforceRetentionPolicy();
    }
  }

  async enforceRetentionPolicy(): Promise<{
    filesRemoved: number;
    spaceFreedGB: number;
    actions: string[];
  }> {
    const result = {
      filesRemoved: 0,
      spaceFreedGB: 0,
      actions: []
    };
    
    try {
      const backupFiles = await this.getBackupFiles();
      const filesToRemove = await this.identifyFilesForRemoval(backupFiles);
      
      for (const file of filesToRemove) {
        try {
          const stats = await fs.stat(file.path);
          await fs.unlink(file.path);
          
          result.filesRemoved++;
          result.spaceFreedGB += stats.size / (1024 * 1024 * 1024);
          result.actions.push(`Removed: ${file.name}`);
        } catch (error) {
          result.actions.push(`Failed to remove: ${file.name} - ${error.message}`);
        }
      }
      
      console.log(`Retention policy enforced: ${result.filesRemoved} files removed, ${result.spaceFreedGB.toFixed(2)}GB freed`);
      
    } catch (error) {
      console.error('Failed to enforce retention policy:', error);
      result.actions.push(`Retention policy failed: ${error.message}`);
    }
    
    return result;
  }

  private async getBackupFiles(): Promise<Array<{
    name: string;
    path: string;
    created: Date;
    size: number;
  }>> {
    try {
      const files = await fs.readdir(this.BACKUP_DIR);
      const backupFiles = [];
      
      for (const file of files) {
        if (file.endsWith('.sql') || file.endsWith('.gz')) {
          const filePath = path.join(this.BACKUP_DIR, file);
          const stats = await fs.stat(filePath);
          
          backupFiles.push({
            name: file,
            path: filePath,
            created: stats.birthtime,
            size: stats.size
          });
        }
      }
      
      return backupFiles.sort((a, b) => b.created.getTime() - a.created.getTime());
    } catch (error) {
      console.error('Failed to get backup files:', error);
      return [];
    }
  }

  private async identifyFilesForRemoval(files: Array<{
    name: string;
    path: string;
    created: Date;
    size: number;
  }>): Promise<Array<{
    name: string;
    path: string;
    created: Date;
    size: number;
  }>> {
    const now = new Date();
    const filesToKeep = new Set<string>();
    const filesToRemove = [];
    
    // Keep files according to retention policy
    const dailyFiles = files.filter(f => {
      const daysDiff = Math.floor((now.getTime() - f.created.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= this.RETENTION_POLICY.daily;
    });
    
    const weeklyFiles = files.filter(f => {
      const weeksDiff = Math.floor((now.getTime() - f.created.getTime()) / (1000 * 60 * 60 * 24 * 7));
      return weeksDiff <= this.RETENTION_POLICY.weekly && weeksDiff > 0;
    });
    
    const monthlyFiles = files.filter(f => {
      const monthsDiff = Math.floor((now.getTime() - f.created.getTime()) / (1000 * 60 * 60 * 24 * 30));
      return monthsDiff <= this.RETENTION_POLICY.monthly && monthsDiff > 0;
    });
    
    const yearlyFiles = files.filter(f => {
      const yearsDiff = Math.floor((now.getTime() - f.created.getTime()) / (1000 * 60 * 60 * 24 * 365));
      return yearsDiff <= this.RETENTION_POLICY.yearly && yearsDiff > 0;
    });
    
    // Mark files to keep
    [...dailyFiles, ...weeklyFiles, ...monthlyFiles, ...yearlyFiles].forEach(f => {
      filesToKeep.add(f.path);
    });
    
    // Identify files to remove
    for (const file of files) {
      if (!filesToKeep.has(file.path)) {
        filesToRemove.push(file);
      }
    }
    
    return filesToRemove;
  }

  private async sendStorageAlerts(alerts: StorageAlert[]): Promise<void> {
    try {
      console.error('STORAGE ALERTS:', alerts);
      
      // In production, integrate with notification system
      // await this.sendEmailAlert(alerts);
      // await this.sendSlackAlert(alerts);
      
    } catch (error) {
      console.error('Failed to send storage alerts:', error);
    }
  }

  async getStorageHistory(limit: number = 10): Promise<StorageMetrics[]> {
    try {
      const { db } = await import('./db');
      const { sql } = await import('drizzle-orm');
      
      const results = await db.execute(sql`
        SELECT id, timestamp, storage_type, total_space_gb, used_space_gb, 
               available_space_gb, usage_percentage, alert_level, cleanup_actions, 
               retention_policy_enforced
        FROM storage_monitoring_logs 
        ORDER BY timestamp DESC 
        LIMIT ${limit}
      `);
      
      return results.map((row: any) => ({
        id: row.id,
        timestamp: row.timestamp,
        storageType: row.storage_type,
        totalSpaceGB: row.total_space_gb,
        usedSpaceGB: row.used_space_gb,
        availableSpaceGB: row.available_space_gb,
        usagePercentage: row.usage_percentage,
        alertLevel: row.alert_level,
        cleanupActions: JSON.parse(row.cleanup_actions || '[]'),
        retentionPolicyEnforced: row.retention_policy_enforced
      }));
      
    } catch (error) {
      console.error('Failed to get storage history:', error);
      return [];
    }
  }

  async getCurrentStorageStatus(): Promise<{
    backup: StorageMetrics;
    database: StorageMetrics;
    system: StorageMetrics;
    overall: 'healthy' | 'warning' | 'critical';
  }> {
    const metrics = await this.monitorAllStorage();
    
    const backup = metrics.find(m => m.storageType === 'backup') || this.createErrorMetric('backup', new Error('No backup metrics'));
    const database = metrics.find(m => m.storageType === 'database') || this.createErrorMetric('database', new Error('No database metrics'));
    const system = metrics.find(m => m.storageType === 'system') || this.createErrorMetric('system', new Error('No system metrics'));
    
    const overallStatus = this.calculateOverallStatus([backup, database, system]);
    
    return {
      backup,
      database,
      system,
      overall: overallStatus
    };
  }

  private calculateOverallStatus(metrics: StorageMetrics[]): 'healthy' | 'warning' | 'critical' {
    const hasCritical = metrics.some(m => m.alertLevel === 'critical');
    const hasWarning = metrics.some(m => m.alertLevel === 'warning');
    
    if (hasCritical) return 'critical';
    if (hasWarning) return 'warning';
    return 'healthy';
  }
}

export const storageMonitoringService = new StorageMonitoringService();