interface FeatureFlags {
  enable_v2_journey_dashboard: boolean;
  enable_ai_mentor_unification: boolean;
  enable_growth_studio_tabs: boolean;
  enable_rhythm_engine: boolean;
  enable_log_session_view: boolean;
  enable_supervision_hub_view: boolean;
}

const defaultFlags: FeatureFlags = {
  enable_v2_journey_dashboard: true,
  enable_ai_mentor_unification: true,
  enable_growth_studio_tabs: true,
  enable_rhythm_engine: true,
  enable_log_session_view: true,
  enable_supervision_hub_view: true,
};

export class FeatureFlagService {
  private static instance: FeatureFlagService;
  private flags: FeatureFlags;

  private constructor() {
    this.flags = { ...defaultFlags };
  }

  static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService();
    }
    return FeatureFlagService.instance;
  }

  isEnabled(flag: keyof FeatureFlags): boolean {
    return this.flags[flag];
  }

  getAllFlags(): FeatureFlags {
    return { ...this.flags };
  }

  updateFlag(flag: keyof FeatureFlags, value: boolean): void {
    this.flags[flag] = value;
  }

  updateFlags(newFlags: Partial<FeatureFlags>): void {
    this.flags = { ...this.flags, ...newFlags };
  }
}

export const featureFlags = FeatureFlagService.getInstance();