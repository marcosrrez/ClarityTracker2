import { Clock, Users, Calendar, TrendingUp, UserCheck } from "lucide-react";
import { useLogEntries, useAppSettings } from "@/hooks/use-firestore";
import { useUser } from "@/lib/firebase";
import { EnhancedStatsCard } from "./EnhancedStatsCard";
import { ClickableMetricCard } from "./ClickableMetricCard";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export const QuickStatsGrid = () => {
  const { entries, loading: entriesLoading, refetch } = useLogEntries();
  const { settings, loading: settingsLoading } = useAppSettings();
  const { user } = useUser();
  const [supervisors, setSupervisors] = useState([]);
  const [supervisorsLoading, setSupervisorsLoading] = useState(true);

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

  // Calculate stats from entries
  const totalClientHours = entries.reduce((sum, entry) => sum + entry.clientContactHours, 0);
  const totalSupervisionHours = entries.reduce((sum, entry) => sum + entry.supervisionHours, 0);
  
  // Calculate days to next check-in
  const checkInInterval = settings?.licenseInfo?.supervisionCheckInInterval || 30;
  const lacDate = settings?.licenseInfo?.lacLicenseDate;
  const daysToCheckIn = lacDate 
    ? Math.max(0, checkInInterval - Math.floor((Date.now() - lacDate.getTime()) / (1000 * 60 * 60 * 24)) % checkInInterval)
    : null;

  // Calculate recent activity (this week vs last week)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  
  const thisWeekEntries = entries.filter(entry => new Date(entry.dateOfContact) >= weekAgo);
  const lastWeekEntries = entries.filter(entry => {
    const date = new Date(entry.dateOfContact);
    return date >= twoWeeksAgo && date < weekAgo;
  });
  
  const thisWeekClientHours = thisWeekEntries.reduce((sum, entry) => sum + entry.clientContactHours, 0);
  const lastWeekClientHours = lastWeekEntries.reduce((sum, entry) => sum + entry.clientContactHours, 0);
  const thisWeekSupervisionHours = thisWeekEntries.reduce((sum, entry) => sum + entry.supervisionHours, 0);
  const lastWeekSupervisionHours = lastWeekEntries.reduce((sum, entry) => sum + entry.supervisionHours, 0);

  // Calculate trends
  const clientHoursTrend = thisWeekClientHours > lastWeekClientHours ? "up" : 
                          thisWeekClientHours < lastWeekClientHours ? "down" : "neutral";
  const supervisionTrend = thisWeekSupervisionHours > lastWeekSupervisionHours ? "up" : 
                          thisWeekSupervisionHours < lastWeekSupervisionHours ? "down" : "neutral";

  const stats = [
    {
      title: "Client Contact Hours",
      value: totalClientHours.toFixed(1),
      subtitle: "Total",
      change: thisWeekClientHours - lastWeekClientHours,
      changeLabel: "vs last week",
      icon: Clock,
      iconColor: "text-blue-500",
      trend: clientHoursTrend,
    },
    {
      title: "Supervision Hours",
      value: (Math.round(totalSupervisionHours * 10) / 10).toString(),
      subtitle: "Total", 
      change: thisWeekSupervisionHours - lastWeekSupervisionHours,
      changeLabel: "vs last week",
      icon: Users,
      iconColor: "text-purple-500",
      trend: supervisionTrend,
    },
    {
      title: "Days to Check-in",
      value: daysToCheckIn?.toString() || "—",
      subtitle: "Next",
      changeLabel: daysToCheckIn ? (daysToCheckIn <= 7 ? "Due soon!" : "Scheduled") : "Not scheduled",
      icon: Calendar,
      iconColor: daysToCheckIn && daysToCheckIn <= 7 ? "text-orange-500" : "text-green-500",
      trend: "neutral",
    },
  ];

  return (
    <section className="space-y-6">
      {/* Primary Metric - Dominant Focus */}
      <ClickableMetricCard 
        category="direct_hours" 
        value={totalClientHours}
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
                  {Math.round(totalClientHours * 10) / 10}
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
                        totalClientHours >= milestone 
                          ? 'bg-green-500' 
                          : 'bg-gray-200 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {totalClientHours >= 75 ? 'Nearly there!' : 
                   totalClientHours >= 50 ? 'Halfway mark' :
                   totalClientHours >= 25 ? 'Good start' : 'Getting started'}
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
                    strokeDasharray={`${Math.min((totalClientHours / 100) * 100, 100)}, 100`}
                    className="transition-all duration-2000 ease-out"
                    style={{
                      filter: 'drop-shadow(0 0 2px rgba(52, 199, 89, 0.3))'
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    {Math.round((totalClientHours / 100) * 100)}%
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
            {thisWeekClientHours - lastWeekClientHours !== 0 && (
              <div className="flex items-center space-x-2">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  thisWeekClientHours - lastWeekClientHours > 0 
                    ? 'bg-green-500 animate-pulse' 
                    : 'bg-orange-500'
                }`} />
                <span className={`text-sm font-medium ${
                  thisWeekClientHours - lastWeekClientHours > 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-orange-600 dark:text-orange-400'
                }`}>
                  {thisWeekClientHours - lastWeekClientHours > 0 ? '+' : ''}
                  {(thisWeekClientHours - lastWeekClientHours).toFixed(1)} this week
                </span>
              </div>
            )}
            
            {/* Time to completion estimate */}
            {totalClientHours > 0 && totalClientHours < 100 && (
              <div className="text-right">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {Math.ceil((100 - totalClientHours) / (thisWeekClientHours || 1))} weeks to goal
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
          value={totalClientHours}
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
                {Math.round((totalClientHours / 80) * 100)}% of 80 req.
              </span>
            </div>
            
            <div className="space-y-2 mb-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Direct</span>
                <span className="text-sm font-bold text-black dark:text-white">
                  {(totalClientHours * 0.7).toFixed(1)}h
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Indirect</span>
                <span className="text-sm font-bold text-black dark:text-white">
                  {(totalClientHours * 0.3).toFixed(1)}h
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
                  style={{ width: `${(totalClientHours * 0.7 / 80) * 100}%` }}
                />
                <div 
                  className="bg-blue-300 transition-all duration-1000"
                  style={{ width: `${(totalClientHours * 0.3 / 80) * 100}%` }}
                />
              </div>
            </div>
          </div>
          </div>
        </ClickableMetricCard>

        {/* Exam Eligibility Status */}
        <ClickableMetricCard 
          category="exam_eligibility" 
          value={totalClientHours >= 80 && totalSupervisionHours >= 40 ? 1 : 0}
          className="block"
        >
          <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-xl p-4 relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl to-transparent rounded-full -translate-y-8 translate-x-8 ${
            totalClientHours >= 80 && totalSupervisionHours >= 40 
              ? 'from-green-50/30' 
              : 'from-yellow-50/30'
          }`} />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${
                totalClientHours >= 80 && totalSupervisionHours >= 40 
                  ? 'bg-green-500/10' 
                  : 'bg-yellow-500/10'
              }`}>
                <Users className={`h-4 w-4 ${
                  totalClientHours >= 80 && totalSupervisionHours >= 40 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-yellow-600 dark:text-yellow-400'
                }`} />
              </div>
              
              <div className={`w-1.5 h-1.5 rounded-full ${
                totalClientHours >= 80 && totalSupervisionHours >= 40 
                  ? 'bg-green-500' 
                  : 'bg-yellow-500 animate-pulse'
              }`} />
            </div>
            
            <div className="text-xl font-bold text-black dark:text-white mb-1">
              {totalClientHours >= 80 && totalSupervisionHours >= 40 ? 'Ready' : 'In Progress'}
            </div>
            
            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">
              Exam Eligibility
            </div>
            
            {/* Requirements checklist */}
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className={`w-1 h-1 rounded-full ${
                  totalClientHours >= 80 ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  80+ Client Hours
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-1 h-1 rounded-full ${
                  totalSupervisionHours >= 40 ? 'bg-green-500' : 'bg-gray-300'
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
          value={totalSupervisionHours}
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
              {totalSupervisionHours.toFixed(1)}
            </div>
            
            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">
              Total Supervision
            </div>
            
            {/* Progress with next milestone */}
            <div className="flex items-center justify-between">
              <div className="w-16 h-1 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min((totalSupervisionHours / 50) * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {50 - totalSupervisionHours > 0 ? `${(50 - totalSupervisionHours).toFixed(1)}h to go` : 'Complete!'}
              </span>
            </div>
          </div>
          </div>
        </ClickableMetricCard>

        {/* Time to Licensure */}
        <ClickableMetricCard 
          category="licensure_timeline" 
          value={totalClientHours >= 100 ? 1 : Math.ceil((100 - totalClientHours) / Math.max(thisWeekClientHours, 1))}
          className="block"
        >
          <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-xl p-4 relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl to-transparent rounded-full -translate-y-8 translate-x-8 ${
            totalClientHours >= 100 ? 'from-green-50/30' : 'from-blue-50/30'
          }`} />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${
                totalClientHours >= 100 ? 'bg-green-500/10' : 'bg-blue-500/10'
              }`}>
                <Clock className={`h-4 w-4 ${
                  totalClientHours >= 100 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-blue-600 dark:text-blue-400'
                }`} />
              </div>
            </div>
            
            <div className="text-xl font-bold text-black dark:text-white mb-1">
              {totalClientHours >= 100 ? 'Ready' : `${Math.ceil((100 - totalClientHours) / Math.max(thisWeekClientHours, 1))}w`}
            </div>
            
            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">
              {totalClientHours >= 100 ? 'For Application' : 'Est. Completion'}
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {totalClientHours >= 100 
                ? 'All hour requirements met' 
                : `At current pace: ${thisWeekClientHours.toFixed(1)}h/week`
              }
            </div>
          </div>
          </div>
        </ClickableMetricCard>
      </div>
    </section>
  );
};
