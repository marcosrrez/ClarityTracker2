import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

interface AudioAnalysis {
  transcription: string;
  emotionalTone: string;
  speakingPatterns: any;
  clinicalMarkers: string[];
  confidence: number;
}

interface VideoAnalysis {
  facialExpressions: any;
  bodyLanguage: any;
  engagementMetrics: any;
  behavioralPatterns: string[];
  dominantEmotion: string;
  emotionConfidence: number;
}

interface TranscriptAnalysis {
  sentiment: string;
  clinicalThemes: string[];
  riskIndicators: any[];
  treatmentModalities: string[];
  speaker: string;
}

interface MultiModalInsights {
  emotionalCorrelation: any;
  incongruenceAnalysis: any;
  engagementAnalysis: any;
  overallInsights: string[];
  clinicalSignificance: string;
}

class MultiModalAnalysisService {
  private openai: OpenAI;
  private genAI: GoogleGenerativeAI | null = null;
  private azureSpeechConfig: sdk.SpeechConfig | null = null;

  constructor() {
    // Initialize OpenAI
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Initialize Google AI if available
    if (process.env.GOOGLE_AI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    }

    // Initialize Azure Speech
    this.initializeAzureSpeech();
  }

  private initializeAzureSpeech() {
    if (process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION) {
      this.azureSpeechConfig = sdk.SpeechConfig.fromSubscription(
        process.env.AZURE_SPEECH_KEY,
        process.env.AZURE_SPEECH_REGION
      );
      
      // Enhanced configuration for clinical context
      this.azureSpeechConfig.speechRecognitionLanguage = "en-US";
      this.azureSpeechConfig.requestWordLevelTimestamps();
      this.azureSpeechConfig.enableAudioLogging = false; // Privacy compliance
    }
  }

  async analyzeTranscript(text: string, timestamp: number): Promise<TranscriptAnalysis> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are a clinical psychology AI assistant. Analyze this therapy session transcript segment for:
            1. Emotional sentiment
            2. Clinical themes and patterns
            3. Risk indicators (suicidal ideation, self-harm, substance abuse, etc.)
            4. Treatment modalities being used
            5. Speaker identification (Therapist/Client)
            
            Respond in JSON format with keys: sentiment, clinicalThemes, riskIndicators, treatmentModalities, speaker, emotionalTone`
          },
          {
            role: "user",
            content: text
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        sentiment: analysis.sentiment || 'neutral',
        clinicalThemes: analysis.clinicalThemes || [],
        riskIndicators: analysis.riskIndicators || [],
        treatmentModalities: analysis.treatmentModalities || [],
        speaker: analysis.speaker || 'Unknown'
      };

    } catch (error) {
      console.error('Error analyzing transcript:', error);
      throw new Error('Failed to analyze transcript');
    }
  }

  async analyzeVideoFrame(imageData: string, timestamp: number) {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Analyze this therapy session video frame for comprehensive behavioral analysis. Provide detailed analysis in JSON format with:
            - faceDetection: {facesDetected: number, landmarks: array, eyeGaze: {x, y}, headPose: {pitch, yaw, roll}}
            - emotions: {joy, sadness, anger, fear, surprise, disgust, contempt, neutral, dominantEmotion, intensity}
            - bodyLanguage: {pose: array, posture: string, gestures: array, fidgeting: number}
            - engagement: {overallScore, eyeContact, attentiveness, participation}
            - behavioralMarkers: {riskIndicators: array, therapeuticAlliance: number, stressLevel: number, comfortLevel: number}
            
            All values should be numbers between 0-1 except where specified. Base analysis on visible cues in therapeutic context.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Provide comprehensive multi-modal analysis of this therapy session frame including face detection, emotion analysis, body language assessment, engagement metrics, and behavioral markers."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageData}`
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 800,
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');

      // Return comprehensive analysis structure
      return {
        timestamp,
        faceDetection: {
          facesDetected: analysis.faceDetection?.facesDetected || 1,
          landmarks: analysis.faceDetection?.landmarks || [],
          eyeGaze: analysis.faceDetection?.eyeGaze || { x: 0.5, y: 0.5 },
          headPose: analysis.faceDetection?.headPose || { pitch: 0, yaw: 0, roll: 0 }
        },
        emotions: {
          joy: analysis.emotions?.joy || 0.1,
          sadness: analysis.emotions?.sadness || 0.1,
          anger: analysis.emotions?.anger || 0.05,
          fear: analysis.emotions?.fear || 0.05,
          surprise: analysis.emotions?.surprise || 0.05,
          disgust: analysis.emotions?.disgust || 0.02,
          contempt: analysis.emotions?.contempt || 0.02,
          neutral: analysis.emotions?.neutral || 0.6,
          dominantEmotion: analysis.emotions?.dominantEmotion || 'neutral',
          intensity: analysis.emotions?.intensity || 0.3
        },
        bodyLanguage: {
          pose: analysis.bodyLanguage?.pose || [],
          posture: analysis.bodyLanguage?.posture || 'neutral',
          gestures: analysis.bodyLanguage?.gestures || [],
          fidgeting: analysis.bodyLanguage?.fidgeting || 0.2
        },
        engagement: {
          overallScore: Math.round((analysis.engagement?.overallScore || 0.7) * 100),
          eyeContact: Math.round((analysis.engagement?.eyeContact || 0.6) * 100),
          attentiveness: Math.round((analysis.engagement?.attentiveness || 0.8) * 100),
          participation: Math.round((analysis.engagement?.participation || 0.7) * 100)
        },
        behavioralMarkers: {
          riskIndicators: analysis.behavioralMarkers?.riskIndicators || [],
          therapeuticAlliance: analysis.behavioralMarkers?.therapeuticAlliance || 6.5,
          stressLevel: analysis.behavioralMarkers?.stressLevel || 0.3,
          comfortLevel: analysis.behavioralMarkers?.comfortLevel || 0.7
        }
      };

    } catch (error) {
      console.error('Error analyzing video frame:', error);
      throw new Error('Failed to analyze video frame');
    }
  }

  async generateClinicalInsights(
    transcriptionSegments: any[],
    videoAnalysis: VideoAnalysis | null,
    sessionDuration: number
  ) {
    try {
      const contextData = {
        recentTranscripts: transcriptionSegments.slice(-5),
        videoInsights: videoAnalysis,
        sessionDuration,
        timestamp: Date.now()
      };

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a clinical supervisor AI. Generate real-time insights for an ongoing therapy session based on transcript and video analysis. Focus on:
            1. Therapeutic alliance quality
            2. Client engagement and progress
            3. Treatment effectiveness indicators
            4. Clinical recommendations
            5. Compliance with therapeutic standards
            
            Provide actionable insights that support the therapist. Respond in JSON format with keys: clinicalInsights, complianceScore, recommendations`
          },
          {
            role: "user",
            content: JSON.stringify(contextData)
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
      });

      return JSON.parse(response.choices[0].message.content || '{}');

    } catch (error) {
      console.error('Error generating clinical insights:', error);
      throw new Error('Failed to generate clinical insights');
    }
  }

  async fuseMultiModalData(
    audioAnalysis: AudioAnalysis,
    videoAnalysis: VideoAnalysis | null,
    transcriptAnalysis: TranscriptAnalysis
  ): Promise<MultiModalInsights> {
    try {
      // Correlation analysis between audio emotions and video expressions
      const emotionalCorrelation = this.correlateEmotionalData(
        audioAnalysis.emotionalTone,
        videoAnalysis?.facialExpressions,
        transcriptAnalysis.sentiment
      );

      // Detect incongruence between modalities
      const incongruenceAnalysis = this.detectIncongruence(
        audioAnalysis.emotionalTone,
        videoAnalysis?.dominantEmotion,
        transcriptAnalysis.sentiment
      );

      // Fuse engagement data
      const engagementAnalysis = this.fuseEngagementData(
        audioAnalysis.speakingPatterns,
        videoAnalysis?.engagementMetrics
      );

      // Generate overall insights
      const overallInsights = await this.generateOverallInsights(
        audioAnalysis,
        videoAnalysis,
        transcriptAnalysis
      );

      return {
        emotionalCorrelation,
        incongruenceAnalysis,
        engagementAnalysis,
        overallInsights,
        clinicalSignificance: this.assessClinicalSignificance(
          emotionalCorrelation,
          incongruenceAnalysis,
          transcriptAnalysis.riskIndicators
        )
      };

    } catch (error) {
      console.error('Error fusing multi-modal data:', error);
      throw new Error('Failed to fuse multi-modal data');
    }
  }

  private correlateEmotionalData(audioTone: string, videoExpressions: any, textSentiment: string) {
    // Calculate correlation between different emotional indicators
    const correlationScore = this.calculateCorrelationScore(audioTone, videoExpressions, textSentiment);
    
    return {
      audioVideoAlignment: correlationScore.audioVideo,
      audioTextAlignment: correlationScore.audioText,
      videoTextAlignment: correlationScore.videoText,
      overallCoherence: correlationScore.overall,
      timestamp: Date.now()
    };
  }

  private detectIncongruence(audioTone: string, videoEmotion?: string, textSentiment?: string) {
    const incongruenceIndicators = [];
    
    // Check for mismatches between modalities
    if (audioTone && videoEmotion && this.areEmotionsIncongruent(audioTone, videoEmotion)) {
      incongruenceIndicators.push({
        type: 'audio-video-mismatch',
        description: `Audio tone (${audioTone}) doesn't match facial expression (${videoEmotion})`,
        severity: 'medium',
        clinicalSignificance: 'May indicate emotional suppression or social masking'
      });
    }

    if (audioTone && textSentiment && this.areEmotionsIncongruent(audioTone, textSentiment)) {
      incongruenceIndicators.push({
        type: 'audio-text-mismatch',
        description: `Vocal tone (${audioTone}) doesn't match verbal content (${textSentiment})`,
        severity: 'high',
        clinicalSignificance: 'Potential indication of internal conflict or difficulty expressing true feelings'
      });
    }

    return {
      indicators: incongruenceIndicators,
      overallIncongruenceLevel: incongruenceIndicators.length > 0 ? 'detected' : 'none',
      timestamp: Date.now()
    };
  }

  private fuseEngagementData(speakingPatterns: any, videoMetrics: any) {
    // Combine audio and video engagement indicators
    let engagementScore = 0.5; // baseline

    if (speakingPatterns?.participationLevel) {
      engagementScore += speakingPatterns.participationLevel * 0.3;
    }

    if (videoMetrics?.eyeContact) {
      engagementScore += videoMetrics.eyeContact * 0.2;
    }

    if (videoMetrics?.bodyPosture) {
      engagementScore += videoMetrics.bodyPosture * 0.2;
    }

    return {
      fusedEngagementScore: Math.min(engagementScore, 1.0),
      audioEngagementIndicators: speakingPatterns || {},
      videoEngagementIndicators: videoMetrics || {},
      recommendedInterventions: this.generateEngagementRecommendations(engagementScore)
    };
  }

  private async generateOverallInsights(
    audioAnalysis: AudioAnalysis,
    videoAnalysis: VideoAnalysis | null,
    transcriptAnalysis: TranscriptAnalysis
  ): Promise<string[]> {
    const insights = [];

    // Therapeutic alliance insights
    if (audioAnalysis.clinicalMarkers.includes('rapport-building')) {
      insights.push('Strong therapeutic rapport observed in conversation patterns');
    }

    // Progress indicators
    if (transcriptAnalysis.clinicalThemes.includes('coping-strategies')) {
      insights.push('Client discussing coping strategies - positive treatment engagement');
    }

    // Risk assessment
    if (transcriptAnalysis.riskIndicators.length > 0) {
      insights.push(`Risk indicators detected: ${transcriptAnalysis.riskIndicators.map(r => r.type).join(', ')}`);
    }

    // Engagement insights
    if (videoAnalysis?.engagementMetrics) {
      insights.push('Visual engagement patterns suggest active participation in session');
    }

    return insights;
  }

  private calculateCorrelationScore(audioTone: string, videoExpressions: any, textSentiment: string) {
    // Simplified correlation calculation
    // In production, this would use more sophisticated algorithms
    return {
      audioVideo: 0.8,
      audioText: 0.7,
      videoText: 0.75,
      overall: 0.75
    };
  }

  private areEmotionsIncongruent(emotion1: string, emotion2: string): boolean {
    const emotionMap = {
      positive: ['happy', 'joy', 'calm', 'content'],
      negative: ['sad', 'angry', 'frustrated', 'anxious'],
      neutral: ['neutral', 'composed', 'focused']
    };

    const getEmotionCategory = (emotion: string) => {
      for (const [category, emotions] of Object.entries(emotionMap)) {
        if (emotions.includes(emotion.toLowerCase())) {
          return category;
        }
      }
      return 'neutral';
    };

    const category1 = getEmotionCategory(emotion1);
    const category2 = getEmotionCategory(emotion2);

    // Consider incongruent if they're in opposite categories
    return (category1 === 'positive' && category2 === 'negative') ||
           (category1 === 'negative' && category2 === 'positive');
  }

  private assessClinicalSignificance(
    emotionalCorrelation: any,
    incongruenceAnalysis: any,
    riskIndicators: any[]
  ): string {
    if (riskIndicators.length > 0) {
      return 'high';
    }
    
    if (incongruenceAnalysis.indicators.length > 0) {
      return 'medium';
    }
    
    if (emotionalCorrelation.overallCoherence < 0.6) {
      return 'medium';
    }
    
    return 'low';
  }

  private generateEngagementRecommendations(engagementScore: number): string[] {
    const recommendations = [];
    
    if (engagementScore < 0.4) {
      recommendations.push('Consider adjusting therapeutic approach to increase client engagement');
      recommendations.push('Explore potential barriers to participation');
    } else if (engagementScore < 0.7) {
      recommendations.push('Client showing moderate engagement - continue building rapport');
    } else {
      recommendations.push('High engagement observed - excellent therapeutic alliance');
    }
    
    return recommendations;
  }

  async checkCompliance(sessionData: any): Promise<any> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a clinical compliance auditor. Review this therapy session data for compliance with professional standards:
            1. Documentation completeness
            2. Risk assessment protocols
            3. Treatment planning standards
            4. Ethical guidelines adherence
            
            Rate compliance on a scale of 1-100 and identify any issues. Respond in JSON format.`
          },
          {
            role: "user",
            content: JSON.stringify(sessionData)
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });

      return JSON.parse(response.choices[0].message.content || '{}');

    } catch (error) {
      console.error('Error checking compliance:', error);
      throw new Error('Failed to check compliance');
    }
  }

  getAzureSpeechConfig() {
    if (!this.azureSpeechConfig) {
      throw new Error('Azure Speech Service not configured. Please provide AZURE_SPEECH_KEY and AZURE_SPEECH_REGION.');
    }
    return {
      key: process.env.AZURE_SPEECH_KEY,
      region: process.env.AZURE_SPEECH_REGION
    };
  }
}

export default new MultiModalAnalysisService();