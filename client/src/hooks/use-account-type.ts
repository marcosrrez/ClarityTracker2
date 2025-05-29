import { useAuth } from "@/hooks/use-auth";

export const useAccountType = () => {
  const { user, userProfile } = useAuth();

  const accountType = userProfile?.accountType || 'individual';
  const subscriptionTier = userProfile?.subscriptionTier || 'free';

  const permissions = {
    // Individual features
    canTrackOwnHours: true,
    canUseAIInsights: subscriptionTier !== 'free',
    canImportData: subscriptionTier !== 'free',
    
    // Supervisor features
    canManageSupervisees: accountType === 'supervisor' || accountType === 'enterprise',
    canViewMultipleDashboards: accountType === 'supervisor' || accountType === 'enterprise',
    canTrackCompliance: accountType === 'supervisor' || accountType === 'enterprise',
    canGenerateReports: accountType === 'supervisor' || accountType === 'enterprise',
    
    // Enterprise features
    canManageOrganization: accountType === 'enterprise',
    canBulkManageUsers: accountType === 'enterprise',
    canCustomizeReporting: accountType === 'enterprise',
    canAccessAPI: accountType === 'enterprise',
  };

  const navigation = {
    showSuperviseeManagement: permissions.canManageSupervisees,
    showComplianceTracking: permissions.canTrackCompliance,
    showOrganizationSettings: permissions.canManageOrganization,
    showReporting: permissions.canGenerateReports,
  };

  const dashboardLayout = {
    // Individual: Personal tracking focus
    individual: {
      primaryCards: ['progress', 'recent-entries', 'goals'],
      secondaryCards: ['insights', 'milestones'],
    },
    // Supervisor: Multi-user overview
    supervisor: {
      primaryCards: ['supervisee-overview', 'compliance-status', 'supervision-hours'],
      secondaryCards: ['recent-supervisee-activity', 'alerts'],
    },
    // Enterprise: Organization-wide analytics
    enterprise: {
      primaryCards: ['organization-metrics', 'user-management', 'compliance-dashboard'],
      secondaryCards: ['usage-analytics', 'system-health'],
    },
  } as const;

  return {
    accountType,
    subscriptionTier,
    permissions,
    navigation,
    dashboardLayout: dashboardLayout[accountType as keyof typeof dashboardLayout],
    isIndividual: accountType === 'individual',
    isSupervisor: accountType === 'supervisor',
    isEnterprise: accountType === 'enterprise',
    isPaid: subscriptionTier !== 'free',
  };
};