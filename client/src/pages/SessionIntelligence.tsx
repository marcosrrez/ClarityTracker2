import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Brain, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  FileText, 
  Star,
  CheckCircle2,
  AlertCircle,
  Eye,
  Mic,
  Camera,
  Users,
  Target,
  BookOpen,
  Shield
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface SessionAnalysis {
  id: string;
  userId: string;
  sessionId: string;
  title: string;
  clientInitials?: string;
  sessionDate: Date;
  duration: number;
  transcriptionData?: any;
  videoAnalysisData?: any;
  audioAnalysisData?: any;
  emotionalMetrics?: any;
  therapeuticAllianceScore?: number;
  engagementScore?: number;
  complianceScore?: number;
  riskIndicators: string[];
  ebpTechniques: string[];
  clinicalInsights?: any;
  supervisorReview?: any;
  status: 'pending' | 'reviewed' | 'approved';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface CrisisAlert {
  id: string;
  sessionId: string;
  superviseeId: string;
  supervisorId: string;
  alertType: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  evidence: string[];
  recommendedAction: string;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  supervisorNotes?: string;
  createdAt: Date;
}

interface EbpRecommendation {
  id: string;
  sessionId: string;
  superviseeId: string;
  technique: string;
  rationale: string;
  priority: 'high' | 'medium' | 'low';
  category: 'cognitive' | 'behavioral' | 'humanistic' | 'systemic';
  timing: 'immediate' | 'next_segment' | 'next_session';
  implemented: boolean;
  effectivenessRating?: number;
  supervisorNotes?: string;
  createdAt: Date;
}

export default function SessionIntelligence() {
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionClient, setNewSessionClient] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch session analyses
  const { data: sessionAnalyses = [], isLoading: isLoadingAnalyses } = useQuery({
    queryKey: ['/api/session-analyses'],
    queryFn: async () => {
      const response = await fetch('/api/session-analyses');
      if (!response.ok) throw new Error('Failed to fetch session analyses');
      return response.json() as Promise<SessionAnalysis[]>;
    }
  });

  // Fetch crisis alerts
  const { data: crisisAlerts = [] } = useQuery({
    queryKey: ['/api/crisis-alerts'],
    queryFn: async () => {
      const response = await fetch('/api/crisis-alerts');
      if (!response.ok) throw new Error('Failed to fetch crisis alerts');
      return response.json() as Promise<CrisisAlert[]>;
    }
  });

  // Fetch EBP recommendations
  const { data: ebpRecommendations = [] } = useQuery({
    queryKey: ['/api/ebp-recommendations'],
    queryFn: async () => {
      const response = await fetch('/api/ebp-recommendations');
      if (!response.ok) throw new Error('Failed to fetch EBP recommendations');
      return response.json() as Promise<EbpRecommendation[]>;
    }
  });

  // Create new session analysis
  const createSessionMutation = useMutation({
    mutationFn: (data: { title: string; clientInitials?: string; sessionDate: Date; duration: number; sessionId: string }) =>
      apiRequest('/api/session-analyses', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/session-analyses'] });
      setNewSessionTitle('');
      setNewSessionClient('');
      toast({
        title: "Session Created",
        description: "New session intelligence analysis has been created.",
      });
    },
  });

  // Submit supervisor review
  const submitReviewMutation = useMutation({
    mutationFn: ({ sessionId, review }: { sessionId: string; review: any }) =>
      apiRequest(`/api/session-analyses/${sessionId}/review`, { method: 'POST', body: { review } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/session-analyses'] });
      toast({
        title: "Review Submitted",
        description: "Supervisor review has been saved successfully.",
      });
    },
  });

  // Acknowledge crisis alert
  const acknowledgeCrisisMutation = useMutation({
    mutationFn: ({ alertId, notes }: { alertId: string; notes?: string }) =>
      apiRequest(`/api/crisis-alerts/${alertId}/acknowledge`, { method: 'POST', body: { notes } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crisis-alerts'] });
      toast({
        title: "Alert Acknowledged",
        description: "Crisis alert has been acknowledged.",
      });
    },
  });

  const handleCreateSession = () => {
    if (!newSessionTitle.trim()) return;
    
    createSessionMutation.mutate({
      title: newSessionTitle,
      clientInitials: newSessionClient || undefined,
      sessionDate: new Date(),
      duration: 50, // Default 50 minutes
      sessionId: crypto.randomUUID()
    });
  };

  const activeCrisisAlerts = crisisAlerts.filter(alert => alert.status === 'active');
  const recentSessions = sessionAnalyses || [];

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Session Intelligence
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          AI-powered session analysis with real-time supervisor insights
        </p>
      </motion.div>

      {/* Crisis Alerts */}
      {activeCrisisAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-red-900 dark:text-red-100">
              Active Crisis Alerts ({activeCrisisAlerts.length})
            </h3>
          </div>
          <div className="space-y-2">
            {activeCrisisAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded border">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <span className="font-medium">{alert.alertType}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {alert.recommendedAction}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => acknowledgeCrisisMutation.mutate({ alertId: alert.id })}
                  disabled={acknowledgeCrisisMutation.isPending}
                >
                  Acknowledge
                </Button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label>Create New Session Analysis</Label>
              <Input
                placeholder="Session title"
                value={newSessionTitle}
                onChange={(e) => setNewSessionTitle(e.target.value)}
              />
              <Input
                placeholder="Client initials (optional)"
                value={newSessionClient}
                onChange={(e) => setNewSessionClient(e.target.value)}
              />
              <Button 
                onClick={handleCreateSession}
                disabled={createSessionMutation.isPending || !newSessionTitle.trim()}
                className="w-full"
              >
                {createSessionMutation.isPending ? 'Creating...' : 'Create Session'}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-16 flex-col">
                <Mic className="h-5 w-5 mb-1" />
                Live Recording
              </Button>
              <Button variant="outline" className="h-16 flex-col">
                <Camera className="h-5 w-5 mb-1" />
                Video Analysis
              </Button>
              <Button variant="outline" className="h-16 flex-col">
                <FileText className="h-5 w-5 mb-1" />
                Import Notes
              </Button>
              <Button variant="outline" className="h-16 flex-col">
                <Target className="h-5 w-5 mb-1" />
                Goals Review
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="sessions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sessions">Recent Sessions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="ebp">EBP Feedback</TabsTrigger>
          <TabsTrigger value="supervision">Supervision</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          {isLoadingAnalyses ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recentSessions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Brain className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Session Analyses Found</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Create your first session analysis to begin tracking therapeutic progress
                </p>
                <Button onClick={handleCreateSession} disabled={!newSessionTitle.trim()}>
                  Create Session Analysis
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentSessions.map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  className="cursor-pointer"
                >
                  <Card className="h-full">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{session.title}</CardTitle>
                        <Badge variant={session.status === 'approved' ? 'default' : 'secondary'}>
                          {session.status}
                        </Badge>
                      </div>
                      {session.clientInitials && (
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Client: {session.clientInitials}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span>Duration: {session.duration} min</span>
                          <span className="text-gray-500">
                            {new Date(session.sessionDate).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {session.therapeuticAllianceScore && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Therapeutic Alliance</span>
                              <span>{session.therapeuticAllianceScore}%</span>
                            </div>
                            <Progress value={session.therapeuticAllianceScore} className="h-2" />
                          </div>
                        )}

                        {session.riskIndicators.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {session.riskIndicators.slice(0, 3).map((risk, index) => (
                              <Badge key={index} variant="destructive" className="text-xs">
                                {risk}
                              </Badge>
                            ))}
                            {session.riskIndicators.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{session.riskIndicators.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-2">
                          <div className="flex gap-1">
                            {session.transcriptionData && <Mic className="h-4 w-4 text-green-600" />}
                            {session.videoAnalysisData && <Camera className="h-4 w-4 text-blue-600" />}
                            {session.supervisorReview && <Eye className="h-4 w-4 text-purple-600" />}
                          </div>
                          <Button size="sm" variant="ghost">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Total Sessions</p>
                    <p className="text-2xl font-bold">{sessionAnalyses.length}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Crisis Alerts</p>
                    <p className="text-2xl font-bold text-red-600">{activeCrisisAlerts.length}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">EBP Recommendations</p>
                    <p className="text-2xl font-bold">{ebpRecommendations.length}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Avg Alliance Score</p>
                    <p className="text-2xl font-bold">
                      {sessionAnalyses.length > 0 
                        ? Math.round(sessionAnalyses.reduce((sum, s) => sum + (s.therapeuticAllianceScore || 0), 0) / sessionAnalyses.length)
                        : 0}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ebp">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Evidence-Based Practice Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ebpRecommendations.slice(0, 10).map((rec) => (
                    <div key={rec.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                              {rec.priority.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">{rec.category}</Badge>
                            <Badge variant="outline">{rec.timing}</Badge>
                          </div>
                          <h4 className="font-semibold">{rec.technique}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {rec.rationale}
                          </p>
                          {rec.supervisorNotes && (
                            <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                              Supervisor: {rec.supervisorNotes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {rec.implemented && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                          {rec.effectivenessRating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm">{rec.effectivenessRating}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="supervision">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Supervisor Review Panel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {recentSessions.map((session) => (
                    <div key={session.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-semibold">{session.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {new Date(session.sessionDate).toLocaleDateString()} • {session.duration} min
                          </p>
                        </div>
                        <Badge variant={session.status === 'approved' ? 'default' : 'secondary'}>
                          {session.status}
                        </Badge>
                      </div>

                      {session.supervisorReview ? (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded p-3">
                          <p className="text-sm">
                            <strong>Supervisor Review:</strong> {JSON.stringify(session.supervisorReview)}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <Label>Session Quality Rating</Label>
                            <div className="flex gap-1 mt-1">
                              {[1,2,3,4,5].map((star) => (
                                <Star key={star} className="h-5 w-5 text-gray-300 hover:text-yellow-500 cursor-pointer" />
                              ))}
                            </div>
                          </div>
                          <div>
                            <Label>Supervisor Feedback</Label>
                            <Textarea 
                              placeholder="Provide feedback on therapeutic techniques, client engagement, and areas for improvement..."
                              className="mt-1"
                            />
                          </div>
                          <Button 
                            onClick={() => submitReviewMutation.mutate({ 
                              sessionId: session.id, 
                              review: { rating: 4, feedback: "Sample review" } 
                            })}
                            disabled={submitReviewMutation.isPending}
                          >
                            {submitReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}