import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {

  Target,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  Lightbulb,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  BookOpen,
  Zap
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface UserTherapyProfile {
  id: string;
  userId: string;
  primaryModalities: string[];
  clientPopulations: string[];
  commonInterventions: string[];
  challengePatterns: string[];
  strengthPatterns: string[];
  learningPreferences: string[];
  competencyLevels: Record<string, number>;
  sessionCount: number;
  lastAnalyzed: Date;
}

interface SupervisionIntelligence {
  id: string;
  userId: string;
  weekStartDate: Date;
  weeklyAnalysis: {
    patternAlerts: string[];
    skillGrowthOpportunities: string[];
    ethicalConsiderations: string[];
    interventionEffectiveness: string[];
    challengingCasesSummary: string[];
  };
  suggestedAgenda: {
    discussionTopics: string[];
    specificCasesToReview: string[];
    skillDevelopmentGoals: string[];
    resourceRecommendations: string[];
  };
  sessionDataAnalyzed: number;
  generatedAt: Date;
}

interface PatternAnalysis {
  id: string;
  userId: string;
  alertType: 'concern' | 'growth' | 'success' | 'supervision_needed';
  pattern: string;
  frequency: number;
  timeline: string;
  recommendation: string;
  urgency: 'low' | 'medium' | 'high';
  isRead: boolean;
  isResolved: boolean;
  createdAt: Date;
}

const mockUserId = 'user_demo_123';

export default function IntelligenceHub() {
  const [sessionNotes, setSessionNotes] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('insights');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user therapy profile
  const { data: therapyProfile, isLoading: profileLoading } = useQuery<UserTherapyProfile | null>({
    queryKey: ['/api/ai/therapy-profile', mockUserId],
  });

  // Fetch supervision intelligence
  const { data: supervisionData, isLoading: supervisionLoading } = useQuery<SupervisionIntelligence[]>({
    queryKey: ['/api/ai/supervision-intelligence', mockUserId],
  });

  // Fetch pattern analysis
  const { data: patternData, isLoading: patternsLoading } = useQuery<PatternAnalysis[]>({
    queryKey: ['/api/ai/pattern-analysis', mockUserId],
  });

  const handleAnalyzeSession = async () => {
    if (!sessionNotes.trim()) {
      toast({
        title: "Please enter session notes",
        description: "Session notes are required for analysis.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const sessionData = {
        id: `session_${Date.now()}`,
        notes: sessionNotes,
        dateOfContact: new Date(),
        clientContactHours: 1,
      };

      await apiRequest('/api/ai/analyze-session', {
        method: 'POST',
        body: JSON.stringify({
          userId: mockUserId,
          sessionData,
        }),
      });

      await queryClient.invalidateQueries({ queryKey: ['/api/ai/therapy-profile', mockUserId] });
      await queryClient.invalidateQueries({ queryKey: ['/api/ai/pattern-analysis', mockUserId] });

      toast({
        title: "Session analyzed successfully",
        description: "Your therapy profile has been updated with new insights.",
      });

      setSessionNotes('');
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: "There was an error analyzing your session notes.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getCompetencyColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getAlertColor = (alertType: string) => {
    switch (alertType) {
      case 'concern': return 'bg-red-100 text-red-800 border-red-200';
      case 'supervision_needed': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'growth': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Brain className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-black">Intelligence Hub</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your unified center for AI-powered insights, professional growth tracking, and intelligent recommendations.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="insights">Recent Insights</TabsTrigger>
            <TabsTrigger value="analyze">Analyze Session</TabsTrigger>
            <TabsTrigger value="profile">Deep Profile View</TabsTrigger>
          </TabsList>

          <TabsContent value="insights" className="space-y-6">
            {/* All Insights in Detail */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                <CardTitle className="flex items-center gap-3 text-black font-bold">
                  <Lightbulb className="h-6 w-6 text-blue-600" />
                  All Intelligence Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Pattern Analysis Results */}
                  {patternData && patternData.length > 0 ? (
                    <div>
                      <h4 className="font-bold text-black mb-3">Pattern Detection</h4>
                      <div className="space-y-3">
                        {patternData.map((pattern) => (
                          <div key={pattern.id} className={`p-4 rounded-lg border ${getAlertColor(pattern.alertType)}`}>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {pattern.alertType === 'concern' && <AlertCircle className="h-5 w-5" />}
                                {pattern.alertType === 'success' && <CheckCircle className="h-5 w-5" />}
                                {pattern.alertType === 'growth' && <TrendingUp className="h-5 w-5" />}
                                {pattern.alertType === 'supervision_needed' && <Users className="h-5 w-5" />}
                                <span className="font-bold text-black">{pattern.pattern}</span>
                              </div>
                              <Badge variant="secondary" className="font-medium">
                                {pattern.urgency}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium text-black mb-2">{pattern.recommendation}</p>
                            <div className="text-xs text-gray-600">
                              Frequency: {pattern.frequency} | Timeline: {pattern.timeline}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-black mb-2">Building Your Intelligence Profile</h3>
                      <p className="text-gray-600">Continue logging sessions to generate personalized insights and pattern analysis.</p>
                    </div>
                  )}

                  {/* Supervision Intelligence */}
                  {supervisionData && supervisionData.length > 0 && (
                    <div>
                      <h4 className="font-bold text-black mb-3">Supervision Preparation Insights</h4>
                      <div className="bg-purple-50 border-l-4 border-l-purple-600 p-4 rounded">
                        {supervisionData.map((intel) => (
                          <div key={intel.id} className="space-y-3">
                            <div>
                              <h5 className="font-medium text-black mb-2">Discussion Topics</h5>
                              <div className="space-y-1">
                                {intel.suggestedAgenda.discussionTopics.map((topic, index) => (
                                  <div key={index} className="flex items-start gap-2">
                                    <ArrowRight className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-black">{topic}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                <CardTitle className="flex items-center gap-3 text-black font-bold">
                  <Target className="h-6 w-6 text-blue-600" />
                  Progressive Therapy Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {profileLoading ? (
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ) : therapyProfile ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-bold text-black mb-2">Primary Modalities</h4>
                        <div className="flex flex-wrap gap-2">
                          {therapyProfile.primaryModalities.map((modality, index) => (
                            <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 font-medium">
                              {modality}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-bold text-black mb-2">Client Populations</h4>
                        <div className="flex flex-wrap gap-2">
                          {therapyProfile.clientPopulations.map((population, index) => (
                            <Badge key={index} variant="outline" className="font-medium">
                              {population}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-bold text-black mb-3">Competency Levels</h4>
                        <div className="space-y-3">
                          {Object.entries(therapyProfile.competencyLevels).map(([competency, score]) => (
                            <div key={competency} className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-black">{competency}</span>
                                <span className="text-sm font-bold text-black">{score}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${getCompetencyColor(score)}`}
                                  style={{ width: `${score}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-black mb-2">No Profile Data Yet</h3>
                    <p className="text-gray-600">Start analyzing sessions to build your therapy profile.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analyze" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
                <CardTitle className="flex items-center gap-3 text-black font-bold">
                  <Brain className="h-6 w-6 text-green-600" />
                  Session Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      Session Notes
                    </label>
                    <Textarea
                      value={sessionNotes}
                      onChange={(e) => setSessionNotes(e.target.value)}
                      placeholder="Enter your session notes here for AI analysis..."
                      className="min-h-[200px] resize-none"
                    />
                  </div>
                  <Button 
                    onClick={handleAnalyzeSession}
                    disabled={isAnalyzing || !sessionNotes.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 font-bold"
                  >
                    {isAnalyzing ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Analyze Session
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="supervision" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-t-lg">
                <CardTitle className="flex items-center gap-3 text-black font-bold">
                  <Users className="h-6 w-6 text-purple-600" />
                  Supervision Preparation
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {supervisionLoading ? (
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ) : supervisionData && supervisionData.length > 0 ? (
                  <div className="space-y-6">
                    {supervisionData.map((intel) => (
                      <div key={intel.id} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-bold text-black mb-3">Suggested Discussion Topics</h4>
                            <div className="space-y-2">
                              {intel.suggestedAgenda.discussionTopics.map((topic, index) => (
                                <div key={index} className="flex items-start gap-2">
                                  <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm text-black font-medium">{topic}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-bold text-black mb-3">Skill Development Goals</h4>
                            <div className="space-y-2">
                              {intel.suggestedAgenda.skillDevelopmentGoals.map((goal, index) => (
                                <div key={index} className="flex items-start gap-2">
                                  <Target className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm text-black font-medium">{goal}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-black mb-2">No Supervision Data</h3>
                    <p className="text-gray-600">Analyze more sessions to generate supervision insights.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patterns" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-t-lg">
                <CardTitle className="flex items-center gap-3 text-black font-bold">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                  Pattern Analysis & Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {patternsLoading ? (
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ) : patternData && patternData.length > 0 ? (
                  <div className="space-y-4">
                    {patternData.map((pattern) => (
                      <div key={pattern.id} className={`p-4 rounded-lg border ${getAlertColor(pattern.alertType)}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {pattern.alertType === 'concern' && <AlertCircle className="h-5 w-5" />}
                            {pattern.alertType === 'success' && <CheckCircle className="h-5 w-5" />}
                            {pattern.alertType === 'growth' && <TrendingUp className="h-5 w-5" />}
                            {pattern.alertType === 'supervision_needed' && <Users className="h-5 w-5" />}
                            <span className="font-bold text-black">{pattern.pattern}</span>
                          </div>
                          <Badge variant="secondary" className="font-medium">
                            {pattern.urgency}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-black mb-2">{pattern.recommendation}</p>
                        <div className="text-xs text-gray-600">
                          Frequency: {pattern.frequency} | Timeline: {pattern.timeline}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-black mb-2">No Patterns Detected</h3>
                    <p className="text-gray-600">More session data is needed for pattern analysis.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}