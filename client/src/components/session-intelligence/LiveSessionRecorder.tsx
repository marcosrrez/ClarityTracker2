import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Mic, Video, Square, Brain, Activity, AlertTriangle, Shield, CheckCircle, FileText, TrendingUp, Eye, Smile, Users, Heart, BarChart3, Flag, Lightbulb, Settings, Minimize2, Maximize2, Play, Pause, Camera, CameraOff, MicOff, Clock, Download, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import AzureSpeechService from '@/services/azureSpeechService';
import VideoService from '@/services/videoService';

interface EmotionState {
  emotion: string;
  intensity: number;
  confidence: number;
}

interface ClinicalInsight {
  type: string;
  content: string;
  confidence: number;
  timestamp: number;
}

interface RiskAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  icon: string;
  timestamp: number;
}

interface SessionAnalysisResult {
  analysis: {
    themes: string[];
    interventions: string[];
    therapeuticAlliance: number;
    clientEngagement: number;
    counselorSkills: string[];
    suggestedImprovements: string[];
  };
  timeEfficiency: {
    estimatedManualTime: number;
    aiAssistedTime: number;
    timeSaved: number;
    efficiencyGain: string;
  };
}

interface NoteAssistanceResult {
  assistance: {
    suggestedImprovements: string[];
    complianceChecks: Array<{
      rule: string;
      status: 'pass' | 'warn' | 'fail';
      suggestion?: string;
    }>;
    billingCodes: string[];
    structuredSummary: string;
  };
}

interface RiskAssessmentResult {
  riskAssessment: {
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    indicators: {
      suicidalIdeation: boolean;
      selfHarm: boolean;
      substanceUse: boolean;
      domesticViolence: boolean;
      psychosis: boolean;
      manic: boolean;
    };
    recommendations: string[];
    urgentActions: string[];
  };
}

interface EBPAnalysisResult {
  analysis: {
    modalitiesDetected: string[];
    fidelityScores: Record<string, number>;
    suggestedTechniques: string[];
    skillDemonstration: string[];
    improvementAreas: string[];
  };
}

const LiveSessionRecorder: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [hasVideo, setHasVideo] = useState(false);
  const [emotionalState, setEmotionalState] = useState<EmotionState>({
    emotion: 'neutral',
    intensity: 0,
    confidence: 0
  });
  
  // Interface states for improved UX
  const [sessionMode, setSessionMode] = useState<'session' | 'review'>('session');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [flaggedMoments, setFlaggedMoments] = useState<Array<{timestamp: number, note: string}>>([]);
  const [activeTab, setActiveTab] = useState('analysis');
  
  // Analysis data
  const [sessionTranscript, setSessionTranscript] = useState('');
  const [userId] = useState('user-123'); // In real app, get from auth
  const [logEntryId] = useState('session-' + Date.now());
  
  // AI Analysis Results
  const [sessionAnalysisResult, setSessionAnalysisResult] = useState<SessionAnalysisResult | null>(null);
  const [noteAssistanceResult, setNoteAssistanceResult] = useState<NoteAssistanceResult | null>(null);
  const [riskAssessmentResult, setRiskAssessmentResult] = useState<RiskAssessmentResult | null>(null);
  const [ebpAnalysisResult, setEbpAnalysisResult] = useState<EBPAnalysisResult | null>(null);

  // AI Analysis Mutations
  const analyzeSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/session/analyze', {
        transcript: sessionTranscript,
        sessionDuration,
        clientPopulation: 'Adult anxiety disorders',
        counselorExperience: 'LAC in training',
        userId
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setSessionAnalysisResult(data);
    }
  });

  const enhanceNoteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/session/progress-note-assist', {
        transcript: sessionTranscript,
        existingNotes: "Session notes from recorded session",
        sessionAnalysis: sessionAnalysisResult?.analysis,
        userId
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setNoteAssistanceResult(data);
    }
  });

  const riskAssessmentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/session/risk-assessment', {
        transcript: sessionTranscript,
        sessionAnalysis: sessionAnalysisResult?.analysis,
        userId,
        logEntryId
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setRiskAssessmentResult(data);
    }
  });

  const ebpAnalysisMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/session/ebp-analysis', {
        transcript: sessionTranscript,
        counselorModalities: ['CBT', 'Mindfulness', 'Person-Centered'],
        userId
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setEbpAnalysisResult(data);
    }
  });

  const [clinicalInsights, setClinicalInsights] = useState<ClinicalInsight[]>([]);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  
  // Service instances
  const speechServiceRef = useRef<AzureSpeechService | null>(null);
  const videoServiceRef = useRef<VideoService | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  
  // Transcription state
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [transcriptionSegments, setTranscriptionSegments] = useState<Array<{text: string, timestamp: number, confidence: number}>>([]);

  // Initialize services
  useEffect(() => {
    videoServiceRef.current = new VideoService();
    
    return () => {
      videoServiceRef.current?.dispose();
    };
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      // Start video capture
      if (videoServiceRef.current && videoContainerRef.current) {
        const videoElement = await videoServiceRef.current.startVideo({
          onVideoFrame: (frame) => {
            // Process video frame for emotion analysis
            // This would integrate with Google AI for facial analysis
          },
          onError: (error) => {
            console.error('Video error:', error);
          },
          onStart: () => {
            console.log('Video capture started');
            setHasVideo(true);
          },
          onStop: () => {
            console.log('Video capture stopped');
            setHasVideo(false);
          }
        });

        // Append video element to container
        if (videoElement && videoContainerRef.current) {
          // Clear existing content safely
          while (videoContainerRef.current.firstChild) {
            videoContainerRef.current.removeChild(videoContainerRef.current.firstChild);
          }
          videoElement.style.width = '100%';
          videoElement.style.height = '100%';
          videoElement.style.objectFit = 'cover';
          videoElement.style.borderRadius = '8px';
          videoContainerRef.current.appendChild(videoElement);
        }
      }
      
      setIsRecording(true);
      setSessionDuration(0);
      
      // Start mock transcription for demonstration
      setSessionTranscript('This is a sample session transcript for testing the AI analysis capabilities.');
      
      // Simulate real-time clinical insights
      setTimeout(() => {
        setClinicalInsights([
          {
            type: 'Engagement',
            content: 'Client showing positive engagement with therapeutic process',
            confidence: 0.85,
            timestamp: Date.now()
          }
        ]);
      }, 3000);

      setTimeout(() => {
        setRiskAlerts([
          {
            id: Date.now().toString(),
            severity: 'low',
            message: 'Session proceeding normally',
            icon: 'check-circle',
            timestamp: Date.now()
          }
        ]);
      }, 5000);
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      setRiskAlerts(prev => [...prev, {
        id: Date.now().toString(),
        severity: 'high',
        message: 'Failed to initialize recording services',
        icon: 'alert-triangle',
        timestamp: Date.now()
      }]);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    setSessionMode('review');
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isPending = analyzeSessionMutation.isPending || 
                   enhanceNoteMutation.isPending || 
                   riskAssessmentMutation.isPending || 
                   ebpAnalysisMutation.isPending;

  return (
    <div className="flex h-[600px] bg-white dark:bg-slate-900 rounded-lg border shadow-lg overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Controls */}
        <div className="flex items-center justify-between p-4 border-b bg-slate-50 dark:bg-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`} />
              <span className="font-medium">
                {isRecording ? 'Recording' : sessionMode === 'review' ? 'Review Mode' : 'Ready'}
              </span>
            </div>
            {sessionDuration > 0 && (
              <div className="text-sm text-muted-foreground">
                Duration: {formatDuration(sessionDuration)}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSessionMode(sessionMode === 'session' ? 'review' : 'session')}
            >
              {sessionMode === 'session' ? 'Review Mode' : 'Session Mode'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Video/Recording Area */}
        <div className="flex-1 p-6">
          <Card className="h-full">
            <CardContent className="p-6 h-full flex flex-col justify-center">
              <div 
                ref={videoContainerRef}
                className="relative bg-slate-100 dark:bg-slate-800 rounded-lg h-full min-h-[300px] flex items-center justify-center"
              >
                {!hasVideo && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Click Start to begin recording</p>
                    </div>
                  </div>
                )}

                {/* Recording indicator */}
                {isRecording && (
                  <div className="absolute top-4 left-4 flex gap-2">
                    <motion.div
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                    >
                      ● REC
                    </motion.div>
                    <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                      {formatDuration(sessionDuration)}
                    </div>
                  </div>
                )}

                {/* Emotion overlay */}
                {isRecording && emotionalState.emotion !== 'neutral' && (
                  <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded">
                    <div className="text-sm">
                      <strong>Emotion:</strong> {emotionalState.emotion}
                    </div>
                    <div className="text-xs opacity-75">
                      Confidence: {Math.round(emotionalState.confidence * 100)}%
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex gap-4 mt-4">
                {!isRecording ? (
                  <Button onClick={startRecording} className="flex-1" size="lg">
                    <Mic className="h-4 w-4 mr-2" />
                    Start Live Analysis
                  </Button>
                ) : (
                  <Button onClick={stopRecording} variant="destructive" className="flex-1" size="lg">
                    <Square className="h-4 w-4 mr-2" />
                    Stop Recording
                  </Button>
                )}
                
                {isRecording && (
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => {
                      const note = window.prompt('Add note for this moment:');
                      if (note) {
                        setFlaggedMoments(prev => [...prev, { timestamp: sessionDuration, note }]);
                      }
                    }}
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Flag Moment
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Progressive Disclosure Sidebar */}
      {!sidebarCollapsed && (
        <motion.div 
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 400, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          className="bg-white dark:bg-slate-800 border-l overflow-y-auto"
        >
          <div className="p-4 space-y-4">
            {sessionMode === 'session' ? (
              /* Session Mode - Critical Alerts Only */
              <>
                {/* Critical Risk Alerts */}
                {riskAlerts.filter(alert => alert.severity === 'high' || alert.severity === 'critical').length > 0 && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium mb-2">Critical Alert</div>
                      {riskAlerts.filter(alert => alert.severity === 'high' || alert.severity === 'critical').map((alert, i) => (
                        <div key={i} className="text-sm">{alert.message}</div>
                      ))}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Current Emotion */}
                {isRecording && emotionalState.emotion !== 'neutral' && (
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Smile className="h-4 w-4 text-blue-600" />
                        <div>
                          <div className="font-medium text-blue-800">{emotionalState.emotion}</div>
                          <div className="text-xs text-blue-600">
                            {Math.round(emotionalState.confidence * 100)}% confidence
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Real-time Suggestions */}
                {isRecording && clinicalInsights.length > 0 && (
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="h-4 w-4 text-green-600 mt-0.5" />
                        <div>
                          <div className="font-medium text-green-800 text-sm mb-1">Live Insight</div>
                          <div className="text-xs text-green-700">
                            {clinicalInsights[clinicalInsights.length - 1]?.content}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Flagged Moments */}
                {flaggedMoments.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Flag className="h-4 w-4" />
                        Flagged Moments ({flaggedMoments.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {flaggedMoments.slice(-3).map((moment, i) => (
                          <div key={i} className="text-xs p-2 bg-muted rounded">
                            <div className="font-medium">{formatDuration(moment.timestamp)}</div>
                            <div className="text-muted-foreground">{moment.note}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              /* Review Mode - Full Analysis */
              <div className="space-y-4">
                {/* AI Analysis Controls */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Session Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Session Transcript</label>
                      <Textarea
                        value={sessionTranscript}
                        onChange={(e) => setSessionTranscript(e.target.value)}
                        placeholder="Transcript will be captured during recording..."
                        className="min-h-[80px] text-xs"
                      />
                    </div>
                    
                    <Button 
                      onClick={() => analyzeSessionMutation.mutate()}
                      disabled={isPending || !sessionTranscript.trim()}
                      size="sm"
                      className="w-full"
                    >
                      {analyzeSessionMutation.isPending ? 'Analyzing...' : 'Run AI Analysis'}
                    </Button>
                  </CardContent>
                </Card>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4 text-xs">
                    <TabsTrigger value="analysis" className="text-xs">Analysis</TabsTrigger>
                    <TabsTrigger value="notes" className="text-xs">Notes</TabsTrigger>
                    <TabsTrigger value="risk" className="text-xs">Risk</TabsTrigger>
                    <TabsTrigger value="ebp" className="text-xs">EBP</TabsTrigger>
                  </TabsList>

                  {/* Session Analysis Results */}
                  <TabsContent value="analysis" className="space-y-3 mt-4">
                    {sessionAnalysisResult ? (
                      <div className="space-y-3">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Activity className="h-4 w-4" />
                              Therapeutic Insights
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0 space-y-3">
                            <div>
                              <h4 className="text-xs font-medium mb-1">Key Themes</h4>
                              <div className="flex flex-wrap gap-1">
                                {sessionAnalysisResult.analysis.themes?.map((theme, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">{theme}</Badge>
                                ))}
                              </div>
                            </div>
                            
                            <Separator />
                            
                            <div>
                              <h4 className="text-xs font-medium mb-1">Interventions Used</h4>
                              <div className="flex flex-wrap gap-1">
                                {sessionAnalysisResult.analysis.interventions?.map((intervention, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">{intervention}</Badge>
                                ))}
                              </div>
                            </div>

                            <Separator />

                            <div>
                              <h4 className="text-xs font-medium mb-1">Therapeutic Alliance Score</h4>
                              <div className="text-lg font-bold text-green-600">
                                {sessionAnalysisResult.analysis.therapeuticAlliance}/10
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Button 
                                onClick={() => enhanceNoteMutation.mutate()}
                                disabled={enhanceNoteMutation.isPending}
                                size="sm"
                                variant="outline"
                                className="w-full"
                              >
                                {enhanceNoteMutation.isPending ? 'Enhancing...' : 'Enhance Notes'}
                              </Button>
                              <Button 
                                onClick={() => riskAssessmentMutation.mutate()}
                                disabled={riskAssessmentMutation.isPending}
                                size="sm"
                                variant="outline"
                                className="w-full"
                              >
                                {riskAssessmentMutation.isPending ? 'Assessing...' : 'Risk Assessment'}
                              </Button>
                              <Button 
                                onClick={() => ebpAnalysisMutation.mutate()}
                                disabled={ebpAnalysisMutation.isPending}
                                size="sm"
                                variant="outline"
                                className="w-full"
                              >
                                {ebpAnalysisMutation.isPending ? 'Analyzing...' : 'EBP Analysis'}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Time Efficiency
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Manual:</span>
                                <div className="font-semibold">
                                  {sessionAnalysisResult.timeEfficiency.estimatedManualTime} min
                                </div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">AI:</span>
                                <div className="font-semibold">
                                  {sessionAnalysisResult.timeEfficiency.aiAssistedTime} min
                                </div>
                              </div>
                            </div>
                            
                            <Alert className="mt-2">
                              <Clock className="h-3 w-3" />
                              <AlertDescription className="text-xs">
                                <strong>Saved: {sessionAnalysisResult.timeEfficiency.timeSaved} min</strong>
                                <br />
                                {sessionAnalysisResult.timeEfficiency.efficiencyGain}
                              </AlertDescription>
                            </Alert>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="text-center py-6">
                          <p className="text-xs text-muted-foreground">Run analysis to see results</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  {/* Note Enhancement Results */}
                  <TabsContent value="notes" className="space-y-3 mt-4">
                    {noteAssistanceResult ? (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            AI-Enhanced Documentation
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-3">
                          <div>
                            <h4 className="text-xs font-medium mb-2">Suggested Improvements</h4>
                            <div className="space-y-1">
                              {noteAssistanceResult.assistance.suggestedImprovements?.map((improvement, i) => (
                                <div key={i} className="p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                                  {improvement}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-xs font-medium mb-2">Compliance Checks</h4>
                            <div className="space-y-1">
                              {noteAssistanceResult.assistance.complianceChecks?.map((check, i) => (
                                <div key={i} className="flex items-center gap-2 p-1 border rounded text-xs">
                                  {check.status === 'pass' ? 
                                    <CheckCircle className="h-3 w-3 text-green-500" /> :
                                    <AlertTriangle className="h-3 w-3 text-yellow-500" />
                                  }
                                  <span>{check.rule}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-xs font-medium mb-2">Suggested Billing Codes</h4>
                            <div className="flex flex-wrap gap-1">
                              {noteAssistanceResult.assistance.billingCodes?.map((code, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">{code}</Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card>
                        <CardContent className="text-center py-6">
                          <p className="text-xs text-muted-foreground">Complete session analysis first</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  {/* Risk Assessment Results */}
                  <TabsContent value="risk" className="space-y-3 mt-4">
                    {riskAssessmentResult ? (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Risk Assessment
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-3">
                          <div>
                            <span className="text-xs text-muted-foreground">Risk Level:</span>
                            <Badge 
                              variant={riskAssessmentResult.riskAssessment.riskLevel === 'low' ? 'secondary' : 'destructive'}
                              className="ml-2"
                            >
                              {riskAssessmentResult.riskAssessment.riskLevel.toUpperCase()}
                            </Badge>
                          </div>
                          
                          <div>
                            <h4 className="text-xs font-medium mb-2">Risk Indicators</h4>
                            <div className="space-y-1 text-xs">
                              {Object.entries(riskAssessmentResult.riskAssessment.indicators).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span>{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                                  <span className={value ? 'text-red-600' : 'text-green-600'}>
                                    {value ? 'Present' : 'Not detected'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {riskAssessmentResult.riskAssessment.recommendations.length > 0 && (
                            <div>
                              <h4 className="text-xs font-medium mb-2">Recommendations</h4>
                              <div className="space-y-1">
                                {riskAssessmentResult.riskAssessment.recommendations.map((rec, i) => (
                                  <div key={i} className="text-xs p-2 bg-yellow-50 border border-yellow-200 rounded">
                                    {rec}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ) : (
                      <Card>
                        <CardContent className="text-center py-6">
                          <p className="text-xs text-muted-foreground">Complete session analysis first</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  {/* EBP Analysis Results */}
                  <TabsContent value="ebp" className="space-y-3 mt-4">
                    {ebpAnalysisResult ? (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Evidence-Based Practice Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-3">
                          <div>
                            <h4 className="text-xs font-medium mb-2">Modalities Detected</h4>
                            <div className="flex flex-wrap gap-1">
                              {ebpAnalysisResult.analysis.modalitiesDetected?.map((modality, i) => (
                                <Badge key={i} variant="outline" className="text-xs">{modality}</Badge>
                              ))}
                            </div>
                          </div>

                          <Separator />

                          <div>
                            <h4 className="text-xs font-medium mb-2">Fidelity Scores</h4>
                            <div className="space-y-1">
                              {Object.entries(ebpAnalysisResult.analysis.fidelityScores).map(([modality, score]) => (
                                <div key={modality} className="flex justify-between items-center text-xs">
                                  <span>{modality}</span>
                                  <Badge variant={Number(score) > 7 ? 'default' : 'secondary'}>
                                    {Number(score).toFixed(1)}/10
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>

                          <Separator />

                          <div>
                            <h4 className="text-xs font-medium mb-2">Suggested Techniques</h4>
                            <div className="space-y-1">
                              {ebpAnalysisResult.analysis.suggestedTechniques?.map((technique, i) => (
                                <div key={i} className="text-xs p-2 bg-green-50 border border-green-200 rounded">
                                  {technique}
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card>
                        <CardContent className="text-center py-6">
                          <p className="text-xs text-muted-foreground">Complete session analysis first</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default LiveSessionRecorder;