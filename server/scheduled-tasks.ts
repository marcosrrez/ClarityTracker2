import { backupVerificationService } from './backup-verification';
import { disasterRecoveryService } from './disaster-recovery';
import { rateLimitingService } from './rate-limiting';

class ScheduledTaskService {
  private intervals: NodeJS.Timeout[] = [];

  public startScheduledTasks(): void {
    console.log('Starting scheduled tasks...');
    
    // Daily backup verification at 2 AM
    this.scheduleDaily('02:00', async () => {
      console.log('Running daily backup verification...');
      try {
        const result = await backupVerificationService.runDailyVerification();
        console.log('Daily backup verification completed:', result.status);
      } catch (error) {
        console.error('Daily backup verification failed:', error);
      }
    });

    // Weekly recovery test (dry run) on Sundays at 3 AM
    this.scheduleWeekly(0, '03:00', async () => {
      console.log('Running weekly recovery test (dry run)...');
      try {
        const results = await disasterRecoveryService.runAllRecoveryTests(true);
        const failedTests = results.filter(r => r.status === 'failed');
        if (failedTests.length > 0) {
          console.error('Weekly recovery test failures:', failedTests);
        } else {
          console.log('Weekly recovery test completed successfully');
        }
      } catch (error) {
        console.error('Weekly recovery test failed:', error);
      }
    });

    // Monthly rate limit log cleanup on the 1st at 4 AM
    this.scheduleMonthly(1, '04:00', async () => {
      console.log('Running monthly rate limit log cleanup...');
      try {
        const result = await rateLimitingService.cleanupOldLogs(30);
        console.log('Monthly cleanup completed:', result.deletedCount, 'logs deleted');
      } catch (error) {
        console.error('Monthly cleanup failed:', error);
      }
    });

    // Hourly system health check
    this.scheduleHourly(async () => {
      console.log('Running hourly system health check...');
      try {
        // This would include basic health checks
        const backupStatus = await backupVerificationService.getLatestVerificationStatus();
        const rateLimitStats = await rateLimitingService.getRateLimitStats('1h');
        
        // Log warnings if health issues detected
        if (backupStatus && backupStatus.status === 'failure') {
          console.error('HEALTH ALERT: Backup verification failures detected');
        }
        
        if (rateLimitStats && rateLimitStats.rateLimitedPercentage > 20) {
          console.warn('HEALTH ALERT: High rate limiting detected:', rateLimitStats.rateLimitedPercentage + '%');
        }
      } catch (error) {
        console.error('Hourly health check failed:', error);
      }
    });

    // Geographic redundancy monitoring every 5 minutes
    this.scheduleMinutes(5, async () => {
      console.log('Running geographic redundancy monitoring...');
      try {
        const { geographicRedundancyService } = await import('./geographic-redundancy');
        const health = await geographicRedundancyService.monitorRegionalHealth();
        
        // Check for failed regions
        const failedRegions = health.filter(region => region.status === 'failed');
        if (failedRegions.length > 0) {
          console.log('GEOGRAPHIC REDUNDANCY ALERT: Failed regions:', failedRegions.map(r => r.name));
          
          // Auto-failover for primary region failures
          const primaryFailed = failedRegions.find(r => r.primary);
          if (primaryFailed) {
            console.log('PRIMARY REGION FAILED - Initiating automatic failover...');
            const result = await geographicRedundancyService.performAutomaticFailover(primaryFailed.code);
            console.log('Failover result:', result);
          }
        }
        
        // Check replication status
        const replicationStatus = await geographicRedundancyService.getReplicationStatus();
        const laggedReplications = replicationStatus.filter(r => r.status === 'lagging');
        if (laggedReplications.length > 0) {
          console.log('REPLICATION LAG ALERT:', laggedReplications.map(r => `${r.region}: ${r.lag}ms`));
        }
        
      } catch (error) {
        console.error('Geographic monitoring failed:', error);
      }
    });

    // Cross-region backup sync every 15 minutes
    this.scheduleMinutes(15, async () => {
      console.log('Running cross-region backup sync...');
      try {
        const { geographicRedundancyService } = await import('./geographic-redundancy');
        const result = await geographicRedundancyService.synchronizeBackups();
        
        if (!result.success) {
          console.log('BACKUP SYNC ALERT: Cross-region sync failed:', result.errors);
        } else {
          console.log(`Backup sync completed: ${result.syncedFiles} files, ${(result.totalSize / 1024 / 1024).toFixed(2)} MB`);
        }
      } catch (error) {
        console.error('Cross-region backup sync failed:', error);
      }
    });

    // Compliance monitoring every 30 minutes
    this.scheduleMinutes(30, async () => {
      console.log('Running compliance monitoring...');
      try {
        const { geographicRedundancyService } = await import('./geographic-redundancy');
        const compliance = await geographicRedundancyService.validateDataResidency();
        
        if (!compliance.compliant) {
          console.log('COMPLIANCE VIOLATION ALERT:', compliance.violations);
          
          // Execute compliance violation runbook
          const { disasterRecoveryRunbooks } = await import('./disaster-recovery-runbooks');
          const execution = await disasterRecoveryRunbooks.executeRunbook('compliance-violation');
          console.log('Compliance runbook execution:', execution.status);
        }
      } catch (error) {
        console.error('Compliance monitoring failed:', error);
      }
    });

    console.log('Scheduled tasks started successfully');
  }

  public stopScheduledTasks(): void {
    console.log('Stopping scheduled tasks...');
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    console.log('Scheduled tasks stopped');
  }

  private scheduleDaily(time: string, task: () => Promise<void>): void {
    const [hours, minutes] = time.split(':').map(Number);
    
    const scheduleNext = () => {
      const now = new Date();
      const scheduledTime = new Date(now);
      scheduledTime.setHours(hours, minutes, 0, 0);
      
      // If the scheduled time has passed today, schedule for tomorrow
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }
      
      const msUntilScheduled = scheduledTime.getTime() - now.getTime();
      
      const timeout = setTimeout(async () => {
        await task();
        scheduleNext(); // Schedule the next occurrence
      }, msUntilScheduled);
      
      this.intervals.push(timeout);
    };
    
    scheduleNext();
  }

  private scheduleWeekly(dayOfWeek: number, time: string, task: () => Promise<void>): void {
    const [hours, minutes] = time.split(':').map(Number);
    
    const scheduleNext = () => {
      const now = new Date();
      const scheduledTime = new Date(now);
      scheduledTime.setHours(hours, minutes, 0, 0);
      
      // Calculate days until the desired day of week
      const daysUntil = (dayOfWeek - now.getDay() + 7) % 7;
      if (daysUntil === 0 && scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 7);
      } else {
        scheduledTime.setDate(scheduledTime.getDate() + daysUntil);
      }
      
      const msUntilScheduled = scheduledTime.getTime() - now.getTime();
      
      const timeout = setTimeout(async () => {
        await task();
        scheduleNext(); // Schedule the next occurrence
      }, msUntilScheduled);
      
      this.intervals.push(timeout);
    };
    
    scheduleNext();
  }

  private scheduleMonthly(dayOfMonth: number, time: string, task: () => Promise<void>): void {
    const [hours, minutes] = time.split(':').map(Number);
    
    const scheduleNext = () => {
      const now = new Date();
      const scheduledTime = new Date(now);
      scheduledTime.setDate(dayOfMonth);
      scheduledTime.setHours(hours, minutes, 0, 0);
      
      // If the scheduled time has passed this month, schedule for next month
      if (scheduledTime <= now) {
        scheduledTime.setMonth(scheduledTime.getMonth() + 1);
      }
      
      const msUntilScheduled = scheduledTime.getTime() - now.getTime();
      
      const timeout = setTimeout(async () => {
        await task();
        scheduleNext(); // Schedule the next occurrence
      }, msUntilScheduled);
      
      this.intervals.push(timeout);
    };
    
    scheduleNext();
  }

  private scheduleHourly(task: () => Promise<void>): void {
    // Run immediately, then every hour
    task().catch(error => console.error('Initial hourly task failed:', error));
    
    const interval = setInterval(async () => {
      try {
        await task();
      } catch (error) {
        console.error('Hourly task failed:', error);
      }
    }, 60 * 60 * 1000); // 1 hour
    
    this.intervals.push(interval);
  }

  private scheduleMinutes(minutes: number, task: () => Promise<void>): void {
    // Run immediately, then every N minutes
    task().catch(error => console.error(`Initial ${minutes}-minute task failed:`, error));
    
    const interval = setInterval(async () => {
      try {
        await task();
      } catch (error) {
        console.error(`${minutes}-minute task failed:`, error);
      }
    }, minutes * 60 * 1000);
    
    this.intervals.push(interval);
  }
}

export const scheduledTaskService = new ScheduledTaskService();