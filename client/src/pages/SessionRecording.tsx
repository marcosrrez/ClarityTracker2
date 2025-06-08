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
  const { toast } = useToast();
  
  // Core state management
  const [currentTab, setCurrentTab] = useState<string>('setup');
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
  
  // Refs for recording and transcription
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const azureSpeechRef = useRef<AzureSpeechService | null>(null);
  const webSpeechRef = useRef<any>(null);
  
  // State for transcription and analysis
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
      return true;
      
    } catch (error) {
      console.error('Azure Speech Service initialization failed:', error);
      initializeWebSpeechFallback();
      
      toast({
        title: "Using Fallback Speech Recognition",
        description: "Azure Speech Service unavailable. Using browser speech recognition.",
        variant: "default"
      });
      return false;
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

  // Start recording session
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
      
      setRecordingState(prev => ({ 
        ...prev, 
        isRecording: true, 
        isPaused: false, 
        isTranscribing: true 
      }));
      setCurrentTab('recording');
      
      // Start duration counter
      intervalRef.current = setInterval(() => {
        setRecordingState(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);

      // Start transcription service
      await startTranscription();

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
  const startTranscription = async () => {
    try {
      // First try Azure Speech Service
      if (!azureSpeechRef.current) {
        const azureInitialized = await initializeAzureSpeech();
        if (!azureInitialized && !webSpeechRef.current) {
          initializeWebSpeechFallback();
        }
      }

      if (azureSpeechRef.current) {
        console.log('Starting Azure Speech Service transcription...');
        await azureSpeechRef.current.startContinuousRecognition(
          (segment: TranscriptionSegment) => {
            console.log('Azure transcription segment:', segment.text);
            setTranscriptionSegments(prev => [...prev, segment]);
            
            setRecordingState(prev => ({
              ...prev,
              transcript: prev.transcript + ' ' + segment.text
            }));
            
            // Trigger real-time analysis for substantial content
            if (segment.text.length > 20) {
              performRealtimeAnalysis(recordingState.transcript + ' ' + segment.text);
            }
          },
          (error: string) => {
            console.error('Azure Speech transcription error:', error);
            // Fall back to Web Speech API on error
            if (webSpeechRef.current) {
              console.log('Falling back to Web Speech API...');
              webSpeechRef.current.start();
              toast({
                title: "Switched to Browser Speech Recognition",
                description: "Azure Speech Service unavailable, using browser fallback.",
                variant: "default"
              });
            } else {
              toast({
                title: "Transcription Error",
                description: "Real-time transcription encountered an issue.",
                variant: "destructive"
              });
            }
          }
        );
      } else if (webSpeechRef.current) {
        console.log('Starting Web Speech API transcription...');
        webSpeechRef.current.start();
      } else {
        throw new Error('No transcription service available');
      }
    } catch (error) {
      console.error('Failed to start transcription:', error);
      toast({
        title: "Transcription Error",
        description: "Failed to start real-time transcription. Recording audio only.",
        variant: "default"
      });
    }
  };

  // Pause/resume recording
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

  // Stop recording and perform analysis
  const stopRecording = async () => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      mediaRecorderRef.current.stop();
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Stop transcription services
      if (azureSpeechRef.current) {
        try {
          await azureSpeechRef.current.startContinuousRecognition(() => {}, () => {}); // Stop by starting empty
        } catch (error) {
          console.log('Azure Speech stop error:', error);
        }
      }
      
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

  // Perform comprehensive final analysis
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

  // Format duration helper
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Session Recording & Analysis</h1>
          <p className="text-gray-600">Record therapy sessions with real-time AI-powered insights and analysis</p>
        </div>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="setup">Session Setup</TabsTrigger>
            <TabsTrigger value="recording">Recording</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>

          {/* Session Setup Tab */}
          <TabsContent value="setup">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Session Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clientId">Client Identifier</Label>
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

          {/* Recording Interface Tab */}
          <TabsContent value="recording">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recording Controls */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {recordingState.isRecording ? (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                          <span>Recording Active</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <MicOff className="h-5 w-5" />
                          <span>Recording Stopped</span>
                        </div>
                      )}
                    </div>
                    <div className="text-lg font-mono">
                      {formatDuration(recordingState.duration)}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      onClick={pauseRecording}
                      disabled={!recordingState.isRecording}
                      variant="outline"
                      size="lg"
                    >
                      {recordingState.isPaused ? (
                        <>
                          <Play className="h-5 w-5 mr-2" />
                          Resume
                        </>
                      ) : (
                        <>
                          <Pause className="h-5 w-5 mr-2" />
                          Pause
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={stopRecording}
                      disabled={!recordingState.isRecording}
                      variant="destructive"
                      size="lg"
                    >
                      <Square className="h-5 w-5 mr-2" />
                      Stop Recording
                    </Button>
                  </div>

                  {/* Real-time Transcript */}
                  <div className="border rounded-lg p-4 bg-gray-50 min-h-[200px] max-h-[400px] overflow-y-auto">
                    <h3 className="font-semibold mb-2">Live Transcript</h3>
                    {recordingState.transcript ? (
                      <p className="text-sm leading-relaxed">{recordingState.transcript}</p>
                    ) : (
                      <p className="text-gray-500 italic">Transcript will appear here as you speak...</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Live Insights Panel */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Live Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Session Quality Indicator */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Session Quality</span>
                      <span className="text-sm text-gray-600">
                        {Math.round(realtimeAnalysis.sessionQuality * 100)}%
                      </span>
                    </div>
                    <Progress value={realtimeAnalysis.sessionQuality * 100} className="h-2" />
                  </div>

                  {/* Key Themes */}
                  <div>
                    <h4 className="font-medium mb-2">Emerging Themes</h4>
                    <div className="flex flex-wrap gap-1">
                      {realtimeAnalysis.themes.slice(0, 5).map((theme, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {theme}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Clinical Alerts */}
                  {clinicalAlerts.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-orange-600">Clinical Alerts</h4>
                      <div className="space-y-2">
                        {clinicalAlerts.slice(0, 3).map((alert, index) => (
                          <Alert key={index} className="border-orange-200">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                              {alert.message}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Interventions */}
                  <div>
                    <h4 className="font-medium mb-2">Suggested Interventions</h4>
                    <div className="space-y-1">
                      {realtimeAnalysis.interventions.slice(0, 3).map((intervention, index) => (
                        <div key={index} className="text-xs p-2 bg-blue-50 rounded border-l-2 border-blue-200">
                          {intervention}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analysis Results Tab */}
          <TabsContent value="analysis">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Session Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  {analysisResults.sessionAnalysis ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2">Key Findings</h3>
                        <p className="text-sm text-gray-600">
                          {analysisResults.sessionAnalysis.summary || 'Analysis in progress...'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500">Complete a recording session to view analysis results</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Treatment Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  {analysisResults.treatmentRecommendations ? (
                    <div className="space-y-2">
                      {analysisResults.treatmentRecommendations.map((rec: string, index: number) => (
                        <div key={index} className="p-3 bg-green-50 rounded border-l-4 border-green-200">
                          <p className="text-sm">{rec}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500">Treatment recommendations will appear after analysis</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}