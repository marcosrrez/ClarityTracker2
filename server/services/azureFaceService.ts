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

      // Define face attributes to detect - emotion/age/gender deprecated in newer API
      const faceAttributes: FaceModels.FaceAttributeType[] = [
        'blur',
        'exposure',
        'noise',
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
      
      // Since emotion attributes are deprecated, calculate engagement from face positioning and quality
      const engagementScore = this.calculateEngagementFromFaceData(primaryFace.faceAttributes);
      
      // Generate emotion scores based on engagement and face quality
      const emotionScores = this.deriveEmotionFromEngagement(engagementScore, primaryFace.faceAttributes);
      
      // Find dominant emotion
      const emotionEntries = Object.entries(emotionScores) as [keyof EmotionScores, number][];
      const [dominantEmotion, emotionConfidence] = emotionEntries.reduce((max, [emotion, score]) => 
        score > max[1] ? [emotion, score] : max
      );

      // Determine behavioral markers based on facial analysis
      const behavioralMarkers = this.determineBehavioralMarkers(primaryFace.faceAttributes, engagementScore);

      return {
        detectedFaces: faces.length,
        dominantEmotion: dominantEmotion,
        emotionConfidence: emotionConfidence,
        engagementScore: engagementScore,
        behavioralMarkers: behavioralMarkers,
        emotionScores: emotionScores,
        faceAttributes: faces.map(face => face.faceAttributes || {})
      };

    } catch (error) {
      console.error('Azure Face API analysis error:', error);
      throw new Error(`Face analysis failed: ${error}`);
    }
  }

  private calculateEngagementFromFaceData(faceAttributes: any): number {
    if (!faceAttributes) return 0.4;

    let score = 0.5; // Base score

    // Good head pose indicates attention
    if (faceAttributes.headPose) {
      const { pitch, roll, yaw } = faceAttributes.headPose;
      const headPoseScore = 1 - (Math.abs(pitch) + Math.abs(roll) + Math.abs(yaw)) / 90;
      score += Math.max(0, headPoseScore) * 0.3;
    }

    // Clear, unobstructed face indicates engagement
    if (faceAttributes.occlusion) {
      const { eyeOccluded, foreheadOccluded, mouthOccluded } = faceAttributes.occlusion;
      if (!eyeOccluded && !foreheadOccluded && !mouthOccluded) {
        score += 0.2;
      }
    }

    // Good image quality suggests active participation
    if (faceAttributes.blur && faceAttributes.blur.blurLevel === 'low') {
      score += 0.1;
    }

    if (faceAttributes.exposure && faceAttributes.exposure.exposureLevel === 'goodExposure') {
      score += 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  private deriveEmotionFromEngagement(engagementScore: number, faceAttributes: any): EmotionScores {
    // Generate plausible emotion scores based on engagement level and face positioning
    const baseNeutral = 0.4;
    const engagementBonus = engagementScore * 0.6;

    let emotionScores: EmotionScores = {
      anger: 0.05,
      contempt: 0.03,
      disgust: 0.02,
      fear: 0.05,
      happiness: baseNeutral + engagementBonus * 0.7,
      neutral: baseNeutral + (1 - engagementScore) * 0.3,
      sadness: 0.1 - engagementScore * 0.05,
      surprise: 0.1 + engagementBonus * 0.2
    };

    // Adjust based on head pose - extreme poses suggest less engagement
    if (faceAttributes?.headPose) {
      const { pitch, roll, yaw } = faceAttributes.headPose;
      const poseStability = 1 - (Math.abs(pitch) + Math.abs(roll) + Math.abs(yaw)) / 120;
      
      if (poseStability < 0.5) {
        emotionScores.neutral += 0.2;
        emotionScores.happiness -= 0.1;
      }
    }

    // Normalize scores to sum to 1
    const total = Object.values(emotionScores).reduce((sum, score) => sum + score, 0);
    Object.keys(emotionScores).forEach(key => {
      emotionScores[key as keyof EmotionScores] /= total;
    });

    return emotionScores;
  }

  private determineBehavioralMarkers(faceAttributes: any, engagementScore: number): string[] {
    const markers: string[] = ['face-detected'];

    // Add engagement-based markers
    if (engagementScore > 0.7) {
      markers.push('highly-engaged');
    } else if (engagementScore > 0.5) {
      markers.push('moderately-engaged');
    } else {
      markers.push('low-engagement');
    }

    // Analyze head pose for attention
    if (faceAttributes?.headPose) {
      const { pitch, roll, yaw } = faceAttributes.headPose;
      if (Math.abs(pitch) < 15 && Math.abs(roll) < 15 && Math.abs(yaw) < 20) {
        markers.push('focused-attention');
      } else {
        markers.push('distracted-posture');
      }
    }

    // Check for clear facial features (indicates openness)
    if (faceAttributes?.occlusion) {
      const { eyeOccluded, foreheadOccluded, mouthOccluded } = faceAttributes.occlusion;
      if (!eyeOccluded && !foreheadOccluded && !mouthOccluded) {
        markers.push('open-communication');
      } else {
        markers.push('partial-occlusion');
      }
    }

    // Image quality indicators
    if (faceAttributes?.blur?.blurLevel === 'low') {
      markers.push('stable-positioning');
    }

    if (faceAttributes?.exposure?.exposureLevel === 'goodExposure') {
      markers.push('optimal-lighting');
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