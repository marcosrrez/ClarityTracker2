import { useState, useEffect } from "react";
import { useLogEntries } from "@/hooks/use-firestore";
import { useAuth } from "@/hooks/use-auth";
import { generatePersonalizedDashboardInsights } from "@/lib/ai";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Target, 
  Lightbulb, 
  BookOpen, 
  Users,
  Sparkles,
  TrendingUp,
  RefreshCw
} from "lucide-react";

interface PersonalizedInsights {
  weeklyFocus: string;
  skillDevelopmentTip: string;
  supervisionTopic: string;
  professionalGrowthInsight: string;
}

export const PersonalizedAICoaching = () => {
  const { user, userProfile } = useAuth();
  const { entries: logEntries = [], loading } = useLogEntries();
  const [insights, setInsights] = useState<PersonalizedInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const generateInsights = async () => {
    if (!logEntries.length) return;
    
    setIsLoading(true);
    try {
      const result = await generatePersonalizedDashboardInsights(logEntries, userProfile);
      setInsights(result);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error generating insights:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate insights on component mount if we have entries
  useEffect(() => {
    if (logEntries.length > 0 && !insights && !loading) {
      generateInsights();
    }
  }, [logEntries.length, loading]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!logEntries.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>AI Coaching</span>
          </CardTitle>
          <CardDescription>Personalized guidance for your professional journey</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Add your first session notes to receive personalized AI coaching and insights.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span>AI Coaching</span>
            </CardTitle>
            <CardDescription>
              Personalized insights based on your recent sessions
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={generateInsights}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : insights ? (
          <div className="space-y-4">
            {/* Weekly Focus */}
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="h-4 w-4 text-blue-500" />
                <h4 className="font-semibold text-blue-700 dark:text-blue-300">This Week's Focus</h4>
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-200">
                {insights.weeklyFocus}
              </p>
            </div>

            {/* Skill Development */}
            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <h4 className="font-semibold text-green-700 dark:text-green-300">Skill Development</h4>
              </div>
              <p className="text-sm text-green-600 dark:text-green-200">
                {insights.skillDevelopmentTip}
              </p>
            </div>

            {/* Supervision Topic */}
            <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="h-4 w-4 text-amber-500" />
                <h4 className="font-semibold text-amber-700 dark:text-amber-300">Supervision Discussion</h4>
              </div>
              <p className="text-sm text-amber-600 dark:text-amber-200">
                {insights.supervisionTopic}
              </p>
            </div>

            {/* Growth Insight */}
            <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Lightbulb className="h-4 w-4 text-purple-500" />
                <h4 className="font-semibold text-purple-700 dark:text-purple-300">Growth Insight</h4>
              </div>
              <p className="text-sm text-purple-600 dark:text-purple-200">
                {insights.professionalGrowthInsight}
              </p>
            </div>

            {lastUpdated && (
              <div className="text-xs text-muted-foreground text-center pt-2">
                Last updated: {lastUpdated.toLocaleString()}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <Button onClick={generateInsights} disabled={isLoading}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate AI Insights
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};