import { Card, CardContent } from "@/components/ui/card";
import { Clock, Users, Calendar } from "lucide-react";
import { useLogEntries, useAppSettings } from "@/hooks/use-firestore";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export const QuickStatsGrid = () => {
  const { entries, loading: entriesLoading } = useLogEntries();
  const { settings, loading: settingsLoading } = useAppSettings();

  if (entriesLoading || settingsLoading) {
    return (
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">Quick Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <div className="flex items-center justify-center h-24">
                <LoadingSpinner />
              </div>
            </Card>
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

  // Calculate recent activity (this week)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentEntries = entries.filter(entry => new Date(entry.dateOfContact) >= weekAgo);
  const weeklyClientHours = recentEntries.reduce((sum, entry) => sum + entry.clientContactHours, 0);
  const weeklySupervisionHours = recentEntries.reduce((sum, entry) => sum + entry.supervisionHours, 0);

  const stats = [
    {
      title: "Client Contact Hours",
      value: totalClientHours.toFixed(1),
      subtitle: "Total",
      change: `+${weeklyClientHours.toFixed(1)} this week`,
      icon: Clock,
      iconColor: "text-primary",
      iconBg: "bg-primary/10 dark:bg-primary/20",
    },
    {
      title: "Supervision Hours",
      value: totalSupervisionHours.toFixed(1),
      subtitle: "Total",
      change: `+${weeklySupervisionHours.toFixed(1)} this week`,
      icon: Users,
      iconColor: "text-accent",
      iconBg: "bg-accent/10 dark:bg-accent/20",
    },
    {
      title: "Days to Check-in",
      value: daysToCheckIn?.toString() || "—",
      subtitle: "Next",
      change: daysToCheckIn ? "Supervision due" : "Not scheduled",
      icon: Calendar,
      iconColor: "text-yellow-500",
      iconBg: "bg-yellow-50 dark:bg-yellow-900/20",
    },
  ];

  return (
    <section className="mb-8">
      <h3 className="text-4xl md:text-5xl font-bold mb-8 text-black dark:text-white tracking-tight">Your Progress</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="backdrop-blur-sm bg-white/70 dark:bg-gray-800/70 rounded-3xl p-8 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105 relative overflow-hidden">
              {/* Subtle gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-indigo-50/30 pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-2xl backdrop-blur-sm">
                    <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">{stat.subtitle}</span>
                </div>
                <h4 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">{stat.value}</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{stat.title}</p>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-blue-600 dark:text-blue-400 font-medium">{stat.change}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
