import { Clock, Users, Calendar, TrendingUp, UserCheck, Brain } from "lucide-react";
import { useLogEntries, useAppSettings } from "@/hooks/use-firestore";
import { useUser } from "@/lib/firebase";
import { useQuery } from "@tanstack/react-query";
import { EnhancedStatsCard } from "./EnhancedStatsCard";
import { ClickableMetricCard } from "./ClickableMetricCard";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { calculateDashboardMetrics } from "@/lib/dashboard-calculations";

export const QuickStatsGrid = () => {
  const { entries, loading: entriesLoading, refetch } = useLogEntries();
  const { settings, loading: settingsLoading } = useAppSettings();
  const { user } = useUser();
  const [supervisors, setSupervisors] = useState([]);
  const [supervisorsLoading, setSupervisorsLoading] = useState(true);

  // Fetch Clinical Intelligence metrics
  const { data: clinicalMetrics } = useQuery({
    queryKey: ['/api/ai/clinical-metrics', user?.uid],
    enabled: !!user?.uid,
    refetchInterval: 30000,
  });

  useEffect(() => {
    const loadSupervisors = async () => {
      if (!user) return;
      setSupervisorsLoading(true);
      try {
        const response = await fetch(`/api/supervisors/${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          setSupervisors(data);
        }
      } catch (error) {
        console.error('Error loading supervisors:', error);
      } finally {
        setSupervisorsLoading(false);
      }
    };
    
    loadSupervisors();
  }, [user]);

  if (entriesLoading || settingsLoading) {
    return (
      <section className="mb-8">
        <motion.h3 
          className="text-4xl md:text-5xl font-bold mb-8 text-black dark:text-white tracking-tight"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Your Progress
        </motion.h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <EnhancedStatsCard
              key={i}
              title="Loading..."
              value="—"
              icon={Clock}
              isLoading={true}
            />
          ))}
        </div>
      </section>
    );
  }

  // Use standardized calculations
  const metrics = calculateDashboardMetrics(entries);
  
  // Calculate days to next check-in
  const checkInInterval = settings?.licenseInfo?.supervisionCheckInInterval || 30;
  const lacDate = settings?.licenseInfo?.lacLicenseDate;
  const daysToCheckIn = lacDate 
    ? Math.max(0, checkInInterval - Math.floor((Date.now() - lacDate.getTime()) / (1000 * 60 * 60 * 24)) % checkInInterval)
    : null;

  const stats = [
    {
      title: "Client Contact Hours",
      value: metrics.totalClientHours.toFixed(1),
      subtitle: "Total",
      change: metrics.thisWeekClientHours - metrics.lastWeekClientHours,
      changeLabel: "vs last week",
      icon: Clock,
      iconColor: "text-blue-500",
      trend: metrics.clientHoursTrend,
    },
    {
      title: "Supervision Hours",
      value: (Math.round(metrics.totalSupervisionHours * 10) / 10).toString(),
      subtitle: "Total", 
      change: metrics.thisWeekSupervisionHours - metrics.lastWeekSupervisionHours,
      changeLabel: "vs last week",
      icon: Users,
      iconColor: "text-purple-500",
      trend: metrics.supervisionTrend,
    },
    {
      title: "Clinical Intelligence",
      value: clinicalMetrics?.overallScore ? `${Math.round(clinicalMetrics.overallScore)}/100` : "—",
      subtitle: "AI Score",
      changeLabel: clinicalMetrics?.trend || "Analyzing",
      icon: Brain,
      iconColor: clinicalMetrics?.overallScore >= 80 ? "text-emerald-500" : 
                 clinicalMetrics?.overallScore >= 60 ? "text-blue-500" : "text-amber-500",
      trend: clinicalMetrics?.trend || "neutral",
    },
  ];

  return (
    <section className="space-y-6">
      {/* Primary Metric - Dominant Focus */}
      <ClickableMetricCard 
        category="direct_hours" 
        value={metrics.totalClientHours}
        className="block"
      >
        <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl p-6 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-green-50/50 to-transparent rounded-full -translate-y-16 translate-x-16" />
        
        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-baseline space-x-1 mb-1">
                <h2 className="text-3xl font-bold text-black dark:text-white">
                  {Math.round(metrics.totalClientHours * 10) / 10}
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  / 100 hours
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">
                Client Contact Progress
              </p>
              
              {/* Progress milestone indicator */}
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  {[25, 50, 75, 100].map((milestone, index) => (
                    <div 
                      key={milestone}
                      className={`w-2 h-2 rounded-full transition-colors duration-500 ${
                        metrics.totalClientHours >= milestone 
                          ? 'bg-green-500' 
                          : 'bg-gray-200 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {metrics.totalClientHours >= 75 ? 'Nearly there!' : 
                   metrics.totalClientHours >= 50 ? 'Halfway mark' :
                   metrics.totalClientHours >= 25 ? 'Good start' : 'Getting started'}
                </span>
              </div>
            </div>
            
            {/* Enhanced Progress Ring */}
            <div className="relative">
              <div className="w-24 h-24 relative">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeDasharray="100, 100"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#34C759"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray={`${Math.min((metrics.totalClientHours / 100) * 100, 100)}, 100`}
                    className="transition-all duration-2000 ease-out"
                    style={{
                      filter: 'drop-shadow(0 0 2px rgba(52, 199, 89, 0.3))'
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    {Math.round((metrics.totalClientHours / 100) * 100)}%
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    complete
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Enhanced contextual information */}
          <div className="mt-4 flex items-center justify-between">
            {metrics.thisWeekClientHours - metrics.lastWeekClientHours !== 0 && (
              <div className="flex items-center space-x-2">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  metrics.thisWeekClientHours - metrics.lastWeekClientHours > 0 
                    ? 'bg-green-500 animate-pulse' 
                    : 'bg-orange-500'
                }`} />
                <span className={`text-sm font-medium ${
                  metrics.thisWeekClientHours - metrics.lastWeekClientHours > 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-orange-600 dark:text-orange-400'
                }`}>
                  {metrics.thisWeekClientHours - metrics.lastWeekClientHours > 0 ? '+' : ''}
                  {(metrics.thisWeekClientHours - metrics.lastWeekClientHours).toFixed(1)} this week
                </span>
              </div>
            )}
            
            {/* Time to completion estimate */}
            {metrics.totalClientHours > 0 && metrics.totalClientHours < 100 && (
              <div className="text-right">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {Math.ceil((100 - metrics.totalClientHours) / (metrics.thisWeekClientHours || 1))} weeks to goal
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </ClickableMetricCard>

      {/* Essential LAC Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Direct vs Indirect Hours Breakdown */}
        <ClickableMetricCard 
          category="direct_hours_breakdown" 
          value={metrics.totalClientHours}
          className="block"
        >
          <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-blue-50/30 to-transparent rounded-full -translate-y-8 translate-x-8" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                {Math.round((metrics.totalClientHours / 80) * 100)}% of 80 req.
              </span>
            </div>
            
            <div className="space-y-2 mb-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Direct</span>
                <span className="text-sm font-bold text-black dark:text-white">
                  {(metrics.totalClientHours * 0.7).toFixed(1)}h
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Indirect</span>
                <span className="text-sm font-bold text-black dark:text-white">
                  {(metrics.totalClientHours * 0.3).toFixed(1)}h
                </span>
              </div>
            </div>
            
            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">
              Hour Distribution
            </div>
            
            {/* Stacked progress bar */}
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
              <div className="h-full flex">
                <div 
                  className="bg-blue-500 transition-all duration-1000"
                  style={{ width: `${(metrics.totalClientHours * 0.7 / 80) * 100}%` }}
                />
                <div 
                  className="bg-blue-300 transition-all duration-1000"
                  style={{ width: `${(metrics.totalClientHours * 0.3 / 80) * 100}%` }}
                />
              </div>
            </div>
          </div>
          </div>
        </ClickableMetricCard>

        {/* Exam Eligibility Status */}
        <ClickableMetricCard 
          category="exam_eligibility" 
          value={metrics.totalClientHours >= 80 && metrics.totalSupervisionHours >= 40 ? 1 : 0}
          className="block"
        >
          <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-xl p-4 relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl to-transparent rounded-full -translate-y-8 translate-x-8 ${
            metrics.totalClientHours >= 80 && metrics.totalSupervisionHours >= 40 
              ? 'from-green-50/30' 
              : 'from-yellow-50/30'
          }`} />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${
                metrics.totalClientHours >= 80 && metrics.totalSupervisionHours >= 40 
                  ? 'bg-green-500/10' 
                  : 'bg-yellow-500/10'
              }`}>
                <Users className={`h-4 w-4 ${
                  metrics.totalClientHours >= 80 && metrics.totalSupervisionHours >= 40 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-yellow-600 dark:text-yellow-400'
                }`} />
              </div>
              
              <div className={`w-1.5 h-1.5 rounded-full ${
                metrics.totalClientHours >= 80 && metrics.totalSupervisionHours >= 40 
                  ? 'bg-green-500' 
                  : 'bg-yellow-500 animate-pulse'
              }`} />
            </div>
            
            <div className="text-xl font-bold text-black dark:text-white mb-1">
              {metrics.totalClientHours >= 80 && metrics.totalSupervisionHours >= 40 ? 'Ready' : 'In Progress'}
            </div>
            
            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">
              Exam Eligibility
            </div>
            
            {/* Requirements checklist */}
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className={`w-1 h-1 rounded-full ${
                  metrics.totalClientHours >= 80 ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  80+ Client Hours
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-1 h-1 rounded-full ${
                  metrics.totalSupervisionHours >= 40 ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  40+ Supervision Hours
                </span>
              </div>
            </div>
          </div>
          </div>
        </ClickableMetricCard>

        {/* Supervision Compliance */}
        <ClickableMetricCard 
          category="supervision_hours" 
          value={metrics.totalSupervisionHours}
          className="block"
        >
          <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-purple-50/30 to-transparent rounded-full -translate-y-8 translate-x-8" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
                Weekly tracking
              </span>
            </div>
            
            <div className="text-xl font-bold text-black dark:text-white mb-1">
              {metrics.totalSupervisionHours.toFixed(1)}
            </div>
            
            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">
              Total Supervision
            </div>
            
            {/* Progress with next milestone */}
            <div className="flex items-center justify-between">
              <div className="w-16 h-1 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min((metrics.totalSupervisionHours / 50) * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {50 - metrics.totalSupervisionHours > 0 ? `${(50 - metrics.totalSupervisionHours).toFixed(1)}h to go` : 'Complete!'}
              </span>
            </div>
          </div>
          </div>
        </ClickableMetricCard>

        {/* Time to Licensure */}
        <ClickableMetricCard 
          category="licensure_timeline" 
          value={metrics.totalClientHours >= 100 ? 1 : Math.ceil((100 - metrics.totalClientHours) / Math.max(metrics.thisWeekClientHours, 1))}
          className="block"
        >
          <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-xl p-4 relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl to-transparent rounded-full -translate-y-8 translate-x-8 ${
            metrics.totalClientHours >= 100 ? 'from-green-50/30' : 'from-blue-50/30'
          }`} />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${
                metrics.totalClientHours >= 100 ? 'bg-green-500/10' : 'bg-blue-500/10'
              }`}>
                <Clock className={`h-4 w-4 ${
                  metrics.totalClientHours >= 100 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-blue-600 dark:text-blue-400'
                }`} />
              </div>
            </div>
            
            <div className="text-xl font-bold text-black dark:text-white mb-1">
              {metrics.totalClientHours >= 100 ? 'Ready' : `${Math.ceil((100 - metrics.totalClientHours) / Math.max(metrics.thisWeekClientHours, 1))}w`}
            </div>
            
            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">
              {metrics.totalClientHours >= 100 ? 'For Application' : 'Est. Completion'}
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {metrics.totalClientHours >= 100 
                ? 'All hour requirements met' 
                : `At current pace: ${metrics.thisWeekClientHours.toFixed(1)}h/week`
              }
            </div>
          </div>
          </div>
        </ClickableMetricCard>

        {/* Supervisor Network Integration */}
        <ClickableMetricCard 
          category="supervision_network" 
          value={supervisors.filter((s: any) => s.isActive).length}
          className="block"
        >
          <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-indigo-50/30 to-transparent rounded-full -translate-y-8 translate-x-8" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <UserCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                Professional network
              </span>
            </div>
            
            <div className="text-xl font-bold text-black dark:text-white mb-1">
              {supervisors.filter((s: any) => s.isActive).length}
            </div>
            
            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">
              Active Supervisors
            </div>
            
            <div className="space-y-1">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {supervisors.length === 0 
                  ? 'Build your network'
                  : `${new Set(supervisors.flatMap((s: any) => s.specialties || [])).size} specialties covered`
                }
              </div>
              {supervisors.length > 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {supervisors.reduce((sum: number, s: any) => sum + (s.totalHours || 0), 0)} total hours logged
                </div>
              )}
            </div>
          </div>
          </div>
        </ClickableMetricCard>

        {/* Clinical Intelligence Score */}
        <ClickableMetricCard 
          category="clinical_intelligence" 
          value={clinicalMetrics?.overallScore || 0}
          className="block"
        >
          <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-emerald-50/30 to-transparent rounded-full -translate-y-8 translate-x-8" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Brain className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className={`text-xs font-semibold capitalize ${
                clinicalMetrics?.trend === 'improving' ? 'text-emerald-600 dark:text-emerald-400' :
                clinicalMetrics?.trend === 'declining' ? 'text-orange-600 dark:text-orange-400' :
                'text-blue-600 dark:text-blue-400'
              }`}>
                {clinicalMetrics?.trend || 'Analyzing'}
              </span>
            </div>
            
            <div className="text-xl font-bold text-black dark:text-white mb-1">
              {clinicalMetrics?.overallScore ? `${Math.round(clinicalMetrics.overallScore)}/100` : "—"}
            </div>
            
            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">
              Clinical Intelligence
            </div>
            
            {/* Progress indicator */}
            <div className="flex items-center justify-between">
              <div className="w-16 h-1 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                  style={{ width: `${clinicalMetrics?.overallScore || 0}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                AI Analysis
              </span>
            </div>
          </div>
          </div>
        </ClickableMetricCard>
      </div>
    </section>
  );
};
