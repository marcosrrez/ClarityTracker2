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
  RefreshCw,
  Brain,
  ChevronDown,
  ChevronUp
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
  const [isExpanded, setIsExpanded] = useState(false);

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
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-purple-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">AI Coaching</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                {insights ? 'Smart insights ready' : 'Personalized insights from your sessions'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={generateInsights}
              disabled={isLoading}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            {insights && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
        
        <div className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          ) : insights ? (
            <div>
              {/* Compact Summary View */}
              {!isExpanded && (
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-4 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Brain className="h-5 w-5 text-purple-600" />
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">AI Insights Available</h4>
                        <p className="text-gray-600 dark:text-gray-300 text-xs">4 personalized recommendations ready</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsExpanded(true)}
                      className="text-purple-600 hover:text-purple-700 hover:bg-purple-100 rounded-xl text-xs"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Expanded Detailed View */}
              {isExpanded && (
                <div className="space-y-4">
                  <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                        <Target className="h-4 w-4 text-blue-500" />
                      </div>
                      <h4 className="font-bold text-gray-900 text-base">This Week's Focus</h4>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed font-medium">
                      {insights.weeklyFocus}
                    </p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </div>
                      <h4 className="font-bold text-gray-900 text-base">Skill Development</h4>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed font-medium">
                      {insights.skillDevelopmentTip}
                    </p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-purple-500" />
                      </div>
                      <h4 className="font-bold text-gray-900 text-base">Supervision Discussion</h4>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed font-medium">
                      {insights.supervisionTopic}
                    </p>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center">
                        <Lightbulb className="h-4 w-4 text-orange-500" />
                      </div>
                      <h4 className="font-bold text-gray-900 text-base">Growth Insight</h4>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed font-medium">
                      {insights.professionalGrowthInsight}
                    </p>
                  </div>
                </div>
              )}

              {lastUpdated && (
                <div className="text-xs text-gray-400 text-center pt-3">
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