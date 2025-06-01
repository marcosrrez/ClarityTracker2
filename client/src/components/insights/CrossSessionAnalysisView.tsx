import { useState } from "react";
import { useLogEntries, useInsightCards } from "@/hooks/use-firestore";
import { useAuth } from "@/hooks/use-auth";
import { generateCrossSessionAnalysis, CrossSessionAnalysis } from "@/lib/ai";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  Target, 
  Lightbulb, 
  Eye, 
  BookOpen, 
  Star,
  Brain,
  Calendar,
  BarChart3,
  Sparkles,
  Plus
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "wouter";

export const CrossSessionAnalysisView = () => {
  const { user, userProfile } = useAuth();
  const { entries: logEntries = [], loading: isLoading } = useLogEntries();
  const { cards: insightCards = [], loading: cardsLoading } = useInsightCards();
  const [analysis, setAnalysis] = useState<CrossSessionAnalysis | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateAnalysis = async () => {
    if (!logEntries.length) {
      toast({
        title: "No Sessions Found",
        description: "Add some session notes first to generate cross-session analysis.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateCrossSessionAnalysis(logEntries, userProfile, insightCards);
      setAnalysis(result);
      toast({
        title: "Analysis Complete!",
        description: "Your cross-session pattern analysis has been generated.",
      });
    } catch (error) {
      console.error("Error generating analysis:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      if (errorMessage.includes('API key')) {
        toast({
          title: "API Configuration Required",
          description: "Google AI API access is needed for cross-session analysis. Please check your API key configuration.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Analysis Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading || cardsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const totalSessions = logEntries.length;
  const totalHours = logEntries.reduce((sum: number, entry: any) => sum + (entry.clientContactHours || 0), 0);
  const timeSpan = totalSessions > 1 ? 
    Math.ceil((new Date(logEntries[logEntries.length - 1].dateOfContact).getTime() - 
               new Date(logEntries[0].dateOfContact).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Cross-Session Pattern Analysis</h2>
          <p className="text-muted-foreground">
            Track your therapeutic identity development over time. Unlike session-by-session coaching, this analyzes patterns spanning weeks and months to prepare you for supervision meetings and identify your emerging professional strengths.
          </p>
        </div>
        <Button 
          onClick={generateAnalysis} 
          disabled={isGenerating || !totalSessions}
          className="rounded-xl font-medium h-12 px-6 transition-all duration-300"
        >
          {isGenerating ? "Analyzing..." : "Generate Analysis"}
        </Button>
      </div>

      {/* Longitudinal Development Metrics */}
      <TooltipProvider>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="p-4 cursor-help hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Practice Evolution</p>
                    <p className="text-lg font-bold text-foreground">
                      {(() => {
                        const timeSpan = totalSessions > 1 ? 
                          Math.ceil((new Date(logEntries[logEntries.length - 1].dateOfContact).getTime() - 
                                     new Date(logEntries[0].dateOfContact).getTime()) / (1000 * 60 * 60 * 24 * 7)) : 0;
                        return `${timeSpan}w`;
                      })()}
                    </p>
                  </div>
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
              </Card>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-medium">Practice Evolution Timeline</p>
              <p className="text-sm text-muted-foreground">
                {(() => {
                  const timeSpan = totalSessions > 1 ? 
                    Math.ceil((new Date(logEntries[logEntries.length - 1].dateOfContact).getTime() - 
                               new Date(logEntries[0].dateOfContact).getTime()) / (1000 * 60 * 60 * 24 * 7)) : 0;
                  if (timeSpan > 12) return "Great longitudinal data! You have sufficient session history for meaningful pattern analysis.";
                  if (timeSpan > 4) return "Good progress tracking. Continue documenting to build stronger pattern recognition.";
                  return "Keep documenting sessions to establish longitudinal patterns for supervision discussions.";
                })()}
              </p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="p-4 cursor-help hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Growth Insights</p>
                    <p className="text-lg font-bold text-foreground">
                      {(() => {
                        const growthKeywords = ['challenge', 'difficult', 'struggle', 'learn', 'improve', 'develop'];
                        return logEntries.filter((entry: any) => 
                          growthKeywords.some(keyword => 
                            entry.notes?.toLowerCase().includes(keyword) || 
                            entry.supervisionNotes?.toLowerCase().includes(keyword)
                          )
                        ).length;
                      })()}
                    </p>
                  </div>
                  <Target className="h-5 w-5 text-amber-500" />
                </div>
              </Card>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-medium">Growth Areas Documented</p>
              <p className="text-sm text-muted-foreground">
                {(() => {
                  const growthKeywords = ['challenge', 'difficult', 'struggle', 'learn', 'improve', 'develop'];
                  const growthEntries = logEntries.filter((entry: any) => 
                    growthKeywords.some(keyword => 
                      entry.notes?.toLowerCase().includes(keyword) || 
                      entry.supervisionNotes?.toLowerCase().includes(keyword)
                    )
                  );
                  const recentGrowth = growthEntries.slice(-3);
                  if (growthEntries.length === 0) return "No growth challenges documented yet. Consider reflecting on areas for development.";
                  if (growthEntries.length > 3) return `Active learning mindset! Recent growth areas include sessions where you've noted challenges and learning opportunities.`;
                  return `${growthEntries.length} sessions mention growth opportunities. Great self-awareness for professional development.`;
                })()}
              </p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="p-4 cursor-help hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Approach Consistency</p>
                    <p className="text-lg font-bold text-foreground">
                      {(() => {
                        const modalityKeywords = ['cbt', 'dbt', 'emdr', 'therapy', 'intervention', 'technique'];
                        const consistency = modalityKeywords.filter(keyword => 
                          logEntries.filter((entry: any) => 
                            entry.notes?.toLowerCase().includes(keyword) || 
                            entry.supervisionNotes?.toLowerCase().includes(keyword)
                          ).length >= 2
                        ).length;
                        return `${Math.min(consistency * 25, 100)}%`;
                      })()}
                    </p>
                  </div>
                  <Brain className="h-5 w-5 text-green-500" />
                </div>
              </Card>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-medium">Therapeutic Approach Development</p>
              <p className="text-sm text-muted-foreground">
                {(() => {
                  const modalityKeywords = ['cbt', 'dbt', 'emdr', 'therapy', 'intervention', 'technique'];
                  const consistency = modalityKeywords.filter(keyword => 
                    logEntries.filter((entry: any) => 
                      entry.notes?.toLowerCase().includes(keyword) || 
                      entry.supervisionNotes?.toLowerCase().includes(keyword)
                    ).length >= 2
                  ).length;
                  const percentage = Math.min(consistency * 25, 100);
                  if (percentage >= 75) return "Strong therapeutic identity emerging! You're consistently applying specific modalities and techniques.";
                  if (percentage >= 50) return "Good foundation developing. Continue exploring and documenting your preferred therapeutic approaches.";
                  return "Early stage of approach development. Document specific techniques and modalities you're learning to track your emerging style.";
                })()}
              </p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="p-4 cursor-help hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Supervision Readiness</p>
                    <p className="text-lg font-bold text-foreground">
                      {(() => {
                        const supervisionEntries = logEntries.filter((entry: any) => 
                          entry.supervisionType && entry.supervisionType !== 'none'
                        );
                        return supervisionEntries.length > 0 ? "Ready" : "Prepare";
                      })()}
                    </p>
                  </div>
                  <Eye className="h-5 w-5 text-purple-500" />
                </div>
              </Card>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-medium">Supervision Preparation Status</p>
              <p className="text-sm text-muted-foreground">
                {(() => {
                  const supervisionEntries = logEntries.filter((entry: any) => 
                    entry.supervisionType && entry.supervisionType !== 'none'
                  );
                  if (supervisionEntries.length > 0) {
                    return `You have ${supervisionEntries.length} documented supervision topics ready for discussion. Great preparation for meaningful supervision sessions.`;
                  }
                  return "Consider documenting specific cases or challenges you'd like to discuss in supervision. This helps maximize your supervision time.";
                })()}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* Authentic Pattern Analysis from Session Data */}
      {logEntries.length > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pattern Recognition */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-indigo-500" />
                  <span>Recurring Patterns</span>
                </CardTitle>
                <CardDescription>Themes emerging from your session notes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(() => {
                    // Extract most common themes from session notes
                    const commonWords = ['client', 'session', 'therapy', 'intervention', 'progress', 'challenge', 'boundary', 'rapport', 'assessment'];
                    const themes = commonWords.filter(word => 
                      logEntries.some((entry: any) => 
                        entry.notes?.toLowerCase().includes(word) || 
                        entry.supervisionNotes?.toLowerCase().includes(word)
                      )
                    ).slice(0, 4);
                    
                    return themes.length > 0 ? themes.map((theme, index) => (
                      <div key={index} className="bg-indigo-50 dark:bg-indigo-950/20 p-3 rounded-lg">
                        <p className="text-sm font-medium capitalize">{theme.replace('_', ' ')} Focus</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Mentioned in {logEntries.filter((entry: any) => 
                            entry.notes?.toLowerCase().includes(theme) || 
                            entry.supervisionNotes?.toLowerCase().includes(theme)
                          ).length} sessions
                        </p>
                      </div>
                    )) : (
                      <p className="text-sm text-muted-foreground">Add more session notes to identify patterns</p>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Supervision Preparation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  <span>Supervision Readiness</span>
                </CardTitle>
                <CardDescription>Areas to discuss in your next supervision</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(() => {
                    const supervisionEntries = logEntries.filter((entry: any) => 
                      entry.supervisionType && entry.supervisionType !== 'none'
                    );
                    
                    if (supervisionEntries.length === 0) {
                      return (
                        <p className="text-sm text-muted-foreground">No supervision sessions documented yet</p>
                      );
                    }

                    return supervisionEntries.slice(-3).map((entry: any, index: number) => (
                      <div key={index} className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                        <p className="text-sm font-medium">{entry.supervisionType?.replace('_', ' ').toUpperCase()}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(entry.dateOfContact).toLocaleDateString()}
                        </p>
                      </div>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Competency Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-amber-500" />
                  <span>Competency Development</span>
                </CardTitle>
                <CardDescription>Skills you're developing in practice</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(() => {
                    const competencyAreas = [
                      { name: 'Assessment Skills', keywords: ['assess', 'evaluation', 'screening'] },
                      { name: 'Intervention Techniques', keywords: ['intervention', 'technique', 'strategy'] },
                      { name: 'Therapeutic Relationship', keywords: ['rapport', 'alliance', 'relationship'] },
                      { name: 'Cultural Competence', keywords: ['cultural', 'diversity', 'background'] }
                    ];

                    const developedAreas = competencyAreas.filter(area => 
                      area.keywords.some(keyword =>
                        logEntries.some((entry: any) => 
                          entry.notes?.toLowerCase().includes(keyword) || 
                          entry.supervisionNotes?.toLowerCase().includes(keyword)
                        )
                      )
                    ).slice(0, 3);

                    return developedAreas.length > 0 ? developedAreas.map((area, index) => (
                      <div key={index} className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
                        <p className="text-sm font-medium">{area.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Evidence in your session documentation
                        </p>
                      </div>
                    )) : (
                      <p className="text-sm text-muted-foreground">Document more sessions to track competency development</p>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Professional Development Intelligence */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  <span>Growth Opportunities</span>
                </CardTitle>
                <CardDescription>Areas for continued development</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(() => {
                    const challengeKeywords = ['challenge', 'difficult', 'struggle', 'unclear', 'unsure'];
                    const challengeEntries = logEntries.filter((entry: any) => 
                      challengeKeywords.some(keyword => 
                        entry.notes?.toLowerCase().includes(keyword) || 
                        entry.supervisionNotes?.toLowerCase().includes(keyword)
                      )
                    );

                    if (challengeEntries.length === 0) {
                      return (
                        <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                          <p className="text-sm font-medium">Strong Confidence</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            No major challenges documented recently
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg">
                        <p className="text-sm font-medium">Growth Areas Identified</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {challengeEntries.length} sessions mention learning opportunities
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}



      {isGenerating && (
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="space-y-4">
              <Skeleton className="h-4 w-3/4 mx-auto" />
              <Skeleton className="h-4 w-1/2 mx-auto" />
              <p className="text-sm text-muted-foreground">
                Analyzing patterns across your sessions...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {analysis && (
        <div className="space-y-6">
          {/* Growth Trajectory */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <span>Professional Growth Trajectory</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {analysis.overallGrowthTrajectory}
              </p>
            </CardContent>
          </Card>

          {/* Key Sections Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recurring Themes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  <span>Recurring Themes</span>
                </CardTitle>
                <CardDescription>Patterns across your sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.recurringThemes.map((theme, index) => (
                    <Badge key={index} variant="secondary" className="mr-2 mb-2">
                      {theme}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Strengths Identified */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span>Core Strengths</span>
                </CardTitle>
                <CardDescription>Consistently demonstrated abilities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.strengthsIdentified.map((strength, index) => (
                    <div key={index} className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                      <p className="text-sm">{strength}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Progress Indicators */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-green-500" />
                  <span>Progress Indicators</span>
                </CardTitle>
                <CardDescription>Evidence of skill development</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.progressIndicators.map((indicator, index) => (
                    <div key={index} className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                      <p className="text-sm">{indicator}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Development Areas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-purple-500" />
                  <span>Development Areas</span>
                </CardTitle>
                <CardDescription>Focus areas for continued growth</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.developmentAreas.map((area, index) => (
                    <div key={index} className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg">
                      <p className="text-sm">{area}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pattern Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-indigo-500" />
                <span>Deep Pattern Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.patternInsights.map((insight, index) => (
                  <div key={index} className="bg-indigo-50 dark:bg-indigo-950/20 p-4 rounded-lg">
                    <p className="text-sm">{insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Personalized Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span>Personalized Recommendations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.personalizedRecommendations.map((rec, index) => (
                  <div key={index} className="border-l-4 border-primary pl-4">
                    <p className="text-sm">{rec}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Evolution Over Time */}
          {analysis.sessionToSessionEvolution.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  <span>Session-to-Session Evolution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.sessionToSessionEvolution.map((evolution, index) => (
                    <div key={index} className="bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-lg">
                      <p className="text-sm">{evolution}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Manual Data Analysis - Using Authentic Session Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-green-500" />
                <span>Your Session Data Overview</span>
              </CardTitle>
              <CardDescription>Authentic patterns from your logged sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Session Types Distribution */}
                {logEntries.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Session Types</h4>
                    {(() => {
                      const sessionTypes = logEntries.reduce((acc: any, entry: any) => {
                        const type = entry.supervisionType && entry.supervisionType !== 'none' 
                          ? 'Supervision' 
                          : entry.indirectHours 
                            ? 'Indirect Contact' 
                            : 'Direct Contact';
                        acc[type] = (acc[type] || 0) + 1;
                        return acc;
                      }, {});
                      
                      return Object.entries(sessionTypes).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <span className="text-sm">{type}</span>
                          <Badge variant="secondary">{count as number} sessions</Badge>
                        </div>
                      ));
                    })()}
                  </div>
                )}

                {/* Recent Activity Timeline */}
                {logEntries.slice(-5).length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Recent Activity</h4>
                    <div className="space-y-2">
                      {logEntries.slice(-5).reverse().map((entry: any, index: number) => (
                        <div key={entry.id || index} className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <Calendar className="h-4 w-4 text-blue-500 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium">
                                {new Date(entry.dateOfContact).toLocaleDateString()}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                {entry.clientContactHours}h
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                              {entry.notes.substring(0, 80)}...
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State with Better Guidance */}
      {totalSessions === 0 && !isLoading && (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Start Your Professional Journey
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Begin logging your sessions to unlock powerful pattern analysis and professional development insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link href="/add-entry">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Session
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};