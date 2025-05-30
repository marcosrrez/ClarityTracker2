import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLogEntries } from "@/hooks/use-firestore";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Target, 
  BarChart3, 
  Users, 
  BookOpen, 
  Sparkles, 
  Lock,
  Calendar,
  TrendingUp
} from "lucide-react";
import { Link } from "wouter";
import { useAccountType } from "@/hooks/use-account-type";
import { GuidedOnboardingOverlay } from "./GuidedOnboardingOverlay";
import { ConfettiCelebration } from "./ConfettiCelebration";
import { hapticFeedback } from "@/lib/haptics";

export const EnhancedDashboard = () => {
  const { entries } = useLogEntries();
  const { user, userProfile, updateUserProfile } = useAuth();
  const { accountType, isSupervisor } = useAccountType();
  const [showGuidedOverlay, setShowGuidedOverlay] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const totalHours = entries?.reduce((sum, entry) => sum + (entry.clientContactHours || 0), 0) || 0;
  const totalSupervisionHours = entries?.reduce((sum, entry) => sum + (entry.supervisionHours || 0), 0) || 0;

  // Check if user needs guided onboarding
  useEffect(() => {
    if (userProfile && !userProfile.hasCompletedOnboarding && entries?.length > 0) {
      setTimeout(() => {
        setShowGuidedOverlay(true);
      }, 1000);
    }
  }, [userProfile, entries]);

  const handleCompleteOnboarding = async () => {
    setShowGuidedOverlay(false);
    hapticFeedback.success();
    try {
      await updateUserProfile({ hasCompletedOnboarding: true });
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const getWelcomeMessage = () => {
    const displayName = userProfile?.displayName || userProfile?.preferredName || user?.displayName || "there";
    const timeOfDay = new Date().getHours();
    let greeting = "Good morning";
    if (timeOfDay >= 12 && timeOfDay < 17) greeting = "Good afternoon";
    if (timeOfDay >= 17) greeting = "Good evening";

    if (!userProfile?.hasCompletedOnboarding) {
      return `${greeting}, ${displayName}! Let's Get Started`;
    }

    if (isSupervisor) {
      return `${greeting}, ${displayName}! Ready to support your supervisees?`;
    }

    return `${greeting}, ${displayName}! Continue your LPC journey`;
  };

  const getQuickActions = () => {
    if (isSupervisor) {
      return [
        {
          title: "Add Supervision Session",
          description: "Record a supervision meeting",
          icon: Users,
          href: "/supervisees",
          color: "from-blue-500 to-blue-600",
          highlight: false
        },
        {
          title: "Review Compliance",
          description: "Check supervisee progress",
          icon: BarChart3,
          href: "/compliance",
          color: "from-green-500 to-green-600",
          highlight: false
        },
        {
          title: "Generate Reports",
          description: "Export supervision data",
          icon: BookOpen,
          href: "/reports",
          color: "from-purple-500 to-purple-600",
          highlight: false
        }
      ];
    }

    return [
      {
        title: "Log a Session",
        description: "Record your latest client session",
        icon: Plus,
        href: "/add-entry",
        color: "from-blue-500 to-blue-600",
        highlight: !userProfile?.hasCompletedOnboarding
      },
      {
        title: "View Progress",
        description: "Track your licensure journey",
        icon: Target,
        href: "/summary",
        color: "from-green-500 to-green-600",
        highlight: false
      },
      {
        title: "AI Insights",
        description: "Get personalized feedback",
        icon: BarChart3,
        href: "/ai-analysis",
        color: "from-purple-500 to-purple-600",
        highlight: false
      }
    ];
  };

  const quickActions = getQuickActions();

  return (
    <div className="space-y-6">
      {/* Enhanced Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="backdrop-blur-sm bg-gradient-to-r from-blue-50 via-white to-purple-50 border-0 shadow-xl">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-black">
                    {getWelcomeMessage()}
                  </h1>
                  {!userProfile?.hasCompletedOnboarding && (
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Sparkles className="w-6 h-6 text-yellow-500" />
                    </motion.div>
                  )}
                </div>
                <p className="text-gray-600">
                  {!userProfile?.hasCompletedOnboarding 
                    ? "You're on your way to becoming a Licensed Professional Counselor"
                    : isSupervisor
                    ? "Monitor supervisee progress and maintain compliance standards"
                    : "Track your progress toward Licensed Professional Counselor status"
                  }
                </p>
              </div>
              
              {!userProfile?.hasCompletedOnboarding && (
                <div className="text-right">
                  <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white mb-2">
                    Sample Session Added
                  </Badge>
                  <div className="text-sm text-gray-600">
                    <p>Hours Logged: 1/4000</p>
                    <Progress value={(1/4000) * 100} className="w-24 h-2 mt-1" />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Progress Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <Card className="backdrop-blur-sm bg-white/70">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Client Hours</h3>
            <p className="text-2xl font-bold text-blue-600">{totalHours}</p>
            <p className="text-sm text-gray-500">of 4000 required</p>
            <Progress value={(totalHours/4000) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-white/70">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Supervision Hours</h3>
            <p className="text-2xl font-bold text-green-600">{totalSupervisionHours}</p>
            <p className="text-sm text-gray-500">of 100 required</p>
            <Progress value={(totalSupervisionHours/100) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-white/70">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Progress</h3>
            <p className="text-2xl font-bold text-purple-600">
              {Math.round((totalHours/4000) * 100)}%
            </p>
            <p className="text-sm text-gray-500">toward LPC</p>
            <Progress value={(totalHours/4000) * 100} className="mt-2" />
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions with enhanced highlighting */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="backdrop-blur-sm bg-white/70">
          <CardHeader>
            <CardTitle>
              {!userProfile?.hasCompletedOnboarding ? "Your Next Step" : "Quick Actions"}
            </CardTitle>
            <CardDescription>
              {!userProfile?.hasCompletedOnboarding 
                ? "Log your first session to start tracking progress"
                : isSupervisor 
                ? "Manage your supervisees and track compliance"
                : "Continue your professional development journey"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link key={index} href={action.href}>
                    <motion.div
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="cursor-pointer"
                      onClick={() => hapticFeedback.light()}
                    >
                      <Card className={`hover:shadow-lg transition-all group ${
                        action.highlight ? 'ring-2 ring-blue-500 shadow-lg animate-pulse' : ''
                      }`}>
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <div className={`p-3 rounded-xl bg-gradient-to-r ${action.color} group-hover:scale-110 transition-transform`}>
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium mb-2 flex items-center gap-2">
                                {action.title}
                                {action.highlight && (
                                  <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                  >
                                    <Sparkles className="w-4 h-4 text-yellow-500" />
                                  </motion.div>
                                )}
                              </h3>
                              <p className="text-sm text-muted-foreground">{action.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Trust Signal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex items-center justify-center gap-2 text-gray-500 text-sm"
      >
        <Lock className="w-4 h-4" />
        <span>HIPAA-compliant & Encrypted</span>
      </motion.div>

      {/* Guided Onboarding Overlay */}
      {showGuidedOverlay && (
        <GuidedOnboardingOverlay 
          onComplete={handleCompleteOnboarding}
          onSkip={handleCompleteOnboarding}
        />
      )}

      {/* Confetti Celebration */}
      {showConfetti && (
        <ConfettiCelebration 
          totalHours={totalHours} 
          onDismiss={() => setShowConfetti(false)} 
        />
      )}
    </div>
  );
};