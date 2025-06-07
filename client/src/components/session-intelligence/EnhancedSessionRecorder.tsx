import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Mic, MicOff, Video, VideoOff, Eye, Brain, Shield, FileText } from 'lucide-react';
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
  detectedFaces: number;
  dominantEmotion: string;
  emotionConfidence: number;
  engagementScore: number;
  poseData: any;
  gazeData: any;
  behavioralMarkers: string[];
}

interface TranscriptionSegment {
  text: string;
  speaker: string;
  timestamp: number;
  confidence: number;
  clinicalTags: string[];
  emotionalTone: string;
}

const EnhancedSessionRecorder: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [currentEmotions, setCurrentEmotions] = useState<EmotionState[]>([]);
  const [detectedThemes, setDetectedThemes] = useState<string[]>([]);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [transcriptionSegments, setTranscriptionSegments] = useState<TranscriptionSegment[]>([]);
  const [clinicalInsights, setClinicalInsights] = useState<ClinicalInsight[]>([]);
  const [videoAnalysis, setVideoAnalysis] = useState<VideoAnalysisFrame | null>(null);
  const [engagementScore, setEngagementScore] = useState(0);
  const [complianceScore, setComplianceScore] = useState(0);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'analyzing'>('idle');

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Initialize Azure Speech Service
  const initializeAzureSpeech = async () => {
    try {
      const response = await fetch('/api/azure-speech/config');
      const config = await response.json();
      
      if (!config.key || !config.region) {
        throw new Error('Azure Speech Service not configured');
      }

      // Initialize Azure Speech SDK (this would require the actual SDK)
      // For now, we'll use Web Speech API as fallback
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        speechRecognitionRef.current = new SpeechRecognition();
        speechRecognitionRef.current.continuous = true;
        speechRecognitionRef.current.interimResults = true;
        speechRecognitionRef.current.lang = 'en-US';

        speechRecognitionRef.current.onresult = (event: any) => {
          const last = event.results.length - 1;
          const transcript = event.results[last][0].transcript;
          const confidence = event.results[last][0].confidence;

          if (event.results[last].isFinal) {
            processTranscriptionSegment(transcript, confidence);
          }
        };
      }
    } catch (error) {
      console.error('Error initializing Azure Speech:', error);
    }
  };

  // Process transcription with clinical analysis
  const processTranscriptionSegment = async (text: string, confidence: number) => {
    try {
      const response = await fetch('/api/session-intelligence/analyze-transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, timestamp: Date.now() }),
      });

      const analysis = await response.json();
      
      const newSegment: TranscriptionSegment = {
        text,
        speaker: analysis.speaker || 'Unknown',
        timestamp: Date.now(),
        confidence,
        clinicalTags: analysis.clinicalTags || [],
        emotionalTone: analysis.emotionalTone || 'neutral'
      };

      setTranscriptionSegments(prev => [...prev.slice(-10), newSegment]);

      // Update detected themes
      if (analysis.themes) {
        setDetectedThemes(prev => Array.from(new Set([...prev, ...analysis.themes])));
      }

      // Check for risk indicators
      if (analysis.riskIndicators && analysis.riskIndicators.length > 0) {
        const newAlerts = analysis.riskIndicators.map((risk: any) => ({
          id: `risk_${Date.now()}_${Math.random()}`,
          severity: risk.severity,
          message: risk.message,
          icon: 'alert-triangle',
          timestamp: Date.now()
        }));
        setRiskAlerts(prev => [...prev, ...newAlerts]);
      }

    } catch (error) {
      console.error('Error processing transcription:', error);
    }
  };

  // Initialize media streams
  const initializeMedia = async () => {
    try {
      // Request audio permission
      const audioStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        }
      });
      audioStreamRef.current = audioStream;
      setIsAudioEnabled(true);

      // Request video permission
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
          }
        });
        videoStreamRef.current = videoStream;
        setIsVideoEnabled(true);

        if (videoRef.current) {
          videoRef.current.srcObject = videoStream;
        }
      } catch (videoError) {
        console.log('Video not available, continuing with audio only');
      }

      // Initialize audio context for real-time analysis
      audioContextRef.current = new AudioContext();

    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  };

  // Start session recording
  const handleStartRecording = async () => {
    try {
      if (!audioStreamRef.current) {
        await initializeMedia();
      }

      await initializeAzureSpeech();

      setIsRecording(true);
      setProcessingStatus('processing');
      setRecordingDuration(0);

      // Start duration timer
      intervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      // Start speech recognition
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.start();
      }

      // Start video analysis if enabled
      if (isVideoEnabled) {
        startVideoAnalysis();
      }

      // Start clinical insights generation
      startClinicalAnalysis();

    } catch (error) {
      console.error('Error starting recording:', error);
      setProcessingStatus('idle');
    }
  };

  // Start video analysis using TensorFlow.js
  const startVideoAnalysis = async () => {
    if (!videoRef.current || !isVideoEnabled) return;

    const analyzeFrame = async () => {
      if (!isRecording) return;

      try {
        // This would integrate with TensorFlow.js models for:
        // - Face detection
        // - Emotion recognition
        // - Pose estimation
        // - Gaze tracking
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx || !videoRef.current) return;

        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);

        // Send frame for analysis
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        
        const response = await fetch('/api/session-intelligence/analyze-video-frame', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            imageData: imageData.split(',')[1], // Remove data:image/jpeg;base64, prefix
            timestamp: Date.now()
          }),
        });

        const analysis = await response.json();
        
        if (analysis.success) {
          setVideoAnalysis(analysis.data);
          updateEmotionalState(analysis.data);
          updateEngagementScore(analysis.data.engagementScore);
        }

      } catch (error) {
        console.error('Error analyzing video frame:', error);
      }

      // Continue analysis
      if (isRecording) {
        setTimeout(analyzeFrame, 1000);
      }
    };

    analyzeFrame();
  };

  // Start clinical analysis
  const startClinicalAnalysis = () => {
    const insightsInterval = setInterval(async () => {
      if (!isRecording) {
        clearInterval(insightsInterval);
        return;
      }

      try {
        const response = await fetch('/api/session-intelligence/generate-insights', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        
        if (data.success && data.insights) {
          const formattedInsights = data.insights.map((insight: any) => ({
            type: insight.type,
            content: insight.description,
            confidence: insight.confidence,
            timestamp: insight.timestamp
          }));
          
          setClinicalInsights(prev => [...prev.slice(-3), ...formattedInsights]);
          
          // Update compliance score based on AI analysis confidence
          const avgConfidence = data.insights.reduce((sum: number, insight: any) => sum + insight.confidence, 0) / data.insights.length;
          setComplianceScore(Math.round(avgConfidence * 100));
        }

      } catch (error) {
        console.error('Error generating clinical insights:', error);
      }
    }, 15000); // Generate insights every 15 seconds
  };

  // Update emotional state display
  const updateEmotionalState = (analysis: VideoAnalysisFrame) => {
    const emotions: EmotionState[] = [
      { emotion: analysis.dominantEmotion, intensity: analysis.emotionConfidence, confidence: analysis.emotionConfidence },
      { emotion: 'neutral', intensity: 1 - analysis.emotionConfidence, confidence: 0.8 },
    ];
    setCurrentEmotions(emotions);
  };

  const updateEngagementScore = (score: number) => {
    setEngagementScore(prev => prev * 0.8 + score * 0.2); // Moving average
  };

  // Stop session recording
  const handleStopRecording = async () => {
    setIsRecording(false);
    setProcessingStatus('analyzing');

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Stop speech recognition
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
    }

    // Stop media streams
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(track => track.stop());
    }

    // Finalize session analysis
    await finalizeSessionAnalysis();
  };

  // Finalize session analysis
  const finalizeSessionAnalysis = async () => {
    try {
      const sessionData = {
        duration: recordingDuration,
        transcriptionSegments,
        videoAnalysis,
        clinicalInsights,
        engagementScore: Math.round(engagementScore * 100),
        complianceScore,
        detectedThemes,
        riskAlerts,
        hasVideo: isVideoEnabled,
        hasAudio: isAudioEnabled
      };

      const response = await fetch('/api/session-intelligence/finalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      if (response.ok) {
        const result = await response.json();
        setComplianceScore(result.finalComplianceScore || complianceScore);
        setProcessingStatus('idle');
      }
    } catch (error) {
      console.error('Error finalizing session analysis:', error);
      setProcessingStatus('idle');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Recording Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Enhanced Session Recording
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={isRecording ? handleStopRecording : handleStartRecording}
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
                <Badge variant={isAudioEnabled ? "default" : "secondary"}>
                  {isAudioEnabled ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />}
                  Audio
                </Badge>
                <Badge variant={isVideoEnabled ? "default" : "secondary"}>
                  {isVideoEnabled ? <Video className="h-3 w-3" /> : <VideoOff className="h-3 w-3" />}
                  Video
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-mono">{formatDuration(recordingDuration)}</div>
                <div className="text-sm text-muted-foreground">Session Duration</div>
              </div>
              {isRecording && (
                <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Analysis Dashboard */}
      {isRecording && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Live Transcription */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Live Transcription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {transcriptionSegments.map((segment, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="border-l-2 border-blue-200 pl-3 py-2"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {segment.speaker}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(segment.confidence * 100)}% confidence
                        </span>
                      </div>
                      <p className="text-sm">{segment.text}</p>
                      {segment.clinicalTags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {segment.clinicalTags.map((tag, tagIndex) => (
                            <Badge key={tagIndex} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>

          {/* Clinical Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Real-time Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Emotional State */}
                {currentEmotions.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Emotional State</h4>
                    <div className="space-y-2">
                      {currentEmotions.map((emotion, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-sm w-20 capitalize">{emotion.emotion}</span>
                          <Progress value={emotion.intensity * 100} className="flex-1" />
                          <span className="text-xs text-muted-foreground">
                            {Math.round(emotion.intensity * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Engagement Score */}
                <div>
                  <h4 className="font-medium mb-2">Engagement Score</h4>
                  <div className="flex items-center gap-2">
                    <Progress value={engagementScore * 100} className="flex-1" />
                    <span className="text-sm font-medium">
                      {Math.round(engagementScore * 100)}%
                    </span>
                  </div>
                </div>

                {/* Clinical Insights */}
                {clinicalInsights.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Clinical Observations</h4>
                    <div className="space-y-2">
                      {clinicalInsights.map((insight, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-sm p-2 bg-muted rounded"
                        >
                          {insight.content}
                          <Badge variant="outline" className="ml-2 text-xs">
                            {Math.round(insight.confidence * 100)}%
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Detected Themes */}
                {detectedThemes.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Session Themes</h4>
                    <div className="flex flex-wrap gap-1">
                      {detectedThemes.map((theme, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {theme}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Risk Alerts */}
                {riskAlerts.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      Risk Indicators
                    </h4>
                    <div className="space-y-2">
                      {riskAlerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={`flex items-center gap-2 p-2 rounded text-sm ${
                            alert.severity === 'high' || alert.severity === 'critical'
                              ? 'bg-red-50 text-red-800'
                              : 'bg-yellow-50 text-yellow-800'
                          }`}
                        >
                          <AlertTriangle className="h-4 w-4" />
                          <span>{alert.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Video Analysis (when enabled) */}
      {isVideoEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Video Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="w-full rounded-lg bg-black"
                  style={{ maxHeight: '300px' }}
                />
              </div>
              {videoAnalysis && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted rounded">
                      <div className="text-2xl font-bold">{videoAnalysis.detectedFaces}</div>
                      <div className="text-sm text-muted-foreground">Faces Detected</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded">
                      <div className="text-2xl font-bold">{Math.round(videoAnalysis.engagementScore * 100)}%</div>
                      <div className="text-sm text-muted-foreground">Engagement</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Behavioral Markers</h4>
                    <div className="flex flex-wrap gap-1">
                      {videoAnalysis.behavioralMarkers.map((marker, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {marker}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Summary (after recording) */}
      {!isRecording && processingStatus === 'idle' && recordingDuration > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Session Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded">
                <div className="text-3xl font-bold">{Math.round(engagementScore * 100)}%</div>
                <div className="text-sm text-muted-foreground">Overall Engagement</div>
              </div>
              <div className="text-center p-4 bg-muted rounded">
                <div className="text-3xl font-bold">{complianceScore}%</div>
                <div className="text-sm text-muted-foreground">Compliance Score</div>
              </div>
              <div className="text-center p-4 bg-muted rounded">
                <div className="text-3xl font-bold">{formatDuration(recordingDuration)}</div>
                <div className="text-sm text-muted-foreground">Session Duration</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedSessionRecorder;