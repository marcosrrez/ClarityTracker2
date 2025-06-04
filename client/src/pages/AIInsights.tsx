import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Brain, 
  Target, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Lightbulb,
  FileText,
  ArrowRight
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

interface CompetencyAnalysis {
  sessionId: string;
  competencyScores: Record<string, number>;
  strengthsIdentified: string[];
  areasForGrowth: string[];
  recommendations: string[];
  overallScore: number;
}

const mockUserId = 'user_demo_123';

export default function AIInsights() {
  const [sessionNotes, setSessionNotes] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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

      // Invalidate and refetch data
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
      <div className="max-w-7xl mx-auto">
        
        {/* Modern Header with Gradient */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white">
          <div className="px-8 py-12">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Lightbulb className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">AI-Powered Insights</h1>
                <p className="text-blue-100 text-lg mt-1">
                  Intelligent analysis for professional growth
                </p>
              </div>
            </div>
            
            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3 mt-6">
              <div className="px-4 py-2 bg-white/15 rounded-full text-sm backdrop-blur-sm">
                Progressive Profiling
              </div>
              <div className="px-4 py-2 bg-white/15 rounded-full text-sm backdrop-blur-sm">
                Pattern Detection
              </div>
              <div className="px-4 py-2 bg-white/15 rounded-full text-sm backdrop-blur-sm">
                Supervision Intelligence
              </div>
              <div className="px-4 py-2 bg-white/15 rounded-full text-sm backdrop-blur-sm">
                Competency Tracking
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs with Modern Design */}
        <div className="bg-white border-b">
          <div className="px-8">
            <nav className="flex space-x-8">
              {[
                { id: 'profile', label: 'Therapy Profile', icon: Target },
                { id: 'analyze', label: 'Analyze Session', icon: Brain },
                { id: 'supervision', label: 'Supervision Prep', icon: Users },
                { id: 'patterns', label: 'Pattern Analysis', icon: TrendingUp }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-4 border-b-2 font-semibold text-sm transition-all ${
                      isActive
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="px-8 py-8">
          {activeTab === 'profile' && (
            <div className="space-y-6">
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
            </div>
          )}

          {activeTab === 'analyze' && (
            <div className="space-y-6">
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
            </div>
          )}

          {activeTab === 'supervision' && (
            <div className="space-y-6">
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
            </div>
          )}

          {activeTab === 'patterns' && (
            <div className="space-y-6">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}