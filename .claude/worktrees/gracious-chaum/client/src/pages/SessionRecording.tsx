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
import { EnhancedSessionAnalysis } from '@/components/features/EnhancedSessionAnalysis';
import { MobileOfflineSync } from '@/components/features/MobileOfflineSync';

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
  const [currentTab, setCurrentTab] = useState('setup');
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
  const [transcriptionSegments, setTranscriptionSegments] = useState<TranscriptionSegment[]>([]);

  // Refs for media recording and transcription
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const azureSpeechRef = useRef<AzureSpeechService | null>(null);
  const webSpeechRef = useRef<SpeechRecognition | null>(null);

  // Initialize speech recognition services
  useEffect(() => {
    // Initialize Azure Speech Service
    try {
      azureSpeechRef.current = new AzureSpeechService({
        subscriptionKey: import.meta.env.VITE_AZURE_SPEECH_KEY || '',
        serviceRegion: import.meta.env.VITE_AZURE_SPEECH_REGION || 'eastus',
        language: 'en-US'
      });
    } catch (error) {
      console.warn('Azure Speech Service not available:', error);
    }

    // Initialize Web Speech API as fallback
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      webSpeechRef.current = new SpeechRecognition();
      webSpeechRef.current.continuous = true;
      webSpeechRef.current.interimResults = true;
      
      webSpeechRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          const segment: TranscriptionSegment = {
            text: finalTranscript,
            timestamp: Date.now(),
            confidence: event.results[event.results.length - 1][0].confidence || 0.8
          };
          
          setTranscriptionSegments(prev => [...prev, segment]);
          setRecordingState(prev => ({ 
            ...prev, 
            transcript: prev.transcript + ' ' + finalTranscript 
          }));
        }
      };
    }

    return () => {
      if (azureSpeechRef.current) {
        azureSpeechRef.current.dispose();
      }
    };
  }, []);

  // Start recording with transcription
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        setRecordingState(prev => ({ ...prev, audioBlob }));
      };
      
      mediaRecorder.start();
      
      // Start duration counter
      intervalRef.current = setInterval(() => {
        setRecordingState(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
      
      setRecordingState(prev => ({ 
        ...prev, 
        isRecording: true, 
        isPaused: false,
        isTranscribing: true 
      }));
      
      // Start transcription
      await startTranscription();
      
      toast({
        title: "Recording Started",
        description: "Session recording and transcription are now active.",
        variant: "default"
      });
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Failed to start recording. Please check microphone permissions.",
        variant: "destructive"
      });
    }
  };

  // Start transcription services
  const startTranscription = async () => {
    try {
      // Try Azure Speech Service first
      if (azureSpeechRef.current) {
        try {
          await azureSpeechRef.current.startContinuousRecognition(
            (segment: TranscriptionSegment) => {
              setTranscriptionSegments(prev => [...prev, segment]);
              setRecordingState(prev => ({ 
                ...prev, 
                transcript: prev.transcript + ' ' + segment.text 
              }));
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
              }
            }
          );
        } catch (azureError) {
          console.warn('Azure Speech Service failed, using Web Speech API:', azureError);
          if (webSpeechRef.current) {
            webSpeechRef.current.start();
          }
        }
      } else if (webSpeechRef.current) {
        console.log('Starting Web Speech API transcription...');
        webSpeechRef.current.start();
      } else {
        console.error('No transcription service available');
        toast({
          title: "Transcription Service Error",
          description: "Unable to initialize speech recognition. Recording will continue without transcription.",
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error('Error starting transcription:', error);
      toast({
        title: "Transcription Error",
        description: "Failed to start speech recognition. Recording will continue without transcription.",
        variant: "destructive"
      });
    }
  };

  // Pause recording
  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState.isRecording && !recordingState.isPaused) {
      mediaRecorderRef.current.pause();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      setRecordingState(prev => ({ ...prev, isPaused: true }));
      
      // Pause transcription services
      if (azureSpeechRef.current) {
        try {
          azureSpeechRef.current.stopRecognition();
        } catch (error) {
          console.error('Error pausing Azure Speech Service:', error);
        }
      }
      
      if (webSpeechRef.current) {
        webSpeechRef.current.stop();
      }
    }
  };

  // Resume recording
  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState.isRecording && recordingState.isPaused) {
      mediaRecorderRef.current.resume();
      
      // Restart duration counter
      intervalRef.current = setInterval(() => {
        setRecordingState(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
      
      setRecordingState(prev => ({ ...prev, isPaused: false }));
      
      // Resume transcription
      startTranscription();
    }
  };

  // Stop recording and generate final analysis
  const stopRecording = async () => {
    // Stop media recording
    if (mediaRecorderRef.current && recordingState.isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Stop audio stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Stop transcription services
    if (azureSpeechRef.current) {
      try {
        azureSpeechRef.current.stopRecognition();
      } catch (error) {
        console.error('Error stopping Azure Speech Service:', error);
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
    
    setCurrentTab('analysis');
    
    // Generate final comprehensive analysis
    await generateFinalAnalysis();
  };

  // Generate comprehensive final analysis
  const generateFinalAnalysis = async () => {
    try {
      const analysisData = {
        transcript: recordingState.transcript,
        sessionDuration: recordingState.duration,
        clientPopulation: `${sessionMetadata.sessionType} therapy`,
        counselorExperience: 'LAC in training',
        userId: 'demo-user'
      };
      
      const response = await fetch('/api/session/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysisData)
      });
      
      if (response.ok) {
        const result = await response.json();
        setAnalysisResults({
          sessionAnalysis: result.analysis,
          timeEfficiency: result.timeEfficiency
        });
        toast({
          title: "Analysis Complete",
          description: "Comprehensive session analysis has been generated.",
          variant: "default"
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Error generating analysis:', error);
      toast({
        title: "Analysis Error",
        description: error.message || "Failed to generate session analysis. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Format duration display
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Session Recording</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Record therapy sessions with real-time transcription and AI-powered clinical insights
        </p>
        <div className="flex justify-center">
          <MobileOfflineSync userId="current-user" />
        </div>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="recording">Recording</TabsTrigger>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
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
                    onChange={(e) => setSessionMetadata(prev => ({ ...prev, clientId: e.target.value }))}
                    placeholder="Enter client identifier"
                  />
                </div>
                <div>
                  <Label htmlFor="sessionType">Session Type</Label>
                  <select
                    id="sessionType"
                    value={sessionMetadata.sessionType}
                    onChange={(e) => setSessionMetadata(prev => ({ ...prev, sessionType: e.target.value as any }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="individual">Individual</option>
                    <option value="group">Group</option>
                    <option value="family">Family</option>
                  </select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="notes">Session Notes</Label>
                <Textarea
                  id="notes"
                  value={sessionMetadata.notes}
                  onChange={(e) => setSessionMetadata(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Pre-session notes or objectives..."
                  rows={3}
                />
              </div>

              <Button
                onClick={() => setCurrentTab('recording')}
                className="w-full"
                disabled={!sessionMetadata.clientId}
              >
                Continue to Recording
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recording" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recording Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <div className="text-4xl font-mono">
                  {formatDuration(recordingState.duration)}
                </div>
                
                <div className="flex justify-center gap-4">
                  {!recordingState.isRecording ? (
                    <Button
                      onClick={startRecording}
                      size="lg"
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Mic className="w-5 h-5 mr-2" />
                      Start Recording
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        onClick={recordingState.isPaused ? resumeRecording : pauseRecording}
                        size="lg"
                        variant="outline"
                      >
                        {recordingState.isPaused ? (
                          <Play className="w-5 h-5" />
                        ) : (
                          <Pause className="w-5 h-5" />
                        )}
                      </Button>
                      
                      <Button
                        onClick={stopRecording}
                        size="lg"
                        variant="destructive"
                      >
                        <Square className="w-5 h-5" />
                      </Button>
                    </div>
                  )}
                </div>

                {recordingState.isRecording && (
                  <div className="space-y-2">
                    <Badge variant={recordingState.isPaused ? "secondary" : "destructive"}>
                      {recordingState.isPaused ? "Paused" : "Recording"}
                    </Badge>
                    
                    {recordingState.isTranscribing && (
                      <Badge variant="outline">
                        <Brain className="w-3 h-3 mr-1" />
                        Transcribing
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {recordingState.transcript && (
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Live Transcript</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 max-h-32 overflow-y-auto">
                    {recordingState.transcript}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transcript" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Session Transcript
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transcriptionSegments.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {transcriptionSegments.map((segment, index) => (
                    <div key={index} className="border-l-2 border-blue-200 pl-4 py-2">
                      <div className="flex justify-between items-start mb-1">
                        <Badge variant="outline" className="text-xs">
                          {new Date(segment.timestamp).toLocaleTimeString()}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(segment.confidence * 100)}% confidence
                        </Badge>
                      </div>
                      <p className="text-sm">{segment.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No transcript available. Start recording to see transcription.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          {recordingState.transcript ? (
            <EnhancedSessionAnalysis 
              sessionData={{
                transcript: recordingState.transcript,
                duration: recordingState.duration,
                sessionType: sessionMetadata.sessionType,
                clinicalFocus: sessionMetadata.notes,
                userId: 'current-user' // TODO: Get from auth context
              }}
              onAnalysisComplete={(analysis) => {
                setAnalysisResults(prev => ({ ...prev, enhanced: analysis }));
              }}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI Clinical Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Brain className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">Enhanced AI Analysis Ready</h3>
                  <p className="text-gray-600">
                    Complete your recording to generate comprehensive clinical insights with Phase 3A enhanced processing
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}