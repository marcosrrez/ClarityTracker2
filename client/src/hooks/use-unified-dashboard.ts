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
    enabled: !!user?.uid,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
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