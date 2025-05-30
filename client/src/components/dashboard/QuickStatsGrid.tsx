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
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <EnhancedStatsCard
              title={stat.title}
              value={stat.value}
              subtitle={stat.subtitle}
              change={stat.change}
              changeLabel={stat.changeLabel}
              icon={stat.icon}
              iconColor={stat.iconColor}
              trend={stat.trend as "up" | "down" | "neutral"}
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
};
