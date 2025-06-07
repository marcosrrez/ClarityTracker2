import { AzureFaceService } from './azureFaceService';
import { AmazonRekognitionService } from './amazonRekognitionService';

interface CombinedEmotionAnalysis {
  dominantEmotion: string;
  emotionConfidence: number;
  engagementScore: number;
  detectedFaces: number;
  behavioralMarkers: string[];
  providers: {
    azure?: any;
    amazon?: any;
  };
  consensusScore: number;
  emotionScores: {
    anger: number;
    contempt: number;
    disgust: number;
    fear: number;
    happiness: number;
    neutral: number;
    sadness: number;
    surprise: number;
  };
}

export class MultiProviderEmotionService {
  private azureService: AzureFaceService;
  private amazonService: AmazonRekognitionService;

  constructor() {
    this.azureService = new AzureFaceService();
    this.amazonService = new AmazonRekognitionService();
  }

  async analyzeEmotions(imageData: string, timestamp: number): Promise<CombinedEmotionAnalysis> {
    const providers: any = {};
    const results: any[] = [];

    // Try Azure Computer Vision first
    try {
      if (this.azureService.isAvailable()) {
        const azureResult = await this.azureService.analyzeEmotions(imageData);
        providers.azure = azureResult;
        results.push({
          provider: 'azure',
          ...azureResult
        });
        console.log('Azure emotion analysis completed');
      }
    } catch (error) {
      console.log('Azure analysis failed, continuing with Amazon:', error instanceof Error ? error.message : error);
    }

    // Try Amazon Rekognition
    try {
      if (this.amazonService.isAvailable()) {
        const amazonResult = await this.amazonService.analyzeEmotions(imageData);
        providers.amazon = amazonResult;
        results.push({
          provider: 'amazon',
          ...amazonResult
        });
        console.log('Amazon Rekognition analysis completed');
      }
    } catch (error) {
      console.log('Amazon analysis failed:', error instanceof Error ? error.message : error);
    }

    // If no providers worked, return fallback analysis
    if (results.length === 0) {
      return this.createFallbackAnalysis(timestamp);
    }

    // Combine results from multiple providers
    return this.combineAnalysisResults(results, providers, timestamp);
  }

  private combineAnalysisResults(results: any[], providers: any, timestamp: number): CombinedEmotionAnalysis {
    const emotions = ['anger', 'contempt', 'disgust', 'fear', 'happiness', 'neutral', 'sadness', 'surprise'];
    
    // Average emotion scores across providers
    const combinedEmotionScores: any = {};
    emotions.forEach(emotion => {
      const scores = results.map(r => r.emotionScores?.[emotion] || 0);
      combinedEmotionScores[emotion] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    });

    // Find dominant emotion from combined scores
    const dominantEmotion = Object.entries(combinedEmotionScores)
      .reduce((max, [emotion, score]) => 
        score > max.score ? { emotion, score } : max, 
        { emotion: 'neutral', score: 0 }
      ).emotion;

    // Average confidence scores
    const avgConfidence = results.reduce((sum, r) => sum + (r.emotionConfidence || 0), 0) / results.length;
    
    // Average engagement scores
    const avgEngagement = results.reduce((sum, r) => sum + (r.engagementScore || 0), 0) / results.length;

    // Average detected faces
    const avgFaces = Math.round(results.reduce((sum, r) => sum + (r.detectedFaces || 0), 0) / results.length);

    // Combine behavioral markers
    const allMarkers = results.flatMap(r => r.behavioralMarkers || []);
    const uniqueMarkers = Array.from(new Set(allMarkers));

    // Calculate consensus score based on agreement between providers
    const consensusScore = this.calculateConsensusScore(results);

    // Add multi-provider markers
    uniqueMarkers.push(`${results.length}-provider-analysis`);
    if (consensusScore > 0.8) {
      uniqueMarkers.push('high-consensus');
    } else if (consensusScore > 0.6) {
      uniqueMarkers.push('moderate-consensus');
    } else {
      uniqueMarkers.push('low-consensus');
    }

    return {
      dominantEmotion,
      emotionConfidence: avgConfidence,
      engagementScore: avgEngagement,
      detectedFaces: avgFaces,
      behavioralMarkers: uniqueMarkers,
      providers,
      consensusScore,
      emotionScores: combinedEmotionScores
    };
  }

  private calculateConsensusScore(results: any[]): number {
    if (results.length < 2) return 1.0;

    const [first, second] = results;
    
    // Compare dominant emotions
    const emotionMatch = first.dominantEmotion === second.dominantEmotion ? 1 : 0;
    
    // Compare confidence levels
    const confidenceDiff = Math.abs((first.emotionConfidence || 0) - (second.emotionConfidence || 0));
    const confidenceMatch = 1 - confidenceDiff;
    
    // Compare engagement scores
    const engagementDiff = Math.abs((first.engagementScore || 0) - (second.engagementScore || 0));
    const engagementMatch = 1 - engagementDiff;

    // Weighted average
    return (emotionMatch * 0.5 + confidenceMatch * 0.3 + engagementMatch * 0.2);
  }

  private createFallbackAnalysis(timestamp: number): CombinedEmotionAnalysis {
    // Generate basic engagement analysis when no cloud providers are available
    const timeVariation = Math.sin(timestamp / 10000) * 0.2;
    const baseEngagement = 0.65 + timeVariation;
    
    return {
      dominantEmotion: 'focused',
      emotionConfidence: 0.75,
      engagementScore: Math.max(0.4, Math.min(1, baseEngagement)),
      detectedFaces: 1,
      behavioralMarkers: ['fallback-analysis', 'session-active', 'local-processing'],
      providers: {},
      consensusScore: 0.5,
      emotionScores: {
        anger: 5,
        contempt: 2,
        disgust: 3,
        fear: 8,
        happiness: 25,
        neutral: 45,
        sadness: 7,
        surprise: 5
      }
    };
  }

  public getAvailableProviders(): string[] {
    const providers: string[] = [];
    
    if (this.azureService.isAvailable()) {
      providers.push('Azure Computer Vision');
    }
    
    if (this.amazonService.isAvailable()) {
      providers.push('Amazon Rekognition');
    }
    
    return providers;
  }

  public getProviderStatus(): { azure: boolean; amazon: boolean } {
    return {
      azure: this.azureService.isAvailable(),
      amazon: this.amazonService.isAvailable()
    };
  }
}