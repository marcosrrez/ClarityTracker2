import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  BookOpen, 
  Clock,
  Users,
  CheckCircle,
  Lightbulb,
  Star
} from 'lucide-react';

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

export default function AIInsights() {
  const [sessionNotes, setSessionNotes] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user therapy profile
  const { data: therapyProfile, isLoading: profileLoading } = useQuery<UserTherapyProfile | null>({
    queryKey: ['/api/ai/therapy-profile', mockUserId],
    queryFn: async () => {
      const response = await fetch(`/api/ai/therapy-profile/${mockUserId}`);
      if (!response.ok) throw new Error('Failed to fetch therapy profile');
      return response.json();
    }
  });

  // Fetch supervision intelligence
  const { data: supervisionIntelligence, isLoading: intelligenceLoading } = useQuery<SupervisionIntelligence[]>({
    queryKey: ['/api/ai/supervision-intelligence', mockUserId],
    queryFn: async () => {
      const response = await fetch(`/api/ai/supervision-intelligence/${mockUserId}`);
      if (!response.ok) throw new Error('Failed to fetch supervision intelligence');
      return response.json();
    }
  });

  // Fetch pattern analysis
  const { data: patterns, isLoading: patternsLoading } = useQuery<PatternAnalysis[]>({
    queryKey: ['/api/ai/pattern-analysis', mockUserId],
    queryFn: async () => {
      const response = await fetch(`/api/ai/pattern-analysis/${mockUserId}?unreadOnly=true`);
      if (!response.ok) throw new Error('Failed to fetch patterns');
      return response.json();
    }
  });

  // Analyze session mutation
  const analyzeSession = useMutation({
    mutationFn: async (sessionData: any) => {
      const response = await fetch('/api/ai/therapy-profile/analyze-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: mockUserId,
          sessionData
        })
      });
      if (!response.ok) throw new Error('Failed to analyze session');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/therapy-profile'] });
      toast({
        title: "Session analyzed successfully",
        description: "Your therapy profile has been updated with new insights."
      });
      setSessionNotes('');
    },
    onError: (error) => {
      toast({
        title: "Analysis failed",
        description: "There was an issue analyzing your session. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleAnalyzeSession = () => {
    if (!sessionNotes.trim()) {
      toast({
        title: "Session notes required",
        description: "Please enter some session notes to analyze.",
        variant: "destructive"
      });
      return;
    }

    const sessionData = {
      id: `session_${Date.now()}`,
      notes: sessionNotes,
      dateOfContact: new Date(),
      clientContactHours: 1
    };

    analyzeSession.mutate(sessionData);
  };

  const getCompetencyColor = (level: number) => {
    if (level >= 4) return "text-green-600";
    if (level >= 3) return "text-yellow-600";
    return "text-red-600";
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'concern': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'growth': return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'supervision_needed': return <Users className="h-4 w-4 text-orange-500" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Brain className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-black">AI-Powered Insights</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Experience the future of clinical supervision with progressive profiling, 
            intelligent pattern detection, and personalized development recommendations.
          </p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Therapy Profile</TabsTrigger>
            <TabsTrigger value="supervision">Supervision Prep</TabsTrigger>
            <TabsTrigger value="patterns">Pattern Analysis</TabsTrigger>
            <TabsTrigger value="analyze">Analyze Session</TabsTrigger>
          </TabsList>

          {/* Progressive Therapy Profile */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Progressive Therapy Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {profileLoading ? (
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                  </div>
                ) : therapyProfile ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Competency Levels */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-black">Core Competencies</h3>
                      <div className="space-y-3">
                        {Object.entries(therapyProfile.competencyLevels || {}).map(([competency, level]) => {
                          if (competency === 'lastUpdated') return null;
                          return (
                            <div key={competency} className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700 capitalize">
                                  {competency.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                                <span className={`text-sm font-bold ${getCompetencyColor(level as number)}`}>
                                  {level}/5
                                </span>
                              </div>
                              <Progress value={(level as number) * 20} className="h-2" />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Session Statistics */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-black">Profile Statistics</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{therapyProfile.sessionCount}</div>
                          <div className="text-sm text-gray-600">Sessions Analyzed</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {new Date(therapyProfile.lastAnalyzed).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-600">Last Updated</div>
                        </div>
                      </div>
                    </div>

                    {/* Primary Modalities */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-black">Primary Modalities</h3>
                      <div className="flex flex-wrap gap-2">
                        {therapyProfile.primaryModalities?.length ? 
                          therapyProfile.primaryModalities.map((modality, index) => (
                            <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                              {modality}
                            </Badge>
                          )) : 
                          <p className="text-gray-500 italic">Analyzing your modalities...</p>
                        }
                      </div>
                    </div>

                    {/* Client Populations */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-black">Client Populations</h3>
                      <div className="flex flex-wrap gap-2">
                        {therapyProfile.clientPopulations?.length ? 
                          therapyProfile.clientPopulations.map((population, index) => (
                            <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                              {population}
                            </Badge>
                          )) :
                          <p className="text-gray-500 italic">Learning about your client populations...</p>
                        }
                      </div>
                    </div>

                    {/* Strength Patterns */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-black">Identified Strengths</h3>
                      <div className="space-y-2">
                        {therapyProfile.strengthPatterns?.length ? 
                          therapyProfile.strengthPatterns.map((strength, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                              <Star className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-800">{strength}</span>
                            </div>
                          )) :
                          <p className="text-gray-500 italic">Your strengths will emerge as you log sessions...</p>
                        }
                      </div>
                    </div>

                    {/* Challenge Patterns */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-black">Growth Areas</h3>
                      <div className="space-y-2">
                        {therapyProfile.challengePatterns?.length ? 
                          therapyProfile.challengePatterns.map((challenge, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                              <Target className="h-4 w-4 text-yellow-600" />
                              <span className="text-sm text-yellow-800">{challenge}</span>
                            </div>
                          )) :
                          <p className="text-gray-500 italic">Development opportunities will be identified...</p>
                        }
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Profile Yet</h3>
                    <p className="text-gray-500 mb-4">Start analyzing sessions to build your progressive therapy profile.</p>
                    <Button onClick={() => window.location.hash = '#analyze'} variant="outline">
                      Analyze Your First Session
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Supervision Intelligence */}
          <TabsContent value="supervision" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Weekly Supervision Preparation
                </CardTitle>
              </CardHeader>
              <CardContent>
                {intelligenceLoading ? (
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                  </div>
                ) : supervisionIntelligence?.length ? (
                  <div className="space-y-6">
                    {supervisionIntelligence[0] && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Suggested Agenda */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-black">Suggested Agenda</h3>
                          
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-medium text-gray-700 mb-2">Discussion Topics</h4>
                              <ul className="space-y-1">
                                {supervisionIntelligence[0].suggestedAgenda.discussionTopics.map((topic, index) => (
                                  <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                                    <span className="text-blue-500 font-bold">•</span>
                                    {topic}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <Separator />

                            <div>
                              <h4 className="font-medium text-gray-700 mb-2">Skill Development Goals</h4>
                              <ul className="space-y-1">
                                {supervisionIntelligence[0].suggestedAgenda.skillDevelopmentGoals.map((goal, index) => (
                                  <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                                    <Target className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                                    {goal}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>

                        {/* Weekly Analysis */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-black">Weekly Analysis</h3>
                          
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-medium text-gray-700 mb-2">Growth Opportunities</h4>
                              <ul className="space-y-1">
                                {supervisionIntelligence[0].weeklyAnalysis.skillGrowthOpportunities.map((opportunity, index) => (
                                  <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                                    <TrendingUp className="h-3 w-3 text-blue-500 mt-1 flex-shrink-0" />
                                    {opportunity}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <Separator />

                            <div>
                              <h4 className="font-medium text-gray-700 mb-2">Intervention Effectiveness</h4>
                              <ul className="space-y-1">
                                {supervisionIntelligence[0].weeklyAnalysis.interventionEffectiveness.map((effectiveness, index) => (
                                  <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                                    <CheckCircle className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                                    {effectiveness}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Supervision Data</h3>
                    <p className="text-gray-500 mb-4">Analyze multiple sessions to generate weekly supervision insights.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pattern Analysis */}
          <TabsContent value="patterns" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Intelligent Pattern Detection
                </CardTitle>
              </CardHeader>
              <CardContent>
                {patternsLoading ? (
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                  </div>
                ) : patterns?.length ? (
                  <div className="space-y-4">
                    {patterns.map((pattern) => (
                      <div key={pattern.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getAlertIcon(pattern.alertType)}
                            <span className="font-medium text-gray-800 capitalize">
                              {pattern.alertType.replace('_', ' ')}
                            </span>
                          </div>
                          <Badge className={getUrgencyColor(pattern.urgency)}>
                            {pattern.urgency} priority
                          </Badge>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-800 mb-1">Pattern Detected</h4>
                          <p className="text-sm text-gray-600">{pattern.pattern}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-800 mb-1">Recommendation</h4>
                          <p className="text-sm text-gray-600">{pattern.recommendation}</p>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Frequency: {pattern.frequency}x</span>
                          <span>Timeline: {pattern.timeline}</span>
                          <span>Detected: {new Date(pattern.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Lightbulb className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Patterns Yet</h3>
                    <p className="text-gray-500 mb-4">Patterns will emerge as you analyze more sessions over time.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Session Analysis */}
          <TabsContent value="analyze" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Analyze Session Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="session-notes">Session Notes</Label>
                  <Textarea
                    id="session-notes"
                    placeholder="Enter your session notes here. Include details about interventions used, client responses, challenges faced, and any notable observations..."
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    rows={8}
                    className="resize-none"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <Button 
                    onClick={handleAnalyzeSession}
                    disabled={analyzeSession.isPending || !sessionNotes.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {analyzeSession.isPending ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Analyze Session
                      </>
                    )}
                  </Button>
                  
                  {sessionNotes && (
                    <div className="text-sm text-gray-500">
                      {sessionNotes.length} characters
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">What happens when you analyze?</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• AI identifies therapeutic modalities and interventions used</li>
                    <li>• Client populations and presenting issues are extracted</li>
                    <li>• Strengths and growth areas are detected</li>
                    <li>• Your progressive therapy profile is updated</li>
                    <li>• Patterns across sessions are identified</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}