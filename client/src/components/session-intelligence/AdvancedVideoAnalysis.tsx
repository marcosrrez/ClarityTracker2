import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye, 
  Brain, 
  Activity, 
  Target, 
  TrendingUp, 
  AlertTriangle,
  Users,
  Hand,
  Smile,
  Frown,
  Mic,
  Camera,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Azure Cognitive Services types
interface AzureVisionResponse {
  faceId: string;
  faceRectangle: { top: number; left: number; width: number; height: number };
  faceAttributes: {
    emotion: {
      anger: number;
      contempt: number;
      disgust: number;
      fear: number;
      happiness: number;
      neutral: number;
      sadness: number;
      surprise: number;
    };
    headPose: { pitch: number; roll: number; yaw: number };
    gaze?: { gazeDirection: { x: number; y: number; z: number } };
  };
}

interface AzureSpeechResponse {
  recognitionStatus: string;
  displayText: string;
  offset: number;
  duration: number;
  confidence: number;
  sentiment?: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

// Azure configuration using environment variables
const AZURE_FACE_ENDPOINT = import.meta.env.VITE_AZURE_FACE_ENDPOINT;
const AZURE_FACE_KEY = import.meta.env.VITE_AZURE_FACE_KEY;
const AZURE_COMPUTER_VISION_ENDPOINT = import.meta.env.VITE_AZURE_COMPUTER_VISION_ENDPOINT;
const AZURE_COMPUTER_VISION_KEY = import.meta.env.VITE_AZURE_COMPUTER_VISION_KEY;

interface EnhancedAnalysisData {
  timestamp: number;
  azureEmotions: any;
  speechAnalysis: any;
  engagementScore: number;
  sessionId: string;
}

interface AdvancedVideoAnalysisProps {
  isRecording: boolean;
  videoElement?: HTMLVideoElement | null;
  sessionId?: string;
}

const AdvancedVideoAnalysis: React.FC<AdvancedVideoAnalysisProps> = ({
  isRecording,
  videoElement,
  sessionId = 'default-session'
}) => {
  // State management
  const [azureResults, setAzureResults] = useState<AzureVisionResponse[]>([]);
  const [speechResults, setSpeechResults] = useState<AzureSpeechResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({
    azure: false,
    computerVision: false,
    processing: false
  });

  // Analysis state
  const [realTimeEmotions, setRealTimeEmotions] = useState({
    happiness: 0,
    sadness: 0,
    anger: 0,
    fear: 0,
    surprise: 0,
    disgust: 0,
    contempt: 0,
    neutral: 0
  });

  const [speechSentiment, setSpeechSentiment] = useState({
    positive: 0,
    neutral: 0,
    negative: 0
  });

  const [engagementMetrics, setEngagementMetrics] = useState({
    overallEngagement: 0,
    eyeContact: 0,
    facialExpressiveness: 0,
    speechClarity: 0,
    emotionalCongruence: 0
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get Azure connection status from centralized integration API
  useEffect(() => {
    const checkAzureStatus = async () => {
      try {
        const response = await fetch('/api/ai/integration-status');
        if (response.ok) {
          const integrationData = await response.json();
          setConnectionStatus({
            azure: integrationData.azure?.faceApi?.available || false,
            computerVision: integrationData.azure?.computerVision?.available || false,
            processing: false
          });
        }
      } catch (error) {
        console.error('Error checking Azure integration status:', error);
        setConnectionStatus({
          azure: false,
          computerVision: false,
          processing: false
        });
      }
    };

    checkAzureStatus();
    // Check status every 30 seconds
    const interval = setInterval(checkAzureStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Azure Face API call for emotion detection through backend
  const analyzeWithAzureFace = useCallback(async (imageBlob: Blob) => {
    try {
      // Convert blob to base64 for backend processing
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          resolve(base64String);
        };
        reader.readAsDataURL(imageBlob);
      });

      const response = await fetch('/api/session-intelligence/analyze-video-frame', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: base64,
          timestamp: Date.now()
        }),
      });

      if (!response.ok) {
        throw new Error(`Azure analysis error: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setConnectionStatus(prev => ({ ...prev, azure: true }));
        return result.data;
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      console.error('Azure Face analysis error:', error);
      setConnectionStatus(prev => ({ ...prev, azure: false }));
      return null;
    }
  }, []);

  // Azure Computer Vision API call through backend (uses same endpoint as Face API)
  const analyzeWithComputerVision = useCallback(async (imageBlob: Blob) => {
    // Use the same backend endpoint that handles both Face API and Computer Vision
    return await analyzeWithAzureFace(imageBlob);
  }, [analyzeWithAzureFace]);

  // Capture frame from video
  const captureVideoFrame = useCallback(() => {
    if (!videoElement || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    ctx.drawImage(videoElement, 0, 0);

    return {
      canvas,
      imageData: ctx.getImageData(0, 0, canvas.width, canvas.height),
      blob: new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8);
      })
    };
  }, [videoElement]);

  // Main analysis loop
  const performAnalysis = useCallback(async () => {
    if (!isRecording || isProcessing) return;

    setIsProcessing(true);
    setConnectionStatus(prev => ({ ...prev, processing: true }));

    try {
      const frameData = captureVideoFrame();
      if (!frameData) return;

      const imageBlob = await frameData.blob;

      // Parallel analysis with Azure Face and Computer Vision
      const [faceResult, visionResult] = await Promise.all([
        analyzeWithAzureFace(imageBlob),
        analyzeWithComputerVision(imageBlob)
      ]);

      // Process Azure Face results
      if (faceResult && faceResult.length > 0) {
        const face = faceResult[0];
        const emotions = face.faceAttributes.emotion;
        
        setRealTimeEmotions({
          happiness: emotions.happiness * 100,
          sadness: emotions.sadness * 100,
          anger: emotions.anger * 100,
          fear: emotions.fear * 100,
          surprise: emotions.surprise * 100,
          disgust: emotions.disgust * 100,
          contempt: emotions.contempt * 100,
          neutral: emotions.neutral * 100
        });

        setAzureResults(faceResult);

        // Calculate engagement metrics based on real data
        const expressiveness = Object.values(emotions).reduce((sum, val) => sum + val, 0) - emotions.neutral;
        const positiveEngagement = emotions.happiness + emotions.surprise;
        
        const newEngagement = {
          overallEngagement: Math.min(100, (positiveEngagement * 100 + 30)),
          eyeContact: face.faceAttributes.headPose ? Math.max(60, 100 - Math.abs(face.faceAttributes.headPose.yaw) * 2) : 60,
          facialExpressiveness: expressiveness * 100,
          speechClarity: speechSentiment.positive * 100,
          emotionalCongruence: Math.max(0, 100 - Math.abs(speechSentiment.positive - emotions.happiness) * 100)
        };

        setEngagementMetrics(newEngagement);
      }

    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsProcessing(false);
      setConnectionStatus(prev => ({ ...prev, processing: false }));
    }
  }, [
    isRecording,
    isProcessing,
    captureVideoFrame,
    analyzeWithAzureFace,
    analyzeWithComputerVision,
    speechSentiment
  ]);

  // Start/stop analysis
  useEffect(() => {
    if (isRecording && videoElement) {
      analysisIntervalRef.current = setInterval(performAnalysis, 5000); // Analyze every 5 seconds
    } else {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
    }

    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    };
  }, [isRecording, videoElement, performAnalysis]);

  const getEmotionColor = (emotion: string) => {
    const colors = {
      happiness: 'text-yellow-600',
      sadness: 'text-blue-600',
      anger: 'text-red-600',
      fear: 'text-purple-600',
      surprise: 'text-orange-600',
      disgust: 'text-green-600',
      contempt: 'text-gray-600',
      neutral: 'text-gray-500'
    };
    return colors[emotion as keyof typeof colors] || 'text-gray-600';
  };

  const getEngagementStatus = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-green-600' };
    if (score >= 60) return { label: 'Good', color: 'text-blue-600' };
    if (score >= 40) return { label: 'Moderate', color: 'text-yellow-600' };
    return { label: 'Needs Attention', color: 'text-red-600' };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Advanced Video Analysis
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={connectionStatus.azure ? "default" : "destructive"} className="text-xs">
              <Camera className="h-3 w-3 mr-1" />
              Azure Face {connectionStatus.azure ? "Connected" : "Disconnected"}
            </Badge>
            <Badge variant={connectionStatus.computerVision ? "default" : "destructive"} className="text-xs">
              <Brain className="h-3 w-3 mr-1" />
              Computer Vision {connectionStatus.computerVision ? "Connected" : "Disconnected"}
            </Badge>
            {connectionStatus.processing && (
              <Badge variant="secondary" className="text-xs">
                <Activity className="h-3 w-3 mr-1" />
                Processing
              </Badge>
            )}
          </div>
        </CardTitle>
        {isProcessing && (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
            Analyzing video frame with Azure AI...
          </div>
        )}
      </CardHeader>
      <CardContent>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        
        <Tabs defaultValue="emotions" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="emotions">Azure Emotions</TabsTrigger>
            <TabsTrigger value="analysis">Face Analysis</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
          </TabsList>

          <TabsContent value="emotions" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Azure Cognitive Services - Real-time Emotion Detection</h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(realTimeEmotions).map(([emotion, intensity]) => (
                  <div key={emotion} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium capitalize ${getEmotionColor(emotion)}`}>
                        {emotion}
                      </span>
                      <span className="text-sm font-bold">{Math.round(intensity)}%</span>
                    </div>
                    <Progress value={intensity} className="h-2" />
                  </div>
                ))}
              </div>
              
              {azureResults.length > 0 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <h5 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Azure Face API Analysis
                  </h5>
                  <div className="text-sm text-blue-600 dark:text-blue-300">
                    Detected {azureResults.length} face(s) with comprehensive emotion and pose analysis
                  </div>
                  {azureResults[0]?.faceAttributes?.headPose && (
                    <div className="text-xs text-blue-500 mt-1">
                      Head Pose - Pitch: {Math.round(azureResults[0].faceAttributes.headPose.pitch)}°, 
                      Yaw: {Math.round(azureResults[0].faceAttributes.headPose.yaw)}°, 
                      Roll: {Math.round(azureResults[0].faceAttributes.headPose.roll)}°
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Facial Analysis & Pose Detection</h4>
              
              {azureResults.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="p-3 border rounded-lg">
                      <div className="text-sm font-medium mb-2">Face Detection Status</div>
                      <Badge variant="default" className="mb-2">
                        {azureResults.length} Face(s) Detected
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        Face Rectangle: {azureResults[0].faceRectangle.width}x{azureResults[0].faceRectangle.height} at 
                        ({azureResults[0].faceRectangle.left}, {azureResults[0].faceRectangle.top})
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <h5 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                      <Hand className="h-4 w-4 inline mr-1" />
                      Live Analysis Active
                    </h5>
                    <div className="text-sm text-green-600 dark:text-green-300">
                      Azure Face API providing real-time facial analysis including emotions, head pose, and facial landmarks
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                  <div className="text-sm text-muted-foreground">
                    {isRecording ? "Analyzing video feed..." : "Start recording to begin facial analysis"}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Real-time Engagement Analysis</h4>
              
              <div className="space-y-3">
                {Object.entries(engagementMetrics).map(([metric, score]) => {
                  const status = getEngagementStatus(score);
                  return (
                    <div key={metric} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium capitalize">
                          {metric.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{Math.round(score)}%</span>
                          <Badge variant="outline" className={`text-xs ${status.color}`}>
                            {status.label}
                          </Badge>
                        </div>
                      </div>
                      <Progress value={score} className="h-2" />
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-indigo-50 dark:bg-indigo-950 rounded-lg">
                <h5 className="text-sm font-medium text-indigo-800 dark:text-indigo-200 mb-2">
                  <Users className="h-4 w-4 inline mr-1" />
                  Clinical Engagement Insights
                </h5>
                <div className="text-sm text-indigo-600 dark:text-indigo-300">
                  Real-time analysis powered by Azure Cognitive Services providing clinical-grade behavioral insights
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdvancedVideoAnalysis;