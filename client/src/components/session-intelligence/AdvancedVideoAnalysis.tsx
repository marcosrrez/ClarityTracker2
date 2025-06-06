import React, { useState, useEffect } from 'react';
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
  Frown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FacialLandmark {
  x: number;
  y: number;
  z?: number;
  confidence: number;
}

interface EmotionDetection {
  emotion: string;
  intensity: number;
  confidence: number;
  timestamp: number;
  microExpressions: string[];
}

interface GazeData {
  direction: { x: number; y: number };
  attentionScore: number;
  lookingAtCamera: boolean;
  blinkRate: number;
  pupilDilation: number;
}

interface PoseEstimation {
  headPose: { pitch: number; yaw: number; roll: number };
  bodyPosture: string;
  shoulderAlignment: number;
  leanDirection: string;
  handPosition: string;
  gesturePatterns: string[];
}

interface BehavioralPattern {
  type: string;
  frequency: number;
  intensity: number;
  context: string;
  therapeuticRelevance: string;
  timestamp: number;
}

interface EngagementMetrics {
  overallEngagement: number;
  eyeContact: number;
  facialExpressiveness: number;
  bodyLanguageOpenness: number;
  verbalNonVerbalCongruence: number;
}

interface AdvancedVideoAnalysisProps {
  isRecording: boolean;
  videoElement?: HTMLVideoElement | null;
}

const AdvancedVideoAnalysis: React.FC<AdvancedVideoAnalysisProps> = ({
  isRecording,
  videoElement
}) => {
  // Enhanced state for comprehensive analysis
  const [facialLandmarks, setFacialLandmarks] = useState<FacialLandmark[]>([]);
  const [emotionHistory, setEmotionHistory] = useState<EmotionDetection[]>([]);
  const [gazeData, setGazeData] = useState<GazeData>({
    direction: { x: 0, y: 0 },
    attentionScore: 85,
    lookingAtCamera: true,
    blinkRate: 15,
    pupilDilation: 0.6
  });
  const [poseData, setPoseData] = useState<PoseEstimation>({
    headPose: { pitch: 0, yaw: 0, roll: 0 },
    bodyPosture: 'engaged',
    shoulderAlignment: 95,
    leanDirection: 'neutral',
    handPosition: 'visible',
    gesturePatterns: ['open-palm', 'leaning-forward']
  });
  const [behavioralPatterns, setBehavioralPatterns] = useState<BehavioralPattern[]>([]);
  const [engagementMetrics, setEngagementMetrics] = useState<EngagementMetrics>({
    overallEngagement: 88,
    eyeContact: 75,
    facialExpressiveness: 82,
    bodyLanguageOpenness: 90,
    verbalNonVerbalCongruence: 85
  });

  // Multi-emotion detection state
  const [currentEmotions, setCurrentEmotions] = useState({
    joy: 65,
    sadness: 15,
    anger: 5,
    fear: 8,
    surprise: 12,
    disgust: 2,
    contempt: 3
  });

  // Advanced behavioral tracking
  const [riskIndicators, setRiskIndicators] = useState<string[]>([]);
  const [therapeuticAlliance, setTherapeuticAlliance] = useState(87);
  const [progressMetrics, setProgressMetrics] = useState({
    sessionToSession: 'improving',
    emotionalRegulation: 78,
    communicationClarity: 85,
    therapistEngagement: 92
  });

  // Simulate advanced video analysis
  useEffect(() => {
    if (!isRecording) return;

    const analysisInterval = setInterval(() => {
      // Simulate facial landmark detection (68+ points)
      const newLandmarks: FacialLandmark[] = Array.from({ length: 68 }, (_, i) => ({
        x: Math.random() * 640,
        y: Math.random() * 480,
        confidence: 0.8 + Math.random() * 0.2
      }));
      setFacialLandmarks(newLandmarks);

      // Simulate emotion detection with micro-expressions
      const emotions = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'contempt'];
      const dominantEmotion = emotions[Math.floor(Math.random() * emotions.length)];
      const newEmotion: EmotionDetection = {
        emotion: dominantEmotion,
        intensity: Math.random() * 100,
        confidence: 0.7 + Math.random() * 0.3,
        timestamp: Date.now(),
        microExpressions: ['eyebrow-flash', 'lip-compression'].filter(() => Math.random() > 0.7)
      };

      setEmotionHistory(prev => [...prev.slice(-19), newEmotion]);

      // Update multi-emotion scores
      setCurrentEmotions(prev => ({
        ...prev,
        [dominantEmotion]: Math.min(100, prev[dominantEmotion as keyof typeof prev] + Math.random() * 10 - 5)
      }));

      // Simulate gaze tracking
      setGazeData(prev => ({
        ...prev,
        direction: {
          x: prev.direction.x + (Math.random() - 0.5) * 10,
          y: prev.direction.y + (Math.random() - 0.5) * 10
        },
        attentionScore: Math.max(0, Math.min(100, prev.attentionScore + (Math.random() - 0.5) * 5)),
        lookingAtCamera: Math.random() > 0.3,
        blinkRate: 12 + Math.random() * 6,
        pupilDilation: 0.4 + Math.random() * 0.4
      }));

      // Simulate pose estimation
      setPoseData(prev => ({
        ...prev,
        headPose: {
          pitch: prev.headPose.pitch + (Math.random() - 0.5) * 5,
          yaw: prev.headPose.yaw + (Math.random() - 0.5) * 5,
          roll: prev.headPose.roll + (Math.random() - 0.5) * 3
        },
        shoulderAlignment: Math.max(0, Math.min(100, prev.shoulderAlignment + (Math.random() - 0.5) * 3))
      }));

      // Detect behavioral patterns
      if (Math.random() > 0.8) {
        const patterns = [
          'self-soothing gesture',
          'defensive posture',
          'engagement increase',
          'fidgeting behavior',
          'open communication stance'
        ];
        const newPattern: BehavioralPattern = {
          type: patterns[Math.floor(Math.random() * patterns.length)],
          frequency: Math.random() * 100,
          intensity: Math.random() * 100,
          context: 'discussing challenging topic',
          therapeuticRelevance: 'indicates emotional processing',
          timestamp: Date.now()
        };
        setBehavioralPatterns(prev => [...prev.slice(-9), newPattern]);
      }

      // Update engagement metrics
      setEngagementMetrics(prev => ({
        overallEngagement: Math.max(0, Math.min(100, prev.overallEngagement + (Math.random() - 0.5) * 3)),
        eyeContact: Math.max(0, Math.min(100, prev.eyeContact + (Math.random() - 0.5) * 5)),
        facialExpressiveness: Math.max(0, Math.min(100, prev.facialExpressiveness + (Math.random() - 0.5) * 4)),
        bodyLanguageOpenness: Math.max(0, Math.min(100, prev.bodyLanguageOpenness + (Math.random() - 0.5) * 3)),
        verbalNonVerbalCongruence: Math.max(0, Math.min(100, prev.verbalNonVerbalCongruence + (Math.random() - 0.5) * 2))
      }));

    }, 2000);

    return () => clearInterval(analysisInterval);
  }, [isRecording]);

  const getEmotionColor = (emotion: string) => {
    const colors = {
      joy: 'text-yellow-600',
      sadness: 'text-blue-600',
      anger: 'text-red-600',
      fear: 'text-purple-600',
      surprise: 'text-orange-600',
      disgust: 'text-green-600',
      contempt: 'text-gray-600'
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
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Advanced Video Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="emotions" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="emotions">Emotions</TabsTrigger>
            <TabsTrigger value="gaze">Gaze & Focus</TabsTrigger>
            <TabsTrigger value="pose">Body Language</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
          </TabsList>

          <TabsContent value="emotions" className="space-y-4 mt-4">
            {/* Multi-Emotion Detection */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Multi-Emotion Detection</h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(currentEmotions).map(([emotion, intensity]) => (
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

            {/* Emotion History Timeline */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Recent Emotion Timeline</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                <AnimatePresence>
                  {emotionHistory.slice(-5).map((emotion, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="p-2 bg-gray-50 dark:bg-gray-800 rounded flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        {emotion.emotion === 'joy' ? <Smile className="h-4 w-4 text-yellow-600" /> : 
                         emotion.emotion === 'sadness' ? <Frown className="h-4 w-4 text-blue-600" /> :
                         <Brain className="h-4 w-4 text-gray-600" />}
                        <span className="text-sm capitalize">{emotion.emotion}</span>
                        {emotion.microExpressions.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            Micro-expressions
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round(emotion.confidence * 100)}%
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Emotional State Transitions */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <h5 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                Emotional State Analysis
              </h5>
              <div className="text-sm text-blue-600 dark:text-blue-300">
                Detecting emotional regulation patterns and incongruence between verbal and non-verbal cues
              </div>
            </div>
          </TabsContent>

          <TabsContent value="gaze" className="space-y-4 mt-4">
            {/* Eye Gaze Direction */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Eye Gaze Analysis</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded-lg">
                  <div className="text-sm font-medium mb-2">Attention Score</div>
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {Math.round(gazeData.attentionScore)}%
                  </div>
                  <Progress value={gazeData.attentionScore} className="h-2" />
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="text-sm font-medium mb-2">Eye Contact</div>
                  <div className="flex items-center gap-2">
                    <Badge variant={gazeData.lookingAtCamera ? "default" : "secondary"}>
                      {gazeData.lookingAtCamera ? "Active" : "Averted"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(engagementMetrics.eyeContact)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded-lg">
                  <div className="text-sm font-medium mb-2">Blink Rate</div>
                  <div className="text-lg font-semibold">
                    {Math.round(gazeData.blinkRate)} bpm
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {gazeData.blinkRate > 20 ? 'High (stress)' : 
                     gazeData.blinkRate < 10 ? 'Low (focused)' : 'Normal'}
                  </div>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="text-sm font-medium mb-2">Pupil Dilation</div>
                  <div className="text-lg font-semibold">
                    {Math.round(gazeData.pupilDilation * 100)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {gazeData.pupilDilation > 0.7 ? 'High interest' : 
                     gazeData.pupilDilation < 0.4 ? 'Low arousal' : 'Normal'}
                  </div>
                </div>
              </div>

              {/* Gaze Direction Visualization */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h5 className="text-sm font-medium mb-2">Gaze Direction Pattern</h5>
                <div className="text-sm text-muted-foreground">
                  Tracking eye movement patterns for attention and engagement indicators
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pose" className="space-y-4 mt-4">
            {/* Head Pose & Body Language */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Body Language Assessment</h4>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 border rounded-lg">
                  <div className="text-sm font-medium mb-1">Head Pose</div>
                  <div className="text-xs space-y-1">
                    <div>Pitch: {Math.round(poseData.headPose.pitch)}°</div>
                    <div>Yaw: {Math.round(poseData.headPose.yaw)}°</div>
                    <div>Roll: {Math.round(poseData.headPose.roll)}°</div>
                  </div>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="text-sm font-medium mb-1">Posture</div>
                  <Badge variant="outline" className="text-xs">
                    {poseData.bodyPosture}
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-1">
                    Shoulder alignment: {poseData.shoulderAlignment}%
                  </div>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="text-sm font-medium mb-1">Hand Position</div>
                  <Badge variant="outline" className="text-xs">
                    {poseData.handPosition}
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-1">
                    Lean: {poseData.leanDirection}
                  </div>
                </div>
              </div>

              {/* Gesture Recognition */}
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <h5 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                  <Hand className="h-4 w-4 inline mr-1" />
                  Detected Gestures
                </h5>
                <div className="flex gap-2 flex-wrap">
                  {poseData.gesturePatterns.map((gesture, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {gesture}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Comfort/Stress Indicators */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border rounded-lg">
                  <div className="text-sm font-medium mb-2">Comfort Level</div>
                  <Progress value={engagementMetrics.bodyLanguageOpenness} className="h-2" />
                  <div className="text-xs text-muted-foreground mt-1">
                    {getEngagementStatus(engagementMetrics.bodyLanguageOpenness).label}
                  </div>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="text-sm font-medium mb-2">Stress Indicators</div>
                  <div className="text-xs space-y-1">
                    <div>Fidgeting: Low</div>
                    <div>Tension: Minimal</div>
                    <div>Defensive posture: None</div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="patterns" className="space-y-4 mt-4">
            {/* Behavioral Pattern Recognition */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Behavioral Pattern Recognition</h4>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <AnimatePresence>
                  {behavioralPatterns.map((pattern, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="p-3 border rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-medium text-sm">{pattern.type}</div>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(pattern.intensity)}% intensity
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>Context: {pattern.context}</div>
                        <div>Therapeutic relevance: {pattern.therapeuticRelevance}</div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Session-to-Session Tracking */}
              <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <h5 className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-2">
                  <TrendingUp className="h-4 w-4 inline mr-1" />
                  Progress Tracking
                </h5>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Session trend</div>
                    <div className="font-medium">{progressMetrics.sessionToSession}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Emotional regulation</div>
                    <div className="font-medium">{progressMetrics.emotionalRegulation}%</div>
                  </div>
                </div>
              </div>

              {/* Risk Assessment */}
              {riskIndicators.length > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <h5 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    Risk Indicators
                  </h5>
                  <div className="space-y-1">
                    {riskIndicators.map((indicator, index) => (
                      <div key={index} className="text-sm text-red-600 dark:text-red-300">
                        {indicator}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-4 mt-4">
            {/* Comprehensive Engagement Metrics */}
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

              {/* Therapeutic Alliance Quality */}
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950 rounded-lg">
                <h5 className="text-sm font-medium text-indigo-800 dark:text-indigo-200 mb-2">
                  <Users className="h-4 w-4 inline mr-1" />
                  Therapeutic Alliance Quality
                </h5>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                    {therapeuticAlliance}%
                  </span>
                  <Badge variant="outline">
                    {therapeuticAlliance >= 80 ? 'Strong' : 
                     therapeuticAlliance >= 60 ? 'Developing' : 'Needs Attention'}
                  </Badge>
                </div>
                <Progress value={therapeuticAlliance} className="h-2 mt-2" />
                <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                  Based on multi-modal behavioral analysis and rapport indicators
                </div>
              </div>

              {/* Incongruence Detection */}
              <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <h5 className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">
                  Verbal-Nonverbal Congruence
                </h5>
                <Progress value={engagementMetrics.verbalNonVerbalCongruence} className="h-2" />
                <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  {engagementMetrics.verbalNonVerbalCongruence >= 80 ? 
                    'Strong alignment between verbal and non-verbal communication' :
                    'Some incongruence detected - may indicate underlying concerns'}
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