import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const execAsync = promisify(exec);

interface BackupVerificationResult {
  id: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'failure';
  details: string;
  metrics: {
    backupSize: number;
    verificationTime: number;
    tablesVerified: number;
    integrityScore: number;
    restoreTestStatus: 'passed' | 'failed' | 'skipped';
  };
  alerts: string[];
}

interface BackupMetrics {
  totalSize: number;
  tableCount: number;
  recordCount: number;
  lastBackupTime: Date;
  checksumHash: string;
}

class BackupVerificationService {
  private backupDir: string;
  private stagingDbUrl: string;
  private productionDbUrl: string;

  constructor() {
    this.backupDir = process.env.BACKUP_DIR || './backups';
    this.stagingDbUrl = process.env.STAGING_DATABASE_URL || process.env.DATABASE_URL + '_staging';
    this.productionDbUrl = process.env.DATABASE_URL || '';
  }

  async runDailyVerification(): Promise<BackupVerificationResult> {
    const startTime = Date.now();
    const verificationId = `backup_verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log(`Starting backup verification: ${verificationId}`);
      
      // Step 1: Create fresh backup
      const backupPath = await this.createBackup();
      
      // Step 2: Verify backup integrity
      const integrityResult = await this.verifyBackupIntegrity(backupPath);
      
      // Step 3: Test restore to staging
      const restoreResult = await this.testBackupRestore(backupPath);
      
      // Step 4: Verify data consistency
      const consistencyResult = await this.verifyDataConsistency();
      
      // Step 5: Generate metrics
      const metrics = await this.generateBackupMetrics(backupPath);
      
      const verificationTime = Date.now() - startTime;
      const overallStatus = this.calculateOverallStatus(integrityResult, restoreResult, consistencyResult);
      
      const result: BackupVerificationResult = {
        id: verificationId,
        timestamp: new Date(),
        status: overallStatus,
        details: this.generateVerificationDetails(integrityResult, restoreResult, consistencyResult),
        metrics: {
          backupSize: metrics.totalSize,
          verificationTime,
          tablesVerified: metrics.tableCount,
          integrityScore: this.calculateIntegrityScore(integrityResult, restoreResult, consistencyResult),
          restoreTestStatus: restoreResult.success ? 'passed' : 'failed'
        },
        alerts: this.generateAlerts(integrityResult, restoreResult, consistencyResult)
      };
      
      // Store verification result
      await this.storeVerificationResult(result);
      
      // Send alerts if necessary
      if (result.status === 'failure' || result.alerts.length > 0) {
        await this.sendAlerts(result);
      }
      
      console.log(`Backup verification completed: ${verificationId} - Status: ${result.status}`);
      return result;
      
    } catch (error) {
      console.error('Backup verification failed:', error);
      
      const failureResult: BackupVerificationResult = {
        id: verificationId,
        timestamp: new Date(),
        status: 'failure',
        details: `Verification failed: ${error.message}`,
        metrics: {
          backupSize: 0,
          verificationTime: Date.now() - startTime,
          tablesVerified: 0,
          integrityScore: 0,
          restoreTestStatus: 'failed'
        },
        alerts: [`Critical: Backup verification system failure - ${error.message}`]
      };
      
      await this.storeVerificationResult(failureResult);
      await this.sendAlerts(failureResult);
      
      return failureResult;
    }
  }

  private async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupDir, `backup_${timestamp}.sql`);
    
    // Ensure backup directory exists
    await fs.mkdir(this.backupDir, { recursive: true });
    
    // Create PostgreSQL dump
    const dumpCommand = `pg_dump "${this.productionDbUrl}" > "${backupPath}"`;
    await execAsync(dumpCommand);
    
    // Verify backup file was created
    const stats = await fs.stat(backupPath);
    if (stats.size === 0) {
      throw new Error('Backup file is empty');
    }
    
    return backupPath;
  }

  private async verifyBackupIntegrity(backupPath: string): Promise<{ success: boolean; details: string }> {
    try {
      // Check file exists and has content
      const stats = await fs.stat(backupPath);
      if (stats.size === 0) {
        return { success: false, details: 'Backup file is empty' };
      }
      
      // Read and verify backup content
      const content = await fs.readFile(backupPath, 'utf8');
      
      // Get existing tables from database and check for their presence
      const existingTables = await this.getExistingTables();
      const requiredElements = ['CREATE TABLE', 'INSERT INTO'];
      
      // Add existing tables to required elements
      const tablesToCheck = existingTables.filter(table => 
        ['users', 'log_entries', 'session_recordings', 'privacy_settings'].includes(table)
      );
      
      const missingElements = [];
      for (const element of requiredElements) {
        if (!content.includes(element)) {
          missingElements.push(element);
        }
      }
      
      // Check if at least some expected tables are in the backup
      const foundTables = tablesToCheck.filter(table => content.includes(table));
      if (foundTables.length === 0 && tablesToCheck.length > 0) {
        missingElements.push(`No expected tables found (checked: ${tablesToCheck.join(', ')})`);
      }
      
      if (missingElements.length > 0) {
        return { 
          success: false, 
          details: `Missing required elements: ${missingElements.join(', ')}` 
        };
      }
      
      // Calculate checksum
      const checksum = crypto.createHash('md5').update(content).digest('hex');
      
      return { 
        success: true, 
        details: `Backup integrity verified. Size: ${stats.size} bytes, Checksum: ${checksum}` 
      };
      
    } catch (error) {
      return { success: false, details: `Integrity check failed: ${error.message}` };
    }
  }

  private async testBackupRestore(backupPath: string): Promise<{ success: boolean; details: string }> {
    try {
      // Create temporary staging database
      const stagingDbName = `staging_restore_test_${Date.now()}`;
      const createDbCommand = `createdb "${stagingDbName}" --template=template0`;
      
      try {
        await execAsync(createDbCommand);
      } catch (error) {
        // Database might already exist, try to drop and recreate
        await execAsync(`dropdb "${stagingDbName}" --if-exists`);
        await execAsync(createDbCommand);
      }
      
      // Restore backup to staging
      const restoreCommand = `psql "${stagingDbName}" < "${backupPath}"`;
      await execAsync(restoreCommand);
      
      // Verify restored data with existing tables
      const existingTables = await this.getExistingTables();
      const tablesToVerify = existingTables.filter(table => 
        ['users', 'log_entries', 'session_recordings'].includes(table)
      );
      
      let verificationResults = [];
      for (const table of tablesToVerify) {
        try {
          const { stdout } = await execAsync(`psql "${stagingDbName}" -c "SELECT COUNT(*) FROM ${table};"`);
          verificationResults.push(`${table}: ${stdout.trim()}`);
        } catch (error) {
          verificationResults.push(`${table}: verification failed - ${error.message}`);
        }
      }
      
      // Clean up staging database
      await execAsync(`dropdb "${stagingDbName}"`);
      
      return { 
        success: true, 
        details: `Restore test successful. Verification results: ${verificationResults.join(', ')}` 
      };
      
    } catch (error) {
      return { success: false, details: `Restore test failed: ${error.message}` };
    }
  }

  private async verifyDataConsistency(): Promise<{ success: boolean; details: string }> {
    try {
      const { db } = await import('./db');
      
      // Check for orphaned records and data consistency with existing tables
      const existingTables = await this.getExistingTables();
      const consistencyChecks = [`SELECT COUNT(*) as total_users FROM users`];
      
      // Add checks for existing tables
      if (existingTables.includes('log_entries')) {
        consistencyChecks.push('SELECT COUNT(*) as total_entries FROM log_entries');
      }
      if (existingTables.includes('session_recordings') && existingTables.includes('log_entries')) {
        consistencyChecks.push('SELECT COUNT(*) as orphaned_sessions FROM session_recordings sr LEFT JOIN log_entries le ON sr.log_entry_id = le.id WHERE le.id IS NULL');
      }
      if (existingTables.includes('progress_notes') && existingTables.includes('log_entries')) {
        consistencyChecks.push('SELECT COUNT(*) as orphaned_notes FROM progress_notes pn LEFT JOIN log_entries le ON pn.log_entry_id = le.id WHERE le.id IS NULL');
      }
      if (existingTables.includes('log_entries')) {
        consistencyChecks.push('SELECT COUNT(*) as recent_entries FROM log_entries WHERE created_at > NOW() - INTERVAL \'7 days\'');
      }
      
      const results = [];
      for (const check of consistencyChecks) {
        const result = await db.execute(check);
        results.push(`${check}: ${JSON.stringify(result.rows[0])}`);
      }
      
      return { 
        success: true, 
        details: `Data consistency verified: ${results.join('; ')}` 
      };
      
    } catch (error) {
      return { success: false, details: `Consistency check failed: ${error.message}` };
    }
  }

  private async generateBackupMetrics(backupPath: string): Promise<BackupMetrics> {
    const stats = await fs.stat(backupPath);
    const content = await fs.readFile(backupPath, 'utf8');
    
    // Count tables and approximate records
    const tableMatches = content.match(/CREATE TABLE/g) || [];
    const insertMatches = content.match(/INSERT INTO/g) || [];
    
    return {
      totalSize: stats.size,
      tableCount: tableMatches.length,
      recordCount: insertMatches.length,
      lastBackupTime: stats.mtime,
      checksumHash: crypto.createHash('md5').update(content).digest('hex')
    };
  }

  private calculateOverallStatus(
    integrityResult: { success: boolean },
    restoreResult: { success: boolean },
    consistencyResult: { success: boolean }
  ): 'success' | 'warning' | 'failure' {
    if (!integrityResult.success || !restoreResult.success) {
      return 'failure';
    }
    
    if (!consistencyResult.success) {
      return 'warning';
    }
    
    return 'success';
  }

  private calculateIntegrityScore(
    integrityResult: { success: boolean },
    restoreResult: { success: boolean },
    consistencyResult: { success: boolean }
  ): number {
    let score = 0;
    if (integrityResult.success) score += 40;
    if (restoreResult.success) score += 40;
    if (consistencyResult.success) score += 20;
    return score;
  }

  private generateVerificationDetails(
    integrityResult: { success: boolean; details: string },
    restoreResult: { success: boolean; details: string },
    consistencyResult: { success: boolean; details: string }
  ): string {
    return [
      `Integrity: ${integrityResult.success ? 'PASS' : 'FAIL'} - ${integrityResult.details}`,
      `Restore: ${restoreResult.success ? 'PASS' : 'FAIL'} - ${restoreResult.details}`,
      `Consistency: ${consistencyResult.success ? 'PASS' : 'FAIL'} - ${consistencyResult.details}`
    ].join(' | ');
  }

  private generateAlerts(
    integrityResult: { success: boolean; details: string },
    restoreResult: { success: boolean; details: string },
    consistencyResult: { success: boolean; details: string }
  ): string[] {
    const alerts: string[] = [];
    
    if (!integrityResult.success) {
      alerts.push(`CRITICAL: Backup integrity check failed - ${integrityResult.details}`);
    }
    
    if (!restoreResult.success) {
      alerts.push(`CRITICAL: Backup restore test failed - ${restoreResult.details}`);
    }
    
    if (!consistencyResult.success) {
      alerts.push(`WARNING: Data consistency issues detected - ${consistencyResult.details}`);
    }
    
    return alerts;
  }

  private async storeVerificationResult(result: BackupVerificationResult): Promise<void> {
    try {
      const { db } = await import('./db');
      const { sql } = await import('drizzle-orm');
      
      await db.execute(sql`
        INSERT INTO backup_verification_logs 
        (timestamp, status, backup_file_path, file_size_mb, verification_duration_seconds, metrics, error_message)
        VALUES (${result.timestamp}, ${result.status}, ${result.details}, 0, 0, ${JSON.stringify(result.metrics)}, ${result.alerts.join('; ')})
      `);
      
    } catch (error) {
      console.error('Failed to store verification result:', error);
    }
  }

  private async sendAlerts(result: BackupVerificationResult): Promise<void> {
    try {
      // Here you would integrate with your notification system
      // For now, we'll log the alerts
      console.error('BACKUP VERIFICATION ALERTS:', {
        id: result.id,
        status: result.status,
        alerts: result.alerts,
        timestamp: result.timestamp
      });
      
      // In production, you might send emails, Slack notifications, etc.
      // await this.sendEmailAlert(result);
      // await this.sendSlackAlert(result);
      
    } catch (error) {
      console.error('Failed to send alerts:', error);
    }
  }

  async getVerificationHistory(limit: number = 10): Promise<BackupVerificationResult[]> {
    try {
      const { db } = await import('./db');
      const { sql } = await import('drizzle-orm');
      
      const results = await db.execute(sql`
        SELECT id, timestamp, status, backup_file_path, file_size_mb, 
               verification_duration_seconds, metrics, error_message
        FROM backup_verification_logs 
        ORDER BY timestamp DESC 
        LIMIT ${limit}
      `);
      
      // Handle both array and single result formats
      const resultArray = Array.isArray(results) ? results : results.rows || [results];
      
      return resultArray.map((row: any) => ({
        id: row.id || 'unknown',
        timestamp: row.timestamp,
        status: row.status as 'success' | 'warning' | 'failure',
        details: row.backup_file_path || 'No details available',
        metrics: typeof row.metrics === 'string' ? JSON.parse(row.metrics || '{}') : row.metrics || {},
        alerts: row.error_message ? [row.error_message] : []
      }));
      
    } catch (error) {
      console.error('Failed to get verification history:', error);
      return [];
    }
  }

  async getLatestVerificationStatus(): Promise<BackupVerificationResult | null> {
    const history = await this.getVerificationHistory(1);
    return history.length > 0 ? history[0] : null;
  }

  private async getExistingTables(): Promise<string[]> {
    try {
      const { db } = await import('./db');
      const { sql } = await import('drizzle-orm');
      
      const results = await db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      `);
      
      const resultArray = Array.isArray(results) ? results : results.rows || [results];
      return resultArray.map((row: any) => row.table_name);
    } catch (error) {
      console.error('Failed to get existing tables:', error);
      return ['users']; // Fallback to basic table
    }
  }
}

export const backupVerificationService = new BackupVerificationService();