import { useState, useMemo } from "react";
import { useLogEntries, useInsightCards } from "@/hooks/use-firestore";
import { useAuth } from "@/hooks/use-auth";
import { generateCrossSessionAnalysis, CrossSessionAnalysis } from "@/lib/ai";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  Target, 
  Lightbulb, 
  Eye, 
  BarChart3,
  Sparkles,
  Lock,
  Calendar,
  Brain,
  CheckCircle
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";

interface MilestoneData {
  milestone: number;
  title: string;
  description: string;
  unlocked: boolean;
  analysisType: 'first-milestone' | 'comparative' | 'advanced';
}

export const CrossSessionInsights = () => {
  const { user, userProfile } = useAuth();
  const { entries: logEntries = [], loading: isLoading } = useLogEntries();
  const { cards: insightCards = [], loading: cardsLoading } = useInsightCards();
  const [analysis, setAnalysis] = useState<CrossSessionAnalysis | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const totalSessions = logEntries.length;

  // Define progressive milestones
  const milestones: MilestoneData[] = useMemo(() => [
    {
      milestone: 10,
      title: "First Pattern Recognition",
      description: "Identify your emerging therapeutic style and early patterns",
      unlocked: totalSessions >= 10,
      analysisType: 'first-milestone'
    },
    {
      milestone: 25,
      title: "Growth Trajectory Analysis", 
      description: "Compare last 15 sessions vs first 10 to see your development",
      unlocked: totalSessions >= 25,
      analysisType: 'comparative'
    },
    {
      milestone: 50,
      title: "Professional Identity Formation",
      description: "Comprehensive analysis of your therapeutic identity and expertise areas",
      unlocked: totalSessions >= 50,
      analysisType: 'advanced'
    }
  ], [totalSessions]);

  // Get the highest unlocked milestone
  const currentMilestone = milestones.filter(m => m.unlocked).pop();
  const nextMilestone = milestones.find(m => !m.unlocked);

  const generateProgressiveAnalysis = async () => {
    if (!currentMilestone) {
      toast({
        title: "Milestone Not Reached",
        description: `Complete ${milestones[0].milestone} sessions to unlock pattern analysis.`,
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      let analysisData = logEntries;
      
      // For comparative analysis, focus on recent vs early sessions
      if (currentMilestone.analysisType === 'comparative') {
        const recentSessions = logEntries.slice(-15);
        const earlySessions = logEntries.slice(0, 10);
        analysisData = [...earlySessions, ...recentSessions];
      }

      const result = await generateCrossSessionAnalysis(analysisData, userProfile, insightCards);
      setAnalysis(result);
      setIsExpanded(true);
      
      toast({
        title: "Analysis Complete!",
        description: `${currentMilestone.title} insights generated successfully.`,
      });
    } catch (error) {
      console.error("Error generating analysis:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      if (errorMessage.includes('API key')) {
        toast({
          title: "API Configuration Required",
          description: "Google AI API access is needed for cross-session analysis.",
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
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    );
  }

  // Show nothing if no sessions yet
  if (totalSessions === 0) {
    return null;
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-3">
                <BarChart3 className="h-6 w-6 text-indigo-600" />
                Cross-Session Pattern Analysis
                {currentMilestone && (
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                    Milestone {currentMilestone.milestone} Unlocked
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {currentMilestone 
                  ? `Longitudinal insights available: ${currentMilestone.title}`
                  : `${milestones[0].milestone - totalSessions} more sessions to unlock pattern analysis`
                }
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {currentMilestone && (
                <Button 
                  onClick={generateProgressiveAnalysis} 
                  disabled={isGenerating}
                  size="sm"
                  className="rounded-xl font-medium transition-all duration-300"
                >
                  {isGenerating ? "Analyzing..." : "Generate Insights"}
                </Button>
              )}
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Milestone Progress */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Analysis Milestones</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {milestones.map((milestone) => (
                  <Card key={milestone.milestone} className={`relative ${milestone.unlocked ? 'ring-2 ring-indigo-200 bg-indigo-50/50' : 'opacity-60'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {milestone.unlocked ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Lock className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="font-medium text-sm">{milestone.milestone} Sessions</span>
                        </div>
                        {milestone === currentMilestone && (
                          <Badge variant="outline" className="text-xs">Current</Badge>
                        )}
                      </div>
                      <h5 className="font-medium text-sm mb-1">{milestone.title}</h5>
                      <p className="text-xs text-muted-foreground">{milestone.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Current Progress */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-indigo-600" />
                <div>
                  <p className="font-medium text-sm">Current Progress</p>
                  <p className="text-xs text-muted-foreground">
                    {totalSessions} sessions completed
                    {nextMilestone && ` • ${nextMilestone.milestone - totalSessions} more for next milestone`}
                  </p>
                </div>
              </div>
              {currentMilestone && (
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  {currentMilestone.title} Ready
                </Badge>
              )}
            </div>

            {/* Analysis Results */}
            {analysis && currentMilestone && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <h4 className="font-medium">{currentMilestone.title} Insights</h4>
                </div>

                {/* Key Insights Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.recurringThemes.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <Target className="h-4 w-4 text-amber-500" />
                          Recurring Themes
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {analysis.recurringThemes.slice(0, 3).map((theme, index) => (
                            <div key={index} className="text-sm bg-amber-50 dark:bg-amber-950/20 p-2 rounded">
                              {theme}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {analysis.strengthsIdentified.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <Brain className="h-4 w-4 text-green-500" />
                          Strengths Identified
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {analysis.strengthsIdentified.slice(0, 3).map((strength, index) => (
                            <div key={index} className="text-sm bg-green-50 dark:bg-green-950/20 p-2 rounded">
                              {strength}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Growth Trajectory for Comparative Analysis */}
                {currentMilestone.analysisType === 'comparative' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                        Development Comparison: Recent vs Early Sessions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                        {analysis.overallGrowthTrajectory}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Personalized Recommendations */}
                {analysis.personalizedRecommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Lightbulb className="h-4 w-4 text-purple-500" />
                        Next Development Steps
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analysis.personalizedRecommendations.slice(0, 3).map((rec, index) => (
                          <div key={index} className="text-sm bg-purple-50 dark:bg-purple-950/20 p-2 rounded flex items-start gap-2">
                            <span className="text-purple-600 font-medium">{index + 1}.</span>
                            {rec}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};