import { Clock, Users, Calendar, TrendingUp } from "lucide-react";
import { useLogEntries, useAppSettings } from "@/hooks/use-firestore";
import { EnhancedStatsCard } from "./EnhancedStatsCard";
import { motion } from "framer-motion";

export const QuickStatsGrid = () => {
  const { entries, loading: entriesLoading } = useLogEntries();
  const { settings, loading: settingsLoading } = useAppSettings();

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
      value: totalSupervisionHours.toFixed(1),
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
      <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl p-6 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-green-50/50 to-transparent rounded-full -translate-y-16 translate-x-16" />
        
        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-baseline space-x-1 mb-1">
                <h2 className="text-3xl font-bold text-black dark:text-white">
                  {totalClientHours.toFixed(1)}
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

      {/* Secondary Metrics - Enhanced Apple Complications */}
      <div className="grid grid-cols-2 gap-4">
        {/* Supervision - Enhanced with progress arc */}
        <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-purple-50/30 to-transparent rounded-full -translate-y-8 translate-x-8" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              
              {/* Circular progress indicator */}
              <div className="relative w-8 h-8">
                <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="63"
                    strokeDashoffset="63"
                    className="text-gray-200 dark:text-gray-600"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill="none"
                    stroke="#8B5CF6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="63"
                    strokeDashoffset={63 - (totalSupervisionHours / 50) * 63}
                    className="transition-all duration-1500 ease-out"
                  />
                </svg>
              </div>
            </div>
            
            <div className="flex items-baseline space-x-1 mb-1">
              <div className="text-xl font-bold text-black dark:text-white">
                {totalSupervisionHours.toFixed(1)}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                / 50
              </span>
            </div>
            
            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">
              Supervision Hours
            </div>
            
            {/* Progress indicator */}
            <div className="flex items-center space-x-1">
              <div className="flex space-x-0.5">
                {[12.5, 25, 37.5, 50].map((milestone, index) => (
                  <div 
                    key={milestone}
                    className={`w-1 h-1 rounded-full transition-colors duration-500 ${
                      totalSupervisionHours >= milestone 
                        ? 'bg-purple-500' 
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {Math.round((totalSupervisionHours / 50) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Next Check-in - Enhanced with urgency indicators */}
        <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-xl p-4 relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl to-transparent rounded-full -translate-y-8 translate-x-8 ${
            daysToCheckIn && daysToCheckIn <= 7 
              ? 'from-orange-50/30' 
              : 'from-blue-50/30'
          }`} />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${
                daysToCheckIn && daysToCheckIn <= 7 
                  ? 'bg-orange-500/10' 
                  : 'bg-blue-500/10'
              }`}>
                <Calendar className={`h-4 w-4 ${
                  daysToCheckIn && daysToCheckIn <= 7 
                    ? 'text-orange-600 dark:text-orange-400' 
                    : 'text-blue-600 dark:text-blue-400'
                }`} />
              </div>
              
              {/* Status indicator */}
              <div className="flex items-center space-x-1">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  daysToCheckIn && daysToCheckIn <= 7 
                    ? 'bg-orange-500 animate-pulse' 
                    : daysToCheckIn && daysToCheckIn <= 14
                    ? 'bg-yellow-500'
                    : 'bg-blue-500'
                }`} />
                {daysToCheckIn && daysToCheckIn <= 7 && (
                  <span className="text-xs text-orange-600 dark:text-orange-400 font-semibold">
                    Due soon
                  </span>
                )}
              </div>
            </div>
            
            <div className="text-xl font-bold text-black dark:text-white mb-1">
              {daysToCheckIn?.toString() || "—"}
            </div>
            
            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">
              {daysToCheckIn ? "Days to check-in" : "Not scheduled"}
            </div>
            
            {/* Urgency bar */}
            {daysToCheckIn && (
              <div className="w-full h-1 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    daysToCheckIn <= 7 
                      ? 'bg-orange-500' 
                      : daysToCheckIn <= 14 
                      ? 'bg-yellow-500' 
                      : 'bg-blue-500'
                  }`}
                  style={{ 
                    width: `${Math.max(10, Math.min(100 - (daysToCheckIn / 30) * 100, 100))}%` 
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
