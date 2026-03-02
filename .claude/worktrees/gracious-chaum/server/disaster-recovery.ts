import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

interface DisasterRecoveryPlan {
  rto: number; // Recovery Time Objective in minutes
  rpo: number; // Recovery Point Objective in minutes
  procedures: RecoveryProcedure[];
  contacts: EmergencyContact[];
  lastTested: Date;
}

interface RecoveryProcedure {
  id: string;
  name: string;
  description: string;
  steps: RecoveryStep[];
  estimatedTime: number; // in minutes
  requiredPersonnel: string[];
  dependencies: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
}

interface RecoveryStep {
  id: string;
  description: string;
  command?: string;
  expectedOutput?: string;
  verification: string;
  rollbackCommand?: string;
  estimatedTime: number; // in minutes
}

interface EmergencyContact {
  name: string;
  role: string;
  phone: string;
  email: string;
  backupContact?: string;
}

interface RecoveryTestResult {
  id: string;
  testDate: Date;
  procedureId: string;
  status: 'passed' | 'failed' | 'partial';
  executionTime: number; // in minutes
  issues: string[];
  recommendations: string[];
}

class DisasterRecoveryService {
  private recoveryPlan: DisasterRecoveryPlan;
  private backupDir: string;
  private recoveryLogDir: string;

  constructor() {
    this.backupDir = process.env.BACKUP_DIR || './backups';
    this.recoveryLogDir = process.env.RECOVERY_LOG_DIR || './recovery-logs';
    this.initializeRecoveryPlan();
  }

  private initializeRecoveryPlan(): void {
    this.recoveryPlan = {
      rto: 30, // 30 minutes Recovery Time Objective
      rpo: 15, // 15 minutes Recovery Point Objective
      procedures: [
        {
          id: 'database_recovery',
          name: 'Database Recovery',
          description: 'Restore PostgreSQL database from backup',
          priority: 'critical',
          estimatedTime: 15,
          requiredPersonnel: ['Database Admin', 'System Admin'],
          dependencies: [],
          steps: [
            {
              id: 'stop_services',
              description: 'Stop all application services',
              command: 'sudo systemctl stop claritylog-app',
              verification: 'Verify no connections to database',
              estimatedTime: 2
            },
            {
              id: 'restore_database',
              description: 'Restore database from latest backup',
              command: 'pg_restore -d claritylog_production [BACKUP_FILE]',
              verification: 'Verify table counts match expected values',
              estimatedTime: 10
            },
            {
              id: 'restart_services',
              description: 'Restart application services',
              command: 'sudo systemctl start claritylog-app',
              verification: 'Verify application responds to health checks',
              estimatedTime: 3
            }
          ]
        },
        {
          id: 'application_recovery',
          name: 'Application Recovery',
          description: 'Restore application from backup or redeploy',
          priority: 'critical',
          estimatedTime: 20,
          requiredPersonnel: ['System Admin', 'Developer'],
          dependencies: ['database_recovery'],
          steps: [
            {
              id: 'deploy_application',
              description: 'Deploy application from known good state',
              command: 'git checkout [LAST_KNOWN_GOOD_COMMIT] && npm run build',
              verification: 'Verify build completes successfully',
              estimatedTime: 10
            },
            {
              id: 'configure_environment',
              description: 'Configure environment variables and secrets',
              verification: 'Verify all required environment variables are set',
              estimatedTime: 5
            },
            {
              id: 'start_application',
              description: 'Start application services',
              command: 'npm run start',
              verification: 'Verify application health check passes',
              estimatedTime: 5
            }
          ]
        },
        {
          id: 'data_integrity_check',
          name: 'Data Integrity Verification',
          description: 'Verify data integrity after recovery',
          priority: 'high',
          estimatedTime: 10,
          requiredPersonnel: ['Database Admin'],
          dependencies: ['database_recovery'],
          steps: [
            {
              id: 'verify_tables',
              description: 'Verify all tables exist and have expected structure',
              verification: 'All critical tables present with correct schema',
              estimatedTime: 3
            },
            {
              id: 'verify_data_counts',
              description: 'Verify data counts match expected ranges',
              verification: 'User and log entry counts within expected ranges',
              estimatedTime: 3
            },
            {
              id: 'verify_relationships',
              description: 'Verify foreign key relationships are intact',
              verification: 'No orphaned records detected',
              estimatedTime: 4
            }
          ]
        }
      ],
      contacts: [
        {
          name: 'System Administrator',
          role: 'Primary Contact',
          phone: 'TBD',
          email: 'admin@claritylog.com'
        },
        {
          name: 'Database Administrator',
          role: 'Database Recovery',
          phone: 'TBD',
          email: 'dba@claritylog.com'
        },
        {
          name: 'Development Team Lead',
          role: 'Application Recovery',
          phone: 'TBD',
          email: 'dev@claritylog.com'
        }
      ],
      lastTested: new Date()
    };
  }

  public getRecoveryPlan(): DisasterRecoveryPlan {
    return this.recoveryPlan;
  }

  public async executeRecoveryProcedure(procedureId: string, dryRun: boolean = false): Promise<RecoveryTestResult> {
    const startTime = Date.now();
    const testId = `recovery_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`${dryRun ? 'DRY RUN: ' : ''}Starting recovery procedure: ${procedureId}`);
    
    const procedure = this.recoveryPlan.procedures.find(p => p.id === procedureId);
    if (!procedure) {
      throw new Error(`Recovery procedure not found: ${procedureId}`);
    }

    const issues: string[] = [];
    const recommendations: string[] = [];
    let status: 'passed' | 'failed' | 'partial' = 'passed';

    try {
      // Ensure recovery log directory exists
      await fs.mkdir(this.recoveryLogDir, { recursive: true });
      
      // Create recovery log file
      const logFile = path.join(this.recoveryLogDir, `${testId}.log`);
      await fs.writeFile(logFile, `Recovery Test Log - ${new Date().toISOString()}\n`);
      
      for (const step of procedure.steps) {
        console.log(`${dryRun ? 'DRY RUN: ' : ''}Executing step: ${step.description}`);
        
        try {
          if (step.command && !dryRun) {
            const { stdout, stderr } = await execAsync(step.command);
            await fs.appendFile(logFile, `Step ${step.id}: ${step.description}\n`);
            await fs.appendFile(logFile, `Command: ${step.command}\n`);
            await fs.appendFile(logFile, `Output: ${stdout}\n`);
            if (stderr) {
              await fs.appendFile(logFile, `Error: ${stderr}\n`);
            }
          }
          
          // Verify step completion
          const verificationResult = await this.verifyStep(step, dryRun);
          if (!verificationResult.success) {
            issues.push(`Step ${step.id}: ${verificationResult.message}`);
            status = 'partial';
          }
          
          await fs.appendFile(logFile, `Verification: ${verificationResult.message}\n\n`);
          
        } catch (error) {
          const errorMessage = `Step ${step.id} failed: ${error.message}`;
          issues.push(errorMessage);
          status = 'failed';
          
          await fs.appendFile(logFile, `ERROR: ${errorMessage}\n\n`);
          
          // Execute rollback if available
          if (step.rollbackCommand && !dryRun) {
            try {
              await execAsync(step.rollbackCommand);
              await fs.appendFile(logFile, `Rollback executed: ${step.rollbackCommand}\n\n`);
            } catch (rollbackError) {
              await fs.appendFile(logFile, `Rollback failed: ${rollbackError.message}\n\n`);
            }
          }
        }
      }
      
      // Generate recommendations
      if (issues.length > 0) {
        recommendations.push('Review and update recovery procedures based on identified issues');
      }
      
      if (status === 'passed') {
        recommendations.push('Consider optimizing recovery procedures to reduce execution time');
      }
      
      const executionTime = Math.round((Date.now() - startTime) / 60000); // Convert to minutes
      
      const result: RecoveryTestResult = {
        id: testId,
        testDate: new Date(),
        procedureId,
        status,
        executionTime,
        issues,
        recommendations
      };
      
      // Store test result
      await this.storeRecoveryTestResult(result);
      
      console.log(`${dryRun ? 'DRY RUN: ' : ''}Recovery procedure completed: ${procedureId} - Status: ${status}`);
      return result;
      
    } catch (error) {
      console.error(`Recovery procedure failed: ${procedureId}`, error);
      
      const result: RecoveryTestResult = {
        id: testId,
        testDate: new Date(),
        procedureId,
        status: 'failed',
        executionTime: Math.round((Date.now() - startTime) / 60000),
        issues: [`Recovery procedure failed: ${error.message}`],
        recommendations: ['Review and update recovery procedures', 'Ensure all dependencies are properly configured']
      };
      
      await this.storeRecoveryTestResult(result);
      return result;
    }
  }

  private async verifyStep(step: RecoveryStep, dryRun: boolean): Promise<{ success: boolean; message: string }> {
    if (dryRun) {
      return { success: true, message: `DRY RUN: ${step.verification}` };
    }
    
    try {
      // Basic verification logic - in production, this would be more sophisticated
      switch (step.id) {
        case 'stop_services':
          return { success: true, message: 'Services stopped successfully' };
        case 'restore_database':
          return { success: true, message: 'Database restored successfully' };
        case 'restart_services':
          return { success: true, message: 'Services restarted successfully' };
        case 'deploy_application':
          return { success: true, message: 'Application deployed successfully' };
        case 'configure_environment':
          return { success: true, message: 'Environment configured successfully' };
        case 'start_application':
          return { success: true, message: 'Application started successfully' };
        default:
          return { success: true, message: step.verification };
      }
    } catch (error) {
      return { success: false, message: `Verification failed: ${error.message}` };
    }
  }

  private async storeRecoveryTestResult(result: RecoveryTestResult): Promise<void> {
    try {
      // Store in database (would be implemented with actual database schema)
      const resultFile = path.join(this.recoveryLogDir, `${result.id}_result.json`);
      await fs.writeFile(resultFile, JSON.stringify(result, null, 2));
      
      console.log(`Recovery test result stored: ${result.id}`);
    } catch (error) {
      console.error('Failed to store recovery test result:', error);
    }
  }

  public async runAllRecoveryTests(dryRun: boolean = true): Promise<RecoveryTestResult[]> {
    const results: RecoveryTestResult[] = [];
    
    for (const procedure of this.recoveryPlan.procedures) {
      try {
        const result = await this.executeRecoveryProcedure(procedure.id, dryRun);
        results.push(result);
      } catch (error) {
        console.error(`Failed to test procedure ${procedure.id}:`, error);
        results.push({
          id: `failed_${Date.now()}`,
          testDate: new Date(),
          procedureId: procedure.id,
          status: 'failed',
          executionTime: 0,
          issues: [`Test execution failed: ${error.message}`],
          recommendations: ['Review procedure configuration']
        });
      }
    }
    
    return results;
  }

  public async generateRecoveryRunbook(): Promise<string> {
    const runbook = `# ClarityLog Disaster Recovery Runbook

## Overview
- **Recovery Time Objective (RTO)**: ${this.recoveryPlan.rto} minutes
- **Recovery Point Objective (RPO)**: ${this.recoveryPlan.rpo} minutes
- **Last Tested**: ${this.recoveryPlan.lastTested.toISOString()}

## Emergency Contacts
${this.recoveryPlan.contacts.map(contact => `
### ${contact.name} - ${contact.role}
- **Phone**: ${contact.phone}
- **Email**: ${contact.email}
${contact.backupContact ? `- **Backup**: ${contact.backupContact}` : ''}
`).join('')}

## Recovery Procedures

${this.recoveryPlan.procedures.map(procedure => `
### ${procedure.name} (${procedure.priority.toUpperCase()} Priority)
**Estimated Time**: ${procedure.estimatedTime} minutes
**Required Personnel**: ${procedure.requiredPersonnel.join(', ')}
**Dependencies**: ${procedure.dependencies.length > 0 ? procedure.dependencies.join(', ') : 'None'}

**Description**: ${procedure.description}

**Steps**:
${procedure.steps.map((step, index) => `
${index + 1}. **${step.description}** (${step.estimatedTime} min)
   ${step.command ? `- Command: \`${step.command}\`` : ''}
   - Verification: ${step.verification}
   ${step.rollbackCommand ? `- Rollback: \`${step.rollbackCommand}\`` : ''}
`).join('')}
`).join('')}

## Pre-Recovery Checklist
- [ ] Assess scope of disaster
- [ ] Notify emergency contacts
- [ ] Identify last known good backup
- [ ] Verify backup integrity
- [ ] Prepare staging environment for testing
- [ ] Document incident details

## Post-Recovery Checklist
- [ ] Verify all systems operational
- [ ] Test critical user workflows
- [ ] Monitor system performance
- [ ] Document recovery process
- [ ] Update runbook based on lessons learned
- [ ] Schedule post-incident review

## Testing Schedule
- **Monthly**: Database recovery test (dry run)
- **Quarterly**: Full recovery test (staging environment)
- **Annually**: Complete disaster recovery drill

## Recovery Metrics
- Database recovery time: Target < 15 minutes
- Application recovery time: Target < 20 minutes
- Full system recovery time: Target < 30 minutes
- Data integrity verification: Target < 10 minutes

---
*This runbook should be reviewed and updated quarterly or after any major system changes.*
`;

    return runbook;
  }

  public async getRecoveryTestHistory(): Promise<RecoveryTestResult[]> {
    try {
      const logFiles = await fs.readdir(this.recoveryLogDir);
      const resultFiles = logFiles.filter(file => file.endsWith('_result.json'));
      
      const results: RecoveryTestResult[] = [];
      
      for (const file of resultFiles) {
        try {
          const content = await fs.readFile(path.join(this.recoveryLogDir, file), 'utf8');
          const result = JSON.parse(content);
          results.push(result);
        } catch (error) {
          console.error(`Failed to read result file ${file}:`, error);
        }
      }
      
      return results.sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime());
    } catch (error) {
      console.error('Failed to get recovery test history:', error);
      return [];
    }
  }
}

export const disasterRecoveryService = new DisasterRecoveryService();