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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const azureSpeechRef = useRef<AzureSpeechService | null>(null);
  const [transcriptionSegments, setTranscriptionSegments] = useState<TranscriptionSegment[]>([]);

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
        startTranscription(audioBlob);
      };

      mediaRecorder.start(1000); // Collect data every second
      
      setRecordingState(prev => ({ ...prev, isRecording: true, isPaused: false }));
      setCurrentTab('recording');
      
      // Start duration counter
      intervalRef.current = setInterval(() => {
        setRecordingState(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Unable to access microphone. Please check permissions.');
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
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setRecordingState(prev => ({ ...prev, isRecording: false, isPaused: false }));
    }
  };

  const startTranscription = async (audioBlob: Blob) => {
    setRecordingState(prev => ({ ...prev, isTranscribing: true }));
    
    // Convert blob to base64 for API transmission
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Audio = reader.result as string;
      transcribeMutation.mutate(base64Audio);
    };
    reader.readAsDataURL(audioBlob);
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
          Complete session intelligence platform competing with industry leaders like Eleos Health
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

              {recordingState.isTranscribing && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Session ended. Processing audio transcription...
                  </AlertDescription>
                </Alert>
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
                        {analysisResults.sessionAnalysis.themes?.map((theme: string, i: number) => (
                          <Badge key={i} variant="secondary">{theme}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-medium mb-2">Therapeutic Alliance</h4>
                      <div className="flex items-center gap-2">
                        <Progress value={analysisResults.sessionAnalysis.therapeuticAlliance * 10} className="flex-1" />
                        <span className="font-bold">{analysisResults.sessionAnalysis.therapeuticAlliance}/10</span>
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
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}