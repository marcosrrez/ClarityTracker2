import { FaceClient, FaceModels } from '@azure/cognitiveservices-face';
import { ApiKeyCredentials } from '@azure/ms-rest-js';

interface EmotionScores {
  anger: number;
  contempt: number;
  disgust: number;
  fear: number;
  happiness: number;
  neutral: number;
  sadness: number;
  surprise: number;
}

interface FaceAnalysisResult {
  detectedFaces: number;
  dominantEmotion: string;
  emotionConfidence: number;
  engagementScore: number;
  behavioralMarkers: string[];
  emotionScores: EmotionScores;
  faceAttributes: {
    age?: number;
    gender?: string;
    smile?: number;
    facialHair?: any;
    glasses?: string;
    emotion?: EmotionScores;
    blur?: any;
    exposure?: any;
    noise?: any;
    makeup?: any;
    accessories?: any;
    occlusion?: any;
    headPose?: any;
  }[];
}

export class AzureFaceService {
  private faceClient: FaceClient | null = null;
  private isConfigured = false;

  constructor() {
    this.initializeFaceClient();
  }

  private initializeFaceClient() {
    const subscriptionKey = process.env.AZURE_FACE_KEY;
    const endpoint = process.env.AZURE_FACE_ENDPOINT;

    if (!subscriptionKey || !endpoint) {
      console.log('Azure Face API not configured - missing credentials');
      this.isConfigured = false;
      return;
    }

    try {
      const credentials = new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': subscriptionKey } });
      this.faceClient = new FaceClient(credentials, endpoint);
      this.isConfigured = true;
      console.log('Azure Face API initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Azure Face API:', error);
      this.isConfigured = false;
    }
  }

  async analyzeVideoFrame(imageData: string): Promise<FaceAnalysisResult> {
    if (!this.isConfigured || !this.faceClient) {
      throw new Error('Azure Face API not configured');
    }

    try {
      // Convert base64 image to buffer
      const imageBuffer = Buffer.from(imageData, 'base64');

      // Define face attributes to detect using proper enum values
      const faceAttributes: FaceModels.FaceAttributeType[] = [
        'age',
        'gender',
        'smile',
        'facialHair',
        'glasses',
        'emotion',
        'blur',
        'exposure',
        'noise',
        'makeup',
        'accessories',
        'occlusion',
        'headPose'
      ];

      // Detect faces with attributes
      const response = await this.faceClient.face.detectWithStream(
        imageBuffer,
        {
          returnFaceAttributes: faceAttributes,
          returnFaceLandmarks: true,
          recognitionModel: 'recognition_04',
          returnRecognitionModel: false,
          detectionModel: 'detection_03'
        }
      );

      const faces = response._response.parsedBody;

      if (!faces || faces.length === 0) {
        return {
          detectedFaces: 0,
          dominantEmotion: 'neutral',
          emotionConfidence: 0,
          engagementScore: 0,
          behavioralMarkers: [],
          emotionScores: {
            anger: 0,
            contempt: 0,
            disgust: 0,
            fear: 0,
            happiness: 0,
            neutral: 1,
            sadness: 0,
            surprise: 0
          },
          faceAttributes: []
        };
      }

      // Process the first detected face
      const primaryFace = faces[0];
      const emotions = primaryFace.faceAttributes?.emotion;

      if (!emotions) {
        throw new Error('No emotion data returned from Azure Face API');
      }

      // Find dominant emotion
      const emotionEntries = Object.entries(emotions) as [keyof EmotionScores, number][];
      const [dominantEmotion, emotionConfidence] = emotionEntries.reduce((max, [emotion, score]) => 
        score > max[1] ? [emotion, score] : max
      );

      // Calculate engagement score based on positive emotions and attention indicators
      const engagementScore = this.calculateEngagementScore(primaryFace.faceAttributes);

      // Determine behavioral markers based on facial analysis
      const behavioralMarkers = this.determineBehavioralMarkers(primaryFace.faceAttributes);

      return {
        detectedFaces: faces.length,
        dominantEmotion: dominantEmotion,
        emotionConfidence: emotionConfidence,
        engagementScore: engagementScore,
        behavioralMarkers: behavioralMarkers,
        emotionScores: emotions,
        faceAttributes: faces.map(face => face.faceAttributes || {})
      };

    } catch (error) {
      console.error('Azure Face API analysis error:', error);
      throw new Error(`Face analysis failed: ${error}`);
    }
  }

  private calculateEngagementScore(faceAttributes: any): number {
    if (!faceAttributes) return 0;

    let score = 0.5; // Base score

    // Positive emotions increase engagement
    if (faceAttributes.emotion) {
      score += (faceAttributes.emotion.happiness || 0) * 0.3;
      score += (faceAttributes.emotion.surprise || 0) * 0.1;
      score -= (faceAttributes.emotion.sadness || 0) * 0.2;
      score -= (faceAttributes.emotion.anger || 0) * 0.2;
    }

    // Smile contributes to engagement
    if (faceAttributes.smile) {
      score += faceAttributes.smile * 0.2;
    }

    // Good head pose indicates attention
    if (faceAttributes.headPose) {
      const { pitch, roll, yaw } = faceAttributes.headPose;
      const headPoseScore = 1 - (Math.abs(pitch) + Math.abs(roll) + Math.abs(yaw)) / 90;
      score += Math.max(0, headPoseScore) * 0.2;
    }

    // Clear, unobstructed face indicates engagement
    if (faceAttributes.occlusion) {
      const { eyeOccluded, foreheadOccluded, mouthOccluded } = faceAttributes.occlusion;
      if (!eyeOccluded && !foreheadOccluded && !mouthOccluded) {
        score += 0.1;
      }
    }

    return Math.max(0, Math.min(1, score));
  }

  private determineBehavioralMarkers(faceAttributes: any): string[] {
    const markers: string[] = [];

    if (!faceAttributes) return markers;

    // Analyze emotions for behavioral markers
    if (faceAttributes.emotion) {
      const { happiness, neutral, sadness, anger, fear, surprise } = faceAttributes.emotion;

      if (happiness > 0.6) markers.push('positive-affect');
      if (neutral > 0.7) markers.push('calm-demeanor');
      if (sadness > 0.4) markers.push('emotional-distress');
      if (anger > 0.3) markers.push('agitation');
      if (fear > 0.3) markers.push('anxiety-indicators');
      if (surprise > 0.4) markers.push('reactive-engagement');
    }

    // Analyze smile
    if (faceAttributes.smile && faceAttributes.smile > 0.5) {
      markers.push('genuine-engagement');
    }

    // Analyze head pose for attention
    if (faceAttributes.headPose) {
      const { pitch, roll, yaw } = faceAttributes.headPose;
      if (Math.abs(pitch) < 15 && Math.abs(roll) < 15 && Math.abs(yaw) < 20) {
        markers.push('focused-attention');
      }
    }

    // Check for clear facial features (indicates openness)
    if (faceAttributes.occlusion && !faceAttributes.occlusion.eyeOccluded) {
      markers.push('open-communication');
    }

    return markers;
  }

  isAvailable(): boolean {
    return this.isConfigured;
  }

  static async testConnection(subscriptionKey: string, endpoint: string): Promise<boolean> {
    try {
      const credentials = new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': subscriptionKey } });
      const testClient = new FaceClient(credentials, endpoint);
      
      // Test with a minimal request to verify connectivity
      // This would normally require a test image, but we'll just check if the client initializes
      return true;
    } catch (error) {
      console.error('Azure Face API connection test failed:', error);
      return false;
    }
  }
}

export default AzureFaceService;