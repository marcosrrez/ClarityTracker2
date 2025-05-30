
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trophy, AlertTriangle, Target, Sparkles, Calendar, Clock } from "lucide-react";
import { useLogEntries, useAppSettings } from "@/hooks/use-firestore";
import { updateAppSettings } from "@/lib/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { EnhancedProgressRing } from "./EnhancedProgressRing";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export const EnhancedProgressSection = () => {
  const { user } = useAuth();
  const { entries, loading: entriesLoading } = useLogEntries();
  const { settings, loading: settingsLoading, refetch: refetchSettings } = useAppSettings();
  const { toast } = useToast();
  
  const [ethicsHours, setEthicsHours] = useState("");
  const [savingEthics, setSavingEthics] = useState(false);

  if (entriesLoading || settingsLoading) {
    return (
      <section className="mb-8">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Licensure Progress</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <div className="h-32 bg-muted animate-pulse rounded" />
              </Card>
            ))}
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <div className="h-32 bg-muted animate-pulse rounded" />
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
  const goalTotalCCH = settings?.goals?.totalCCH || 4000;
  const goalDirectCCH = settings?.goals?.directCCH || 2000;
  const goalSupervisionHours = settings?.goals?.supervisionHours || 200;
  const goalEthicsHours = settings?.goals?.ethicsHours || 20;

  // Progress percentages
  const totalCCHProgress = Math.min((finalTotalCCH / goalTotalCCH) * 100, 100);
  const directCCHProgress = Math.min((finalDirectCCH / goalDirectCCH) * 100, 100);
  const supervisionProgress = Math.min((finalSupervisionHours / goalSupervisionHours) * 100, 100);
  const ethicsProgress = Math.min((finalEthicsHours / goalEthicsHours) * 100, 100);

  // Overall progress calculation
  const overallProgress = (totalCCHProgress + directCCHProgress + supervisionProgress + ethicsProgress) / 4;

  // Check milestones
  const hasReached1000CCH = finalTotalCCH >= 1000;
  const hasReached2000CCH = finalTotalCCH >= 2000;
  const hasReached3000CCH = finalTotalCCH >= 3000;
  
  // Check supervision alert
  const checkInInterval = settings?.licenseInfo?.supervisionCheckInInterval || 30;
  const lacDate = settings?.licenseInfo?.lacLicenseDate;
  const daysToCheckIn = lacDate 
    ? Math.max(0, checkInInterval - Math.floor((Date.now() - lacDate.getTime()) / (1000 * 60 * 60 * 24)) % checkInInterval)
    : null;
  const supervisionDue = daysToCheckIn !== null && daysToCheckIn <= 14;

  // Estimated completion date
  const recentEntries = entries.slice(-10);
  const avgHoursPerWeek = recentEntries.length > 0 
    ? (recentEntries.reduce((sum, entry) => sum + entry.clientContactHours, 0) / recentEntries.length) * 7
    : 0;
  const remainingHours = goalTotalCCH - finalTotalCCH;
  const estimatedWeeksToComplete = avgHoursPerWeek > 0 ? Math.ceil(remainingHours / avgHoursPerWeek) : null;

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
      color: "#3b82f6",
      icon: Clock,
    },
    {
      title: "Direct Client Contact Hours",
      current: finalDirectCCH,
      goal: goalDirectCCH,
      progress: directCCHProgress,
      remaining: Math.max(0, goalDirectCCH - finalDirectCCH),
      color: "#8b5cf6",
      icon: Target,
    },
    {
      title: "Supervision Hours",
      current: finalSupervisionHours,
      goal: goalSupervisionHours,
      progress: supervisionProgress,
      remaining: Math.max(0, goalSupervisionHours - finalSupervisionHours),
      color: "#10b981",
      icon: Calendar,
    },
  ];

  return (
    <section className="mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Licensure Progress</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Track your journey to becoming a Licensed Professional Counselor
            </p>
          </div>
          
          {/* Overall Progress Ring */}
          <div className="hidden md:block">
            <EnhancedProgressRing
              progress={overallProgress}
              size={100}
              color="#3b82f6"
            >
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {Math.round(overallProgress)}%
                </div>
                <div className="text-xs text-gray-500">Overall</div>
              </div>
            </EnhancedProgressRing>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Progress Cards - Enhanced Design */}
          <div className="space-y-6">
            {progressCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all duration-300"
                >
                  {/* Background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 rounded-2xl" style={{ backgroundColor: `${card.color}15` }}>
                          <Icon className="h-6 w-6" style={{ color: card.color }} />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-gray-900 dark:text-white">{card.title}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {card.current.toFixed(1)} of {card.goal} hours
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold" style={{ color: card.color }}>
                          {Math.round(card.progress)}%
                        </div>
                        <div className="text-xs text-gray-500">Complete</div>
                      </div>
                    </div>

                    {/* Enhanced Progress Bar */}
                    <div className="mb-4">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                        <motion.div 
                          className="h-4 rounded-full bg-gradient-to-r shadow-inner"
                          style={{
                            backgroundImage: `linear-gradient(90deg, ${card.color}99, ${card.color})`
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${card.progress}%` }}
                          transition={{ duration: 1, delay: index * 0.2, ease: "easeOut" }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">
                        {card.remaining.toFixed(1)} hours remaining
                      </span>
                      {card.progress >= 25 && (
                        <motion.span 
                          className="text-green-600 dark:text-green-400 font-semibold"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 1 }}
                        >
                          {card.progress >= 75 ? "Almost there! 🎯" : "Great progress! 👏"}
                        </motion.span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Motivation & Alerts - Enhanced */}
          <div className="space-y-6">
            {/* Completion Estimation */}
            {estimatedWeeksToComplete && remainingHours > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-3xl p-8 border border-blue-200 dark:border-blue-800 relative overflow-hidden"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      Estimated Completion
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 font-medium">
                      At your current pace of ~{avgHoursPerWeek.toFixed(1)} hours/week, 
                      you'll complete your licensure in approximately
                    </p>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {estimatedWeeksToComplete} weeks
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Keep up the momentum! 🚀
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Milestone Achievement */}
            {hasReached3000CCH ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-3xl p-8 border border-yellow-200 dark:border-yellow-800 relative overflow-hidden"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/40 rounded-2xl flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      Amazing Achievement! 🏆
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 font-medium">
                      You've completed over 3,000 client contact hours! You're in the final stretch 
                      of your LPC journey. Your dedication is truly inspiring.
                    </p>
                    <div className="text-sm text-yellow-600 dark:text-yellow-400 font-semibold">
                      You're a licensure champion! 🎉
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : hasReached2000CCH ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-3xl p-8 border border-purple-200 dark:border-purple-800"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-2xl flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      Halfway Champion! 🎯
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 font-medium">
                      Incredible! You've passed the 2,000-hour milestone. You're officially 
                      halfway to your LPC licensure goal!
                    </p>
                    <div className="text-sm text-purple-600 dark:text-purple-400 font-semibold">
                      The finish line is in sight! 💪
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : hasReached1000CCH && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-3xl p-8 border border-green-200 dark:border-green-800"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-2xl flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      First Milestone Reached! 🎉
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 font-medium">
                      Congratulations! You've completed over 1,000 client contact hours. 
                      You're making excellent progress toward your LPC licensure.
                    </p>
                    <div className="text-sm text-green-600 dark:text-green-400 font-semibold">
                      Keep up the great work! 🌟
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Supervision Alert */}
            {supervisionDue && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-3xl p-8 border border-orange-200 dark:border-orange-800"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/40 rounded-2xl flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      Supervision Check-in Due
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 font-medium">
                      Your next supervision session is due in {daysToCheckIn} days. 
                      Don't forget to schedule your meeting with your supervisor.
                    </p>
                    <Button 
                      size="sm" 
                      className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
                    >
                      Schedule Now
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Ethics Hours */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm"
            >
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-500" />
                <span>Renewal Requirements</span>
              </h4>
              
              <div className="space-y-6">
                <div>
                  <Label htmlFor="ethicsHours" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">
                    Ethics Hours
                  </Label>
                  <div className="flex space-x-3">
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
                      {savingEthics ? (
                        <>
                          <LoadingSpinner className="mr-2 h-4 w-4" />
                          Saving...
                        </>
                      ) : (
                        "Save"
                      )}
                    </Button>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-3 font-medium">
                    <span>Progress</span>
                    <span>{finalEthicsHours}/{goalEthicsHours} hours</span>
                  </div>
                  <div className="relative">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <motion.div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300 shadow-inner"
                        initial={{ width: 0 }}
                        animate={{ width: `${ethicsProgress}%` }}
                        transition={{ duration: 1, delay: 1 }}
                      />
                    </div>
                    {ethicsProgress >= 100 && (
                      <motion.div
                        className="absolute right-0 top-0 transform translate-x-2 -translate-y-1"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1.5, type: "spring" }}
                      >
                        <span className="text-green-500 text-lg">✨</span>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
