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
      iconBg: "bg-primary/10",
    },
    {
      title: "Supervision Hours",
      value: totalSupervisionHours.toFixed(1),
      subtitle: "Total",
      change: `+${weeklySupervisionHours.toFixed(1)} this week`,
      icon: Users,
      iconColor: "text-accent",
      iconBg: "bg-accent/10",
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
      <h3 className="text-lg font-semibold text-foreground mb-4">Quick Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.iconBg}`}>
                  <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
                <span className="text-sm text-muted-foreground">{stat.subtitle}</span>
              </div>
              <h4 className="text-2xl font-bold text-foreground mb-1">{stat.value}</h4>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
              <div className="mt-3 flex items-center text-sm">
                <span className="text-accent font-medium">{stat.change}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
