/**
 * Feature Flag API for Zero-Disruption Deployment
 * Enables real-time feature flag management and rollback capabilities
 */

import { Request, Response } from 'express';

interface FeatureFlagState {
  enhancedAI: { enabled: boolean; rolloutPercentage: number };
  offlineSync: { enabled: boolean; rolloutPercentage: number };
  complianceValidation: { enabled: boolean; rolloutPercentage: number };
  advancedAnalytics: { enabled: boolean; rolloutPercentage: number };
  mobileEnhancements: { enabled: boolean; rolloutPercentage: number };
  enterpriseIntegration: { enabled: boolean; rolloutPercentage: number };
}

interface DeploymentMetrics {
  responseTime: number;
  errorRate: number;
  userComplaints: number;
  systemHealth: number;
  lastUpdate: Date;
}

class FeatureFlagManager {
  private static instance: FeatureFlagManager;
  private flags: FeatureFlagState;
  private metrics: DeploymentMetrics;
  private rollbackThresholds = {
    responseTime: 500, // ms
    errorRate: 1, // %
    userComplaints: 10, // per hour
    systemHealth: 90 // %
  };

  private constructor() {
    this.flags = {
      enhancedAI: { enabled: false, rolloutPercentage: 0 },
      offlineSync: { enabled: false, rolloutPercentage: 0 },
      complianceValidation: { enabled: false, rolloutPercentage: 0 },
      advancedAnalytics: { enabled: false, rolloutPercentage: 0 },
      mobileEnhancements: { enabled: false, rolloutPercentage: 0 },
      enterpriseIntegration: { enabled: false, rolloutPercentage: 0 }
    };

    this.metrics = {
      responseTime: 150, // Current baseline
      errorRate: 0.05, // Current baseline
      userComplaints: 0,
      systemHealth: 95,
      lastUpdate: new Date()
    };

    // Start monitoring
    this.startMonitoring();
  }

  public static getInstance(): FeatureFlagManager {
    if (!FeatureFlagManager.instance) {
      FeatureFlagManager.instance = new FeatureFlagManager();
    }
    return FeatureFlagManager.instance;
  }

  public getFlags(): FeatureFlagState {
    return { ...this.flags };
  }

  public updateFlag(flag: keyof FeatureFlagState, rolloutPercentage: number): void {
    this.flags[flag].rolloutPercentage = Math.max(0, Math.min(100, rolloutPercentage));
    this.flags[flag].enabled = rolloutPercentage > 0;
    
    console.log(`Feature flag ${flag} updated to ${rolloutPercentage}% rollout`);
  }

  public emergencyDisable(flag: keyof FeatureFlagState): void {
    this.flags[flag].enabled = false;
    this.flags[flag].rolloutPercentage = 0;
    console.log(`EMERGENCY DISABLE: Feature flag ${flag} disabled`);
  }

  public emergencyDisableAll(): void {
    Object.keys(this.flags).forEach(flag => {
      this.emergencyDisable(flag as keyof FeatureFlagState);
    });
    console.log('EMERGENCY DISABLE ALL: All feature flags disabled');
  }

  public updateMetrics(metrics: Partial<DeploymentMetrics>): void {
    this.metrics = {
      ...this.metrics,
      ...metrics,
      lastUpdate: new Date()
    };

    // Check for automatic rollback conditions
    this.checkRollbackConditions();
  }

  public getMetrics(): DeploymentMetrics {
    return { ...this.metrics };
  }

  private checkRollbackConditions(): void {
    const { responseTime, errorRate, userComplaints, systemHealth } = this.metrics;
    const thresholds = this.rollbackThresholds;

    // Check each threshold
    if (responseTime > thresholds.responseTime) {
      console.warn(`Response time threshold exceeded: ${responseTime}ms > ${thresholds.responseTime}ms`);
      this.considerRollback('responseTime');
    }

    if (errorRate > thresholds.errorRate) {
      console.warn(`Error rate threshold exceeded: ${errorRate}% > ${thresholds.errorRate}%`);
      this.considerRollback('errorRate');
    }

    if (userComplaints > thresholds.userComplaints) {
      console.warn(`User complaints threshold exceeded: ${userComplaints} > ${thresholds.userComplaints}`);
      this.considerRollback('userComplaints');
    }

    if (systemHealth < thresholds.systemHealth) {
      console.warn(`System health threshold exceeded: ${systemHealth}% < ${thresholds.systemHealth}%`);
      this.considerRollback('systemHealth');
    }
  }

  private considerRollback(reason: string): void {
    // In a real implementation, this would trigger alerts and potentially automatic rollback
    console.log(`ROLLBACK CONSIDERATION: ${reason} - evaluating enabled features`);
    
    // Example: If system health is critical, disable all new features
    if (reason === 'systemHealth' && this.metrics.systemHealth < 85) {
      this.emergencyDisableAll();
    }
  }

  private startMonitoring(): void {
    // Simulate monitoring updates every 30 seconds
    setInterval(() => {
      // In a real implementation, this would collect actual metrics
      this.updateMetrics({
        responseTime: 150 + Math.random() * 50, // Simulate response time variance
        errorRate: 0.05 + Math.random() * 0.1, // Simulate error rate variance
        systemHealth: 95 + Math.random() * 5, // Simulate system health variance
        userComplaints: Math.floor(Math.random() * 3) // Simulate user complaints
      });
    }, 30000);
  }

  // Gradual rollout helper
  public gradualRollout(flag: keyof FeatureFlagState, targetPercentage: number, incrementMinutes: number = 60): void {
    const currentPercentage = this.flags[flag].rolloutPercentage;
    const increment = 5; // 5% increments
    
    if (currentPercentage >= targetPercentage) {
      console.log(`Gradual rollout complete for ${flag} at ${targetPercentage}%`);
      return;
    }

    const nextPercentage = Math.min(currentPercentage + increment, targetPercentage);
    this.updateFlag(flag, nextPercentage);
    
    console.log(`Gradual rollout: ${flag} increased to ${nextPercentage}%`);
    
    // Schedule next increment
    setTimeout(() => {
      this.gradualRollout(flag, targetPercentage, incrementMinutes);
    }, incrementMinutes * 60 * 1000);
  }
}

// Export singleton instance
export const featureFlagManager = FeatureFlagManager.getInstance();

// API Handlers
export const featureFlagHandlers = {
  // Get current feature flags
  getFlags: async (req: Request, res: Response) => {
    try {
      const flags = featureFlagManager.getFlags();
      res.json({ flags, timestamp: new Date() });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get feature flags' });
    }
  },

  // Update feature flag rollout percentage
  updateFlag: async (req: Request, res: Response) => {
    try {
      const { flag, rolloutPercentage } = req.body;
      
      if (!flag || rolloutPercentage === undefined) {
        return res.status(400).json({ error: 'Flag and rolloutPercentage are required' });
      }

      featureFlagManager.updateFlag(flag, rolloutPercentage);
      res.json({ success: true, flag, rolloutPercentage });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update feature flag' });
    }
  },

  // Emergency disable single flag
  emergencyDisable: async (req: Request, res: Response) => {
    try {
      const { flag } = req.body;
      
      if (!flag) {
        return res.status(400).json({ error: 'Flag is required' });
      }

      featureFlagManager.emergencyDisable(flag);
      res.json({ success: true, action: 'emergency_disable', flag });
    } catch (error) {
      res.status(500).json({ error: 'Failed to emergency disable feature flag' });
    }
  },

  // Emergency disable all flags
  emergencyDisableAll: async (req: Request, res: Response) => {
    try {
      featureFlagManager.emergencyDisableAll();
      res.json({ success: true, action: 'emergency_disable_all' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to emergency disable all feature flags' });
    }
  },

  // Start gradual rollout
  startGradualRollout: async (req: Request, res: Response) => {
    try {
      const { flag, targetPercentage, incrementMinutes = 60 } = req.body;
      
      if (!flag || targetPercentage === undefined) {
        return res.status(400).json({ error: 'Flag and targetPercentage are required' });
      }

      featureFlagManager.gradualRollout(flag, targetPercentage, incrementMinutes);
      res.json({ success: true, flag, targetPercentage, incrementMinutes });
    } catch (error) {
      res.status(500).json({ error: 'Failed to start gradual rollout' });
    }
  },

  // Get deployment metrics
  getMetrics: async (req: Request, res: Response) => {
    try {
      const metrics = featureFlagManager.getMetrics();
      res.json({ metrics, timestamp: new Date() });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get deployment metrics' });
    }
  },

  // Update metrics (for monitoring integration)
  updateMetrics: async (req: Request, res: Response) => {
    try {
      const metrics = req.body;
      featureFlagManager.updateMetrics(metrics);
      res.json({ success: true, metrics });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update metrics' });
    }
  },

  // Get rollback status
  getRollbackStatus: async (req: Request, res: Response) => {
    try {
      const metrics = featureFlagManager.getMetrics();
      const flags = featureFlagManager.getFlags();
      
      const status = {
        healthy: metrics.systemHealth >= 90,
        metrics,
        enabledFeatures: Object.entries(flags).filter(([_, config]) => config.enabled),
        rollbackReady: true
      };

      res.json(status);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get rollback status' });
    }
  }
};