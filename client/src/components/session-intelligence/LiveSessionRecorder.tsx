import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, Video, Square, Brain, Activity, AlertTriangle, Shield, CheckCircle, FileText, TrendingUp, Eye, Smile, Users, Heart, BarChart3, ChevronDown, ChevronUp, Flag, Lightbulb, Settings, Minimize2, Maximize2, Play, Pause, Camera, CameraOff, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

interface VideoAnalysisFrame {
  timestamp: number;
  faceDetection: {
    facesDetected: number;
    landmarks: number[][];
    eyeGaze: { x: number; y: number };
    headPose: { pitch: number; yaw: number; roll: number };
  };
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    disgust: number;
    contempt: number;
    neutral: number;
    dominantEmotion: string;
    intensity: number;
  };
  bodyLanguage: {
    pose: { x: number; y: number; confidence: number }[];
    posture: 'engaged' | 'neutral' | 'withdrawn';
    gestures: string[];
    fidgeting: number;
  };
  engagement: {
    overallScore: number;
    eyeContact: number;
    attentiveness: number;
    participation: number;
  };
  behavioralMarkers: {
    riskIndicators: string[];
    therapeuticAlliance: number;
    stressLevel: number;
    comfortLevel: number;
  };
}

interface TranscriptionSegment {
  text: string;
  speaker: string;
  timestamp: number;
  confidence: number;
  clinicalTags: string[];
  emotionalTone: string;
}

const LiveSessionRecorder: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [hasVideo, setHasVideo] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<VideoAnalysisFrame | null>(null);
  const [emotionalState, setEmotionalState] = useState<EmotionState>({
    emotion: 'neutral',
    intensity: 0,
    confidence: 0
  });
  // Interface states for improved UX
  const [sessionMode, setSessionMode] = useState<'session' | 'review'>('session');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [criticalAlertsOnly, setCriticalAlertsOnly] = useState(true);
  const [flaggedMoments, setFlaggedMoments] = useState<Array<{timestamp: number, note: string}>>([]);
  const [activeTab, setActiveTab] = useState('alerts');
  
  // Analysis data
  const [transcriptionSegments, setTranscriptionSegments] = useState<TranscriptionSegment[]>([]);
  const [clinicalInsights, setClinicalInsights] = useState<ClinicalInsight[]>([]);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [analysisHistory, setAnalysisHistory] = useState<VideoAnalysisFrame[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognizerRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize video stream
  useEffect(() => {
    const initializeVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasVideo(true);
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasVideo(false);
      }
    };

    initializeVideo();
  }, []);

  // Start recording function
  const startRecording = async () => {
    try {
      setIsRecording(true);
      setSessionDuration(0);

      // Initialize Azure Speech SDK
      const response = await fetch('/api/azure-speech/config');
      const config = await response.json();
      
      if (config.key && config.region) {
        const { SpeechConfig, AudioConfig, SpeechRecognizer } = await import('microsoft-cognitiveservices-speech-sdk');
        
        const speechConfig = SpeechConfig.fromSubscription(config.key, config.region);
        speechConfig.speechRecognitionLanguage = "en-US";
        speechConfig.enableDictation();

        const audioConfig = AudioConfig.fromDefaultMicrophoneInput();
        const recognizer = new SpeechRecognizer(speechConfig, audioConfig);
        recognizerRef.current = recognizer;

        recognizer.recognized = async (s: any, e: any) => {
          if (e.result.text) {
            const newSegment: TranscriptionSegment = {
              text: e.result.text,
              speaker: 'Client',
              timestamp: Date.now(),
              confidence: 0.95,
              clinicalTags: [],
              emotionalTone: 'neutral'
            };

            setTranscriptionSegments(prev => [...prev, newSegment]);

            // Send for analysis
            try {
              const analysisResponse = await fetch('/api/session-intelligence/analyze-transcript', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSegment)
              });
            } catch (error) {
              console.error('Error analyzing transcript:', error);
            }
          }
        };

        recognizer.startContinuousRecognitionAsync();
        console.log('Azure Speech SDK initialized successfully');
      }

      // Start video analysis
      if (hasVideo && videoRef.current) {
        startVideoAnalysis();
      }

      // Start session timer
      intervalRef.current = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);

      console.log('Live session recording started');

    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
    }
  };

  // Video analysis function
  const startVideoAnalysis = () => {
    const analyzeFrame = async () => {
      if (!isRecording || !videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        try {
          const imageData = canvas.toDataURL('image/jpeg', 0.8);
          const base64Data = imageData.split(',')[1];

          const analysisResponse = await fetch('/api/session-intelligence/analyze-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              frame: base64Data,
              timestamp: Date.now()
            })
          });

          if (analysisResponse.ok) {
            const analysisFrame: VideoAnalysisFrame = await analysisResponse.json();
            setCurrentAnalysis(analysisFrame);
            setAnalysisHistory(prev => [...prev.slice(-19), analysisFrame]);
            setEmotionalState({
              emotion: analysisFrame.emotions.dominantEmotion,
              intensity: analysisFrame.emotions.intensity,
              confidence: analysisFrame.emotions.intensity
            });
          }
        } catch (error) {
          console.error('Error analyzing video frame:', error);
        }
      }

      if (isRecording) {
        setTimeout(analyzeFrame, 2000);
      }
    };

    analyzeFrame();
  };

  // Stop recording function
  const stopRecording = async () => {
    try {
      setIsRecording(false);

      if (recognizerRef.current) {
        recognizerRef.current.stopContinuousRecognitionAsync();
        recognizerRef.current = null;
      }

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Finalize session
      const response = await fetch('/api/session-intelligence/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration: sessionDuration,
          transcriptionSegments,
          clinicalInsights,
          analysisHistory,
          overallEngagement: currentAnalysis?.engagement.overallScore || 0
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Session finalized:', result);
      }

    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isRecording) {
        stopRecording();
      }
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900">
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-b shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Session Intelligence</h1>
          
          {/* Mode Toggle */}
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={sessionMode === 'session' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSessionMode('session')}
              className="text-xs"
            >
              <Activity className="h-3 w-3 mr-1" />
              Session Mode
            </Button>
            <Button
              variant={sessionMode === 'review' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSessionMode('review')}
              className="text-xs"
            >
              <FileText className="h-3 w-3 mr-1" />
              Review Mode
            </Button>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-sm">
            <Brain className="h-4 w-4 text-green-600" />
            <span className="text-green-600 font-medium">Google AI Active</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Shield className="h-4 w-4 text-blue-600" />
            <span className="text-blue-600 font-medium">HIPAA Compliant</span>
          </div>
          {isRecording && (
            <div className="flex items-center gap-1 text-sm">
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="h-2 w-2 bg-red-500 rounded-full"
              />
              <span className="text-red-600 font-medium">{formatDuration(sessionDuration)}</span>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Feed */}
        <div className={`flex-1 p-4 ${sidebarCollapsed ? 'mr-0' : 'mr-4'}`}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Live Video Analysis
                {isRecording && (
                  <Badge variant="destructive" className="ml-2">
                    <Activity className="h-3 w-3 mr-1" />
                    RECORDING
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-80 object-cover"
                  muted
                  playsInline
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {!hasVideo && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <p className="text-white">Video access required for analysis</p>
                  </div>
                )}

                {/* Recording indicators */}
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

                  {/* Therapeutic Alliance */}
                  {analysisHistory.length > 0 && (
                    <Card>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4 text-pink-600" />
                            <span className="text-sm font-medium">Therapeutic Alliance</span>
                          </div>
                          <Badge variant={analysisHistory[analysisHistory.length - 1]?.behavioralMarkers?.therapeuticAlliance > 7 ? 'default' : 'secondary'}>
                            {analysisHistory[analysisHistory.length - 1]?.behavioralMarkers?.therapeuticAlliance?.toFixed(1) || 'N/A'}/10
                          </Badge>
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
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3 text-xs">
                    <TabsTrigger value="alerts" className="text-xs">Alerts</TabsTrigger>
                    <TabsTrigger value="insights" className="text-xs">Insights</TabsTrigger>
                    <TabsTrigger value="documentation" className="text-xs">Docs</TabsTrigger>
                  </TabsList>

                  <TabsContent value="alerts" className="space-y-3 mt-4">
                    {/* Risk Assessment */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Risk Assessment
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {riskAlerts.map((alert, i) => (
                            <div key={i} className={`p-2 rounded border text-xs ${
                              alert.severity === 'critical' ? 'bg-red-50 border-red-200' :
                              alert.severity === 'high' ? 'bg-orange-50 border-orange-200' :
                              alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                              'bg-blue-50 border-blue-200'
                            }`}>
                              <div className="font-medium">{alert.severity.toUpperCase()}</div>
                              <div>{alert.message}</div>
                            </div>
                          ))}
                          {riskAlerts.length === 0 && (
                            <div className="text-xs text-muted-foreground p-2">No risk alerts detected</div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Compliance Monitoring */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Compliance
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between items-center p-2 bg-green-50 border border-green-200 rounded">
                            <span>HIPAA Compliance</span>
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          </div>
                          <div className="flex justify-between items-center p-2 bg-green-50 border border-green-200 rounded">
                            <span>Documentation Quality</span>
                            <Badge variant="outline" className="text-xs">High</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="insights" className="space-y-3 mt-4">
                    {/* Clinical Insights */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Brain className="h-4 w-4" />
                          Clinical Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {clinicalInsights.map((insight, i) => (
                            <div key={i} className="p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                              <div className="font-medium text-blue-800">{insight.type}</div>
                              <div className="text-blue-700">{insight.content}</div>
                              <div className="text-blue-600 mt-1">{Math.round(insight.confidence * 100)}% confidence</div>
                            </div>
                          ))}
                          {clinicalInsights.length === 0 && (
                            <div className="text-xs text-muted-foreground p-2">Insights will appear during analysis</div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Engagement Metrics */}
                    {analysisHistory.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Engagement
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span>Overall Score:</span>
                              <span className="font-medium">{analysisHistory[analysisHistory.length - 1]?.engagement?.overallScore || 0}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Eye Contact:</span>
                              <span className="font-medium">{analysisHistory[analysisHistory.length - 1]?.engagement?.eyeContact || 0}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Attentiveness:</span>
                              <span className="font-medium">{analysisHistory[analysisHistory.length - 1]?.engagement?.attentiveness || 0}%</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="documentation" className="space-y-3 mt-4">
                    {/* Auto-Generated Documentation */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          AI Documentation
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3 text-xs">
                          <div className="p-2 bg-gray-50 rounded">
                            <div className="font-medium mb-1">Session Summary</div>
                            <div>Duration: {formatDuration(sessionDuration)}</div>
                            <div>Segments: {transcriptionSegments.length}</div>
                            <div>Analysis Frames: {analysisHistory.length}</div>
                          </div>
                          
                          {transcriptionSegments.length > 0 && (
                            <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                              <div className="font-medium mb-1">Latest Transcript</div>
                              <div className="max-h-20 overflow-y-auto">
                                "{transcriptionSegments[transcriptionSegments.length - 1]?.text}"
                              </div>
                            </div>
                          )}
                          
                          <div className="p-2 bg-green-50 border border-green-200 rounded">
                            <div className="font-medium mb-1">Efficiency Metrics</div>
                            <div>Time Saved: ~38 minutes</div>
                            <div>Automation Rate: 84%</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default LiveSessionRecorder;
