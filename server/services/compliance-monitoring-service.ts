import type { ComplianceMonitoring, LogEntry, UserProfile } from '../../shared/schema';
import { StateRequirementsEngine } from './state-requirements-engine';

interface ComplianceAlert {
  id: string;
  type: 'warning' | 'overdue' | 'reminder' | 'violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  dueDate?: Date;
  actionRequired: string;
  autoResolvable: boolean;
}

interface ComplianceStatus {
  requirementType: string;
  status: 'compliant' | 'warning' | 'overdue';
  currentAmount: number;
  requiredAmount: number;
  percentageComplete: number;
  daysUntilDue?: number;
  lastUpdate: Date;
}

export class ComplianceMonitoringService {
  
  /**
   * Monitor all compliance requirements for a user
   */
  static async monitorCompliance(
    userId: string,
    userProfile: UserProfile,
    logEntries: LogEntry[]
  ): Promise<ComplianceMonitoring[]> {
    const requirements = StateRequirementsEngine.getRequirements(
      userProfile.stateRegion,
      'LPC' // Default license type
    );
    
    if (!requirements) {
      return [];
    }

    const currentHours = this.calculateCurrentHours(logEntries);
    const monitoring: ComplianceMonitoring[] = [];

    // Monitor CCH requirements
    monitoring.push(
      this.createCCHMonitoring(userId, currentHours.total, requirements.totalCCH),
      this.createDirectCCHMonitoring(userId, currentHours.direct, requirements.directCCH),
      this.createSupervisionMonitoring(userId, currentHours.supervision, requirements.supervisionHours),
      this.createEthicsMonitoring(userId, currentHours.ethics, requirements.ethicsHours)
    );

    // Add state-specific monitoring
    const stateSpecific = this.createStateSpecificMonitoring(
      userId, 
      userProfile.stateRegion, 
      currentHours, 
      logEntries
    );
    monitoring.push(...stateSpecific);

    return monitoring;
  }

  /**
   * Generate compliance alerts based on current status
   */
  static async generateAlerts(
    userId: string,
    userProfile: UserProfile,
    complianceData: ComplianceMonitoring[]
  ): Promise<ComplianceAlert[]> {
    const alerts: ComplianceAlert[] = [];

    for (const compliance of complianceData) {
      const alertsForRequirement = this.checkRequirementAlerts(compliance, userProfile);
      alerts.push(...alertsForRequirement);
    }

    // Add cross-requirement alerts
    const crossRequirementAlerts = this.checkCrossRequirementCompliance(complianceData, userProfile);
    alerts.push(...crossRequirementAlerts);

    return alerts.sort((a, b) => this.getAlertPriority(b) - this.getAlertPriority(a));
  }

  /**
   * Get compliance status summary
   */
  static getComplianceStatus(complianceData: ComplianceMonitoring[]): ComplianceStatus[] {
    return complianceData.map(compliance => ({
      requirementType: compliance.requirementType,
      status: compliance.currentStatus,
      currentAmount: compliance.completedAmount,
      requiredAmount: compliance.requiredAmount,
      percentageComplete: (compliance.completedAmount / compliance.requiredAmount) * 100,
      daysUntilDue: compliance.dueDate ? 
        Math.ceil((compliance.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 
        undefined,
      lastUpdate: compliance.updatedAt,
    }));
  }

  /**
   * Calculate current hours from log entries
   */
  private static calculateCurrentHours(logEntries: LogEntry[]) {
    return logEntries.reduce((totals, entry) => {
      return {
        total: totals.total + entry.clientContactHours,
        direct: totals.direct + (entry.indirectHours ? 0 : entry.clientContactHours),
        supervision: totals.supervision + entry.supervisionHours,
        ethics: totals.ethics + (entry.professionalDevelopmentType === 'ethics' ? entry.professionalDevelopmentHours : 0),
      };
    }, { total: 0, direct: 0, supervision: 0, ethics: 0 });
  }

  /**
   * Create CCH monitoring record
   */
  private static createCCHMonitoring(
    userId: string,
    currentHours: number,
    requiredHours: number
  ): ComplianceMonitoring {
    const percentage = currentHours / requiredHours;
    let status: 'compliant' | 'warning' | 'overdue' = 'compliant';
    
    if (percentage < 0.5) {
      status = 'warning';
    }
    
    return {
      id: crypto.randomUUID(),
      userId,
      requirementType: 'total_cch',
      currentStatus: status,
      completedAmount: currentHours,
      requiredAmount: requiredHours,
      autoAlerts: true,
      alertFrequency: 'weekly',
      notes: `Total client contact hours progress: ${Math.round(percentage * 100)}%`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Create direct CCH monitoring record
   */
  private static createDirectCCHMonitoring(
    userId: string,
    currentHours: number,
    requiredHours: number
  ): ComplianceMonitoring {
    const percentage = currentHours / requiredHours;
    let status: 'compliant' | 'warning' | 'overdue' = 'compliant';
    
    if (percentage < 0.6) {
      status = 'warning';
    }
    
    return {
      id: crypto.randomUUID(),
      userId,
      requirementType: 'direct_cch',
      currentStatus: status,
      completedAmount: currentHours,
      requiredAmount: requiredHours,
      autoAlerts: true,
      alertFrequency: 'weekly',
      notes: `Direct client contact hours progress: ${Math.round(percentage * 100)}%`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Create supervision monitoring record
   */
  private static createSupervisionMonitoring(
    userId: string,
    currentHours: number,
    requiredHours: number
  ): ComplianceMonitoring {
    const percentage = currentHours / requiredHours;
    let status: 'compliant' | 'warning' | 'overdue' = 'compliant';
    
    if (percentage < 0.8) {
      status = 'warning';
    }
    
    return {
      id: crypto.randomUUID(),
      userId,
      requirementType: 'supervision_hours',
      currentStatus: status,
      completedAmount: currentHours,
      requiredAmount: requiredHours,
      autoAlerts: true,
      alertFrequency: 'weekly',
      notes: `Supervision hours progress: ${Math.round(percentage * 100)}%`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Create ethics monitoring record
   */
  private static createEthicsMonitoring(
    userId: string,
    currentHours: number,
    requiredHours: number
  ): ComplianceMonitoring {
    const percentage = currentHours / requiredHours;
    let status: 'compliant' | 'warning' | 'overdue' = 'compliant';
    
    if (currentHours < requiredHours) {
      status = 'warning';
    }
    
    return {
      id: crypto.randomUUID(),
      userId,
      requirementType: 'ethics_hours',
      currentStatus: status,
      completedAmount: currentHours,
      requiredAmount: requiredHours,
      autoAlerts: true,
      alertFrequency: 'monthly',
      notes: `Ethics training progress: ${Math.round(percentage * 100)}%`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Create state-specific monitoring records
   */
  private static createStateSpecificMonitoring(
    userId: string,
    state: string,
    currentHours: any,
    logEntries: LogEntry[]
  ): ComplianceMonitoring[] {
    const stateMonitoring: ComplianceMonitoring[] = [];

    switch (state) {
      case 'Texas':
        // Texas requires specific supervision ratio
        const txSupervisionRatio = currentHours.supervision / Math.max(1, currentHours.total);
        const txRequiredRatio = 0.05; // 1:20 ratio
        
        stateMonitoring.push({
          id: crypto.randomUUID(),
          userId,
          requirementType: 'tx_supervision_ratio',
          currentStatus: txSupervisionRatio >= txRequiredRatio ? 'compliant' : 'warning',
          completedAmount: txSupervisionRatio * 100,
          requiredAmount: txRequiredRatio * 100,
          autoAlerts: true,
          alertFrequency: 'weekly',
          notes: `Texas supervision ratio: ${Math.round(txSupervisionRatio * 100 * 100) / 100}%`,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        break;

      case 'California':
        // California requires weekly supervision for first year
        const recentSupervision = this.getRecentSupervisionFrequency(logEntries, 12); // Last 12 weeks
        
        stateMonitoring.push({
          id: crypto.randomUUID(),
          userId,
          requirementType: 'ca_weekly_supervision',
          currentStatus: recentSupervision >= 0.8 ? 'compliant' : 'warning',
          completedAmount: recentSupervision * 100,
          requiredAmount: 100,
          autoAlerts: true,
          alertFrequency: 'weekly',
          notes: `California weekly supervision compliance: ${Math.round(recentSupervision * 100)}%`,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        break;

      case 'Florida':
        // Florida has specific CE requirements during supervision period
        const flCEHours = this.calculateContinuingEducation(logEntries);
        
        stateMonitoring.push({
          id: crypto.randomUUID(),
          userId,
          requirementType: 'fl_continuing_education',
          currentStatus: flCEHours >= 30 ? 'compliant' : 'warning',
          completedAmount: flCEHours,
          requiredAmount: 30,
          autoAlerts: true,
          alertFrequency: 'monthly',
          notes: `Florida CE hours during supervision: ${flCEHours}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        break;
    }

    return stateMonitoring;
  }

  /**
   * Check for alerts on individual requirements
   */
  private static checkRequirementAlerts(
    compliance: ComplianceMonitoring,
    userProfile: UserProfile
  ): ComplianceAlert[] {
    const alerts: ComplianceAlert[] = [];
    const percentage = (compliance.completedAmount / compliance.requiredAmount) * 100;

    // Critical alerts
    if (compliance.currentStatus === 'overdue') {
      alerts.push({
        id: crypto.randomUUID(),
        type: 'overdue',
        severity: 'critical',
        title: `${compliance.requirementType.replace('_', ' ').toUpperCase()} Overdue`,
        message: `Your ${compliance.requirementType} requirement is overdue and requires immediate attention.`,
        actionRequired: 'Complete requirement immediately to maintain compliance',
        autoResolvable: false,
      });
    }

    // Warning alerts
    if (compliance.currentStatus === 'warning') {
      let severity: 'low' | 'medium' | 'high' = 'medium';
      let message = '';
      
      if (percentage < 25) {
        severity = 'high';
        message = `You're significantly behind on ${compliance.requirementType}. Immediate action recommended.`;
      } else if (percentage < 50) {
        severity = 'medium';
        message = `You're behind schedule on ${compliance.requirementType}. Consider increasing your pace.`;
      } else {
        severity = 'low';
        message = `Monitor your progress on ${compliance.requirementType} to stay on track.`;
      }

      alerts.push({
        id: crypto.randomUUID(),
        type: 'warning',
        severity,
        title: `${compliance.requirementType.replace('_', ' ').toUpperCase()} Behind Schedule`,
        message,
        actionRequired: this.getActionForRequirement(compliance.requirementType),
        autoResolvable: false,
      });
    }

    // Milestone reminders
    if (percentage >= 75 && percentage < 80) {
      alerts.push({
        id: crypto.randomUUID(),
        type: 'reminder',
        severity: 'low',
        title: `Almost There!`,
        message: `You're ${Math.round(percentage)}% complete with ${compliance.requirementType}. Keep up the great work!`,
        actionRequired: 'Continue current pace',
        autoResolvable: true,
      });
    }

    return alerts;
  }

  /**
   * Check cross-requirement compliance issues
   */
  private static checkCrossRequirementCompliance(
    complianceData: ComplianceMonitoring[],
    userProfile: UserProfile
  ): ComplianceAlert[] {
    const alerts: ComplianceAlert[] = [];

    // Find specific compliance records
    const totalCCH = complianceData.find(c => c.requirementType === 'total_cch');
    const supervision = complianceData.find(c => c.requirementType === 'supervision_hours');
    const ethics = complianceData.find(c => c.requirementType === 'ethics_hours');

    // Check supervision ratio
    if (totalCCH && supervision) {
      const ratio = supervision.completedAmount / Math.max(1, totalCCH.completedAmount);
      const requiredRatio = supervision.requiredAmount / totalCCH.requiredAmount;
      
      if (ratio < requiredRatio * 0.8) {
        alerts.push({
          id: crypto.randomUUID(),
          type: 'violation',
          severity: 'high',
          title: 'Supervision Ratio Below Requirements',
          message: 'Your supervision hours are not keeping pace with your client contact hours.',
          actionRequired: 'Schedule additional supervision sessions immediately',
          autoResolvable: false,
        });
      }
    }

    // Check ethics completion timing
    if (totalCCH && ethics && totalCCH.completedAmount > 2000 && ethics.completedAmount === 0) {
      alerts.push({
        id: crypto.randomUUID(),
        type: 'warning',
        severity: 'medium',
        title: 'Ethics Training Recommended',
        message: 'Consider completing ethics training early in your licensure journey.',
        actionRequired: 'Enroll in approved ethics training program',
        autoResolvable: false,
      });
    }

    return alerts;
  }

  /**
   * Get action recommendation for specific requirement type
   */
  private static getActionForRequirement(requirementType: string): string {
    const actions: Record<string, string> = {
      'total_cch': 'Increase weekly client contact sessions',
      'direct_cch': 'Focus on direct client contact rather than indirect hours',
      'supervision_hours': 'Schedule additional supervision sessions',
      'ethics_hours': 'Enroll in approved ethics training program',
      'tx_supervision_ratio': 'Schedule more frequent supervision sessions',
      'ca_weekly_supervision': 'Ensure weekly supervision sessions are maintained',
      'fl_continuing_education': 'Complete additional continuing education hours',
    };

    return actions[requirementType] || 'Review requirement details and take appropriate action';
  }

  /**
   * Calculate alert priority for sorting
   */
  private static getAlertPriority(alert: ComplianceAlert): number {
    const severityWeights = { critical: 100, high: 75, medium: 50, low: 25 };
    const typeWeights = { violation: 20, overdue: 15, warning: 10, reminder: 5 };
    
    return severityWeights[alert.severity] + typeWeights[alert.type];
  }

  /**
   * Get recent supervision frequency
   */
  private static getRecentSupervisionFrequency(logEntries: LogEntry[], weeks: number): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - (weeks * 7));
    
    const recentEntries = logEntries.filter(entry => 
      entry.dateOfContact >= cutoffDate && entry.supervisionHours > 0
    );
    
    // Count weeks with supervision
    const supervisionWeeks = new Set(
      recentEntries.map(entry => this.getWeekKey(entry.dateOfContact))
    );
    
    return supervisionWeeks.size / weeks;
  }

  /**
   * Calculate continuing education hours
   */
  private static calculateContinuingEducation(logEntries: LogEntry[]): number {
    return logEntries
      .filter(entry => 
        entry.professionalDevelopmentType !== 'none' && 
        entry.professionalDevelopmentType !== 'ethics'
      )
      .reduce((sum, entry) => sum + entry.professionalDevelopmentHours, 0);
  }

  /**
   * Get week key for grouping
   */
  private static getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const week = Math.floor((date.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
    return `${year}-W${week}`;
  }

  /**
   * Schedule automatic compliance checks
   */
  static scheduleComplianceCheck(userId: string, frequency: 'daily' | 'weekly' | 'monthly'): void {
    // This would integrate with a job scheduler in production
    console.log(`Scheduled ${frequency} compliance check for user ${userId}`);
  }

  /**
   * Send compliance notification
   */
  static async sendComplianceNotification(
    userId: string,
    alert: ComplianceAlert
  ): Promise<boolean> {
    // This would integrate with notification service (email, SMS, push)
    console.log(`Sending compliance notification to user ${userId}:`, alert.title);
    return true;
  }
}