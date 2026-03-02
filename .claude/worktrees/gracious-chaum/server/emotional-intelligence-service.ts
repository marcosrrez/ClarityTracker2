/**
 * Emotional Intelligence Service for Dinger
 * Analyzes counselor emotional state and provides adaptive support
 */

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface EmotionalState {
  tone: 'confident' | 'uncertain' | 'stressed' | 'frustrated' | 'curious' | 'overwhelmed' | 'neutral';
  confidence: number; // 1-100
  stressLevel: number; // 1-100
  burnoutRisk: number; // 1-100
  supportNeeded: 'high' | 'medium' | 'low';
  primaryEmotions: string[];
  triggers?: string[];
}

interface ProactiveRecommendation {
  type: 'self-care' | 'skill-building' | 'resource' | 'supervision' | 'peer-support';
  priority: 'immediate' | 'soon' | 'development';
  title: string;
  description: string;
  actionSteps: string[];
  timeToComplete: string;
  rationale: string;
}

interface AdaptiveCommunicationStyle {
  approach: 'supportive' | 'directive' | 'collaborative' | 'analytical' | 'encouraging';
  languageComplexity: 'simple' | 'moderate' | 'advanced';
  responseLength: 'brief' | 'detailed' | 'comprehensive';
  includeValidation: boolean;
  focusAreas: string[];
}

export class EmotionalIntelligenceService {
  private openai: OpenAI | null = null;
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    if (process.env.GOOGLE_AI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    }
  }

  /**
   * Analyze emotional state from conversation patterns
   */
  async analyzeEmotionalState(
    currentMessage: string,
    conversationHistory: string[],
    userProfile: any
  ): Promise<EmotionalState> {
    try {
      if (this.openai) {
        const response = await this.openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            {
              role: "system",
              content: `You are an expert in emotional intelligence and counselor well-being. Analyze the emotional state of a counselor based on their communication patterns. Consider:
              
              - Language patterns indicating stress, confidence, or uncertainty
              - Questions that suggest overwhelm or specific challenges
              - Professional tone vs. personal vulnerability
              - Indicators of burnout or imposter syndrome
              - Learning motivation and growth mindset
              
              Respond with JSON format containing: tone, confidence (1-100), stressLevel (1-100), burnoutRisk (1-100), supportNeeded, primaryEmotions array, and optional triggers array.`
            },
            {
              role: "user",
              content: `Current message: "${currentMessage}"
              
              Recent conversation history: ${conversationHistory.slice(-5).join('\n\n')}
              
              User experience level: ${userProfile.experienceLevel || 'developing'}
              Recent challenges: ${userProfile.challengeAreas?.join(', ') || 'general development'}`
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 500
        });

        return JSON.parse(response.choices[0].message.content || '{}');
      }

      // Fallback analysis
      return this.analyzeToneFallback(currentMessage, conversationHistory);
    } catch (error) {
      console.error('Emotional analysis failed:', error);
      return this.analyzeToneFallback(currentMessage, conversationHistory);
    }
  }

  /**
   * Generate proactive recommendations based on emotional state and patterns
   */
  async generateProactiveRecommendations(
    emotionalState: EmotionalState,
    userProfile: any,
    recentTopics: string[]
  ): Promise<ProactiveRecommendation[]> {
    try {
      if (this.openai) {
        const response = await this.openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are a proactive clinical supervisor with expertise in counselor development. Generate personalized recommendations based on emotional state analysis. Focus on:
              
              - Immediate self-care if stress/burnout risk is high
              - Skill-building opportunities aligned with growth areas
              - Resource suggestions for current challenges
              - Supervision prep for complex situations
              - Peer support connections for professional development
              
              Each recommendation should include type, priority, title, description, actionSteps array, timeToComplete, and rationale.
              
              Respond with JSON array of recommendations.`
            },
            {
              role: "user",
              content: `Emotional state: ${JSON.stringify(emotionalState)}
              
              User profile: ${JSON.stringify(userProfile)}
              
              Recent discussion topics: ${recentTopics.join(', ')}`
            }
          ],
          response_format: { type: "json_object" },
          max_tokens: 1000
        });

        const result = JSON.parse(response.choices[0].message.content || '{"recommendations": []}');
        return result.recommendations || [];
      }

      return this.generateFallbackRecommendations(emotionalState, userProfile);
    } catch (error) {
      console.error('Proactive recommendations failed:', error);
      return this.generateFallbackRecommendations(emotionalState, userProfile);
    }
  }

  /**
   * Adapt communication style based on emotional state
   */
  async adaptCommunicationStyle(
    emotionalState: EmotionalState,
    userProfile: any
  ): Promise<AdaptiveCommunicationStyle> {
    const style: AdaptiveCommunicationStyle = {
      approach: 'supportive',
      languageComplexity: 'moderate',
      responseLength: 'detailed',
      includeValidation: false,
      focusAreas: []
    };

    // Adapt based on emotional state
    if (emotionalState.stressLevel > 70 || emotionalState.burnoutRisk > 60) {
      style.approach = 'supportive';
      style.responseLength = 'brief';
      style.includeValidation = true;
      style.focusAreas = ['self-care', 'stress-management'];
    } else if (emotionalState.confidence < 40) {
      style.approach = 'encouraging';
      style.includeValidation = true;
      style.focusAreas = ['confidence-building', 'skill-reinforcement'];
    } else if (emotionalState.tone === 'curious') {
      style.approach = 'collaborative';
      style.languageComplexity = 'advanced';
      style.focusAreas = ['exploration', 'advanced-concepts'];
    } else if (emotionalState.tone === 'frustrated') {
      style.approach = 'analytical';
      style.focusAreas = ['problem-solving', 'alternative-approaches'];
    }

    // Adjust for experience level
    if (userProfile.experienceLevel === 'novice') {
      style.languageComplexity = 'simple';
      style.responseLength = 'detailed';
    } else if (userProfile.experienceLevel === 'expert') {
      style.languageComplexity = 'advanced';
      style.approach = 'collaborative';
    }

    return style;
  }

  /**
   * Fallback emotional analysis using keyword patterns
   */
  private analyzeToneFallback(currentMessage: string, history: string[]): EmotionalState {
    const message = currentMessage.toLowerCase();
    const allText = [currentMessage, ...history.slice(-3)].join(' ').toLowerCase();

    let tone: EmotionalState['tone'] = 'neutral';
    let confidence = 60;
    let stressLevel = 30;
    let burnoutRisk = 20;

    // Stress indicators
    if (message.includes('overwhelmed') || message.includes('stressed') || message.includes('too much')) {
      tone = 'overwhelmed';
      stressLevel = 80;
      confidence = 30;
    }

    // Uncertainty indicators
    if (message.includes('not sure') || message.includes('confused') || message.includes('don\'t know')) {
      tone = 'uncertain';
      confidence = 25;
    }

    // Frustration indicators
    if (message.includes('frustrated') || message.includes('difficult') || message.includes('challenging')) {
      tone = 'frustrated';
      stressLevel = 65;
    }

    // Curiosity indicators
    if (message.includes('how') || message.includes('why') || message.includes('learn')) {
      tone = 'curious';
      confidence = 70;
    }

    // Burnout risk assessment
    const burnoutKeywords = ['burnout', 'exhausted', 'drained', 'overwhelmed', 'too much'];
    const burnoutCount = burnoutKeywords.filter(keyword => allText.includes(keyword)).length;
    burnoutRisk = Math.min(90, burnoutCount * 25 + 20);

    return {
      tone,
      confidence,
      stressLevel,
      burnoutRisk,
      supportNeeded: stressLevel > 60 ? 'high' : stressLevel > 40 ? 'medium' : 'low',
      primaryEmotions: [tone],
      triggers: burnoutCount > 0 ? ['workload', 'complexity'] : undefined
    };
  }

  /**
   * Generate fallback recommendations
   */
  private generateFallbackRecommendations(
    emotionalState: EmotionalState,
    userProfile: any
  ): ProactiveRecommendation[] {
    const recommendations: ProactiveRecommendation[] = [];

    // High stress/burnout recommendations
    if (emotionalState.stressLevel > 70 || emotionalState.burnoutRisk > 60) {
      recommendations.push({
        type: 'self-care',
        priority: 'immediate',
        title: 'Stress Management Protocol',
        description: 'Implement immediate stress reduction techniques to maintain clinical effectiveness',
        actionSteps: [
          'Take 5-minute breathing breaks between sessions',
          'Practice grounding techniques during transitions',
          'Set boundaries around work-related thoughts outside office hours',
          'Schedule brief check-ins with supervisor about workload'
        ],
        timeToComplete: '1-2 days to establish routine',
        rationale: 'High stress levels can impact clinical judgment and therapeutic presence'
      });
    }

    // Low confidence recommendations
    if (emotionalState.confidence < 40) {
      recommendations.push({
        type: 'skill-building',
        priority: 'soon',
        title: 'Confidence Building Through Competency Review',
        description: 'Strengthen professional confidence through structured skill reinforcement',
        actionSteps: [
          'Review recent successful client interactions',
          'Identify specific techniques that worked well',
          'Practice role-playing challenging scenarios',
          'Seek feedback on areas of strength from supervisor'
        ],
        timeToComplete: '1-2 weeks',
        rationale: 'Building on existing strengths enhances overall professional confidence'
      });
    }

    // Curiosity-driven recommendations
    if (emotionalState.tone === 'curious') {
      recommendations.push({
        type: 'resource',
        priority: 'development',
        title: 'Advanced Learning Opportunity',
        description: 'Explore cutting-edge developments in your areas of interest',
        actionSteps: [
          'Identify specific topics of current interest',
          'Research recent journal articles in those areas',
          'Consider attending relevant webinars or workshops',
          'Discuss findings in next supervision session'
        ],
        timeToComplete: '2-4 weeks',
        rationale: 'Curiosity indicates readiness for advanced learning and professional growth'
      });
    }

    return recommendations;
  }
}

export const emotionalIntelligence = new EmotionalIntelligenceService();