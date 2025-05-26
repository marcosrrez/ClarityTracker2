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
          ...settings?.importedHours,
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
      <h3 className="text-lg font-semibold text-foreground mb-6">Licensure Progress</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Progress Cards */}
        <div className="space-y-6">
          {progressCards.map((card, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-foreground">{card.title}</h4>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(card.progress)}%
                  </span>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-sm text-muted-foreground mb-1">
                    <span>{card.current.toFixed(1)}</span>
                    <span>{card.goal}</span>
                  </div>
                  <Progress value={card.progress} className="h-2" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {card.remaining.toFixed(1)} hours remaining
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Motivation & Alerts */}
        <div className="space-y-6">
          {/* Milestone Achievement */}
          {hasReached1000CCH && (
            <Card className="bg-gradient-to-br from-accent/10 to-green-50 dark:from-accent/10 dark:to-green-900/20 border-accent/30">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-accent/20 rounded-lg">
                    <Trophy className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Milestone Reached!</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Congratulations! You've completed over 1,000 client contact hours. You're making excellent progress toward your LPC licensure.
                    </p>
                    <div className="text-xs text-accent font-medium">🎉 Keep up the great work!</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Supervision Alert */}
          {supervisionDue && (
            <Alert className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-700">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <h4 className="font-semibold">Supervision Check-in Due</h4>
                  <p className="text-sm">
                    Your next supervision session is due in {daysToCheckIn} days. Don't forget to schedule your meeting with your supervisor.
                  </p>
                  <Button size="sm" variant="outline" className="mt-2">
                    Schedule Now
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Ethics Hours */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-semibold text-foreground mb-4">Renewal Requirements</h4>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="ethicsHours" className="text-sm font-medium">
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
                    />
                    <Button 
                      onClick={handleSaveEthics}
                      disabled={savingEthics}
                    >
                      {savingEthics ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>{finalEthicsHours}/{goalEthicsHours} hours</span>
                  </div>
                  <Progress value={ethicsProgress} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
