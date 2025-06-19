import { GoogleGenerativeAI } from '@google/generative-ai';

interface SupervisionContext {
  userId: string;
  sessionData: any[];
  experienceLevel: 'novice' | 'developing' | 'proficient' | 'expert';
  totalHours: number;
  recentThemes: string[];
  strengthAreas: string[];
  challengeAreas: string[];
}

/**
 * Enhanced Dinger Service with session data integration and structured supervision
 */
export class EnhancedDingerService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    if (process.env.GOOGLE_AI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    }
  }

  /**
   * Generate contextual response with session data awareness
   */
  async generateSupervisionResponse(
    query: string,
    userId: string,
    mode: string = 'supervisor'
  ): Promise<{
    response: string;
    sessionInsights?: string[];
    resourceRecommendations?: any[];
    supervisionFocus?: string[];
    confidenceLevel: number;
  }> {
    try {
      if (!this.genAI) {
        throw new Error('Google AI not available');
      }

      // Build supervision context with session data
      const context = await this.buildSupervisionContext(userId);
      
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = this.buildSupervisionPrompt(query, context, mode);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();

      // Extract structured insights from response
      const insights = this.extractInsights(responseText, context);

      return {
        response: responseText,
        sessionInsights: insights.sessionInsights,
        resourceRecommendations: insights.resources,
        supervisionFocus: insights.supervisionTopics,
        confidenceLevel: 85
      };

    } catch (error) {
      console.error('Enhanced Dinger supervision response failed:', error);
      
      // Fallback to basic response
      return {
        response: "I'm here to support your clinical development. Could you share more details about what you'd like to discuss?",
        confidenceLevel: 70
      };
    }
  }

  /**
   * Build comprehensive supervision context from user session data
   */
  private async buildSupervisionContext(userId: string): Promise<SupervisionContext> {
    try {
      const { storage } = await import('./storage');
      
      // Get all log entries for this user
      const allEntries = await storage.getLogEntries();
      const userEntries = allEntries.filter((entry: any) => entry.userId === userId);
      
      if (userEntries.length === 0) {
        return {
          userId,
          sessionData: [],
          experienceLevel: 'developing',
          totalHours: 0,
          recentThemes: ['Getting Started'],
          strengthAreas: ['Motivation to Learn'],
          challengeAreas: ['Building Experience']
        };
      }

      // Analyze session data
      const totalHours = userEntries.reduce((sum: number, entry: any) => sum + (entry.clientContactHours || 0), 0);
      const recentEntries = userEntries.slice(0, 10);
      
      // Extract themes and patterns from session notes
      const themes = this.extractSessionThemes(userEntries);
      const strengths = this.identifyStrengths(userEntries);
      const challenges = this.identifyChallenges(userEntries);
      
      return {
        userId,
        sessionData: recentEntries,
        experienceLevel: totalHours > 500 ? 'proficient' : totalHours > 200 ? 'developing' : 'novice',
        totalHours,
        recentThemes: themes,
        strengthAreas: strengths,
        challengeAreas: challenges
      };
      
    } catch (error) {
      console.error('Error building supervision context:', error);
      return {
        userId,
        sessionData: [],
        experienceLevel: 'developing',
        totalHours: 0,
        recentThemes: ['Professional Development'],
        strengthAreas: ['Commitment to Growth'],
        challengeAreas: ['Building Clinical Skills']
      };
    }
  }

  /**
   * Build structured supervision prompt
   */
  private buildSupervisionPrompt(query: string, context: SupervisionContext, mode: string): string {
    const supervisionLevel = this.getSupervisionLevel(context.experienceLevel);
    const sessionSummary = this.createSessionSummary(context);

    return `You are Dr. AI Supervisor, a PhD-level licensed counselor with 20+ years of clinical practice, supervision, and research experience. You provide supplemental support to human supervisors working with LACs and mental health professionals.

## SUPERVISEE PROFILE
- Experience Level: ${context.experienceLevel} 
- Total Clinical Hours: ${context.totalHours}
- Recent Session Count: ${context.sessionData.length}
- Current Strengths: ${context.strengthAreas.join(', ')}
- Development Areas: ${context.challengeAreas.join(', ')}
- Recent Focus Themes: ${context.recentThemes.join(', ')}

## SESSION DATA SUMMARY
${sessionSummary}

## SUPERVISION APPROACH FOR ${context.experienceLevel.toUpperCase()} LEVEL
${supervisionLevel}

## STRUCTURED SUPERVISION PROTOCOL
Based on the supervisee's question and session data, provide guidance that includes:

1. **Clinical Perspective**: Address the specific question with evidence-based insight
2. **Session Connection**: Reference relevant patterns from their actual session data
3. **Skill Development**: Targeted recommendations based on their experience level
4. **Supervision Focus**: Specific areas to discuss with human supervisor
5. **Next Steps**: Practical actions they can take

## CURRENT QUESTION
"${query}"

Please provide a comprehensive yet accessible response that connects their question to their actual clinical experience and development needs.`;
  }

  /**
   * Extract insights from AI response
   */
  private extractInsights(responseText: string, context: SupervisionContext): any {
    // Simple pattern matching for structured insights
    const insights = {
      sessionInsights: [],
      resources: [],
      supervisionTopics: []
    };

    // Extract session insights
    if (context.sessionData.length > 0) {
      insights.sessionInsights = [
        `Based on your ${context.sessionData.length} recent sessions`,
        `Your ${context.totalHours} clinical hours show ${context.experienceLevel} development`,
        `Recent focus on: ${context.recentThemes.slice(0, 2).join(', ')}`
      ];
    }

    // Extract supervision topics
    if (context.challengeAreas.length > 0) {
      insights.supervisionTopics = context.challengeAreas.map(area => 
        `Discuss ${area} development strategies`
      );
    }

    return insights;
  }

  /**
   * Extract themes from session notes
   */
  private extractSessionThemes(entries: any[]): string[] {
    const allNotes = entries.map(entry => entry.notes || '').join(' ').toLowerCase();
    
    const themeKeywords = {
      'Therapeutic Alliance': ['rapport', 'relationship', 'trust', 'connection'],
      'Assessment Skills': ['assessment', 'diagnosis', 'evaluation', 'screening'],
      'Intervention Techniques': ['intervention', 'technique', 'strategy', 'approach'],
      'Documentation': ['notes', 'documentation', 'record', 'chart'],
      'Risk Assessment': ['risk', 'safety', 'suicide', 'harm', 'crisis'],
      'Cultural Competence': ['cultural', 'diversity', 'multicultural', 'identity']
    };
    
    return Object.keys(themeKeywords).filter(theme =>
      themeKeywords[theme].some(keyword => allNotes.includes(keyword))
    ).slice(0, 4);
  }

  /**
   * Identify strengths from session patterns
   */
  private identifyStrengths(entries: any[]): string[] {
    const allNotes = entries.map(entry => entry.notes || '').join(' ').toLowerCase();
    
    const strengthIndicators = {
      'Active Listening': ['listened', 'reflected', 'summarized', 'paraphrased'],
      'Empathy': ['empathy', 'understanding', 'validated', 'supportive'],
      'Rapport Building': ['rapport', 'connection', 'comfortable', 'trust'],
      'Documentation': ['detailed', 'thorough', 'comprehensive', 'complete'],
      'Clinical Observation': ['noticed', 'observed', 'aware', 'attention']
    };
    
    return Object.keys(strengthIndicators).filter(strength =>
      strengthIndicators[strength].some(indicator => allNotes.includes(indicator))
    ).slice(0, 3);
  }

  /**
   * Identify challenge areas
   */
  private identifyChallenges(entries: any[]): string[] {
    const allNotes = entries.map(entry => entry.notes || '').join(' ').toLowerCase();
    
    const challengeIndicators = {
      'Intervention Planning': ['unsure', 'uncertain', 'struggled', 'difficult'],
      'Risk Assessment': ['concerned', 'worried', 'unclear', 'confused'],
      'Case Conceptualization': ['complex', 'complicated', 'challenging', 'puzzling'],
      'Therapeutic Boundaries': ['boundary', 'limits', 'professional', 'appropriate']
    };
    
    return Object.keys(challengeIndicators).filter(challenge =>
      challengeIndicators[challenge].some(indicator => allNotes.includes(indicator))
    ).slice(0, 2);
  }

  /**
   * Get supervision level guidance
   */
  private getSupervisionLevel(experienceLevel: string): string {
    const levelGuidance = {
      'novice': 'Focus on basic skill development, safety protocols, and building confidence. Provide clear structure and frequent check-ins.',
      'developing': 'Emphasize skill refinement, case conceptualization, and increasing autonomy. Balance support with challenge.',
      'proficient': 'Encourage advanced techniques, complex case management, and leadership development. Focus on specialization.',
      'expert': 'Support research integration, mentoring others, and innovative practice approaches. Peer consultation model.'
    };
    
    return levelGuidance[experienceLevel] || levelGuidance['developing'];
  }

  /**
   * Create session summary
   */
  private createSessionSummary(context: SupervisionContext): string {
    if (context.sessionData.length === 0) {
      return 'No session data available yet. Focus on onboarding and initial skill development.';
    }

    const recentSessions = context.sessionData.slice(0, 5);
    const totalRecentHours = recentSessions.reduce((sum: any, entry: any) => sum + (entry.clientContactHours || 0), 0);
    
    return `Recent ${recentSessions.length} sessions totaling ${totalRecentHours} hours. 
Themes include: ${context.recentThemes.join(', ')}. 
Current strengths: ${context.strengthAreas.join(', ')}.
Development focus: ${context.challengeAreas.join(', ')}.`;
  }
}

export const enhancedDingerService = new EnhancedDingerService();