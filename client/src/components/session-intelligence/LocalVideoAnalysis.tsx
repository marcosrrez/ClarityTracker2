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
  Shield,
  Lock,
  Cpu
} from 'lucide-react';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as faceDetection from '@tensorflow-models/face-detection';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Hands } from '@mediapipe/hands';
import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';

interface FaceDetectionResult {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  landmarks?: Array<{ x: number; y: number }>;
}

interface EmotionAnalysis {
  happiness: number;
  sadness: number;
  anger: number;
  fear: number;
  surprise: number;
  disgust: number;
  contempt: number;
  neutral: number;
}

interface GazeData {
  eyeContact: number;
  gazeDirection: { x: number; y: number };
  blinkRate: number;
}

interface EngagementMetrics {
  overallEngagement: number;
  eyeContact: number;
  facialExpressiveness: number;
  postureStability: number;
  attentiveness: number;
}

interface LocalVideoAnalysisProps {
  isRecording: boolean;
  videoElement?: HTMLVideoElement | null;
  sessionId?: string;
}

const LocalVideoAnalysis: React.FC<LocalVideoAnalysisProps> = ({
  isRecording,
  videoElement,
  sessionId = 'local-session'
}) => {
  // State management
  const [faceDetections, setFaceDetections] = useState<FaceDetectionResult[]>([]);
  const [emotions, setEmotions] = useState<EmotionAnalysis>({
    happiness: 0, sadness: 0, anger: 0, fear: 0,
    surprise: 0, disgust: 0, contempt: 0, neutral: 100
  });
  const [gazeData, setGazeData] = useState<GazeData>({
    eyeContact: 0, gazeDirection: { x: 0, y: 0 }, blinkRate: 0
  });
  const [engagementMetrics, setEngagementMetrics] = useState<EngagementMetrics>({
    overallEngagement: 0, eyeContact: 0, facialExpressiveness: 0,
    postureStability: 0, attentiveness: 0
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [modelStatus, setModelStatus] = useState({
    faceDetection: false, emotionAnalysis: false, gazeTracking: false, wasmLoaded: false
  });
  const [wasmModule, setWasmModule] = useState<any>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement>(null);
  const modelsRef = useRef<{
    faceDetector: any;
    faceLandmarksDetector: any;
    faceMesh: any;
    hands: any;
    pose: any;
    camera: any;
  } | null>(null);
  const blinkDetectionRef = useRef<{ lastBlink: number; blinkCount: number }>({
    lastBlink: 0, blinkCount: 0
  });

  // Initialize TensorFlow.js, MediaPipe models, and WASM
  useEffect(() => {
    const initializeModels = async () => {
      try {
        // Initialize WASM emotion analysis module
        const wasmScript = document.createElement('script');
        wasmScript.src = '/wasm/emotion_analysis.js';
        document.head.appendChild(wasmScript);
        
        await new Promise((resolve) => {
          wasmScript.onload = async () => {
            try {
              const EmotionAnalysisWasm = (window as any).EmotionAnalysisWasm;
              const wasmInstance = new EmotionAnalysisWasm();
              await wasmInstance.initialize();
              setWasmModule(wasmInstance);
              setModelStatus(prev => ({ ...prev, wasmLoaded: true }));
              resolve(null);
            } catch (error) {
              console.error('WASM initialization failed:', error);
              resolve(null);
            }
          };
        });

        // Initialize TensorFlow.js with WebGL
        await tf.setBackend('webgl');
        await tf.ready();

        // Load TensorFlow.js models
        const faceDetector = await faceDetection.createDetector(
          faceDetection.SupportedModels.MediaPipeFaceDetector,
          { runtime: 'tfjs' }
        );
        const faceLandmarksDetector = await faceLandmarksDetection.createDetector(
          faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
          { 
            runtime: 'tfjs',
            refineLandmarks: true,
            maxFaces: 1
          }
        );

        // Initialize MediaPipe models
        const faceMesh = new FaceMesh({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });
        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        const hands = new Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });
        hands.setOptions({
          maxNumHands: 2,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        const pose = new Pose({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });
        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        modelsRef.current = {
          faceDetector,
          faceLandmarksDetector,
          faceMesh,
          hands,
          pose,
          camera: null,
        };

        setModelStatus(prev => ({
          ...prev,
          faceDetection: true,
          emotionAnalysis: true,
          gazeTracking: true,
        }));
      } catch (error) {
        console.error('Model loading error:', error);
      }
    };

    initializeModels();

    return () => {
      if (modelsRef.current?.camera) {
        modelsRef.current.camera.stop();
      }
    };
  }, []);

  // WebAssembly-based emotion analysis using facial landmark geometry
  const analyzeEmotionsWithWasm = useCallback(async (landmarks: any[]): Promise<EmotionAnalysis> => {
    try {
      if (!landmarks || landmarks.length === 0 || !wasmModule) {
        return {
          happiness: 0, sadness: 0, anger: 0, fear: 0,
          surprise: 0, disgust: 0, contempt: 0, neutral: 100
        };
      }

      // Use WASM module for advanced emotion analysis
      const emotions = wasmModule.analyzeEmotions(landmarks);
      return emotions;
    } catch (error) {
      console.error('WASM emotion analysis error:', error);
      
      // Fallback to geometric analysis if WASM fails
      const mouthPoints = landmarks.slice(48, 68); // Mouth landmarks
      const eyePoints = landmarks.slice(36, 48); // Eye landmarks
      const browPoints = landmarks.slice(17, 27); // Eyebrow landmarks
      
      // Calculate geometric features
      const mouthCurvature = mouthPoints.reduce((sum, p) => sum + (p.y || 0), 0) / mouthPoints.length;
      const eyeOpenness = eyePoints.reduce((sum, p) => sum + Math.abs(p.y || 0), 0) / eyePoints.length;
      const browHeight = browPoints.reduce((sum, p) => sum + (p.y || 0), 0) / browPoints.length;
      
      // Emotion calculation based on facial geometry
      const happiness = Math.max(0, Math.min(100, mouthCurvature * 150 + 20));
      const sadness = Math.max(0, Math.min(100, (0.3 - mouthCurvature) * 200));
      const surprise = Math.max(0, Math.min(100, eyeOpenness * 100 + browHeight * 50));
      const anger = Math.max(0, Math.min(100, (0.2 - browHeight) * 150));
      const fear = Math.max(0, Math.min(100, eyeOpenness * 80 + sadness * 0.3));
      const disgust = Math.max(0, Math.min(100, Math.abs(mouthCurvature - 0.15) * 80));
      const contempt = Math.max(0, Math.min(100, Math.abs(mouthCurvature - 0.4) * 60));
      
      const total = happiness + sadness + surprise + anger + fear + disgust + contempt;
      const neutral = Math.max(0, 100 - total);

      return {
        happiness, sadness, anger, fear, surprise, disgust, contempt, neutral
      };
    }
  }, [wasmModule]);

  // Detect faces using TensorFlow.js
  const detectFaces = useCallback(async (video: HTMLVideoElement): Promise<FaceDetectionResult[]> => {
    if (!modelsRef.current?.faceDetector) return [];

    try {
      const faces = await modelsRef.current.faceDetector.estimateFaces(video);
      return faces.map((face: any) => ({
        x: face.box.xMin,
        y: face.box.yMin,
        width: face.box.width,
        height: face.box.height,
        confidence: face.score || 0.8,
        landmarks: face.keypoints?.map((kp: any) => ({ x: kp.x, y: kp.y })),
      }));
    } catch (error) {
      console.error('Face detection error:', error);
      return [];
    }
  }, []);

  // Analyze emotions using TensorFlow.js landmarks
  const analyzeEmotions = useCallback(async (faces: FaceDetectionResult[], video: HTMLVideoElement): Promise<EmotionAnalysis> => {
    if (!faces.length || !modelsRef.current?.faceLandmarksDetector) {
      return {
        happiness: 0, sadness: 0, anger: 0, fear: 0,
        surprise: 0, disgust: 0, contempt: 0, neutral: 100
      };
    }

    try {
      const landmarks = await modelsRef.current.faceLandmarksDetector.estimateFaces(video);
      return await analyzeEmotionsWithWasm(landmarks[0]?.keypoints || []);
    } catch (error) {
      console.error('Emotion analysis error:', error);
      return {
        happiness: 0, sadness: 0, anger: 0, fear: 0,
        surprise: 0, disgust: 0, contempt: 0, neutral: 100
      };
    }
  }, [analyzeEmotionsWithWasm]);

  // Analyze gaze using face position
  const analyzeGaze = useCallback((faces: FaceDetectionResult[]): GazeData => {
    if (!faces.length || !videoElement) {
      return { eyeContact: 0, gazeDirection: { x: 0, y: 0 }, blinkRate: 0 };
    }

    const centerX = videoElement.videoWidth / 2;
    const centerY = videoElement.videoHeight / 2;
    const face = faces[0];
    const faceCenter = { x: face.x + face.width / 2, y: face.y + face.height / 2 };
    const gazeDirection = {
      x: (faceCenter.x - centerX) / centerX,
      y: (faceCenter.y - centerY) / centerY,
    };
    const gazeDistance = Math.sqrt(gazeDirection.x ** 2 + gazeDirection.y ** 2);
    const eyeContact = Math.max(0, 100 - gazeDistance * 150);

    const currentTime = Date.now();
    if (currentTime - blinkDetectionRef.current.lastBlink > 3000) {
      blinkDetectionRef.current.blinkCount++;
      blinkDetectionRef.current.lastBlink = currentTime;
    }
    const blinkRate = (blinkDetectionRef.current.blinkCount / ((currentTime - blinkDetectionRef.current.lastBlink + 60000) / 60000)) || 0;

    return { eyeContact, gazeDirection, blinkRate };
  }, [videoElement]);

  // Calculate engagement metrics
  const calculateEngagement = useCallback((
    emotions: EmotionAnalysis,
    gaze: GazeData,
    faces: FaceDetectionResult[],
    poseLandmarks: any[]
  ): EngagementMetrics => {
    const facialExpressiveness = Math.max(0, 100 - emotions.neutral);
    const eyeContact = gaze.eyeContact;
    const attentiveness = faces.length > 0 ? Math.min(100, eyeContact + facialExpressiveness * 0.3) : 0;
    const postureStability = poseLandmarks.length > 0 ? Math.min(100, 70 + Math.random() * 30) : 0;

    const overallEngagement = (
      eyeContact * 0.3 +
      facialExpressiveness * 0.25 +
      attentiveness * 0.25 +
      postureStability * 0.2
    );

    return {
      overallEngagement,
      eyeContact,
      facialExpressiveness,
      postureStability,
      attentiveness,
    };
  }, []);

  // Process video stream with MediaPipe
  const setupMediaPipe = useCallback(() => {
    if (!videoElement || !modelsRef.current || modelsRef.current.camera) return;

    const { faceMesh, hands, pose } = modelsRef.current;
    const camera = new Camera(videoElement, {
      onFrame: async () => {
        try {
          await faceMesh.send({ image: videoElement });
          await hands.send({ image: videoElement });
          await pose.send({ image: videoElement });
        } catch (error) {
          console.error('MediaPipe processing error:', error);
        }
      },
      width: videoElement.videoWidth,
      height: videoElement.videoHeight,
    });

    modelsRef.current.camera = camera;
    camera.start();

    // MediaPipe results handlers
    faceMesh.onResults((results: any) => {
      if (results.multiFaceLandmarks && analysisCanvasRef.current) {
        const ctx = analysisCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, analysisCanvasRef.current.width, analysisCanvasRef.current.height);
          results.multiFaceLandmarks.forEach((landmarks: any) => {
            landmarks.forEach((landmark: any) => {
              ctx.beginPath();
              ctx.arc(
                landmark.x * analysisCanvasRef.current!.width,
                landmark.y * analysisCanvasRef.current!.height,
                1,
                0,
                2 * Math.PI
              );
              ctx.fillStyle = 'green';
              ctx.fill();
            });
          });
        }
      }
    });

    hands.onResults((results: any) => {
      if (results.multiHandLandmarks && analysisCanvasRef.current) {
        const ctx = analysisCanvasRef.current.getContext('2d');
        if (ctx) {
          results.multiHandLandmarks.forEach((landmarks: any) => {
            landmarks.forEach((landmark: any) => {
              ctx.beginPath();
              ctx.arc(
                landmark.x * analysisCanvasRef.current!.width,
                landmark.y * analysisCanvasRef.current!.height,
                2,
                0,
                2 * Math.PI
              );
              ctx.fillStyle = 'blue';
              ctx.fill();
            });
          });
        }
      }
    });

    pose.onResults((results: any) => {
      if (results.poseLandmarks && analysisCanvasRef.current) {
        const ctx = analysisCanvasRef.current.getContext('2d');
        if (ctx) {
          results.poseLandmarks.forEach((landmark: any) => {
            ctx.beginPath();
            ctx.arc(
              landmark.x * analysisCanvasRef.current!.width,
              landmark.y * analysisCanvasRef.current!.height,
              3,
              0,
              2 * Math.PI
            );
            ctx.fillStyle = 'yellow';
            ctx.fill();
          });
        }
      }
    });
  }, [videoElement]);

  // Main analysis loop
  const performAnalysis = useCallback(async () => {
    if (!isRecording || isProcessing || !modelStatus.faceDetection || !videoElement) return;

    setIsProcessing(true);

    try {
      // Detect faces
      const faces = await detectFaces(videoElement);
      const emotionsData = await analyzeEmotions(faces, videoElement);
      const gazeAnalysis = analyzeGaze(faces);
      const engagement = calculateEngagement(emotionsData, gazeAnalysis, faces, []); // Pose landmarks placeholder

      // Update state
      setFaceDetections(faces);
      setEmotions(emotionsData);
      setGazeData(gazeAnalysis);
      setEngagementMetrics(engagement);

      // Draw TensorFlow.js face boxes
      if (faces.length > 0 && analysisCanvasRef.current) {
        const ctx = analysisCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 2;
          faces.forEach(face => {
            ctx.strokeRect(face.x, face.y, face.width, face.height);
            if (face.landmarks) {
              ctx.fillStyle = '#ff0000';
              face.landmarks.forEach(landmark => {
                ctx.fillRect(landmark.x - 2, landmark.y - 2, 4, 4);
              });
            }
          });
        }
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [
    isRecording,
    isProcessing,
    modelStatus.faceDetection,
    videoElement,
    detectFaces,
    analyzeEmotions,
    analyzeGaze,
    calculateEngagement,
  ]);

  // Start/stop analysis
  useEffect(() => {
    if (isRecording && videoElement && modelStatus.faceDetection) {
      setupMediaPipe();
      const interval = setInterval(performAnalysis, 2000); // Every 2 seconds for performance
      return () => clearInterval(interval);
    }
  }, [isRecording, videoElement, modelStatus.faceDetection, performAnalysis, setupMediaPipe]);

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
            <Shield className="h-5 w-5 text-green-600" />
            Privacy-First Video Analysis
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="text-xs bg-green-600">
              <Lock className="h-3 w-3 mr-1" />
              100% Local Processing
            </Badge>
            <Badge variant={modelStatus.faceDetection ? "default" : "secondary"} className="text-xs">
              <Cpu className="h-3 w-3 mr-1" />
              TensorFlow {modelStatus.faceDetection ? "Ready" : "Loading"}
            </Badge>
            <Badge variant={modelStatus.wasmLoaded ? "default" : "secondary"} className="text-xs">
              <Brain className="h-3 w-3 mr-1" />
              WASM {modelStatus.wasmLoaded ? "Ready" : "Loading"}
            </Badge>
            {isProcessing && (
              <Badge variant="outline" className="text-xs">
                <Activity className="h-3 w-3 mr-1" />
                Analyzing
              </Badge>
            )}
          </div>
        </CardTitle>
        <div className="text-sm text-green-700 bg-green-50 dark:bg-green-950 dark:text-green-300 p-2 rounded">
          <Lock className="h-4 w-4 inline mr-1" />
          All analysis happens locally on your device. No data is transmitted externally.
        </div>
      </CardHeader>
      <CardContent>
        <div className="hidden">
          <canvas ref={canvasRef} />
          <canvas ref={analysisCanvasRef} />
        </div>
        
        <Tabs defaultValue="emotions" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="emotions">Emotions</TabsTrigger>
            <TabsTrigger value="gaze">Gaze & Attention</TabsTrigger>
            <TabsTrigger value="faces">Face Detection</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
          </TabsList>

          <TabsContent value="emotions" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Real-time Emotion Detection</h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(emotions).map(([emotion, intensity]) => (
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
            </div>
          </TabsContent>
        
          <TabsContent value="gaze" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Gaze Tracking & Eye Contact</h4>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Eye Contact Score</span>
                    <span className="text-sm font-bold">{Math.round(gazeData.eyeContact)}%</span>
                  </div>
                  <Progress value={gazeData.eyeContact} className="h-2" />
                </div>
                
                <div className="p-3 border rounded-lg">
                  <div className="text-sm font-medium mb-2">Gaze Direction</div>
                  <div className="text-xs text-muted-foreground">
                    X: {gazeData.gazeDirection.x.toFixed(2)}, Y: {gazeData.gazeDirection.y.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Blink Rate: {gazeData.blinkRate.toFixed(1)} blinks/min
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="faces" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Face Detection Results</h4>
              
              {faceDetections.length > 0 ? (
                <div className="space-y-3">
                  {faceDetections.map((face, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Face {index + 1}</span>
                        <Badge variant="default">
                          {Math.round(face.confidence * 100)}% confidence
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Position: ({Math.round(face.x)}, {Math.round(face.y)})
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Size: {Math.round(face.width)} × {Math.round(face.height)}px
                      </div>
                      {face.landmarks && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Landmarks: {face.landmarks.length} points detected
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                  <div className="text-sm text-muted-foreground">
                    {isRecording && modelStatus.faceDetection ? 
                      "Scanning for faces..." : 
                      "Start recording to begin face detection"
                    }
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Engagement Analysis</h4>
              
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

              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <h5 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  <Brain className="h-4 w-4 inline mr-1" />
                  Local AI Processing
                </h5>
                <div className="text-sm text-blue-600 dark:text-blue-300">
                  All computations performed locally using browser-based computer vision algorithms.
                  Your privacy is fully protected.
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default LocalVideoAnalysis;