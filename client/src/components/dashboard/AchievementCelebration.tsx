import { useState, useEffect } from "react";
import { useLogEntries, useInsightCards } from "@/hooks/use-firestore";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  Star, 
  Award,
  Target,
  Calendar,
  BookOpen,
  TrendingUp,
  Sparkles,
  PartyPopper
} from "lucide-react";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  unlocked: boolean;
  progress?: number;
  unlockedDate?: Date;
}

export const AchievementCelebration = () => {
  const { user, userProfile } = useAuth();
  const { entries: logEntries = [], loading } = useLogEntries();
  const { cards: insightCards = [] } = useInsightCards();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);

  const calculateAchievements = () => {
    const totalHours = logEntries.reduce((sum, entry) => sum + (entry.clientContactHours || 0), 0);
    const totalSessions = logEntries.length;
    const totalInsights = insightCards.length;
    const hasRecentActivity = logEntries.some(entry => 
      new Date(entry.dateOfContact) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    const allAchievements: Achievement[] = [
      {
        id: "first-session",
        title: "First Steps",
        description: "Logged your first counseling session",
        icon: Star,
        color: "text-yellow-500",
        unlocked: totalSessions >= 1,
        unlockedDate: totalSessions >= 1 ? new Date(logEntries[0]?.dateOfContact) : undefined
      },
      {
        id: "consistent-logger",
        title: "Consistent Professional",
        description: "Maintained regular session documentation",
        icon: Calendar,
        color: "text-blue-500",
        unlocked: totalSessions >= 5,
        progress: Math.min(100, (totalSessions / 5) * 100)
      },
      {
        id: "quarter-century",
        title: "Quarter Century",
        description: "Reached 25 client contact hours milestone",
        icon: Trophy,
        color: "text-amber-500",
        unlocked: totalHours >= 25,
        progress: Math.min(100, (totalHours / 25) * 100)
      },
      {
        id: "century-mark",
        title: "Century Achievement",
        description: "Completed 100 client contact hours",
        icon: Award,
        color: "text-purple-500",
        unlocked: totalHours >= 100,
        progress: Math.min(100, (totalHours / 100) * 100)
      },
      {
        id: "reflective-practitioner",
        title: "Reflective Practitioner",
        description: "Created multiple personal insights and reflections",
        icon: BookOpen,
        color: "text-green-500",
        unlocked: totalInsights >= 3,
        progress: Math.min(100, (totalInsights / 3) * 100)
      },
      {
        id: "growth-mindset",
        title: "Growth Mindset",
        description: "Consistently engaged in professional development",
        icon: TrendingUp,
        color: "text-indigo-500",
        unlocked: totalSessions >= 10 && totalInsights >= 2,
        progress: Math.min(100, ((totalSessions / 10) + (totalInsights / 2)) * 50)
      },
      {
        id: "dedicated-learner",
        title: "Dedicated Learner",
        description: "Maintained active learning and documentation",
        icon: Sparkles,
        color: "text-pink-500",
        unlocked: hasRecentActivity && totalSessions >= 3,
        progress: hasRecentActivity ? 100 : 75
      }
    ];

    // Check for newly unlocked achievements
    const previousAchievements = achievements;
    const newlyUnlocked = allAchievements.filter(achievement => 
      achievement.unlocked && 
      !previousAchievements.find(prev => prev.id === achievement.id && prev.unlocked)
    );

    setAchievements(allAchievements);
    
    if (newlyUnlocked.length > 0 && previousAchievements.length > 0) {
      setNewAchievements(newlyUnlocked);
      // Auto-hide new achievement notification after 5 seconds
      setTimeout(() => setNewAchievements([]), 5000);
    }
  };

  useEffect(() => {
    if (!loading) {
      calculateAchievements();
    }
  }, [logEntries.length, insightCards.length, loading]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  if (!logEntries.length && !loading) {
    return null; // Don't show achievements until user has some data
  }

  return (
    <>
      {/* New Achievement Celebration */}
      {newAchievements.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 animate-in slide-in-from-top-4 duration-500">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <PartyPopper className="h-8 w-8 text-yellow-500" />
              <div>
                <h3 className="font-bold text-yellow-800 dark:text-yellow-200">
                  Achievement Unlocked!
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  {newAchievements[0].title} - {newAchievements[0].description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievement Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-primary" />
              <span>Professional Achievements</span>
            </div>
            <Badge variant="outline">
              {unlockedCount}/{totalCount}
            </Badge>
          </CardTitle>
          <CardDescription>
            Celebrating your professional development milestones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement) => {
              const IconComponent = achievement.icon;
              
              return (
                <div 
                  key={achievement.id}
                  className={`p-4 rounded-lg border transition-all duration-200 ${
                    achievement.unlocked 
                      ? 'bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20' 
                      : 'bg-muted/50 border-muted opacity-60'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-full ${
                      achievement.unlocked ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      <IconComponent className={`h-4 w-4 ${
                        achievement.unlocked ? achievement.color : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-sm truncate">
                          {achievement.title}
                        </h4>
                        {achievement.unlocked && (
                          <Badge variant="secondary" className="ml-2">
                            <Star className="h-3 w-3 mr-1" />
                            Earned
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {achievement.description}
                      </p>
                      
                      {!achievement.unlocked && achievement.progress !== undefined && (
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div 
                            className="bg-primary h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${achievement.progress}%` }}
                          />
                        </div>
                      )}
                      
                      {achievement.unlocked && achievement.unlockedDate && (
                        <p className="text-xs text-primary font-medium">
                          Unlocked {achievement.unlockedDate.toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Achievement Progress</span>
              <span className="font-bold">{Math.round((unlockedCount / totalCount) * 100)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div 
                className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};