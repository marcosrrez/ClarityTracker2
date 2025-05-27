import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trophy, AlertTriangle } from "lucide-react";
import { useLogEntries, useAppSettings } from "@/hooks/use-firestore";
import { updateAppSettings } from "@/lib/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const ProgressSection = () => {
  const { user } = useAuth();
  const { entries, loading: entriesLoading } = useLogEntries();
  const { settings, loading: settingsLoading, refetch: refetchSettings } = useAppSettings();
  const { toast } = useToast();
  
  const [ethicsHours, setEthicsHours] = useState("");
  const [savingEthics, setSavingEthics] = useState(false);

  if (entriesLoading || settingsLoading) {
    return (
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-6">Licensure Progress</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <div className="h-20 bg-muted animate-pulse rounded" />
              </Card>
            ))}
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <div className="h-20 bg-muted animate-pulse rounded" />
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Calculate progress from entries
  const totalClientHours = entries.reduce((sum, entry) => sum + entry.clientContactHours, 0);
  const directClientHours = entries.filter(entry => !entry.indirectHours).reduce((sum, entry) => sum + entry.clientContactHours, 0);
  const totalSupervisionHours = entries.reduce((sum, entry) => sum + entry.supervisionHours, 0);

  // Add imported hours
  const importedTotalCCH = settings?.importedHours?.totalCCH || 0;
  const importedDirectCCH = settings?.importedHours?.directCCH || 0;
  const importedSupervisionHours = settings?.importedHours?.supervisionHours || 0;
  const importedEthicsHours = settings?.importedHours?.ethicsHours || 0;

  const finalTotalCCH = totalClientHours + importedTotalCCH;
  const finalDirectCCH = directClientHours + importedDirectCCH;
  const finalSupervisionHours = totalSupervisionHours + importedSupervisionHours;
  const finalEthicsHours = importedEthicsHours;

  // Goals
  const goalTotalCCH = settings?.goals?.totalCCH || 2000;
  const goalDirectCCH = settings?.goals?.directCCH || 1500;
  const goalSupervisionHours = settings?.goals?.supervisionHours || 200;
  const goalEthicsHours = settings?.goals?.ethicsHours || 20;

  // Progress percentages
  const totalCCHProgress = Math.min((finalTotalCCH / goalTotalCCH) * 100, 100);
  const directCCHProgress = Math.min((finalDirectCCH / goalDirectCCH) * 100, 100);
  const supervisionProgress = Math.min((finalSupervisionHours / goalSupervisionHours) * 100, 100);
  const ethicsProgress = Math.min((finalEthicsHours / goalEthicsHours) * 100, 100);

  // Check milestones
  const hasReached1000CCH = finalTotalCCH >= 1000;
  
  // Check supervision alert
  const checkInInterval = settings?.licenseInfo?.supervisionCheckInInterval || 30;
  const lacDate = settings?.licenseInfo?.lacLicenseDate;
  const daysToCheckIn = lacDate 
    ? Math.max(0, checkInInterval - Math.floor((Date.now() - lacDate.getTime()) / (1000 * 60 * 60 * 24)) % checkInInterval)
    : null;
  const supervisionDue = daysToCheckIn !== null && daysToCheckIn <= 14;

  const handleSaveEthics = async () => {
    if (!user) return;
    
    const hours = parseFloat(ethicsHours);
    if (isNaN(hours) || hours < 0) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid number of hours",
        variant: "destructive",
      });
      return;
    }

    try {
      setSavingEthics(true);
      await updateAppSettings(user.uid, {
        importedHours: {
          supervisionHours: settings?.importedHours?.supervisionHours ?? 0,
          totalCCH: settings?.importedHours?.totalCCH ?? 0,
          directCCH: settings?.importedHours?.directCCH ?? 0,
          ethicsHours: hours,
        },
      });
      await refetchSettings();
      setEthicsHours("");
      toast({
        title: "Ethics hours saved",
        description: "Your ethics hours have been updated successfully",
      });
    } catch (error) {
      console.error("Error saving ethics hours:", error);
      toast({
        title: "Error",
        description: "Failed to save ethics hours",
        variant: "destructive",
      });
    } finally {
      setSavingEthics(false);
    }
  };

  const progressCards = [
    {
      title: "Total Client Contact Hours",
      current: finalTotalCCH,
      goal: goalTotalCCH,
      progress: totalCCHProgress,
      remaining: Math.max(0, goalTotalCCH - finalTotalCCH),
      color: "bg-primary",
    },
    {
      title: "Direct Client Contact Hours",
      current: finalDirectCCH,
      goal: goalDirectCCH,
      progress: directCCHProgress,
      remaining: Math.max(0, goalDirectCCH - finalDirectCCH),
      color: "bg-accent",
    },
    {
      title: "Supervision Hours",
      current: finalSupervisionHours,
      goal: goalSupervisionHours,
      progress: supervisionProgress,
      remaining: Math.max(0, goalSupervisionHours - finalSupervisionHours),
      color: "bg-green-500",
    },
  ];

  return (
    <section className="mb-8">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Licensure Progress</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Progress Cards - Notion Style */}
        <div className="space-y-6">
          {progressCards.map((card, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">{card.title}</h4>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(card.progress)}%
                </span>
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">
                  <span>{card.current.toFixed(1)} hours</span>
                  <span>Goal: {card.goal}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${
                      index === 0 ? 'bg-blue-500' : 
                      index === 1 ? 'bg-purple-500' : 
                      'bg-green-500'
                    }`}
                    style={{ width: `${card.progress}%` }}
                  ></div>
                </div>
              </div>
              <p className="text-sm text-gray-500 font-medium">
                {card.remaining.toFixed(1)} hours remaining to reach your goal
              </p>
            </div>
          ))}
        </div>

        {/* Motivation & Alerts - Notion Style */}
        <div className="space-y-6">
          {/* Milestone Achievement */}
          {hasReached1000CCH && (
            <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm relative overflow-hidden">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Milestone Reached!</h4>
                  <p className="text-sm text-gray-600 mb-3 font-medium">
                    Congratulations! You've completed over 1,000 client contact hours. You're making excellent progress toward your LPC licensure.
                  </p>
                  <div className="text-sm text-green-600 font-semibold">Keep up the great work!</div>
                </div>
              </div>
            </div>
          )}

          {/* Supervision Alert */}
          {supervisionDue && (
            <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm relative overflow-hidden">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-orange-500" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Supervision Check-in Due</h4>
                  <p className="text-sm text-gray-600 mb-4 font-medium">
                    Your next supervision session is due in {daysToCheckIn} days. Don't forget to schedule your meeting with your supervisor.
                  </p>
                  <Button 
                    size="sm" 
                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
                  >
                    Schedule Now
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Ethics Hours */}
          <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm relative overflow-hidden">
            <h4 className="text-lg font-bold text-gray-900 mb-6">Renewal Requirements</h4>
            <div className="space-y-4">
              <div>
                <Label htmlFor="ethicsHours" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Ethics Hours
                </Label>
                <div className="flex space-x-3 mt-2">
                  <Input
                    id="ethicsHours"
                    type="number"
                    placeholder="0"
                    value={ethicsHours}
                    onChange={(e) => setEthicsHours(e.target.value)}
                    min="0"
                    step="0.5"
                    className="rounded-xl border-gray-200"
                  />
                  <Button 
                    onClick={handleSaveEthics}
                    disabled={savingEthics}
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
                  >
                    {savingEthics ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2 font-medium">
                  <span>Progress</span>
                  <span>{finalEthicsHours}/{goalEthicsHours} hours</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${ethicsProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
