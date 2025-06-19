import { useState, useEffect } from "react";
import { useLogEntries } from "@/hooks/use-firestore";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
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
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Award
} from "lucide-react";

// Session Insight Card type for unified MyMind experience
interface SessionInsightCard {
  id: string;
  userId: string;
  sessionRecordingId?: string;
  title: string;
  content: string;
  cardStyle: 'coaching' | 'growth' | 'supervision' | 'risk' | 'achievement';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
}

interface PersonalizedInsights {
  weeklyFocus: string;
  skillDevelopmentTip: string;
  supervisionTopic: string;
  professionalGrowthInsight: string;
  therapyProfileInsight?: string;
  competencyFocus?: string;
  patternAlert?: string;
}

interface SessionInsightCard {
  id: string;
  type: string;
  title: string;
  content: string;
  cardStyle: 'coaching' | 'learning' | 'supervision' | 'growth' | 'risk' | 'achievement';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  sourceType: string;
  sessionRecordingId?: string;
  metadata?: any;
  createdAt: string;
  helpful?: boolean;
  actionTaken?: string;
}

export const PersonalizedAICoaching = () => {
  const { user, userProfile } = useAuth();
  const { entries: logEntries = [], loading } = useLogEntries();
  const [insights, setInsights] = useState<PersonalizedInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch enhanced coaching insights from Clinical Intelligence Platform
  const { data: enhancedInsights, isLoading: enhancedLoading } = useQuery({
    queryKey: ['/api/ai/enhanced-coaching-insights', user?.uid],
    enabled: !!user?.uid,
    refetchInterval: 60000, // Real-time updates from session analyses
  });

  // Fetch session recording insight cards for unified MyMind experience
  const { data: sessionInsightCards, isLoading: cardsLoading, refetch: refetchCards } = useQuery({
    queryKey: ['/api/my-mind/insight-cards', user?.uid],
    enabled: !!user?.uid,
    refetchInterval: 30000, // Frequent updates for new session insights
  });

  const generateInsights = async () => {
    if (!logEntries.length || !user) return;
    
    setIsLoading(true);
    try {
      // Use enhanced insights from Clinical Intelligence Platform if available
      if (enhancedInsights && !enhancedLoading) {
        setInsights(enhancedInsights);
        setLastUpdated(new Date());
        setIsLoading(false);
        return;
      }
      
      // Fallback to traditional AI insights
      const result = await generatePersonalizedDashboardInsights(logEntries, userProfile);
      setInsights(result);
      setLastUpdated(new Date());
      
      // Store insights in history for future reference
      try {
        await fetch('/api/ai/insights-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.uid,
            insightType: 'coaching',
            title: 'Weekly AI Coaching Insights',
            content: `Focus: ${result.weeklyFocus} | Skill Development: ${result.skillDevelopmentTip} | Supervision Topic: ${result.supervisionTopic}`,
            sourceType: 'dashboard_coaching',
            sourceData: result,
            metadata: {
              sessionsAnalyzed: logEntries.length,
              triggerConditions: ['dashboard_refresh']
            }
          })
        });
      } catch (storageError) {
        console.log('Note: Insights generated but not stored for history viewing');
      }
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
                      <Lightbulb className="h-5 w-5 text-purple-600" />
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">AI Insights Available</h4>
                        <p className="text-gray-600 dark:text-gray-300 text-xs">
                          {4 + (insights.therapyProfileInsight ? 1 : 0) + (insights.competencyFocus ? 1 : 0) + (insights.patternAlert ? 1 : 0)} personalized recommendations ready
                        </p>
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

                  {/* Session Recording Insight Cards */}
                  {sessionInsightCards?.cards && sessionInsightCards.cards.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 mt-6">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <h4 className="font-semibold text-gray-900 text-sm">Session Insights</h4>
                        <Badge variant="outline" className="text-xs">From Recordings</Badge>
                      </div>
                      {sessionInsightCards.cards.slice(0, 3).map((card: SessionInsightCard) => (
                        <div 
                          key={card.id}
                          className={`p-6 rounded-2xl border transition-colors duration-200 ${
                            card.cardStyle === 'risk' ? 'bg-red-50 border-red-200 hover:bg-red-100' :
                            card.cardStyle === 'growth' ? 'bg-green-50 border-green-200 hover:bg-green-100' :
                            card.cardStyle === 'supervision' ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100' :
                            card.cardStyle === 'achievement' ? 'bg-purple-50 border-purple-200 hover:bg-purple-100' :
                            'bg-blue-50 border-blue-200 hover:bg-blue-100'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                card.cardStyle === 'risk' ? 'bg-red-100' :
                                card.cardStyle === 'growth' ? 'bg-green-100' :
                                card.cardStyle === 'supervision' ? 'bg-yellow-100' :
                                card.cardStyle === 'achievement' ? 'bg-purple-100' :
                                'bg-blue-100'
                              }`}>
                                {card.cardStyle === 'risk' ? <AlertTriangle className="h-4 w-4 text-red-500" /> :
                                 card.cardStyle === 'growth' ? <TrendingUp className="h-4 w-4 text-green-500" /> :
                                 card.cardStyle === 'supervision' ? <Users className="h-4 w-4 text-yellow-600" /> :
                                 card.cardStyle === 'achievement' ? <Award className="h-4 w-4 text-purple-500" /> :
                                 <Lightbulb className="h-4 w-4 text-blue-500" />}
                              </div>
                              <div>
                                <h5 className="font-bold text-gray-900 text-sm">{card.title}</h5>
                                {card.priority === 'urgent' && (
                                  <Badge variant="destructive" className="text-xs mt-1">Urgent</Badge>
                                )}
                                {card.priority === 'high' && (
                                  <Badge variant="secondary" className="text-xs mt-1">High Priority</Badge>
                                )}
                              </div>
                            </div>
                            {card.sessionRecordingId && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-xs"
                                onClick={() => {
                                  // Navigate to session recording view
                                  console.log('View session:', card.sessionRecordingId);
                                }}
                              >
                                View Session
                              </Button>
                            )}
                          </div>
                          <p className="text-gray-700 text-sm leading-relaxed font-medium">
                            {card.content}
                          </p>
                          <div className="flex items-center justify-between mt-4">
                            <span className="text-xs text-gray-500">
                              {new Date(card.createdAt).toLocaleDateString()}
                            </span>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-xs"
                                onClick={async () => {
                                  await fetch(`/api/my-mind/insight-cards/${card.id}/feedback`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ helpful: true })
                                  });
                                  await refetchCards();
                                }}
                              >
                                👍 Helpful
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-xs"
                                onClick={async () => {
                                  await fetch(`/api/my-mind/insight-cards/${card.id}/feedback`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ helpful: false })
                                  });
                                  await refetchCards();
                                }}
                              >
                                👎 Not Helpful
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {sessionInsightCards.cards.length > 3 && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            // Navigate to full MyMind view
                            window.location.href = '/insights';
                          }}
                        >
                          View All {sessionInsightCards.cards.length} Session Insights
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Intelligence Hub Enhanced Insights */}
                  {insights.therapyProfileInsight && (
                    <div className="bg-indigo-50 border border-indigo-200 p-6 rounded-2xl hover:bg-indigo-100 transition-colors duration-200">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center">
                          <Lightbulb className="h-4 w-4 text-indigo-500" />
                        </div>
                        <h4 className="font-bold text-gray-900 text-base">Therapy Profile</h4>
                        <Badge variant="secondary" className="text-xs">Intelligence</Badge>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed font-medium">
                        {insights.therapyProfileInsight}
                      </p>
                    </div>
                  )}

                  {insights.competencyFocus && (
                    <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl hover:bg-emerald-100 transition-colors duration-200">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center">
                          <Award className="h-4 w-4 text-emerald-500" />
                        </div>
                        <h4 className="font-bold text-gray-900 text-base">Competency Focus</h4>
                        <Badge variant="secondary" className="text-xs">Intelligence</Badge>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed font-medium">
                        {insights.competencyFocus}
                      </p>
                    </div>
                  )}

                  {insights.patternAlert && (
                    <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl hover:bg-amber-100 transition-colors duration-200">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        </div>
                        <h4 className="font-bold text-gray-900 text-base">Pattern Alert</h4>
                        <Badge variant="secondary" className="text-xs">Intelligence</Badge>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed font-medium">
                        {insights.patternAlert}
                      </p>
                    </div>
                  )}
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
              <Lightbulb className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
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