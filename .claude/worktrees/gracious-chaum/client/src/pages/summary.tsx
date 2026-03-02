import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Calendar, Clock, Users, Target, TrendingUp, Award } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { useLogEntries, useAppSettings } from "@/hooks/use-firestore";

export default function SummaryPage() {
  const { entries, loading: entriesLoading } = useLogEntries();
  const { settings, loading: settingsLoading } = useAppSettings();

  if (entriesLoading || settingsLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Summary</h1>
          <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
        </div>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  // Calculate totals from entries
  const totalClientHours = entries.reduce((sum, entry) => sum + entry.clientContactHours, 0);
  const directClientHours = entries.filter(entry => !entry.indirectHours).reduce((sum, entry) => sum + entry.clientContactHours, 0);
  const indirectClientHours = entries.filter(entry => entry.indirectHours).reduce((sum, entry) => sum + entry.clientContactHours, 0);
  const totalSupervisionHours = entries.reduce((sum, entry) => sum + entry.supervisionHours, 0);

  // Add imported hours
  const importedTotalCCH = settings?.importedHours?.totalCCH || 0;
  const importedDirectCCH = settings?.importedHours?.directCCH || 0;
  const importedSupervisionHours = settings?.importedHours?.supervisionHours || 0;
  const importedEthicsHours = settings?.importedHours?.ethicsHours || 0;

  const finalTotalCCH = totalClientHours + importedTotalCCH;
  const finalDirectCCH = directClientHours + importedDirectCCH;
  const finalIndirectCCH = indirectClientHours + (importedTotalCCH - importedDirectCCH);
  const finalSupervisionHours = totalSupervisionHours + importedSupervisionHours;

  // Goals
  const goalTotalCCH = settings?.goals?.totalCCH || 2000;
  const goalDirectCCH = settings?.goals?.directCCH || 1500;
  const goalSupervisionHours = settings?.goals?.supervisionHours || 200;
  const goalEthicsHours = settings?.goals?.ethicsHours || 20;

  // Calculate progress percentages
  const totalCCHProgress = Math.min((finalTotalCCH / goalTotalCCH) * 100, 100);
  const directCCHProgress = Math.min((finalDirectCCH / goalDirectCCH) * 100, 100);
  const supervisionProgress = Math.min((finalSupervisionHours / goalSupervisionHours) * 100, 100);
  const ethicsProgress = Math.min((importedEthicsHours / goalEthicsHours) * 100, 100);

  // Calculate time-based summaries
  const now = new Date();
  const thisMonth = entries.filter(entry => {
    const entryDate = new Date(entry.dateOfContact);
    return entryDate >= startOfMonth(now) && entryDate <= endOfMonth(now);
  });
  const thisYear = entries.filter(entry => {
    const entryDate = new Date(entry.dateOfContact);
    return entryDate >= startOfYear(now) && entryDate <= endOfYear(now);
  });

  const monthlyClientHours = thisMonth.reduce((sum, entry) => sum + entry.clientContactHours, 0);
  const monthlySupervisionHours = thisMonth.reduce((sum, entry) => sum + entry.supervisionHours, 0);
  const yearlyClientHours = thisYear.reduce((sum, entry) => sum + entry.clientContactHours, 0);
  const yearlySupervisionHours = thisYear.reduce((sum, entry) => sum + entry.supervisionHours, 0);

  // Supervision type breakdown
  const supervisionBreakdown = entries.reduce((acc, entry) => {
    if (entry.supervisionHours > 0 && entry.supervisionType !== "none") {
      acc[entry.supervisionType] = (acc[entry.supervisionType] || 0) + entry.supervisionHours;
    }
    return acc;
  }, {} as Record<string, number>);

  // Calculate ratios and insights
  const directToIndirectRatio = finalIndirectCCH > 0 ? (finalDirectCCH / finalIndirectCCH).toFixed(1) : "N/A";
  const averageSessionLength = entries.length > 0 ? (totalClientHours / entries.length).toFixed(1) : "0";
  const hoursToGoal = Math.max(0, goalTotalCCH - finalTotalCCH);

  const summaryCards = [
    {
      title: "Total Progress",
      value: `${finalTotalCCH.toFixed(1)} / ${goalTotalCCH}`,
      subtitle: "Client Contact Hours",
      progress: totalCCHProgress,
      icon: Target,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Direct Hours",
      value: `${finalDirectCCH.toFixed(1)} / ${goalDirectCCH}`,
      subtitle: "Face-to-face counseling",
      progress: directCCHProgress,
      icon: Clock,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/20"
    },
    {
      title: "Supervision",
      value: `${finalSupervisionHours.toFixed(1)} / ${goalSupervisionHours}`,
      subtitle: "Supervision hours",
      progress: supervisionProgress,
      icon: Users,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-900/20"
    },
    {
      title: "Ethics Hours",
      value: `${importedEthicsHours.toFixed(1)} / ${goalEthicsHours}`,
      subtitle: "Professional ethics training",
      progress: ethicsProgress,
      icon: Award,
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-900/20"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Progress Summary
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Comprehensive overview of your professional development progress and achievements toward licensure.
        </p>
      </div>

      {/* Main Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(card.progress)}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h3 className="font-semibold text-foreground">{card.title}</h3>
                  <p className="text-2xl font-bold text-foreground">{card.value}</p>
                  <p className="text-sm text-muted-foreground">{card.subtitle}</p>
                </div>
                <Progress value={card.progress} className="h-2" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hours Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Hours Breakdown</CardTitle>
            <CardDescription>
              Detailed analysis of your logged hours
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Client Contact Hours</span>
                <span className="font-semibold">{finalTotalCCH.toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center text-sm ml-4">
                <span className="text-muted-foreground">• Direct Hours</span>
                <span>{finalDirectCCH.toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center text-sm ml-4">
                <span className="text-muted-foreground">• Indirect Hours</span>
                <span>{finalIndirectCCH.toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Supervision Hours</span>
                <span className="font-semibold">{finalSupervisionHours.toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Ethics Hours</span>
                <span className="font-semibold">{importedEthicsHours.toFixed(1)}</span>
              </div>
            </div>

            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Direct/Indirect Ratio</span>
                <span>{directToIndirectRatio}:1</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Average Session Length</span>
                <span>{averageSessionLength} hours</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Hours to Goal</span>
                <span>{hoursToGoal.toFixed(1)} hours</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time-Based Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Summary</CardTitle>
            <CardDescription>
              Recent activity and supervision breakdown
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-foreground mb-2">This Month</h4>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Client Hours</span>
                  <span>{monthlyClientHours.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Supervision Hours</span>
                  <span>{monthlySupervisionHours.toFixed(1)}</span>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-2">This Year</h4>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Client Hours</span>
                  <span>{yearlyClientHours.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Supervision Hours</span>
                  <span>{yearlySupervisionHours.toFixed(1)}</span>
                </div>
              </div>

              {Object.keys(supervisionBreakdown).length > 0 && (
                <div>
                  <h4 className="font-medium text-foreground mb-2">Supervision Types</h4>
                  {Object.entries(supervisionBreakdown).map(([type, hours]) => (
                    <div key={type} className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground capitalize">• {type}</span>
                      <span>{hours.toFixed(1)} hours</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <span>Recent Activity</span>
          </CardTitle>
          <CardDescription>
            Your most recent log entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No log entries yet. Start by adding your first entry!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.slice(0, 5).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">
                      {entry.clientContactHours} hours {entry.indirectHours ? "(Indirect)" : "(Direct)"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(entry.dateOfContact), "MMM dd, yyyy")}
                      {entry.supervisionHours > 0 && ` • ${entry.supervisionHours}h supervision`}
                    </p>
                  </div>
                  <Badge variant={entry.indirectHours ? "secondary" : "default"}>
                    {entry.indirectHours ? "Indirect" : "Direct"}
                  </Badge>
                </div>
              ))}
              {entries.length > 5 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  And {entries.length - 5} more entries...
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
