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
      <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-1">
              {totalClientHours.toFixed(1)} Hours
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
              Client Contact Progress
            </p>
          </div>
          
          {/* Apple-style Progress Ring */}
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray="100, 100"
                className="text-gray-200 dark:text-gray-700"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#34C759"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${Math.min((totalClientHours / 100) * 100, 100)}, 100`}
                className="transition-all duration-1500 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-green-600 dark:text-green-400">
                {Math.round((totalClientHours / 100) * 100)}%
              </span>
            </div>
          </div>
        </div>
        
        {/* Contextual Change - Only when meaningful */}
        {thisWeekClientHours - lastWeekClientHours !== 0 && (
          <div className="mt-4 flex items-center text-sm">
            <span className={`font-medium ${
              thisWeekClientHours - lastWeekClientHours > 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-orange-600 dark:text-orange-400'
            }`}>
              {thisWeekClientHours - lastWeekClientHours > 0 ? '+' : ''}
              {(thisWeekClientHours - lastWeekClientHours).toFixed(1)} this week
            </span>
          </div>
        )}
      </div>

      {/* Secondary Metrics - Apple Complications Style */}
      <div className="grid grid-cols-2 gap-4">
        {/* Supervision */}
        <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <div className="w-8 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min((totalSupervisionHours / 50) * 100, 100)}%` }}
              />
            </div>
          </div>
          <div className="text-lg font-bold text-black dark:text-white">
            {totalSupervisionHours.toFixed(1)}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            Supervision Hours
          </div>
        </div>

        {/* Next Check-in */}
        <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <Calendar className={`h-5 w-5 ${
              daysToCheckIn && daysToCheckIn <= 7 
                ? 'text-orange-600 dark:text-orange-400' 
                : 'text-blue-600 dark:text-blue-400'
            }`} />
            <div className={`w-2 h-2 rounded-full ${
              daysToCheckIn && daysToCheckIn <= 7 
                ? 'bg-orange-500 animate-pulse' 
                : 'bg-blue-500'
            }`} />
          </div>
          <div className="text-lg font-bold text-black dark:text-white">
            {daysToCheckIn?.toString() || "—"}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            {daysToCheckIn ? (daysToCheckIn <= 7 ? "Days until due" : "Days to check-in") : "Not scheduled"}
          </div>
        </div>
      </div>
    </section>
  );
};
