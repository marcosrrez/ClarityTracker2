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
  Sparkles
} from "lucide-react";

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
      toast({
        title: "Analysis Failed",
        description: "Unable to generate cross-session analysis. Please try again.",
        variant: "destructive",
      });
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
            AI-powered insights across your professional development journey
          </p>
        </div>
        <Button 
          onClick={generateAnalysis} 
          disabled={isGenerating || !totalSessions}
          className="min-w-32"
        >
          {isGenerating ? "Analyzing..." : "Generate Analysis"}
        </Button>
      </div>

      {/* Session Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{totalSessions}</p>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{totalHours}h</p>
                <p className="text-sm text-muted-foreground">Client Contact Hours</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{insightCards.length}</p>
                <p className="text-sm text-muted-foreground">Insight Cards</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{timeSpan}</p>
                <p className="text-sm text-muted-foreground">Days Tracked</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {!analysis && !isGenerating && totalSessions > 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ready for Deep Analysis</h3>
            <p className="text-muted-foreground mb-4">
              Generate comprehensive insights across your {totalSessions} sessions and {insightCards.length} insight cards.
              The AI will analyze all your session notes, previous analyses, and personal reflections for deep pattern discovery.
            </p>
            <Button onClick={generateAnalysis}>
              <Sparkles className="h-4 w-4 mr-2" />
              Analyze My Journey
            </Button>
          </CardContent>
        </Card>
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
        </div>
      )}
    </div>
  );
};