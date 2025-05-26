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
    <div className="ive-card">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">AI Coaching</h3>
              <p className="text-sm text-muted-foreground">
                Personalized insights from your sessions
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={generateInsights}
            disabled={isLoading}
            className="ive-button opacity-60 hover:opacity-100"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        <div className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          ) : insights ? (
            <div className="space-y-4">
              {/* Jony Ive: Material depth with purposeful color psychology */}
              <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-xl hover:bg-blue-50/70 transition-colors duration-300">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-6 h-6 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Target className="h-3 w-3 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-blue-900 text-sm">This Week's Focus</h4>
                </div>
                <p className="text-blue-800 text-sm leading-relaxed">
                  {insights.weeklyFocus}
                </p>
              </div>

              <div className="bg-green-50/50 border border-green-100 p-5 rounded-xl hover:bg-green-50/70 transition-colors duration-300">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-6 h-6 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-green-900 text-sm">Skill Development</h4>
                </div>
                <p className="text-green-800 text-sm leading-relaxed">
                  {insights.skillDevelopmentTip}
                </p>
              </div>

              <div className="bg-amber-50/50 border border-amber-100 p-5 rounded-xl hover:bg-amber-50/70 transition-colors duration-300">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-6 h-6 bg-amber-500/10 rounded-lg flex items-center justify-center">
                    <Users className="h-3 w-3 text-amber-600" />
                  </div>
                  <h4 className="font-semibold text-amber-900 text-sm">Supervision Discussion</h4>
                </div>
                <p className="text-amber-800 text-sm leading-relaxed">
                  {insights.supervisionTopic}
                </p>
              </div>

              <div className="bg-purple-50/50 border border-purple-100 p-5 rounded-xl hover:bg-purple-50/70 transition-colors duration-300">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-6 h-6 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <Lightbulb className="h-3 w-3 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-purple-900 text-sm">Growth Insight</h4>
                </div>
                <p className="text-purple-800 text-sm leading-relaxed">
                  {insights.professionalGrowthInsight}
                </p>
              </div>

              {lastUpdated && (
                <div className="text-xs text-muted-foreground/60 text-center pt-3">
                  Last updated: {lastUpdated.toLocaleString()}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Brain className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground/70 mb-4 text-sm">
                Generate personalized insights from your sessions
              </p>
              <Button 
                onClick={generateInsights} 
                disabled={isLoading}
                className="ive-button"
                variant="outline"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate AI Insights
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};