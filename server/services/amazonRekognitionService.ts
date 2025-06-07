import AWS from 'aws-sdk';

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

interface AmazonEmotionAnalysis {
  dominantEmotion: string;
  emotionConfidence: number;
  emotionScores: EmotionScores;
  detectedFaces: number;
  faceAttributes: {
    age?: number;
    gender?: string;
    smile?: number;
    eyesOpen?: number;
    mouthOpen?: number;
    mustache?: number;
    beard?: number;
    eyeglasses?: number;
    sunglasses?: number;
    emotions?: EmotionScores;
  }[];
  engagementScore: number;
  behavioralMarkers: string[];
}

export class AmazonRekognitionService {
  private rekognition: AWS.Rekognition | null = null;
  private isConfigured = false;

  constructor() {
    this.initializeRekognition();
  }

  private initializeRekognition() {
    const accessKey = process.env.AWS_ACCESS_KEY_ID;
    const secretKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION || 'us-east-1';

    if (!accessKey || !secretKey) {
      console.log('Amazon Rekognition not configured - missing AWS credentials');
      this.isConfigured = false;
      return;
    }

    try {
      AWS.config.update({
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
        region: region
      });
      
      this.rekognition = new AWS.Rekognition();
      this.isConfigured = true;
      console.log('Amazon Rekognition initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Amazon Rekognition:', error);
      this.isConfigured = false;
    }
  }

  async analyzeEmotions(imageData: string): Promise<AmazonEmotionAnalysis> {
    if (!this.isConfigured || !this.rekognition) {
      throw new Error('Amazon Rekognition not configured');
    }

    try {
      const imageBuffer = Buffer.from(imageData, 'base64');

      const params = {
        Image: {
          Bytes: imageBuffer
        },
        Attributes: [
          'ALL'
        ]
      };

      const result = await this.rekognition.detectFaces(params).promise();

      if (!result.FaceDetails || result.FaceDetails.length === 0) {
        return this.createEmptyAnalysis();
      }

      const face = result.FaceDetails[0];
      const emotions = face.Emotions || [];

      // Process emotions into our standard format
      const emotionScores: EmotionScores = {
        anger: this.findEmotionConfidence(emotions, 'ANGRY'),
        contempt: 0, // Rekognition doesn't detect contempt
        disgust: this.findEmotionConfidence(emotions, 'DISGUSTED'),
        fear: this.findEmotionConfidence(emotions, 'FEAR'),
        happiness: this.findEmotionConfidence(emotions, 'HAPPY'),
        neutral: this.findEmotionConfidence(emotions, 'CALM'),
        sadness: this.findEmotionConfidence(emotions, 'SAD'),
        surprise: this.findEmotionConfidence(emotions, 'SURPRISED')
      };

      // Find dominant emotion
      const dominantEmotion = this.getDominantEmotion(emotionScores);
      const emotionConfidence = emotionScores[dominantEmotion as keyof EmotionScores] / 100;

      // Calculate engagement score based on multiple factors
      const engagementScore = this.calculateEngagementScore(face, emotionScores);

      // Generate behavioral markers
      const behavioralMarkers = this.generateBehavioralMarkers(face, emotionScores);

      return {
        dominantEmotion,
        emotionConfidence,
        emotionScores,
        detectedFaces: result.FaceDetails.length,
        faceAttributes: [{
          age: face.AgeRange ? (face.AgeRange.Low + face.AgeRange.High) / 2 : undefined,
          gender: face.Gender?.Value,
          smile: face.Smile?.Confidence,
          eyesOpen: face.EyesOpen?.Confidence,
          mouthOpen: face.MouthOpen?.Confidence,
          mustache: face.Mustache?.Confidence,
          beard: face.Beard?.Confidence,
          eyeglasses: face.Eyeglasses?.Confidence,
          sunglasses: face.Sunglasses?.Confidence,
          emotions: emotionScores
        }],
        engagementScore,
        behavioralMarkers
      };

    } catch (error) {
      console.error('Amazon Rekognition analysis error:', error);
      throw new Error(`Failed to analyze emotions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private findEmotionConfidence(emotions: any[], emotionType: string): number {
    const emotion = emotions.find(e => e.Type === emotionType);
    return emotion ? emotion.Confidence : 0;
  }

  private getDominantEmotion(emotionScores: EmotionScores): string {
    let maxEmotion = 'neutral';
    let maxScore = emotionScores.neutral;

    Object.entries(emotionScores).forEach(([emotion, score]) => {
      if (score > maxScore) {
        maxEmotion = emotion;
        maxScore = score;
      }
    });

    return maxEmotion;
  }

  private calculateEngagementScore(face: any, emotionScores: EmotionScores): number {
    let score = 0.5; // Base score

    // Eyes open indicates attention
    if (face.EyesOpen?.Confidence > 80) {
      score += 0.2;
    }

    // Positive emotions indicate engagement
    if (emotionScores.happiness > 30) {
      score += 0.15;
    }

    // Face orientation (looking at camera)
    if (face.Pose) {
      const yaw = Math.abs(face.Pose.Yaw || 0);
      const pitch = Math.abs(face.Pose.Pitch || 0);
      
      if (yaw < 15 && pitch < 15) {
        score += 0.2; // Looking directly at camera
      } else if (yaw < 30 && pitch < 30) {
        score += 0.1; // Slightly turned away
      }
    }

    // Confidence in face detection
    if (face.Confidence > 90) {
      score += 0.05;
    }

    return Math.max(0, Math.min(1, score));
  }

  private generateBehavioralMarkers(face: any, emotionScores: EmotionScores): string[] {
    const markers: string[] = [];

    // Attention markers
    if (face.EyesOpen?.Confidence > 90) {
      markers.push('eyes-open', 'attentive');
    }

    // Emotional markers
    if (emotionScores.happiness > 50) {
      markers.push('positive-emotion', 'engaged');
    } else if (emotionScores.sadness > 50) {
      markers.push('sadness-detected', 'emotional-state');
    } else if (emotionScores.anger > 50) {
      markers.push('anger-detected', 'emotional-escalation');
    } else if (emotionScores.fear > 50) {
      markers.push('anxiety-indicators', 'emotional-distress');
    }

    // Engagement markers
    if (face.Smile?.Confidence > 70) {
      markers.push('smiling', 'positive-engagement');
    }

    // Orientation markers
    if (face.Pose) {
      const yaw = Math.abs(face.Pose.Yaw || 0);
      if (yaw < 10) {
        markers.push('direct-gaze', 'focused');
      } else if (yaw > 30) {
        markers.push('looking-away', 'distracted');
      }
    }

    // Quality markers
    if (face.Confidence > 95) {
      markers.push('high-quality-detection');
    }

    return markers;
  }

  private createEmptyAnalysis(): AmazonEmotionAnalysis {
    return {
      dominantEmotion: 'neutral',
      emotionConfidence: 0,
      emotionScores: {
        anger: 0,
        contempt: 0,
        disgust: 0,
        fear: 0,
        happiness: 0,
        neutral: 100,
        sadness: 0,
        surprise: 0
      },
      detectedFaces: 0,
      faceAttributes: [],
      engagementScore: 0,
      behavioralMarkers: ['no-face-detected']
    };
  }

  public isAvailable(): boolean {
    return this.isConfigured;
  }
}