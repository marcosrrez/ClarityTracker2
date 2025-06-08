import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { AzureSpeechService, TranscriptionSegment } from '@/services/azureSpeechService';
import { 
  Mic, 
  MicOff, 
  Square, 
  Play, 
  Pause,
  FileText, 
  Shield,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  Activity,
  Brain
} from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface SessionMetadata {
  clientId: string;
  sessionType: 'individual' | 'group' | 'family';
  duration: number;
  goals: string[];
  notes: string;
}

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  transcript: string;
  isTranscribing: boolean;
}

interface AnalysisResults {
  sessionAnalysis?: any;
  riskAssessment?: any;
  progressNotes?: any;
  ebpAnalysis?: any;
  treatmentRecommendations?: any;
}

export default function SessionRecording() {
  const [sessionMetadata, setSessionMetadata] = useState<SessionMetadata>({
    clientId: '',
    sessionType: 'individual',
    duration: 0,
    goals: [],
    notes: ''
  });
  
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioBlob: null,
    transcript: '',
    isTranscribing: false
  });

  const [analysisResults, setAnalysisResults] = useState<AnalysisResults>({});
  const [currentTab, setCurrentTab] = useState('setup');
  const { toast } = useToast();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const azureSpeechRef = useRef<AzureSpeechService | null>(null);
  const webSpeechRef = useRef<any>(null);
  const [transcriptionSegments, setTranscriptionSegments] = useState<TranscriptionSegment[]>([]);
  const [liveInsights, setLiveInsights] = useState<any>(null);
  const [realtimeAnalysis, setRealtimeAnalysis] = useState({
    themes: [] as string[],
    interventions: [] as string[],
    riskIndicators: [] as string[],
    therapeuticAlliance: 0,
    treatmentSuggestions: [] as string[],
    sessionQuality: 0
  });
  const [clinicalAlerts, setClinicalAlerts] = useState<any[]>([]);

  // Initialize Azure Speech Service with fallback
  const initializeAzureSpeech = async () => {
    try {
      // Get credentials from server-side environment
      const response = await apiRequest('GET', '/api/azure/speech-config');
      
      if (!response.ok) {
        throw new Error(`Azure config request failed: ${response.status}`);
      }
      
      const config = await response.json();
      
      if (!config.subscriptionKey || !config.serviceRegion) {
        throw new Error('Invalid Azure Speech configuration received');
      }
      
      azureSpeechRef.current = new AzureSpeechService({
        subscriptionKey: config.subscriptionKey,
        serviceRegion: config.serviceRegion,
        language: 'en-US'
      });
      console.log('Azure Speech Service initialized successfully');
      
      // Test the connection
      const isConnected = await AzureSpeechService.testConnection(config);
      if (!isConnected) {
        console.warn('Azure Speech Service connection test failed');
      }
      
    } catch (error) {
      console.error('Azure Speech Service initialization failed:', error);
      
      // Initialize fallback Web Speech API
      initializeWebSpeechFallback();
      
      toast({
        title: "Using Fallback Speech Recognition",
        description: "Azure Speech Service unavailable. Using browser speech recognition.",
        variant: "default"
      });
    }
  };

  // Fallback to Web Speech API
  const initializeWebSpeechFallback = () => {
    try {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event: any) => {
          const last = event.results.length - 1;
          const transcript = event.results[last][0].transcript;
          const confidence = event.results[last][0].confidence || 0.8;
          
          if (event.results[last].isFinal) {
            const segment = {
              text: transcript,
              timestamp: Date.now(),
              confidence: confidence
            };
            
            setTranscriptionSegments(prev => [...prev, segment]);
            setRecordingState(prev => ({
              ...prev,
              transcript: prev.transcript + ' ' + transcript
            }));
            
            // Trigger real-time analysis for substantial content
            if (transcript.length > 50) {
              performRealtimeAnalysis(recordingState.transcript + ' ' + transcript);
            }
          }
        };
        
        recognition.onerror = (event: any) => {
          console.error('Web Speech API error:', event.error);
        };
        
        webSpeechRef.current = recognition;
        console.log('Web Speech API fallback initialized');
      } else {
        throw new Error('No speech recognition support available');
      }
    } catch (error) {
      console.error('Failed to initialize speech recognition fallback:', error);
      toast({
        title: "Speech Recognition Unavailable",
        description: "Neither Azure Speech Service nor browser speech recognition is available.",
        variant: "destructive"
      });
    }
  };

  // Session recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordingState(prev => ({ ...prev, audioBlob }));
      };

      mediaRecorder.start(1000); // Collect data every second
      
      setRecordingState(prev => ({ ...prev, isRecording: true, isPaused: false, isTranscribing: true }));
      setCurrentTab('recording');
      
      // Start duration counter
      intervalRef.current = setInterval(() => {
        setRecordingState(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);

      // Start real-time transcription with Azure
      await startAzureTranscription();

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Unable to access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  // Start transcription service (Azure or fallback)
  const startAzureTranscription = async () => {
    if (!azureSpeechRef.current && !webSpeechRef.current) {
      await initializeAzureSpeech();
    }

    try {
      if (azureSpeechRef.current) {
        await azureSpeechRef.current.startContinuousRecognition(
          (segment: TranscriptionSegment) => {
            setTranscriptionSegments(prev => [...prev, segment]);
            
            // Update the main transcript with the latest segment
            setRecordingState(prev => ({
              ...prev,
              transcript: prev.transcript + ' ' + segment.text
            }));
            
            // Trigger real-time analysis for substantial content
            if (segment.text.length > 50) {
              performRealtimeAnalysis(recordingState.transcript + ' ' + segment.text);
            }
          },
          (error: string) => {
            console.error('Azure Speech transcription error:', error);
            toast({
              title: "Transcription Error",
              description: "Real-time transcription encountered an issue.",
              variant: "destructive"
            });
          }
        );
      } else if (webSpeechRef.current) {
        // Use Web Speech API fallback
        webSpeechRef.current.start();
      } else {
        throw new Error('No transcription service available');
      }
    } catch (error) {
      console.error('Failed to start Azure transcription:', error);
      toast({
        title: "Azure Speech Error",
        description: "Failed to start real-time transcription. Falling back to audio recording only.",
        variant: "destructive"
      });
    }
  };

  // Real-time analysis for live insights
  const performRealtimeAnalysis = async (transcript: string) => {
    if (transcript.length < 100) return; // Wait for substantial content
    
    try {
      const response = await apiRequest('POST', '/api/session-intelligence/analyze-transcript', {
        transcript,
        sessionType: sessionMetadata.sessionType,
        partialAnalysis: true
      });
      
      if (response.ok) {
        const analysis = await response.json();
        
        // Update live insights
        setLiveInsights(analysis);
        
        // Update real-time analysis state
        setRealtimeAnalysis(prev => ({
          ...prev,
          themes: analysis.themes || prev.themes,
          interventions: analysis.suggestedInterventions || prev.interventions,
          sessionQuality: analysis.sessionQuality || prev.sessionQuality
        }));
        
        // Check for clinical alerts
        if (analysis.clinicalAlerts && analysis.clinicalAlerts.length > 0) {
          setClinicalAlerts(prev => [...prev, ...analysis.clinicalAlerts]);
        }
      }
    } catch (error) {
      console.error('Real-time analysis error:', error);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      if (recordingState.isPaused) {
        mediaRecorderRef.current.resume();
        intervalRef.current = setInterval(() => {
          setRecordingState(prev => ({ ...prev, duration: prev.duration + 1 }));
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
      setRecordingState(prev => ({ ...prev, isPaused: !prev.isPaused }));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      mediaRecorderRef.current.stop();
      
      // Stop Azure Speech Service transcription
      if (azureSpeechRef.current) {
        azureSpeechRef.current.stopRecognition();
      }
      
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setRecordingState(prev => ({ ...prev, isRecording: false, isPaused: false, isTranscribing: false }));
      
      // Automatically start session analysis with Azure transcription
      if (recordingState.transcript.length > 0) {
        analyzeSessionMutation.mutate();
      }
      
      setCurrentTab('analysis');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      if (recordingState.isPaused) {
        mediaRecorderRef.current.resume();
        intervalRef.current = setInterval(() => {
          setRecordingState(prev => ({ ...prev, duration: prev.duration + 1 }));
        }, 1000);
        setRecordingState(prev => ({ ...prev, isPaused: false }));
      } else {
        mediaRecorderRef.current.pause();
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        setRecordingState(prev => ({ ...prev, isPaused: true }));
      }
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      mediaRecorderRef.current.stop();
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Stop Azure Speech Service transcription
      if (azureSpeechRef.current) {
        await azureSpeechRef.current.stopContinuousRecognition();
      }
      
      // Stop Web Speech API fallback
      if (webSpeechRef.current) {
        webSpeechRef.current.stop();
      }
      
      setRecordingState(prev => ({ 
        ...prev, 
        isRecording: false, 
        isPaused: false, 
        isTranscribing: false 
      }));
      
      // Trigger final analysis
      if (recordingState.transcript.length > 50) {
        await performFinalAnalysis();
      }
      
      setCurrentTab('analysis');
    }
  };

  const performFinalAnalysis = async () => {
    try {
      const response = await apiRequest('POST', '/api/session-intelligence/comprehensive-analysis', {
        transcript: recordingState.transcript,
        sessionMetadata,
        transcriptionSegments,
        duration: recordingState.duration
      });
      
      if (response.ok) {
        const analysis = await response.json();
        setAnalysisResults(analysis);
      }
    } catch (error) {
      console.error('Final analysis error:', error);
    }
  };

  // API mutations
  const transcribeMutation = useMutation({
    mutationFn: async (audioBase64: string) => {
      const response = await apiRequest('POST', '/api/session/transcribe', {
        audio: audioBase64,
        sessionMetadata
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setRecordingState(prev => ({ 
        ...prev, 
        transcript: data.transcript,
        isTranscribing: false 
      }));
      setCurrentTab('analysis');
      // Automatically start session analysis
      analyzeSessionMutation.mutate();
    },
    onError: (error) => {
      console.error('Transcription error:', error);
      setRecordingState(prev => ({ ...prev, isTranscribing: false }));
    }
  });

  const analyzeSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/session/full-analysis', {
        transcript: recordingState.transcript,
        sessionDuration: recordingState.duration,
        sessionMetadata,
        userId: 'current-user'
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setAnalysisResults(data);
      setCurrentTab('results');
    }
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getRecordingStatus = () => {
    if (recordingState.isTranscribing) return 'Transcribing...';
    if (recordingState.isPaused) return 'Paused';
    if (recordingState.isRecording) return 'Recording';
    return 'Ready';
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Session Recording & Analysis</h1>
        <p className="text-muted-foreground">
          Complete session intelligence platform with advanced AI-powered clinical insights
        </p>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="setup">Session Setup</TabsTrigger>
          <TabsTrigger value="recording">Recording</TabsTrigger>
          <TabsTrigger value="analysis">Transcription</TabsTrigger>
          <TabsTrigger value="results">Analysis Results</TabsTrigger>
        </TabsList>

        {/* Session Setup */}
        <TabsContent value="setup">
          <Card>
            <CardHeader>
              <CardTitle>Session Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input
                    id="clientId"
                    value={sessionMetadata.clientId}
                    onChange={(e) => setSessionMetadata(prev => ({ 
                      ...prev, 
                      clientId: e.target.value 
                    }))}
                    placeholder="Enter client identifier"
                  />
                </div>
                <div>
                  <Label htmlFor="sessionType">Session Type</Label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={sessionMetadata.sessionType}
                    onChange={(e) => setSessionMetadata(prev => ({ 
                      ...prev, 
                      sessionType: e.target.value as any 
                    }))}
                  >
                    <option value="individual">Individual Therapy</option>
                    <option value="group">Group Therapy</option>
                    <option value="family">Family Therapy</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Session Notes</Label>
                <Textarea
                  id="notes"
                  value={sessionMetadata.notes}
                  onChange={(e) => setSessionMetadata(prev => ({ 
                    ...prev, 
                    notes: e.target.value 
                  }))}
                  placeholder="Pre-session notes, goals, or observations"
                  className="min-h-[100px]"
                />
              </div>

              <Button 
                onClick={startRecording}
                disabled={!sessionMetadata.clientId.trim()}
                className="w-full"
                size="lg"
              >
                <Mic className="h-5 w-5 mr-2" />
                Start Session Recording
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recording Interface */}
        <TabsContent value="recording">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Session in Progress</span>
                <Badge variant={recordingState.isRecording ? 'destructive' : 'secondary'}>
                  {getRecordingStatus()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-6xl font-mono font-bold mb-4">
                  {formatDuration(recordingState.duration)}
                </div>
                
                <div className="flex justify-center gap-4">
                  <Button
                    onClick={pauseRecording}
                    disabled={!recordingState.isRecording}
                    variant="outline"
                    size="lg"
                  >
                    {recordingState.isPaused ? 
                      <Play className="h-5 w-5" /> : 
                      <Pause className="h-5 w-5" />
                    }
                  </Button>
                  
                  <Button
                    onClick={stopRecording}
                    disabled={!recordingState.isRecording}
                    variant="destructive"
                    size="lg"
                  >
                    <Square className="h-5 w-5 mr-2" />
                    End Session
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold">Session Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Client:</span>
                    <div className="font-medium">{sessionMetadata.clientId}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <div className="font-medium">{sessionMetadata.sessionType}</div>
                  </div>
                </div>
              </div>

              {/* Real-time Transcription and Clinical Insights */}
              {recordingState.isTranscribing && (
                <div className="space-y-4">
                  <Alert>
                    <Activity className="h-4 w-4" />
                    <AlertDescription>
                      Azure Speech Service is actively transcribing audio with real-time clinical analysis
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Live Transcript */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                      <h4 className="font-medium mb-2">Live Transcript</h4>
                      <div className="max-h-40 overflow-y-auto">
                        {transcriptionSegments.length > 0 ? (
                          <div className="space-y-2">
                            {transcriptionSegments.slice(-10).map((segment, index) => (
                              <div key={index} className="text-sm">
                                <span className="text-xs text-muted-foreground mr-2">
                                  {new Date(segment.timestamp).toLocaleTimeString()}
                                </span>
                                <span className={segment.confidence > 0.7 ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600'}>
                                  {segment.text}
                                </span>
                                {segment.confidence <= 0.5 && (
                                  <span className="text-xs text-yellow-600 ml-2">(low confidence)</span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            Listening for speech...
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Real-time Clinical Insights */}
                    <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        Live Clinical Insights
                      </h4>
                      <div className="space-y-3">
                        {realtimeAnalysis.themes.length > 0 && (
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">Emerging Themes:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {realtimeAnalysis.themes.slice(0, 3).map((theme, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">{theme}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {realtimeAnalysis.interventions.length > 0 && (
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">Interventions Detected:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {realtimeAnalysis.interventions.slice(0, 2).map((intervention, i) => (
                                <Badge key={i} variant="outline" className="text-xs">{intervention}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {realtimeAnalysis.therapeuticAlliance > 0 && (
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">Alliance Score:</span>
                            <div className="flex items-center gap-2 mt-1">
                              <Progress value={realtimeAnalysis.therapeuticAlliance * 10} className="flex-1 h-2" />
                              <span className="text-xs font-bold">{realtimeAnalysis.therapeuticAlliance}/10</span>
                            </div>
                          </div>
                        )}
                        
                        {realtimeAnalysis.treatmentSuggestions.length > 0 && (
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">Treatment Suggestions:</span>
                            <div className="mt-1 space-y-1">
                              {realtimeAnalysis.treatmentSuggestions.slice(0, 2).map((suggestion, i) => (
                                <div key={i} className="text-xs bg-green-50 dark:bg-green-950 p-2 rounded border-l-2 border-green-500">
                                  {suggestion}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {realtimeAnalysis.sessionQuality > 0 && (
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">Session Quality:</span>
                            <div className="flex items-center gap-2 mt-1">
                              <Progress value={realtimeAnalysis.sessionQuality * 10} className="flex-1 h-2" />
                              <span className="text-xs font-bold">{realtimeAnalysis.sessionQuality}/10</span>
                            </div>
                          </div>
                        )}
                        
                        {realtimeAnalysis.riskIndicators.length > 0 && (
                          <Alert className="py-2">
                            <AlertTriangle className="h-3 w-3" />
                            <AlertDescription className="text-xs">
                              <strong>Risk Indicators:</strong> {realtimeAnalysis.riskIndicators.slice(0, 2).join(', ')}
                            </AlertDescription>
                          </Alert>
                        )}
                        
                        {realtimeAnalysis.themes.length === 0 && realtimeAnalysis.interventions.length === 0 && (
                          <div className="text-xs text-muted-foreground">
                            Analyzing session content for clinical insights...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transcription Results */}
        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Session Transcript
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {transcribeMutation.isPending ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p>Processing audio transcription...</p>
                </div>
              ) : recordingState.transcript ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm">
                      {recordingState.transcript}
                    </pre>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      Session Duration: {formatDuration(recordingState.duration)}
                    </div>
                    <Button
                      onClick={() => analyzeSessionMutation.mutate()}
                      disabled={analyzeSessionMutation.isPending}
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      {analyzeSessionMutation.isPending ? 'Analyzing...' : 'Analyze Session'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No transcript available. Please record a session first.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Results */}
        <TabsContent value="results">
          <div className="space-y-6">
            {analyzeSessionMutation.isPending && (
              <Card>
                <CardContent className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Running comprehensive AI analysis...</p>
                  <div className="text-sm text-muted-foreground mt-2">
                    Analyzing themes, interventions, risk factors, and evidence-based practices
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Session Intelligence */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Session Intelligence
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysisResults.sessionAnalysis ? (
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium mb-2">Key Themes</h4>
                        <div className="flex flex-wrap gap-2">
                          {analysisResults.sessionAnalysis.analysis?.themes?.map((theme: string, i: number) => (
                            <Badge key={i} variant="secondary">{theme}</Badge>
                          ))}
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h4 className="font-medium mb-2">Interventions Used</h4>
                        <div className="flex flex-wrap gap-2">
                          {analysisResults.sessionAnalysis.analysis?.interventions?.map((intervention: string, i: number) => (
                            <Badge key={i} variant="outline">{intervention}</Badge>
                          ))}
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h4 className="font-medium mb-2">Therapeutic Alliance</h4>
                        <div className="flex items-center gap-2">
                          <Progress value={analysisResults.sessionAnalysis.analysis?.therapeuticAlliance * 10} className="flex-1" />
                          <span className="font-bold">{analysisResults.sessionAnalysis.analysis?.therapeuticAlliance}/10</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      Analysis pending...
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Risk Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analysisResults.riskAssessment ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span>Risk Level:</span>
                        <Badge variant={
                          analysisResults.riskAssessment.riskLevel === 'low' ? 'secondary' : 'destructive'
                        }>
                          {analysisResults.riskAssessment.riskLevel.toUpperCase()}
                        </Badge>
                      </div>
                      
                      {analysisResults.riskAssessment.immediateActions?.length > 0 && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Immediate Actions Required:</strong>
                            <ul className="list-disc list-inside mt-1">
                              {analysisResults.riskAssessment.immediateActions.map((action: string, i: number) => (
                                <li key={i}>{action}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      Assessment pending...
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Evidence-Based Practice Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Evidence-Based Practice
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analysisResults.ebpAnalysis ? (
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium mb-2">Techniques Used</h4>
                        <div className="flex flex-wrap gap-2">
                          {analysisResults.ebpAnalysis.techniquesUsed?.map((technique: string, i: number) => (
                            <Badge key={i} variant="outline">{technique}</Badge>
                          ))}
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h4 className="font-medium mb-2">Adherence Score</h4>
                        <div className="flex items-center gap-2">
                          <Progress value={analysisResults.ebpAnalysis.adherenceScore * 10} className="flex-1" />
                          <span className="font-bold">{analysisResults.ebpAnalysis.adherenceScore}/10</span>
                        </div>
                      </div>
                      
                      {analysisResults.ebpAnalysis.recommendations?.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Recommendations</h4>
                          <ul className="text-sm space-y-1">
                            {analysisResults.ebpAnalysis.recommendations.map((rec: string, i: number) => (
                              <li key={i} className="text-muted-foreground">• {rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      EBP analysis pending...
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Progress Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Auto-Generated Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analysisResults.progressNotes ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg text-sm">
                        {analysisResults.progressNotes.generatedNotes}
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Billing Codes</h4>
                        <div className="flex gap-2">
                          {analysisResults.progressNotes.billingCodes?.map((code: string, i: number) => (
                            <Badge key={i} variant="outline">{code}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      Notes generation pending...
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Time Efficiency */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Efficiency Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analysisResults.sessionAnalysis?.timeEfficiency ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-muted-foreground">Manual Time:</span>
                          <div className="text-lg font-semibold">
                            {analysisResults.sessionAnalysis.timeEfficiency.estimatedManualTime} min
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">AI Time:</span>
                          <div className="text-lg font-semibold">
                            {analysisResults.sessionAnalysis.timeEfficiency.aiAssistedTime} min
                          </div>
                        </div>
                      </div>
                      
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Time Saved: {analysisResults.sessionAnalysis.timeEfficiency.timeSaved} minutes</strong>
                          <br />
                          Efficiency Gain: {analysisResults.sessionAnalysis.timeEfficiency.efficiencyGain}
                        </AlertDescription>
                      </Alert>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      Efficiency calculation pending...
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Clinical Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Clinical Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analysisResults.treatmentRecommendations ? (
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium mb-2">Treatment Recommendations</h4>
                        <ul className="text-sm space-y-1">
                          {analysisResults.treatmentRecommendations.recommendations?.map((rec: string, i: number) => (
                            <li key={i} className="text-muted-foreground">• {rec}</li>
                          ))}
                        </ul>
                      </div>
                      
                      {analysisResults.treatmentRecommendations.nextSessionFocus && (
                        <div>
                          <h4 className="font-medium mb-2">Next Session Focus</h4>
                          <p className="text-sm text-muted-foreground">
                            {analysisResults.treatmentRecommendations.nextSessionFocus}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      Insights generation pending...
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}