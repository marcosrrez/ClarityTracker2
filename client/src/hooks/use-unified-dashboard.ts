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
      // DISABLED: Firebase admin connection failing, causing timeout errors
      // Return empty data structure to prevent crashes while maintaining existing Firebase data flow
      return {
        totalClientHours: 0,
        directClientHours: 0,
        supervisionHours: 0,
        ethicsHours: 0,
        totalCCHProgress: 0,
        directCCHProgress: 0,
        supervisionProgress: 0,
        ethicsProgress: 0,
        activeSupervisors: 0,
        supervisionTotalHours: 0,
        sessionsThisMonth: 0,
        supervisionProgressPercentage: 0,
        aiInsightCount: 0,
        sessionAnalysisCount: 0,
        competencyDataAvailable: false,
        dataQuality: {
          hasRealSessionData: false,
          hasSupervisionData: false,
          hasAIAnalysis: false,
          sufficientForInsights: false
        },
        lastUpdated: new Date().toISOString(),
        dataVersion: "1.0.0"
      };
    },
    enabled: false, // Disable to prevent Firebase Admin connection errors
    refetchInterval: 60000,
    staleTime: 30000,
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