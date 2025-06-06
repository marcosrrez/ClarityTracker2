import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Clock,
  Activity,
  Shield,
  Mic,
  MicOff,
  Video,
  VideoOff
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ClinicalInsight {
  type: 'intervention' | 'observation' | 'risk';
  content: string;
  confidence: number;
  timestamp: number;
}

interface RiskAlert {
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: number;
}

export function EnhancedSessionRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [sessionTranscript, setSessionTranscript] = useState('');
  const [clinicalInsights, setClinicalInsights] = useState<ClinicalInsight[]>([]);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Analysis mutations
  const analyzeSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/session/analyze', {
        transcript: sessionTranscript,
        sessionDuration,
        clientPopulation: 'Adult anxiety disorders',
        counselorExperience: 'LAC in training',
        userId: 'current-user'
      });
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.analysis?.insights) {
        setClinicalInsights(prev => [...prev, ...data.analysis.insights.map((insight: any) => ({
          type: 'observation',
          content: insight,
          confidence: 0.8,
          timestamp: Date.now()
        }))]);
      }
    }
  });

  const enhanceNoteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/session/progress-note-assist', {
        transcript: sessionTranscript,
        existingNotes: '',
        userId: 'current-user'
      });
      return await response.json();
    }
  });

  const riskAssessmentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/session/risk-assessment', {
        transcript: sessionTranscript,
        userId: 'current-user',
        logEntryId: 'current-session'
      });
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.riskLevel && data.riskLevel !== 'low') {
        setRiskAlerts(prev => [...prev, {
          severity: data.riskLevel,
          message: data.concerns?.[0] || 'Risk assessment indicates elevated concern',
          timestamp: Date.now()
        }]);
      }
    }
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      // Start video capture
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      setVideoStream(stream);
      setHasVideo(true);
      setIsRecording(true);
      setSessionDuration(0);
      
      console.log('Video capture started');
      
      // Start Azure Speech transcription
      const response = await fetch('/api/azure-speech/start-transcription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: `session_${Date.now()}`,
          userId: 'current-user',
        })
      });

      if (response.ok) {
        const { sessionId } = await response.json();
        setCurrentSessionId(sessionId);
        console.log('Azure Speech session started:', sessionId);
        
        // Start polling for transcript updates
        startTranscriptPolling(sessionId);
        
        // Start video emotion analysis
        startVideoAnalysis(sessionId);
      } else {
        console.error('Failed to start transcription service');
      }
      
      // Start duration timer
      const timer = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
      
      // Store timer reference for cleanup
      (window as any).sessionTimer = timer;
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      setRiskAlerts(prev => [...prev, {
        severity: 'high',
        message: 'Failed to access camera/microphone',
        timestamp: Date.now()
      }]);
    }
  };

  const stopRecording = async () => {
    try {
      // Stop video stream
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        setVideoStream(null);
      }
      
      // Stop transcription
      if (currentSessionId) {
        await fetch('/api/azure-speech/stop-transcription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: currentSessionId })
        });
      }
      
      // Clear timer
      if ((window as any).sessionTimer) {
        clearInterval((window as any).sessionTimer);
        (window as any).sessionTimer = null;
      }
      
      setIsRecording(false);
      setHasVideo(false);
      setCurrentSessionId(null);
      
      console.log('Recording stopped');
      
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  const startTranscriptPolling = (sessionId: string) => {
    const pollTranscript = async () => {
      try {
        const response = await fetch(`/api/azure-speech/get-transcript/${sessionId}`);
        if (response.ok) {
          const { segments } = await response.json();
          if (segments && segments.length > 0) {
            const fullTranscript = segments
              .filter((s: any) => s.isFinal)
              .map((s: any) => s.text)
              .join(' ');
            
            if (fullTranscript !== sessionTranscript) {
              setSessionTranscript(fullTranscript);
              
              // Trigger real-time analysis for new content
              if (fullTranscript.length > sessionTranscript.length + 50) {
                triggerRealTimeAnalysis(fullTranscript);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error polling transcript:', error);
      }
    };

    // Poll every 2 seconds during recording
    const pollInterval = setInterval(pollTranscript, 2000);
    (window as any).transcriptPoll = pollInterval;
    
    // Clear on stop
    setTimeout(() => {
      if (!isRecording) {
        clearInterval(pollInterval);
        (window as any).transcriptPoll = null;
      }
    }, 1000);
  };

  const startVideoAnalysis = (sessionId: string) => {
    const captureVideoFrame = async () => {
      if (!videoStream) return;

      try {
        const video = document.querySelector('video') as HTMLVideoElement;
        if (!video) return;

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const imageData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
          
          // Send for AI emotion analysis
          const response = await fetch('/api/multimodal/analyze-emotion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageData,
              sessionId
            })
          });

          if (response.ok) {
            const emotionData = await response.json();
            setClinicalInsights(prev => [...prev, {
              type: 'observation',
              content: `Video Analysis: ${emotionData.dominantEmotion || 'neutral'} emotion detected, ${emotionData.engagementLevel || 'moderate'} engagement`,
              confidence: emotionData.emotionConfidence || 0.7,
              timestamp: Date.now()
            }]);
          }
        }
      } catch (error) {
        console.error('Video analysis error:', error);
      }
    };

    // Capture frame every 10 seconds for analysis
    const videoAnalysisInterval = setInterval(captureVideoFrame, 10000);
    (window as any).videoAnalysisInterval = videoAnalysisInterval;
  };

  const triggerRealTimeAnalysis = async (transcript: string) => {
    try {
      const response = await fetch('/api/ai/real-time-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: transcript,
          timestamp: Date.now()
        })
      });

      if (response.ok) {
        const analysis = await response.json();
        
        if (analysis.insights) {
          setClinicalInsights(prev => [...prev, ...analysis.insights.map((insight: string) => ({
            type: 'observation' as const,
            content: insight,
            confidence: 0.8,
            timestamp: Date.now()
          }))]);
        }

        if (analysis.riskLevel && analysis.riskLevel !== 'low') {
          setRiskAlerts(prev => [...prev, {
            severity: analysis.riskLevel,
            message: analysis.riskFactors?.[0] || 'Elevated risk detected',
            timestamp: Date.now()
          }]);
        }
      }
    } catch (error) {
      console.error('Real-time analysis error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Recording Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Session Intelligence Enhancement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                variant={isRecording ? "destructive" : "default"}
                size="lg"
                className="flex items-center gap-2"
              >
                {isRecording ? (
                  <>
                    <MicOff className="h-5 w-5" />
                    Stop Session
                  </>
                ) : (
                  <>
                    <Mic className="h-5 w-5" />
                    Start Session
                  </>
                )}
              </Button>
              
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`} />
                <span className="font-medium">
                  {isRecording ? 'Recording Active' : 'Ready to Record'}
                </span>
              </div>
              
              {sessionDuration > 0 && (
                <div className="text-sm text-muted-foreground">
                  Duration: {formatDuration(sessionDuration)}
                </div>
              )}
            </div>
          </div>

          {/* Video Preview */}
          {hasVideo && (
            <div className="mb-4">
              <video
                ref={(el) => {
                  if (el && videoStream) {
                    el.srcObject = videoStream;
                  }
                }}
                autoPlay
                muted
                className="w-full max-w-md h-48 bg-black rounded-lg"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Transcript */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Live Transcript
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={sessionTranscript}
              onChange={(e) => setSessionTranscript(e.target.value)}
              placeholder="Transcript will appear here during recording..."
              className="min-h-[200px] text-sm"
            />
            
            <Button 
              onClick={() => analyzeSessionMutation.mutate()}
              disabled={analyzeSessionMutation.isPending || !sessionTranscript.trim()}
              size="sm"
              className="w-full"
            >
              {analyzeSessionMutation.isPending ? 'Analyzing...' : 'Run AI Analysis'}
            </Button>
          </CardContent>
        </Card>

        {/* Clinical Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Clinical Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[200px] overflow-y-auto">
              {clinicalInsights.length === 0 ? (
                <p className="text-sm text-muted-foreground">Real-time insights will appear here during session</p>
              ) : (
                clinicalInsights.map((insight, index) => (
                  <div key={index} className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border-l-4 border-blue-500">
                    <p className="text-sm">{insight.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {insight.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Confidence: {(insight.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Alerts */}
      {riskAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Risk Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {riskAlerts.map((alert, index) => (
                <Alert key={index} className={
                  alert.severity === 'high' ? 'border-red-500 bg-red-50 dark:bg-red-950' :
                  alert.severity === 'medium' ? 'border-orange-500 bg-orange-50 dark:bg-orange-950' :
                  'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'
                }>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>{alert.message}</span>
                      <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Tools */}
      <Tabs defaultValue="analysis" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analysis">Session Analysis</TabsTrigger>
          <TabsTrigger value="notes">Progress Notes</TabsTrigger>
          <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comprehensive Session Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => analyzeSessionMutation.mutate()}
                disabled={analyzeSessionMutation.isPending || !sessionTranscript.trim()}
                className="w-full"
              >
                {analyzeSessionMutation.isPending ? 'Analyzing Session...' : 'Generate Full Analysis'}
              </Button>
              
              {analyzeSessionMutation.data && (
                <div className="mt-4 space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Key Insights</h4>
                    <div className="space-y-2">
                      {analyzeSessionMutation.data.analysis?.insights?.map((insight: string, index: number) => (
                        <div key={index} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                          <p className="text-sm">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI-Assisted Progress Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => enhanceNoteMutation.mutate()}
                disabled={enhanceNoteMutation.isPending || !sessionTranscript.trim()}
                className="w-full"
              >
                {enhanceNoteMutation.isPending ? 'Generating Notes...' : 'Generate Progress Notes'}
              </Button>
              
              {enhanceNoteMutation.data && (
                <div className="mt-4">
                  <Textarea
                    value={enhanceNoteMutation.data.enhancedNote || ''}
                    className="min-h-[200px]"
                    placeholder="Enhanced progress notes will appear here..."
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => riskAssessmentMutation.mutate()}
                disabled={riskAssessmentMutation.isPending || !sessionTranscript.trim()}
                className="w-full"
              >
                {riskAssessmentMutation.isPending ? 'Assessing Risk...' : 'Run Risk Assessment'}
              </Button>
              
              {riskAssessmentMutation.data && (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Risk Level:</span>
                    <Badge variant={
                      riskAssessmentMutation.data.riskLevel === 'high' ? 'destructive' :
                      riskAssessmentMutation.data.riskLevel === 'medium' ? 'secondary' : 'default'
                    }>
                      {riskAssessmentMutation.data.riskLevel?.toUpperCase()}
                    </Badge>
                  </div>
                  
                  {riskAssessmentMutation.data.concerns && (
                    <div>
                      <h4 className="font-medium mb-2">Areas of Concern</h4>
                      <ul className="space-y-1">
                        {riskAssessmentMutation.data.concerns.map((concern: string, index: number) => (
                          <li key={index} className="text-sm">• {concern}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}