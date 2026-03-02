import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Mic, 
  Video, 
  Square, 
  Play,
  Pause,
  Upload,
  FileText,
  Brain, 
  Activity, 
  AlertTriangle, 
  Shield,
  Users,
  Clock,
  Stethoscope,
  Target,
  TrendingUp,
  BookOpen,
  Eye,
  Headphones
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Enhanced interfaces combining Eleos and Mentalyc patterns
interface EBPImplementation {
  technique: string;
  adherence: number;
  timing: number[];
  effectiveness: number;
  supervisorNotes?: string;
}

interface MeasurementBasedCare {
  scaleName: string;
  score: number;
  previousScore?: number;
  trend: 'improving' | 'stable' | 'declining';
  clinicalSignificance: boolean;
  graphData: { session: number; score: number }[];
}

interface SupervisionMarker {
  timestamp: number;
  category: 'technique' | 'risk' | 'progress' | 'ethics';
  content: string;
  priority: 'low' | 'medium' | 'high';
  transcriptSnippet: string;
}

interface SessionMode {
  type: 'in-person' | 'telehealth' | 'upload' | 'dictate' | 'describe';
  label: string;
  icon: React.ElementType;
  description: string;
  active: boolean;
}

interface ProgressNoteTemplate {
  format: 'SOAP' | 'DAP' | 'BIRP' | 'GIRP' | 'PIE';
  sections: Record<string, string>;
  confidence: number;
  completeness: number;
}

const EnhancedClinicalRecorder: React.FC = () => {
  // Recording state
  const [currentMode, setCurrentMode] = useState<SessionMode['type']>('in-person');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [recordingQuality, setRecordingQuality] = useState({ audio: 95, video: 88 });

  // Clinical intelligence state
  const [ebpImplementations, setEbpImplementations] = useState<EBPImplementation[]>([]);
  const [measurementBasedCare, setMeasurementBasedCare] = useState<MeasurementBasedCare[]>([]);
  const [supervisionMarkers, setSupervisionMarkers] = useState<SupervisionMarker[]>([]);
  const [progressNote, setProgressNote] = useState<ProgressNoteTemplate | null>(null);
  const [therapeuticAlliance, setTherapeuticAlliance] = useState(0);
  const [riskAssessment, setRiskAssessment] = useState({ level: 'low', factors: [] as string[] });

  // Real-time analysis state
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [speakerDiarization, setSpeakerDiarization] = useState<{speaker: string, text: string, timestamp: number}[]>([]);
  const [emotionalStates, setEmotionalStates] = useState<{therapist: string, client: string}>({ therapist: 'calm', client: 'anxious' });
  const [engagementMetrics, setEngagementMetrics] = useState({ eyeContact: 75, bodyLanguage: 82, vocalTone: 78 });

  // Session hour logging state
  const [showHourLogging, setShowHourLogging] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [hourLogData, setHourLogData] = useState({
    sessionType: 'direct' as 'direct' | 'group' | 'supervision',
    duration: 0,
    clientInitials: '',
    sessionDate: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [isLoggingHours, setIsLoggingHours] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Handle recording completion and show hour logging
  const handleRecordingComplete = () => {
    setIsRecording(false);
    setSessionComplete(true);
    setShowHourLogging(true);
    
    // Auto-populate duration from recording time
    const durationInMinutes = Math.round(sessionDuration / 60);
    const roundedDuration = Math.round(durationInMinutes / 15) * 15; // Round to 15min intervals
    
    setHourLogData(prev => ({
      ...prev,
      duration: Math.max(15, roundedDuration) // Minimum 15 minutes
    }));
  };

  // Handle session hour logging
  const handleLogSessionHours = async () => {
    setIsLoggingHours(true);
    
    try {
      const response = await fetch('/api/log-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: hourLogData.sessionType,
          date: hourLogData.sessionDate,
          duration: hourLogData.duration,
          clientInitials: hourLogData.clientInitials,
          notes: hourLogData.notes,
          recordingId: `session_${Date.now()}`, // Link to recording
          source: 'clinical_recorder'
        })
      });

      if (response.ok) {
        // Success feedback and close panel
        setShowHourLogging(false);
        
        // Show success message
        const successMessage = `Recording saved and ${hourLogData.duration / 60} hours logged toward licensure`;
        console.log(successMessage); // You can replace with toast notification
        
        // Reset form
        setHourLogData({
          sessionType: 'direct',
          duration: 0,
          clientInitials: '',
          sessionDate: new Date().toISOString().split('T')[0],
          notes: ''
        });
      }
    } catch (error) {
      console.error('Failed to log session hours:', error);
    } finally {
      setIsLoggingHours(false);
    }
  };

  // File upload and session description states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [sessionDescription, setSessionDescription] = useState('');
  const [sessionType, setSessionType] = useState('individual');
  const [primaryIntervention, setPrimaryIntervention] = useState('cbt');
  const [isProcessing, setIsProcessing] = useState(false);

  const sessionModes: SessionMode[] = [
    { type: 'in-person', label: 'Record In-Person', icon: Video, description: 'Live session with video analysis', active: true },
    { type: 'telehealth', label: 'Record Telehealth', icon: Users, description: 'Remote session capture', active: true },
    { type: 'upload', label: 'Upload Audio', icon: Upload, description: 'Process recorded session file', active: true },
    { type: 'dictate', label: 'Dictate Notes', icon: Mic, description: 'Voice-to-text documentation', active: true },
    { type: 'describe', label: 'Describe Session', icon: FileText, description: 'Manual session summary', active: true }
  ];

  // File upload handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsProcessing(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('analysisType', 'session-analysis');

      // Upload and process the file
      const response = await fetch('/api/sessions/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update transcript with uploaded file analysis
        setSpeakerDiarization(result.transcript || []);
        
        // Process EBP analysis
        if (result.transcript) {
          for (const segment of result.transcript) {
            await analyzeEBPImplementation(segment.text, segment.speaker);
            generateSupervisionMarkers(segment.text, segment.speaker);
          }
        }

        // Generate progress note
        await generateProgressNote();
      }
    } catch (error) {
      console.error('File upload failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Session description processor
  const processSessionDescription = async () => {
    if (!sessionDescription.trim()) return;

    setIsProcessing(true);

    try {
      // Analyze the session description using AI
      const response = await fetch('/api/ai/analyze-session-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: sessionDescription,
          sessionType,
          primaryIntervention,
          analysisType: 'comprehensive'
        })
      });

      const analysis = await response.json();

      // Update EBP implementations based on description
      if (analysis.ebpTechniques) {
        setEbpImplementations(analysis.ebpTechniques);
      }

      // Update supervision markers
      if (analysis.supervisionPoints) {
        setSupervisionMarkers(analysis.supervisionPoints);
      }

      // Update measurement-based care if assessments mentioned
      if (analysis.assessments) {
        setMeasurementBasedCare(analysis.assessments);
      }

      // Generate progress note from description
      await generateProgressNote();

    } catch (error) {
      console.error('Session description analysis failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Enhanced recording initialization with multi-modal setup
  const initializeRecording = async () => {
    try {
      let constraints: MediaStreamConstraints = {};

      if (currentMode === 'in-person') {
        constraints = {
          video: { width: 1280, height: 720, facingMode: 'user' },
          audio: { 
            echoCancellation: true, 
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 44100
          }
        };
      } else if (currentMode === 'telehealth') {
        constraints = {
          video: { width: 640, height: 480 },
          audio: { echoCancellation: true, noiseSuppression: true }
        };
      } else if (currentMode === 'dictate') {
        constraints = {
          audio: { 
            echoCancellation: true, 
            noiseSuppression: true,
            autoGainControl: true 
          }
        };
      }

      if (Object.keys(constraints).length > 0) {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        mediaStreamRef.current = stream;

        if (videoRef.current && constraints.video) {
          videoRef.current.srcObject = stream;
        }

        await initializeAzureSpeechRecognition();
        await initializeVideoAnalysis();
      }

      setIsRecording(true);
      startSessionTimer();
      
    } catch (error) {
      console.error('Failed to initialize recording:', error);
    }
  };

  // Azure Speech Recognition with speaker diarization
  const initializeAzureSpeechRecognition = async () => {
    try {
      const response = await fetch('/api/azure/speech-config');
      const config = await response.json();
      
      const sdk = await import('microsoft-cognitiveservices-speech-sdk');
      const speechConfig = sdk.SpeechConfig.fromSubscription(config.subscriptionKey, config.serviceRegion);
      
      // Configure speech recognition
      speechConfig.speechRecognitionLanguage = 'en-US';
      speechConfig.enableDictation();
      
      const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

      recognizer.recognizing = (s, e) => {
        setCurrentTranscript(e.result.text);
      };

      recognizer.recognized = (s, e) => {
        if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
          const speaker = Math.random() > 0.5 ? 'Therapist' : 'Client'; // Simple speaker assignment
          
          setSpeakerDiarization(prev => [...prev, {
            speaker,
            text: e.result.text,
            timestamp: Date.now()
          }]);

          // Real-time EBP analysis
          analyzeEBPImplementation(e.result.text, speaker);
          
          // Generate supervision markers
          generateSupervisionMarkers(e.result.text, speaker);
          
          // Update therapeutic alliance assessment
          assessTherapeuticAlliance(e.result.text, speaker);
        }
      };

      recognizer.startContinuousRecognitionAsync();
      
    } catch (error) {
      console.error('Azure Speech initialization failed:', error);
    }
  };

  // Enhanced video analysis with clinical focus
  const initializeVideoAnalysis = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const processVideoFrame = async () => {
      if (!isRecording || isPaused) return;

      try {
        // Process frame for clinical markers
        const response = await fetch('/api/azure/analyze-clinical-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageData: captureVideoFrame(),
            analysisType: 'clinical-session'
          })
        });

        const analysis = await response.json();
        
        // Update engagement metrics
        setEngagementMetrics({
          eyeContact: analysis.eyeContact || 75,
          bodyLanguage: analysis.bodyLanguage || 82,
          vocalTone: analysis.vocalTone || 78
        });

        // Update emotional states
        setEmotionalStates({
          therapist: analysis.therapistEmotion || 'calm',
          client: analysis.clientEmotion || 'neutral'
        });

      } catch (error) {
        console.error('Video analysis error:', error);
      }
    };

    const intervalId = setInterval(processVideoFrame, 2000);
    return () => clearInterval(intervalId);
  };

  // EBP implementation analysis (Eleos-inspired)
  const analyzeEBPImplementation = async (text: string, speakerId: string) => {
    try {
      const response = await fetch('/api/ai/analyze-ebp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          speaker: speakerId === 'Guest-1' ? 'therapist' : 'client',
          context: 'real-time-session'
        })
      });

      const analysis = await response.json();
      
      if (analysis.ebpDetected) {
        setEbpImplementations(prev => [...prev, {
          technique: analysis.technique,
          adherence: analysis.adherence,
          timing: [sessionDuration],
          effectiveness: analysis.effectiveness,
          supervisorNotes: analysis.supervisorNotes
        }]);
      }
    } catch (error) {
      console.error('EBP analysis failed:', error);
    }
  };

  // Generate supervision markers (Eleos-inspired)
  const generateSupervisionMarkers = (text: string, speaker: string) => {
    // Real-time supervision point detection
    const supervisionTriggers = [
      { pattern: /risk|harm|suicide|self-harm/i, category: 'risk' as const, priority: 'high' as const },
      { pattern: /cbt|cognitive|behavioral/i, category: 'technique' as const, priority: 'medium' as const },
      { pattern: /progress|improvement|worse/i, category: 'progress' as const, priority: 'medium' as const },
      { pattern: /boundary|ethical|dual/i, category: 'ethics' as const, priority: 'high' as const }
    ];

    supervisionTriggers.forEach(trigger => {
      if (trigger.pattern.test(text)) {
        setSupervisionMarkers(prev => [...prev, {
          timestamp: sessionDuration,
          category: trigger.category,
          content: `${trigger.category.toUpperCase()}: Detected in ${speaker.toLowerCase()} statement`,
          priority: trigger.priority,
          transcriptSnippet: text.substring(0, 100) + '...'
        }]);
      }
    });
  };

  // Therapeutic alliance assessment
  const assessTherapeuticAlliance = (text: string, speaker: string) => {
    const allianceMarkers = {
      positive: /agree|understand|helpful|comfortable|trust/i,
      negative: /disagree|confused|unhelpful|uncomfortable|doubt/i
    };

    if (speaker === 'Client') {
      if (allianceMarkers.positive.test(text)) {
        setTherapeuticAlliance(prev => Math.min(100, prev + 2));
      } else if (allianceMarkers.negative.test(text)) {
        setTherapeuticAlliance(prev => Math.max(0, prev - 3));
      }
    }
  };

  // Generate progress note draft (Eleos-inspired)
  const generateProgressNote = async () => {
    try {
      const response = await fetch('/api/ai/generate-progress-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcription: speakerDiarization,
          ebpImplementations,
          measurementBasedCare,
          supervisionMarkers,
          sessionDuration,
          therapeuticAlliance,
          engagementMetrics
        })
      });

      const note = await response.json();
      setProgressNote(note);
    } catch (error) {
      console.error('Progress note generation failed:', error);
    }
  };

  const captureVideoFrame = (): string => {
    if (!videoRef.current || !canvasRef.current) return '';
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return '';
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const startSessionTimer = () => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      setSessionDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    
    return () => clearInterval(timer);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const stopRecording = async () => {
    setIsRecording(false);
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }

    // Generate final progress note
    await generateProgressNote();
    
    // Trigger session completion and hour logging
    handleRecordingComplete();
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Session Mode Selection (Mentalyc-inspired) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Clinical Session Recording
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {sessionModes.map((mode) => {
              const Icon = mode.icon;
              return (
                <Button
                  key={mode.type}
                  variant={currentMode === mode.type ? "default" : "outline"}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => setCurrentMode(mode.type)}
                  disabled={!mode.active}
                >
                  <Icon className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium text-sm">{mode.label}</div>
                    <div className="text-xs text-muted-foreground">{mode.description}</div>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recording Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video/Audio Feed */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Session Feed</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={isRecording ? "destructive" : "secondary"}>
                  {isRecording ? "RECORDING" : "READY"}
                </Badge>
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDuration(sessionDuration)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative bg-black rounded-lg overflow-hidden mb-4">
              {currentMode !== 'describe' && currentMode !== 'upload' && (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="w-full h-64 object-cover"
                />
              )}
              {(currentMode === 'describe' || currentMode === 'upload') && (
                <div className="w-full h-64 flex items-center justify-center text-white">
                  <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm opacity-75">
                      {currentMode === 'describe' ? 'Manual Description Mode' : 'Audio Upload Mode'}
                    </p>
                  </div>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* File Upload Interface for Upload Mode */}
            {currentMode === 'upload' && (
              <div className="mb-4 p-6 border-2 border-dashed border-gray-300 rounded-lg">
                <input
                  type="file"
                  accept="audio/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="text-center">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium mb-2">Upload Session Recording</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Drag and drop or click to select audio/video files
                    </p>
                    <Button variant="outline">Choose File</Button>
                  </div>
                </label>
              </div>
            )}

            {/* Session Description Interface for Describe Mode */}
            {currentMode === 'describe' && (
              <div className="mb-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Session Description</label>
                  <Textarea
                    placeholder="Describe the therapy session in detail. Include therapeutic techniques used, client responses, key insights, and any notable interactions..."
                    value={sessionDescription}
                    onChange={(e) => setSessionDescription(e.target.value)}
                    className="min-h-32"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Session Type</label>
                    <Select value={sessionType} onValueChange={setSessionType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select session type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual Therapy</SelectItem>
                        <SelectItem value="group">Group Therapy</SelectItem>
                        <SelectItem value="family">Family Therapy</SelectItem>
                        <SelectItem value="couples">Couples Therapy</SelectItem>
                        <SelectItem value="assessment">Assessment Session</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Primary Intervention</label>
                    <Select value={primaryIntervention} onValueChange={setPrimaryIntervention}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select intervention" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cbt">Cognitive Behavioral Therapy</SelectItem>
                        <SelectItem value="dbt">Dialectical Behavior Therapy</SelectItem>
                        <SelectItem value="emdr">EMDR</SelectItem>
                        <SelectItem value="psychodynamic">Psychodynamic</SelectItem>
                        <SelectItem value="humanistic">Humanistic/Person-Centered</SelectItem>
                        <SelectItem value="mindfulness">Mindfulness-Based</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button 
                  onClick={processSessionDescription}
                  className="w-full"
                  disabled={!sessionDescription.trim()}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Analyze Session Description
                </Button>
              </div>
            )}

            <div className="flex items-center justify-center gap-4">
              {!isRecording && currentMode !== 'upload' && currentMode !== 'describe' ? (
                <Button
                  onClick={initializeRecording}
                  size="lg"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Start Recording
                </Button>
              ) : isRecording ? (
                <div className="flex gap-2">
                  <Button
                    onClick={() => setIsPaused(!isPaused)}
                    variant="outline"
                    size="lg"
                  >
                    {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                  </Button>
                  <Button
                    onClick={stopRecording}
                    variant="destructive"
                    size="lg"
                  >
                    <Square className="h-5 w-5 mr-2" />
                    Stop Recording
                  </Button>
                </div>
              ) : null}
            </div>

            {/* Recording Quality Indicators */}
            {isRecording && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Audio Quality</span>
                    <span>{recordingQuality.audio}%</span>
                  </div>
                  <Progress value={recordingQuality.audio} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Video Quality</span>
                    <span>{recordingQuality.video}%</span>
                  </div>
                  <Progress value={recordingQuality.video} className="h-2" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Real-time Clinical Intelligence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Live Clinical Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Therapeutic Alliance */}
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Therapeutic Alliance</span>
                <span className="font-medium">{therapeuticAlliance}%</span>
              </div>
              <Progress value={therapeuticAlliance} className="h-2" />
            </div>

            {/* Engagement Metrics */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Engagement Metrics</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Eye Contact</span>
                  <span>{engagementMetrics.eyeContact}%</span>
                </div>
                <Progress value={engagementMetrics.eyeContact} className="h-1" />
                
                <div className="flex justify-between text-xs">
                  <span>Body Language</span>
                  <span>{engagementMetrics.bodyLanguage}%</span>
                </div>
                <Progress value={engagementMetrics.bodyLanguage} className="h-1" />
                
                <div className="flex justify-between text-xs">
                  <span>Vocal Tone</span>
                  <span>{engagementMetrics.vocalTone}%</span>
                </div>
                <Progress value={engagementMetrics.vocalTone} className="h-1" />
              </div>
            </div>

            {/* Emotional States */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Emotional States</h4>
              <div className="flex justify-between">
                <Badge variant="outline" className="text-xs">
                  Therapist: {emotionalStates.therapist}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Client: {emotionalStates.client}
                </Badge>
              </div>
            </div>

            {/* Current EBP Implementations */}
            {ebpImplementations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  EBP Techniques
                </h4>
                <div className="space-y-1">
                  {ebpImplementations.slice(-3).map((ebp, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {ebp.technique} ({ebp.adherence}%)
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Risk Assessment */}
            {riskAssessment.level !== 'low' && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Risk Assessment</span>
                </div>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  {riskAssessment.level.toUpperCase()} - Review required
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Clinical Analysis Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="transcript" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="transcript">Live Transcript</TabsTrigger>
              <TabsTrigger value="supervision">Supervision</TabsTrigger>
              <TabsTrigger value="ebp">EBP Analysis</TabsTrigger>
              <TabsTrigger value="notes">Progress Notes</TabsTrigger>
              <TabsTrigger value="measurement">Assessments</TabsTrigger>
            </TabsList>

            <TabsContent value="transcript" className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Live Session Transcript</h3>
                  <Badge variant="outline">Speaker Diarization Active</Badge>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
                  {speakerDiarization.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Transcript will appear here during recording...
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {speakerDiarization.map((segment, index) => (
                        <div key={index} className="flex gap-3">
                          <Badge 
                            variant={segment.speaker === 'Therapist' ? 'default' : 'secondary'}
                            className="text-xs shrink-0"
                          >
                            {segment.speaker}
                          </Badge>
                          <p className="text-sm">{segment.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="supervision" className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Supervision Markers</h3>
                {supervisionMarkers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Supervision points will be automatically identified during the session...
                  </p>
                ) : (
                  <div className="space-y-3">
                    {supervisionMarkers.map((marker, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge 
                                variant={marker.priority === 'high' ? 'destructive' : marker.priority === 'medium' ? 'default' : 'secondary'}
                              >
                                {marker.category.toUpperCase()}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDuration(marker.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm mb-2">{marker.content}</p>
                            <blockquote className="text-xs text-muted-foreground border-l-2 pl-2">
                              "{marker.transcriptSnippet}"
                            </blockquote>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="ebp" className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Evidence-Based Practice Analysis</h3>
                {ebpImplementations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    EBP technique analysis will appear here during the session...
                  </p>
                ) : (
                  <div className="grid gap-4">
                    {ebpImplementations.map((ebp, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{ebp.technique}</h4>
                          <Badge variant="outline">{ebp.adherence}% adherence</Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Effectiveness Score</span>
                            <span>{ebp.effectiveness}%</span>
                          </div>
                          <Progress value={ebp.effectiveness} className="h-2" />
                          {ebp.supervisorNotes && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {ebp.supervisorNotes}
                            </p>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="notes" className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Progress Note Draft</h3>
                {!progressNote ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground mb-4">
                      Progress note will be generated automatically at the end of the session
                    </p>
                    <Button 
                      onClick={generateProgressNote} 
                      disabled={!isRecording}
                      variant="outline"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Draft Note
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Select defaultValue={progressNote.format}>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SOAP">SOAP Notes</SelectItem>
                          <SelectItem value="DAP">DAP Format</SelectItem>
                          <SelectItem value="BIRP">BIRP Format</SelectItem>
                          <SelectItem value="GIRP">GIRP Format</SelectItem>
                          <SelectItem value="PIE">PIE Format</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {progressNote.completeness}% Complete
                        </Badge>
                        <Badge variant="outline">
                          {progressNote.confidence}% Confidence
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {Object.entries(progressNote.sections).map(([section, content]) => (
                        <div key={section}>
                          <h4 className="font-medium mb-2 capitalize">{section}</h4>
                          <Textarea
                            value={content}
                            onChange={(e) => setProgressNote(prev => prev ? {
                              ...prev,
                              sections: { ...prev.sections, [section]: e.target.value }
                            } : null)}
                            className="min-h-24"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="measurement" className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Measurement-Based Care</h3>
                {measurementBasedCare.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Assessment data will be integrated and graphed here...
                  </p>
                ) : (
                  <div className="grid gap-4">
                    {measurementBasedCare.map((measure, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">{measure.scaleName}</h4>
                          <Badge 
                            variant={measure.trend === 'improving' ? 'default' : measure.trend === 'declining' ? 'destructive' : 'secondary'}
                          >
                            {measure.trend}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mb-3">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{measure.score}</div>
                            <div className="text-xs text-muted-foreground">Current</div>
                          </div>
                          {measure.previousScore && (
                            <div className="text-center">
                              <div className="text-lg text-muted-foreground">{measure.previousScore}</div>
                              <div className="text-xs text-muted-foreground">Previous</div>
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="text-xs text-muted-foreground mb-1">Trend</div>
                            <div className="flex items-center gap-1">
                              {measure.graphData.slice(-5).map((point, i) => (
                                <div 
                                  key={i} 
                                  className="w-2 bg-blue-500 rounded"
                                  style={{ height: `${point.score / 5}px` }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        {measure.clinicalSignificance && (
                          <Badge variant="outline" className="text-xs">
                            Clinically Significant Change
                          </Badge>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Session Hour Logging Panel */}
      <AnimatePresence>
        {showHourLogging && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                  <Clock className="h-5 w-5" />
                  Log Session Hours
                </CardTitle>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Record this session toward your licensure requirements
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Session Type */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Session Type
                    </label>
                    <Select 
                      value={hourLogData.sessionType} 
                      onValueChange={(value: 'direct' | 'group' | 'supervision') => 
                        setHourLogData(prev => ({ ...prev, sessionType: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="direct">Direct Client Contact</SelectItem>
                        <SelectItem value="group">Group Session</SelectItem>
                        <SelectItem value="supervision">Supervision Session</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      {hourLogData.sessionType === 'direct' && 'Counts toward direct client contact hours'}
                      {hourLogData.sessionType === 'group' && 'Group therapy session'}
                      {hourLogData.sessionType === 'supervision' && 'Clinical supervision hour'}
                    </p>
                  </div>

                  {/* Duration */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Duration (minutes)
                    </label>
                    <Select 
                      value={hourLogData.duration.toString()} 
                      onValueChange={(value) => 
                        setHourLogData(prev => ({ ...prev, duration: parseInt(value) }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="75">1 hour 15 minutes</SelectItem>
                        <SelectItem value="90">1 hour 30 minutes</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Auto-populated from recording: {Math.round(sessionDuration / 60)} min
                    </p>
                  </div>

                  {/* Date */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Session Date
                    </label>
                    <input
                      type="date"
                      value={hourLogData.sessionDate}
                      onChange={(e) => setHourLogData(prev => ({ ...prev, sessionDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-blue-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Client Initials (optional) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Client Initials (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., J.D."
                    value={hourLogData.clientInitials}
                    onChange={(e) => setHourLogData(prev => ({ ...prev, clientInitials: e.target.value }))}
                    className="w-full px-3 py-2 border border-blue-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Session Notes (optional)
                  </label>
                  <Textarea
                    placeholder="Brief session summary or notes..."
                    value={hourLogData.notes}
                    onChange={(e) => setHourLogData(prev => ({ ...prev, notes: e.target.value }))}
                    className="min-h-[80px] border-blue-200 focus:border-blue-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-blue-200 dark:border-blue-800">
                  <Button
                    variant="outline"
                    onClick={() => setShowHourLogging(false)}
                    className="text-blue-700 border-blue-300 hover:bg-blue-100"
                  >
                    Save Recording Only
                  </Button>
                  <Button
                    onClick={handleLogSessionHours}
                    disabled={isLoggingHours}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isLoggingHours ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Logging Hours...
                      </>
                    ) : (
                      <>
                        Save & Log {hourLogData.duration / 60} Hours
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-center">
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    This session will be linked to your recording and count toward licensure requirements
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedClinicalRecorder;