import { useState } from "react";
import { useQuery, useMutation, queryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Clock,
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  Calendar,
  PenTool,
  Award,
  TrendingUp,
  Play,
  Eye,
  Star,
  Target,
  Brain,
  Shield,
  Loader2
} from "lucide-react";

interface SessionAnalysis {
  id: string;
  superviseeId: string;
  superviseeName: string;
  sessionDate: Date;
  duration: number;
  clientInitials: string;
  ebpTechniques: string[];
  complianceScore: number;
  engagementScore: number;
  riskIndicators: string[];
  strengths: string[];
  areasForImprovement: string[];
  supervisorReview?: {
    rating: number;
    feedback: string;
    recommendations: string[];
    reviewed: boolean;
  };
}

interface CompetencyArea {
  name: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  sessions: number;
}

interface SupervisionMetrics {
  totalSuperviseeSessions: number;
  averageComplianceScore: number;
  averageEngagementScore: number;
  supervisionsThisMonth: number;
  pendingReviews: number;
  riskIndicatorsCount: number;
}

export default function SupervisionHubView() {
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    feedback: '',
    recommendations: ''
  });

  const { toast } = useToast();

  // Fetch session analyses from database
  const { data: sessionAnalyses = [], isLoading: analysesLoading } = useQuery({
    queryKey: ['/api/supervision/session-analyses'],
    select: (data) => data.map((analysis: any) => ({
      ...analysis,
      sessionDate: new Date(analysis.sessionDate),
      ebpTechniques: typeof analysis.ebpTechniques === 'string' 
        ? JSON.parse(analysis.ebpTechniques) 
        : analysis.ebpTechniques || [],
      riskIndicators: typeof analysis.riskIndicators === 'string' 
        ? JSON.parse(analysis.riskIndicators) 
        : analysis.riskIndicators || [],
      strengths: typeof analysis.strengths === 'string' 
        ? JSON.parse(analysis.strengths) 
        : analysis.strengths || [],
      areasForImprovement: typeof analysis.areasForImprovement === 'string' 
        ? JSON.parse(analysis.areasForImprovement) 
        : analysis.areasForImprovement || []
    }))
  });

  // Fetch competency data
  const { data: competencyAreas = [], isLoading: competencyLoading } = useQuery({
    queryKey: ['/api/supervision/competency-areas']
  });

  // Fetch supervision metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/supervision/metrics-summary']
  });

  // Mutation for adding supervisor review
  const addReviewMutation = useMutation({
    mutationFn: async ({ analysisId, review }: { analysisId: string, review: any }) => {
      const response = await fetch(`/api/supervision/session-analyses/${analysisId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(review)
      });
      if (!response.ok) throw new Error('Failed to add review');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supervision/session-analyses'] });
      toast({
        title: "Review Added",
        description: "Supervisor review has been saved successfully."
      });
      setSelectedAnalysis(null);
      setReviewData({ rating: 5, feedback: '', recommendations: '' });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save review. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleAddReview = () => {
    if (!selectedAnalysis || !reviewData.feedback.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide feedback before submitting the review.",
        variant: "destructive"
      });
      return;
    }

    const review = {
      rating: reviewData.rating,
      feedback: reviewData.feedback,
      recommendations: reviewData.recommendations.split('\n').filter(r => r.trim()),
      reviewed: true
    };

    addReviewMutation.mutate({ analysisId: selectedAnalysis, review });
  };

  return (
    <div className="min-h-screen bg-gray-50 lg:pl-80">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-black">AI-Enhanced Supervision Hub</h1>
          <p className="text-gray-600">Advanced supervision with session analysis and competency tracking</p>
        </div>

        {/* Enhanced Supervision Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Session Analysis
            </TabsTrigger>
            <TabsTrigger value="development" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Development
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Compliance
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Metrics Overview */}
              {metricsLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-black">{metrics?.totalSuperviseeSessions || 0}</p>
                      <p className="text-sm text-gray-600">Sessions Analyzed</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Award className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-black">{metrics?.averageComplianceScore || 0}%</p>
                      <p className="text-sm text-gray-600">Avg Compliance</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Clock className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-black">{metrics?.supervisionsThisMonth || 0}</p>
                      <p className="text-sm text-gray-600">This Month</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <AlertCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-black">{metrics?.pendingReviews || 0}</p>
                      <p className="text-sm text-gray-600">Pending Reviews</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Session Analysis Tab */}
          <TabsContent value="sessions">
            <div className="space-y-6">
              {/* Session Analysis Header */}
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-black">AI-Powered Session Analysis</h2>
                <Button className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Generate AI Summary
                </Button>
              </div>

              {/* Session Analysis Cards */}
              {analysesLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : sessionAnalyses.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-black mb-2">No Session Analyses Yet</h3>
                    <p className="text-gray-600">Session analyses will appear here once supervisees complete sessions with AI analysis enabled.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {sessionAnalyses.map((analysis: SessionAnalysis) => (
                    <Card key={analysis.id} className="border border-gray-200">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg text-black">{analysis.superviseeName}</CardTitle>
                            <p className="text-sm text-gray-600">
                              {analysis.sessionDate.toLocaleDateString()} • {analysis.duration} min • Client: {analysis.clientInitials}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {analysis.supervisorReview?.reviewed ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Reviewed
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Pending Review</Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Scores */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-black">Compliance Score</p>
                            <div className="flex items-center gap-2">
                              <Progress value={analysis.complianceScore} className="flex-1" />
                              <span className="text-sm font-semibold">{analysis.complianceScore}%</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-black">Engagement Score</p>
                            <div className="flex items-center gap-2">
                              <Progress value={analysis.engagementScore} className="flex-1" />
                              <span className="text-sm font-semibold">{analysis.engagementScore}%</span>
                            </div>
                          </div>
                        </div>

                        {/* EBP Techniques */}
                        <div>
                          <p className="text-sm font-medium text-black mb-2">Evidence-Based Practices Used</p>
                          <div className="flex flex-wrap gap-2">
                            {analysis.ebpTechniques.map((technique) => (
                              <Badge key={technique} variant="outline">{technique}</Badge>
                            ))}
                          </div>
                        </div>

                        {/* Risk Indicators */}
                        {analysis.riskIndicators.length > 0 && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle className="h-4 w-4 text-red-600" />
                              <p className="text-sm font-medium text-red-800">Risk Indicators</p>
                            </div>
                            <ul className="text-sm text-red-700 space-y-1">
                              {analysis.riskIndicators.map((indicator, index) => (
                                <li key={index}>• {indicator}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Strengths & Areas for Improvement */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-sm font-medium text-green-800 mb-2">Strengths</p>
                            <ul className="text-sm text-green-700 space-y-1">
                              {analysis.strengths.map((strength, index) => (
                                <li key={index}>• {strength}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <p className="text-sm font-medium text-orange-800 mb-2">Areas for Improvement</p>
                            <ul className="text-sm text-orange-700 space-y-1">
                              {analysis.areasForImprovement.map((area, index) => (
                                <li key={index}>• {area}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Supervisor Review */}
                        {analysis.supervisorReview && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Star className="h-4 w-4 text-blue-600" />
                              <p className="text-sm font-medium text-blue-800">
                                Supervisor Review ({analysis.supervisorReview.rating}/5 stars)
                              </p>
                            </div>
                            <p className="text-sm text-blue-700 mb-3">{analysis.supervisorReview.feedback}</p>
                            <div>
                              <p className="text-sm font-medium text-blue-800 mb-1">Recommendations:</p>
                              <ul className="text-sm text-blue-700 space-y-1">
                                {analysis.supervisorReview.recommendations.map((rec, index) => (
                                  <li key={index}>• {rec}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm" className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            View Full Session
                          </Button>
                          <Button variant="outline" size="sm" className="flex items-center gap-2">
                            <Play className="h-4 w-4" />
                            Watch Recording
                          </Button>
                          {!analysis.supervisorReview?.reviewed && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  className="flex items-center gap-2"
                                  onClick={() => setSelectedAnalysis(analysis.id)}
                                >
                                  <PenTool className="h-4 w-4" />
                                  Add Review
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Add Supervisor Review</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <label className="text-sm font-medium text-black">Rating (1-5 stars)</label>
                                    <Input
                                      type="number"
                                      min="1"
                                      max="5"
                                      value={reviewData.rating}
                                      onChange={(e) => setReviewData(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                                      className="mt-1"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-black">Feedback</label>
                                    <Textarea
                                      value={reviewData.feedback}
                                      onChange={(e) => setReviewData(prev => ({ ...prev, feedback: e.target.value }))}
                                      placeholder="Provide detailed feedback on the session..."
                                      className="mt-1"
                                      rows={4}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-black">Recommendations (one per line)</label>
                                    <Textarea
                                      value={reviewData.recommendations}
                                      onChange={(e) => setReviewData(prev => ({ ...prev, recommendations: e.target.value }))}
                                      placeholder="Practice specific techniques&#10;Review documentation standards&#10;Focus on crisis assessment"
                                      className="mt-1"
                                      rows={3}
                                    />
                                  </div>
                                  <div className="flex gap-2 pt-4">
                                    <Button onClick={handleAddReview} disabled={addReviewMutation.isPending}>
                                      {addReviewMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                      Save Review
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Development Tab */}
          <TabsContent value="development">
            <div className="space-y-6">
              {/* Competency Tracking */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-blue-600" />
                    Competency Development Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {competencyLoading ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : competencyAreas.length === 0 ? (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Competency data will be populated as sessions are analyzed.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {competencyAreas.map((area: CompetencyArea) => (
                        <div key={area.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-black">{area.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">{area.score}%</span>
                                {area.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
                                {area.trend === 'down' && <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />}
                                {area.trend === 'stable' && <div className="h-4 w-4 border-2 border-gray-400 rounded-full" />}
                              </div>
                            </div>
                            <Progress value={area.score} className="mb-1" />
                            <p className="text-xs text-gray-500">{area.sessions} sessions analyzed</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Compliance Tab */}
          <TabsContent value="compliance">
            <div className="space-y-6">
              {/* Compliance Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-black">{metrics?.averageComplianceScore || 0}%</p>
                    <p className="text-sm text-gray-600">Overall Compliance</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-black">{metrics?.totalSuperviseeSessions || 0}</p>
                    <p className="text-sm text-gray-600">Sessions Documented</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <AlertCircle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-black">{metrics?.riskIndicatorsCount || 0}</p>
                    <p className="text-sm text-gray-600">Risk Indicators</p>
                  </CardContent>
                </Card>
              </div>

              {/* Compliance Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Supervision Compliance Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="flex-1 text-black">Session analysis system active</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <Brain className="h-5 w-5 text-blue-600" />
                      <span className="flex-1 text-black">AI-powered supervision feedback</span>
                      <Badge variant="default" className="bg-blue-100 text-blue-800">Enabled</Badge>
                    </div>
                    {metrics?.pendingReviews > 0 && (
                      <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <Clock className="h-5 w-5 text-orange-600" />
                        <span className="flex-1 text-black">{metrics.pendingReviews} sessions pending supervisor review</span>
                        <Badge variant="secondary">Action Needed</Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}