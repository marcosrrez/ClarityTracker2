import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/lib/firebase";

export interface UnifiedDashboardData {
  // Core metrics
  totalClientHours: number;
  directClientHours: number;
  supervisionHours: number;
  ethicsHours: number;
  
  // Progress calculations
  totalCCHProgress: number;
  directCCHProgress: number;
  supervisionProgress: number;
  ethicsProgress: number;
  
  // Supervision metrics
  activeSupervisors: number;
  supervisionTotalHours: number;
  sessionsThisMonth: number;
  supervisionProgressPercentage: number;
  
  // AI metrics (only when real data exists)
  aiInsightCount: number;
  sessionAnalysisCount: number;
  competencyDataAvailable: boolean;
  
  // Data quality indicators
  dataQuality: {
    hasRealSessionData: boolean;
    hasSupervisionData: boolean;
    hasAIAnalysis: boolean;
    sufficientForInsights: boolean;
  };
  
  // Timestamps
  lastUpdated: string;
  dataVersion: string;
}

export function useUnifiedDashboard() {
  const { user } = useUser();
  
  return useQuery({
    queryKey: ['/api/dashboard/unified', user?.uid],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/unified/${user?.uid}`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      return response.json();
    },
    enabled: !!user?.uid,
    refetchInterval: 60000, // Refetch every 1 minute instead of 30 seconds
    staleTime: 30000, // Consider data stale after 30 seconds
    retry: 3,
    retryDelay: 1000
  });
}

export function useUnifiedDashboardData(): {
  data: UnifiedDashboardData | undefined;
  isLoading: boolean;
  error: any;
  refetch: () => void;
} {
  const { data, isLoading, error, refetch } = useUnifiedDashboard();
  
  return {
    data,
    isLoading,
    error,
    refetch
  };
}