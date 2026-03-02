/**
 * Feature Flag System for Zero-Disruption Phase 3A/3B Deployment
 * Enables gradual rollout and instant rollback capabilities
 */

import React from 'react';

interface FeatureFlags {
  enhancedAI: boolean;
  offlineSync: boolean;
  complianceValidation: boolean;
  advancedAnalytics: boolean;
  mobileEnhancements: boolean;
  enterpriseIntegration: boolean;
}

interface FeatureFlagConfig {
  flag: keyof FeatureFlags;
  defaultValue: boolean;
  rolloutPercentage: number;
  environmentOverride?: string;
}

class FeatureFlagManager {
  private static instance: FeatureFlagManager;
  private flags: FeatureFlags;
  private userId: string | null = null;
  private rolloutConfig: FeatureFlagConfig[] = [
    {
      flag: 'enhancedAI',
      defaultValue: true,
      rolloutPercentage: 100, // ACTIVATED - Full rollout
      environmentOverride: 'VITE_ENABLE_ENHANCED_AI'
    },
    {
      flag: 'offlineSync',
      defaultValue: true,
      rolloutPercentage: 100, // ACTIVATED - Full rollout
      environmentOverride: 'VITE_ENABLE_OFFLINE_SYNC'
    },
    {
      flag: 'complianceValidation',
      defaultValue: true,
      rolloutPercentage: 100, // ACTIVATED - Full rollout
      environmentOverride: 'VITE_ENABLE_COMPLIANCE_CHECK'
    },
    {
      flag: 'advancedAnalytics',
      defaultValue: false,
      rolloutPercentage: 0,
      environmentOverride: 'VITE_ENABLE_ADVANCED_ANALYTICS'
    },
    {
      flag: 'mobileEnhancements',
      defaultValue: false,
      rolloutPercentage: 0,
      environmentOverride: 'VITE_ENABLE_MOBILE_ENHANCEMENTS'
    },
    {
      flag: 'enterpriseIntegration',
      defaultValue: false,
      rolloutPercentage: 0,
      environmentOverride: 'VITE_ENABLE_ENTERPRISE_INTEGRATION'
    }
  ];

  private constructor() {
    this.flags = this.initializeFlags();
  }

  public static getInstance(): FeatureFlagManager {
    if (!FeatureFlagManager.instance) {
      FeatureFlagManager.instance = new FeatureFlagManager();
    }
    return FeatureFlagManager.instance;
  }

  public setUserId(userId: string): void {
    this.userId = userId;
    this.flags = this.initializeFlags();
  }

  public isEnabled(flag: keyof FeatureFlags): boolean {
    return this.flags[flag];
  }

  public getAllFlags(): FeatureFlags {
    return { ...this.flags };
  }

  private initializeFlags(): FeatureFlags {
    const flags: FeatureFlags = {
      enhancedAI: true,
      offlineSync: true,
      complianceValidation: true,
      advancedAnalytics: false,
      mobileEnhancements: false,
      enterpriseIntegration: false
    };

    this.rolloutConfig.forEach(config => {
      // Check environment override first
      if (config.environmentOverride) {
        const envValue = import.meta.env[config.environmentOverride];
        if (envValue === 'true') {
          flags[config.flag] = true;
          return;
        }
        if (envValue === 'false') {
          flags[config.flag] = false;
          return;
        }
      }

      // Check rollout percentage
      if (this.isInRollout(config.rolloutPercentage)) {
        flags[config.flag] = true;
      } else {
        flags[config.flag] = config.defaultValue;
      }
    });

    return flags;
  }

  private isInRollout(percentage: number): boolean {
    if (percentage === 0) return false;
    if (percentage >= 100) return true;
    
    // Use userId for consistent rollout if available
    if (this.userId) {
      const hash = this.simpleHash(this.userId);
      return (hash % 100) < percentage;
    }
    
    // Fallback to random for anonymous users
    return Math.random() * 100 < percentage;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Admin functions for controlled rollout
  public updateRolloutPercentage(flag: keyof FeatureFlags, percentage: number): void {
    const config = this.rolloutConfig.find(c => c.flag === flag);
    if (config) {
      config.rolloutPercentage = Math.max(0, Math.min(100, percentage));
      this.flags = this.initializeFlags();
    }
  }

  public emergencyDisable(flag: keyof FeatureFlags): void {
    this.updateRolloutPercentage(flag, 0);
  }

  public emergencyDisableAll(): void {
    this.rolloutConfig.forEach(config => {
      config.rolloutPercentage = 0;
    });
    this.flags = this.initializeFlags();
  }
}

// Export singleton instance
export const featureFlags = FeatureFlagManager.getInstance();

// Hook for React components
export function useFeatureFlag(flag: keyof FeatureFlags): boolean {
  return featureFlags.isEnabled(flag);
}

// Hook for multiple feature flags
export function useFeatureFlags(): FeatureFlags {
  return featureFlags.getAllFlags();
}

// Progressive enhancement wrapper component
interface ProgressiveFeatureProps {
  flag: keyof FeatureFlags;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProgressiveFeature({ flag, children, fallback = null }: ProgressiveFeatureProps) {
  const isEnabled = useFeatureFlag(flag);
  
  if (isEnabled) {
    return children as React.ReactElement;
  }
  
  return fallback as React.ReactElement;
}

// Feature flag context for debugging
export interface FeatureFlagContextType {
  flags: FeatureFlags;
  isEnabled: (flag: keyof FeatureFlags) => boolean;
  updateRollout: (flag: keyof FeatureFlags, percentage: number) => void;
  emergencyDisable: (flag: keyof FeatureFlags) => void;
}

export const FeatureFlagContext = React.createContext<FeatureFlagContextType | null>(null);

// Development tools for testing
export const devTools = {
  enableAll: () => {
    Object.keys(featureFlags.getAllFlags()).forEach(flag => {
      featureFlags.updateRolloutPercentage(flag as keyof FeatureFlags, 100);
    });
  },
  disableAll: () => {
    featureFlags.emergencyDisableAll();
  },
  setRollout: (flag: keyof FeatureFlags, percentage: number) => {
    featureFlags.updateRolloutPercentage(flag, percentage);
  }
};