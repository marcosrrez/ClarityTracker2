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

      // Extract structured insights from response with enhanced competency mapping
      const insights = this.extractEnhancedInsights(responseText, context);

      return {
        response: responseText,
        sessionInsights: insights.sessionInsights,
        resourceRecommendations: insights.resources,
        supervisionFocus: insights.supervisionTopics,
        competencyAreas: insights.competencyAreas,
        riskFactors: insights.riskFactors,
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
    const riskAssessment = this.assessRiskFactors(query, context);
    const consultationFramework = this.getCaseConsultationFramework(context.experienceLevel);

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

## RISK ASSESSMENT SCREENING
${riskAssessment}

## CASE CONSULTATION FRAMEWORK
${consultationFramework}

## SUPERVISION APPROACH FOR ${context.experienceLevel.toUpperCase()} LEVEL
${supervisionLevel}

## STRUCTURED CLINICAL SUPERVISION PROTOCOL

### Phase 1: Clinical Assessment
1. **Safety Evaluation**: Assess any immediate risk factors or safety concerns
2. **Case Conceptualization**: Connect presenting issue to theoretical framework
3. **Evidence-Base Review**: Reference relevant research and best practices

### Phase 2: Skill Development Analysis
4. **Competency Mapping**: Identify CACREP standards being addressed
5. **Technical Skills**: Evaluate intervention techniques and clinical skills
6. **Professional Development**: Assess growth areas and learning objectives

### Phase 3: Supervision Planning
7. **Action Steps**: Provide specific, measurable recommendations
8. **Supervisor Discussion Points**: Key topics for human supervision
9. **Follow-Up Monitoring**: Identify areas needing ongoing assessment

## CURRENT CONSULTATION REQUEST
"${query}"

Using the structured protocol above, provide comprehensive supervision that integrates their actual session data with evidence-based clinical guidance. Address safety concerns immediately if present, then proceed through systematic case analysis.`;
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

  /**
   * Assess risk factors from query and session data
   */
  private assessRiskFactors(query: string, context: SupervisionContext): string {
    const riskKeywords = {
      'High Priority': ['suicide', 'harm', 'crisis', 'danger', 'emergency', 'safety', 'abuse', 'violence'],
      'Medium Priority': ['risk', 'concern', 'worried', 'anxiety', 'depression', 'trauma', 'substance'],
      'Clinical Attention': ['boundaries', 'dual relationship', 'ethics', 'competence', 'supervision']
    };

    const queryLower = query.toLowerCase();
    const sessionNotes = context.sessionData.map(s => s.notes || '').join(' ').toLowerCase();
    
    let riskLevel = 'Standard';
    let riskFactors: string[] = [];

    // Check for high priority risks
    if (riskKeywords['High Priority'].some(keyword => queryLower.includes(keyword) || sessionNotes.includes(keyword))) {
      riskLevel = 'HIGH PRIORITY - IMMEDIATE ATTENTION REQUIRED';
      riskFactors.push('Safety concerns detected - immediate supervisor consultation required');
    }
    
    // Check for medium priority risks
    else if (riskKeywords['Medium Priority'].some(keyword => queryLower.includes(keyword) || sessionNotes.includes(keyword))) {
      riskLevel = 'Medium Priority';
      riskFactors.push('Clinical risk factors present - enhanced monitoring recommended');
    }
    
    // Check for clinical attention needs
    else if (riskKeywords['Clinical Attention'].some(keyword => queryLower.includes(keyword) || sessionNotes.includes(keyword))) {
      riskLevel = 'Clinical Attention';
      riskFactors.push('Professional development focus - supervision discussion recommended');
    }

    return `Risk Level: ${riskLevel}
${riskFactors.length > 0 ? 'Identified Factors: ' + riskFactors.join('; ') : 'No immediate risk factors identified'}
Supervisee Experience: ${context.experienceLevel} (${context.totalHours} hours) - ${this.getRiskGuidance(context.experienceLevel)}`;
  }

  /**
   * Get case consultation framework based on experience level
   */
  private getCaseConsultationFramework(experienceLevel: 'novice' | 'developing' | 'proficient' | 'expert'): string {
    const frameworks = {
      'novice': `## NOVICE CONSULTATION PROTOCOL
1. **Safety First**: Always assess client safety and welfare
2. **Basic Skills Focus**: Concentrate on fundamental therapeutic skills
3. **Structured Approach**: Use clear, step-by-step intervention planning
4. **Frequent Check-ins**: Regular supervisor consultation for all cases
5. **Skill Building**: Focus on core competencies and confidence building`,

      'developing': `## DEVELOPING CONSULTATION PROTOCOL  
1. **Case Conceptualization**: Practice connecting theory to client presentation
2. **Intervention Selection**: Explore evidence-based treatment options
3. **Skill Refinement**: Build on existing strengths while addressing gaps
4. **Autonomy Building**: Increase independent decision-making with support
5. **Specialization Exploration**: Begin identifying areas of clinical interest`,

      'proficient': `## PROFICIENT CONSULTATION PROTOCOL
1. **Complex Case Management**: Handle challenging or multi-faceted cases
2. **Advanced Techniques**: Implement specialized interventions
3. **Leadership Development**: Begin mentoring newer clinicians
4. **Research Integration**: Apply current research to clinical practice
5. **Ethical Reasoning**: Navigate complex ethical dilemmas independently`,

      'expert': `## EXPERT CONSULTATION PROTOCOL
1. **Peer Consultation**: Collaborative problem-solving approach
2. **Innovation**: Develop and test new therapeutic approaches
3. **Teaching Excellence**: Share expertise with supervisees and colleagues
4. **Research Contribution**: Contribute to clinical knowledge base
5. **Systems Thinking**: Address organizational and systemic factors`
    };

    return frameworks[experienceLevel];
  }

  /**
   * Get risk-specific guidance based on experience level
   */
  private getRiskGuidance(experienceLevel: 'novice' | 'developing' | 'proficient' | 'expert'): string {
    const guidance = {
      'novice': 'Requires immediate supervisor consultation for any risk assessment',
      'developing': 'Consult supervisor before implementing risk management protocols',
      'proficient': 'Implement standard protocols with supervisor notification',
      'expert': 'Manage independently with appropriate documentation and follow-up'
    };

    return guidance[experienceLevel];
  }

  /**
   * Enhanced insight extraction with competency mapping
   */
  private extractEnhancedInsights(responseText: string, context: SupervisionContext): any {
    const insights = {
      sessionInsights: [],
      resources: [],
      supervisionTopics: [],
      competencyAreas: [],
      riskFactors: []
    };

    // Session insights with competency mapping
    if (context.sessionData.length > 0) {
      insights.sessionInsights = [
        `Clinical Experience: ${context.totalHours} hours (${context.experienceLevel} level)`,
        `Recent Focus: ${context.recentThemes.slice(0, 2).join(', ')}`,
        `Growth Areas: ${context.challengeAreas.join(', ')}`,
        `Demonstrated Strengths: ${context.strengthAreas.join(', ')}`
      ];
    }

    // CACREP competency areas identified
    const competencyMapping = {
      'Therapeutic Alliance': 'CACREP 2.F.5.g - Counseling relationship development',
      'Assessment Skills': 'CACREP 2.F.7 - Assessment and testing',
      'Risk Assessment': 'CACREP 2.F.5.m - Crisis intervention and suicide prevention',
      'Documentation': 'CACREP 2.F.1.l - Records and documentation requirements',
      'Cultural Competence': 'CACREP 2.F.2.a - Multicultural counseling competencies'
    };

    context.recentThemes.forEach(theme => {
      if (competencyMapping[theme]) {
        insights.competencyAreas.push(competencyMapping[theme]);
      }
    });

    // Supervision focus based on experience level and themes
    insights.supervisionTopics = [
      `${context.experienceLevel} development priorities`,
      ...context.challengeAreas.map(area => `${area} skill building`),
      'Professional identity development',
      'Ethical decision-making practice'
    ];

    return insights;
  }
}

export const enhancedDingerService = new EnhancedDingerService();