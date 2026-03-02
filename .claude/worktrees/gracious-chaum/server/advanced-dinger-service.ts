import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { emotionalIntelligence } from './emotional-intelligence-service';

// Advanced Dinger Types
interface ReasoningContext {
  userProfile: CounselorProfile;
  sessionHistory: ConversationMemory[];
  currentMode: 'supervisor' | 'peer' | 'clinician' | 'researcher';
  complexityLevel: 'novice' | 'developing' | 'proficient' | 'expert';
  reasoningType: 'chain-of-thought' | 'tree-of-thought' | 'direct';
}

interface CounselorProfile {
  userId: string;
  experienceLevel: 'novice' | 'developing' | 'proficient' | 'expert';
  monthsOfExperience: number;
  primaryModalities: string[];
  clientPopulations: string[];
  strengthAreas: string[];
  challengeAreas: string[];
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  communicationPreference: 'direct' | 'supportive' | 'collaborative' | 'analytical';
  recentFocusAreas: string[];
  confidenceLevel: number; // 1-100
  lastActive: Date;
}

interface ConversationMemory {
  id: string;
  userId: string;
  sessionId: string;
  timestamp: Date;
  query: string;
  response: string;
  mode: string;
  competencyAreas: string[];
  emotionalTone: 'confident' | 'uncertain' | 'frustrated' | 'curious' | 'overwhelmed';
  complexity: number;
  outcomeRating?: number;
  followUpNeeded: boolean;
  tags: string[];
}

interface EnhancedResponse {
  response: string;
  reasoningSteps?: string[];
  alternativePerspectives?: string[];
  resourceRecommendations: ResourceSuggestion[];
  followUpSuggestions: string[];
  confidenceLevel: number;
  nextSessionTopics?: string[];
  supervisionPrep?: string[];
  emotionalInsights?: {
    detectedState: any;
    adaptedStyle: any;
    proactiveRecommendations: any[];
  };
}

interface ResourceSuggestion {
  type: 'article' | 'technique' | 'course' | 'consultation' | 'book' | 'video';
  title: string;
  description: string;
  url?: string;
  relevanceScore: number;
  priority: 'immediate' | 'development' | 'reference';
  competencyArea: string;
}

/**
 * Advanced AI Coaching Engine for Dinger
 * Implements doctoral-level mentoring with adaptive reasoning and contextual memory
 */
export class AdvancedDingerService {
  private genAI: GoogleGenerativeAI | null = null;
  private openai: OpenAI | null = null;

  constructor() {
    if (process.env.GOOGLE_AI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    }
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }

  /**
   * Generate enhanced response with multi-modal reasoning
   */
  async generateEnhancedResponse(
    query: string,
    userId: string,
    requestedMode?: string
  ): Promise<EnhancedResponse> {
    try {
      // Build contextual understanding
      const userProfile = await this.getUserProfile(userId);
      const sessionHistory = await this.getRecentSessionHistory(userId, 10);
      const context = await this.buildReasoningContext(query, userProfile, sessionHistory, requestedMode);

      // Analyze emotional state for adaptive response
      const conversationHistory = sessionHistory.map(h => h.query + ' ' + h.response);
      const emotionalState = await emotionalIntelligence.analyzeEmotionalState(
        query, 
        conversationHistory, 
        userProfile
      );

      // Adapt communication style based on emotional state
      const adaptedStyle = await emotionalIntelligence.adaptCommunicationStyle(
        emotionalState,
        userProfile
      );

      // Generate proactive recommendations
      const recentTopics = sessionHistory.map(h => h.competencyAreas).flat();
      const proactiveRecommendations = await emotionalIntelligence.generateProactiveRecommendations(
        emotionalState,
        userProfile,
        recentTopics
      );

      // Generate response with emotional intelligence integration
      const response = await this.generateContextualResponse(query, context, adaptedStyle);
      
      // Generate additional insights
      const resources = await this.generateResourceRecommendations(query, context);
      const followUps = await this.generateFollowUpSuggestions(query, context);
      
      // Store conversation memory with emotional context
      await this.storeConversationMemory(userId, query, response, context);

      return {
        response: response.mainResponse,
        reasoningSteps: response.reasoningSteps,
        alternativePerspectives: response.alternatives,
        resourceRecommendations: [...resources, ...this.convertProactiveToResources(proactiveRecommendations)],
        followUpSuggestions: followUps,
        confidenceLevel: response.confidence,
        nextSessionTopics: response.nextTopics,
        supervisionPrep: response.supervisionItems,
        emotionalInsights: {
          detectedState: emotionalState,
          adaptedStyle: adaptedStyle,
          proactiveRecommendations: proactiveRecommendations
        }
      };
    } catch (error) {
      console.error('Enhanced Dinger response generation failed:', error);
      throw new Error('Failed to generate enhanced response');
    }
  }

  /**
   * Build comprehensive reasoning context
   */
  private async buildReasoningContext(
    query: string, 
    userProfile: CounselorProfile, 
    sessionHistory: ConversationMemory[],
    requestedMode?: string
  ): Promise<ReasoningContext> {
    // Determine optimal mode based on query and profile
    const mode = requestedMode || await this.determineOptimalMode(query, userProfile, sessionHistory);
    
    // Assess complexity level
    const complexityLevel = this.assessComplexityLevel(query, userProfile);
    
    // Choose reasoning type
    const reasoningType = this.selectReasoningType(query, complexityLevel);

    return {
      userProfile,
      sessionHistory,
      currentMode: mode as any,
      complexityLevel,
      reasoningType
    };
  }

  /**
   * Convert proactive recommendations to resource format
   */
  private convertProactiveToResources(recommendations: any[]): ResourceSuggestion[] {
    return recommendations.map(rec => ({
      type: rec.type === 'self-care' ? 'technique' : rec.type === 'skill-building' ? 'course' : 'article',
      title: rec.title,
      description: rec.description,
      relevanceScore: rec.priority === 'immediate' ? 95 : rec.priority === 'soon' ? 80 : 65,
      priority: rec.priority,
      competencyArea: rec.type
    }));
  }

  /**
   * Generate contextual response using adaptive prompting
   */
  private async generateContextualResponse(query: string, context: ReasoningContext, adaptedStyle?: any): Promise<{
    mainResponse: string;
    reasoningSteps?: string[];
    alternatives?: string[];
    confidence: number;
    nextTopics?: string[];
    supervisionItems?: string[];
  }> {
    if (!this.genAI) {
      throw new Error('Google AI not available for enhanced responses');
    }

    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = this.buildAdaptivePrompt(query, context);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Parse structured response
    return this.parseStructuredResponse(responseText, context);
  }

  /**
   * Build adaptive prompt based on context with comprehensive supervision framework
   */
  private buildAdaptivePrompt(query: string, context: ReasoningContext): string {
    const { userProfile, currentMode, complexityLevel, reasoningType, sessionHistory } = context;
    
    const modeInstructions = this.getModeInstructions(currentMode);
    const complexityGuidance = this.getComplexityGuidance(complexityLevel);
    const reasoningInstructions = this.getReasoningInstructions(reasoningType);
    return `You are Dr. AI Supervisor, a PhD-level licensed counselor with 20+ years of clinical practice, supervision, and research experience. You provide supplemental support to human supervisors working with LACs, LPCs, and other mental health professionals.

## CORE IDENTITY & SUPERVISION APPROACH
You combine expert clinical knowledge, teaching excellence, and cutting-edge research capabilities. Your responses follow structured supervision protocols while remaining conversational and supportive.

## CURRENT SUPERVISION CONTEXT:
- Supervisee Experience: ${userProfile.experienceLevel} (${userProfile.monthsOfExperience} months)
- Current Mode: ${currentMode}
- Complexity Level: ${complexityLevel}
- Reasoning Type: ${reasoningType}
- Primary Modalities: ${userProfile.primaryModalities.join(', ')}
- Recent Focus Areas: ${userProfile.recentFocusAreas.join(', ')}
- Learning Style: ${userProfile.learningStyle}
- Communication Preference: ${userProfile.communicationPreference}
- Confidence Level: ${userProfile.confidenceLevel}%
- Strength Areas: ${userProfile.strengthAreas.join(', ')}
- Challenge Areas: ${userProfile.challengeAreas.join(', ')}

## SUPERVISION FRAMEWORK FOR ${currentMode.toUpperCase()} MODE:
${this.getSupervisoryGuidance(currentMode, userProfile.experienceLevel)}

${modeInstructions}

${complexityGuidance}

${reasoningInstructions}

## RECENT SUPERVISION HISTORY:
${sessionHistory.length > 0 ? 
  sessionHistory.slice(0, 3).map(conv => 
    `- ${conv.emotionalTone} discussion about ${conv.competencyAreas.join(', ')}`
  ).join('\n') : 
  'No recent supervision history available'
}

## SUPERVISION RESPONSE PROTOCOL:
For case consultations, structure your response with:
1. **Case Summary**: Brief restatement of key information
2. **Clinical Impressions**: Diagnostic considerations and case conceptualization  
3. **Risk Assessment**: Safety evaluation with specific recommendations
4. **Treatment Recommendations**: Evidence-based interventions with implementation guidance
5. **Supervision Focus**: Areas for supervisee development
6. **Research Support**: Relevant studies and evidence base
7. **Follow-up**: Next steps and monitoring recommendations

For teaching requests, provide:
1. **Learning Objectives**: Clear, measurable goals
2. **Content Delivery**: Structured presentation of information
3. **Examples**: Case illustrations and practical applications
4. **Practice Opportunities**: Exercises and skill-building activities
5. **Assessment**: Methods to evaluate understanding
6. **Resources**: Additional reading and learning materials

CURRENT QUERY ANALYSIS:
${context.sessionHistory.slice(0, 3).map(session => 
  `- Query: "${session.query}" | Tone: ${session.emotionalTone} | Areas: ${session.competencyAreas.join(', ')}`
).join('\n')}

USER QUERY: "${query}"

Provide your response in this JSON format:
{
  "mainResponse": "Your primary response here",
  "reasoningSteps": ["Step 1 explanation", "Step 2 explanation", ...],
  "alternatives": ["Alternative perspective 1", "Alternative perspective 2"],
  "confidence": 85,
  "nextTopics": ["Suggested follow-up topic 1", "Suggested follow-up topic 2"],
  "supervisionItems": ["Item for next supervision", "Another supervision topic"]
}

Ensure your response is:
1. Appropriately complex for their experience level
2. Uses their preferred communication style
3. Connects to their current focus areas
4. Provides actionable guidance
5. Includes evidence-based references when relevant`;
  }

  /**
   * Mode-specific instruction sets
   */
  private getModeInstructions(mode: string): string {
    const instructions = {
      supervisor: `SUPERVISOR MODE: Act as a supportive but evaluative supervisor. Focus on:
- Professional development and growth areas
- Ethical considerations and best practices
- Structured feedback and skill building
- Documentation and accountability
- Competency development tracking`,

      peer: `PEER CONSULTANT MODE: Act as a collaborative colleague. Focus on:
- Shared problem-solving and brainstorming
- Mutual support and validation
- Creative intervention ideas
- Case conceptualization discussions
- Professional camaraderie`,

      clinician: `MASTER CLINICIAN MODE: Act as an experienced therapeutic expert. Focus on:
- Advanced intervention techniques
- Complex case conceptualization
- Evidence-based practice integration
- Nuanced clinical insights
- Specialized modality guidance`,

      researcher: `RESEARCHER MODE: Act as an academic research expert. Focus on:
- Evidence-based practice recommendations
- Current research findings and applications
- Critical analysis of interventions
- Research methodology insights
- Literature-backed suggestions`
    };

    return instructions[mode] || instructions.supervisor;
  }

  /**
   * Complexity-based guidance
   */
  private getComplexityGuidance(level: string): string {
    const guidance = {
      novice: `NOVICE LEVEL GUIDANCE:
- Provide clear, step-by-step instructions
- Focus on foundational concepts and safety
- Use concrete examples and basic terminology
- Emphasize structure and protocols
- Celebrate small wins and progress`,

      developing: `DEVELOPING LEVEL GUIDANCE:
- Introduce integration of multiple concepts
- Discuss ethical nuances and considerations
- Encourage critical thinking and analysis
- Provide moderate complexity techniques
- Support independent problem-solving`,

      proficient: `PROFICIENT LEVEL GUIDANCE:
- Engage with advanced therapeutic concepts
- Discuss cultural competency and adaptation
- Explore complex case dynamics
- Encourage innovation and creativity
- Focus on refinement and mastery`,

      expert: `EXPERT LEVEL GUIDANCE:
- Discuss supervision and teaching skills
- Explore cutting-edge research and practices
- Engage with systemic and organizational issues
- Focus on leadership and mentorship
- Address advanced ethical dilemmas`
    };

    return guidance[level] || guidance.developing;
  }

  /**
   * Reasoning type instructions
   */
  private getReasoningInstructions(type: string): string {
    const instructions = {
      'chain-of-thought': `CHAIN-OF-THOUGHT REASONING:
Show your thinking process step-by-step. Break down complex problems into logical components and explain each step of your reasoning. This helps build understanding and confidence.`,

      'tree-of-thought': `TREE-OF-THOUGHT REASONING:
Consider multiple approaches or perspectives simultaneously. Present different paths of thinking and evaluate their merits. This encourages flexible thinking and comprehensive analysis.`,

      'direct': `DIRECT RESPONSE:
Provide clear, concise guidance without extensive reasoning exposition. Focus on actionable advice and practical solutions.`
    };

    return instructions[type] || instructions['chain-of-thought'];
  }

  /**
   * Determine optimal mode based on query analysis
   */
  private async determineOptimalMode(
    query: string, 
    userProfile: CounselorProfile, 
    sessionHistory: ConversationMemory[]
  ): Promise<string> {
    const queryLower = query.toLowerCase();
    
    // Research-oriented queries
    if (queryLower.includes('research') || queryLower.includes('evidence') || queryLower.includes('study')) {
      return 'researcher';
    }
    
    // Supervision-related queries
    if (queryLower.includes('supervision') || queryLower.includes('supervisor') || userProfile.experienceLevel === 'novice') {
      return 'supervisor';
    }
    
    // Advanced clinical queries
    if (queryLower.includes('technique') || queryLower.includes('intervention') || userProfile.experienceLevel === 'expert') {
      return 'clinician';
    }
    
    // Default to peer for collaborative discussions
    return 'peer';
  }

  /**
   * Assess complexity level for response
   */
  private assessComplexityLevel(query: string, userProfile: CounselorProfile): 'novice' | 'developing' | 'proficient' | 'expert' {
    // Base on user experience but adjust for query complexity
    let baseLevel = userProfile.experienceLevel;
    
    const queryLower = query.toLowerCase();
    const complexityIndicators = ['complex', 'advanced', 'difficult', 'challenging', 'sophisticated'];
    const basicIndicators = ['basic', 'simple', 'fundamental', 'introduction', 'beginner'];
    
    if (complexityIndicators.some(indicator => queryLower.includes(indicator))) {
      // Increase complexity level
      const levels = ['novice', 'developing', 'proficient', 'expert'];
      const currentIndex = levels.indexOf(baseLevel);
      const newIndex = Math.min(currentIndex + 1, levels.length - 1);
      return levels[newIndex] as any;
    }
    
    if (basicIndicators.some(indicator => queryLower.includes(indicator))) {
      // Decrease complexity level
      const levels = ['novice', 'developing', 'proficient', 'expert'];
      const currentIndex = levels.indexOf(baseLevel);
      const newIndex = Math.max(currentIndex - 1, 0);
      return levels[newIndex] as any;
    }
    
    return baseLevel;
  }

  /**
   * Select appropriate reasoning type
   */
  private selectReasoningType(query: string, complexityLevel: string): 'chain-of-thought' | 'tree-of-thought' | 'direct' {
    const queryLower = query.toLowerCase();
    
    // Complex ethical or clinical dilemmas benefit from tree-of-thought
    if (queryLower.includes('ethical') || queryLower.includes('dilemma') || queryLower.includes('options')) {
      return 'tree-of-thought';
    }
    
    // Learning and understanding queries benefit from chain-of-thought
    if (queryLower.includes('how') || queryLower.includes('why') || queryLower.includes('explain')) {
      return 'chain-of-thought';
    }
    
    // Quick practical questions can be direct
    if (queryLower.includes('quick') || queryLower.includes('brief') || complexityLevel === 'expert') {
      return 'direct';
    }
    
    return 'chain-of-thought'; // Default
  }

  /**
   * Parse structured response from AI
   */
  private parseStructuredResponse(responseText: string, context: ReasoningContext): {
    mainResponse: string;
    reasoningSteps?: string[];
    alternatives?: string[];
    confidence: number;
    nextTopics?: string[];
    supervisionItems?: string[];
  } {
    try {
      // Try to parse JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          mainResponse: parsed.mainResponse || responseText,
          reasoningSteps: parsed.reasoningSteps || [],
          alternatives: parsed.alternatives || [],
          confidence: parsed.confidence || 75,
          nextTopics: parsed.nextTopics || [],
          supervisionItems: parsed.supervisionItems || []
        };
      }
    } catch (error) {
      console.log('Failed to parse structured response, using fallback');
    }
    
    // Fallback to simple response
    return {
      mainResponse: responseText,
      confidence: 70
    };
  }

  /**
   * Generate resource recommendations
   */
  private async generateResourceRecommendations(
    query: string, 
    context: ReasoningContext
  ): Promise<ResourceSuggestion[]> {
    // Implementation would analyze query and context to suggest relevant resources
    // For now, return basic structure
    return [
      {
        type: 'article',
        title: 'Evidence-Based Practice Resource',
        description: 'Relevant to your current query',
        relevanceScore: 85,
        priority: 'development',
        competencyArea: 'clinical-skills'
      }
    ];
  }

  /**
   * Generate follow-up suggestions
   */
  private async generateFollowUpSuggestions(
    query: string, 
    context: ReasoningContext
  ): Promise<string[]> {
    const { userProfile, currentMode } = context;
    
    // Generate contextual follow-ups based on mode and experience
    const suggestions = [
      "How might you apply this in your next client session?",
      "What supervision questions does this raise for you?",
      "Are there any ethical considerations to explore further?"
    ];
    
    return suggestions.slice(0, 3);
  }

  /**
   * Store conversation memory for future context
   */
  private async storeConversationMemory(
    userId: string,
    query: string,
    response: any,
    context: ReasoningContext
  ): Promise<void> {
    // Implementation would store in database
    // This creates a memory trace for future conversations
    console.log('Storing conversation memory for user:', userId);
  }

  /**
   * Get comprehensive user profile with session data integration
   */
  private async getUserProfile(userId: string): Promise<CounselorProfile> {
    try {
      // Import storage here to avoid circular dependency
      const { storage } = await import('./storage');
      
      // Get user's log entries for analysis
      const logEntries = await storage.getLogEntries();
      
      // Get Dinger profile if exists
      let existingProfile = null;
      try {
        const { db } = await import('./db');
        const { dingerUserProfileTable } = await import('../shared/schema');
        const { eq } = await import('drizzle-orm');
        
        const profiles = await db.select()
          .from(dingerUserProfileTable)
          .where(eq(dingerUserProfileTable.userId, userId))
          .limit(1);
          
        if (profiles.length > 0) {
          const profile = profiles[0];
          existingProfile = {
            ...profile,
            primaryModalities: JSON.parse(profile.primaryModalities || '[]'),
            clientPopulations: JSON.parse(profile.clientPopulations || '[]'),
            strengthAreas: JSON.parse(profile.strengthAreas || '[]'),
            challengeAreas: JSON.parse(profile.challengeAreas || '[]'),
            recentFocusAreas: JSON.parse(profile.recentFocusAreas || '[]'),
            adaptiveSettings: JSON.parse(profile.adaptiveSettings || '{}')
          };
        }
      } catch (dbError) {
        console.log('Note: Dinger profile not found, analyzing from session data');
      }

      // Analyze session data for dynamic profile creation
      const sessionAnalysis = this.analyzeSessionData(logEntries);
      
      return {
        userId,
        experienceLevel: existingProfile?.experienceLevel || sessionAnalysis.inferredExperienceLevel,
        monthsOfExperience: existingProfile?.monthsOfExperience || sessionAnalysis.estimatedMonthsExperience,
        primaryModalities: existingProfile?.primaryModalities || sessionAnalysis.detectedModalities,
        clientPopulations: existingProfile?.clientPopulations || sessionAnalysis.clientDemographics,
        strengthAreas: existingProfile?.strengthAreas || sessionAnalysis.identifiedStrengths,
        challengeAreas: existingProfile?.challengeAreas || sessionAnalysis.growthAreas,
        learningStyle: existingProfile?.learningStyle || 'collaborative',
        communicationPreference: existingProfile?.communicationPreference || 'supportive',
        recentFocusAreas: sessionAnalysis.recentThemes,
        confidenceLevel: existingProfile?.confidenceLevel || sessionAnalysis.confidenceIndicators,
        lastActive: new Date()
      };
    } catch (error) {
      console.error('Error building user profile:', error);
      // Fallback to basic profile
      return {
        userId,
        experienceLevel: 'developing',
        monthsOfExperience: 12,
        primaryModalities: ['CBT', 'Person-Centered'],
        clientPopulations: ['Adults'],
        strengthAreas: ['Active Listening'],
        challengeAreas: ['Documentation'],
        learningStyle: 'collaborative',
        communicationPreference: 'supportive',
        recentFocusAreas: ['Clinical Skills'],
        confidenceLevel: 70,
        lastActive: new Date()
      };
    }
  }

  /**
   * Analyze session data to create dynamic user profile
   */
  private analyzeSessionData(logEntries: any[]): any {
    if (!logEntries || logEntries.length === 0) {
      return {
        inferredExperienceLevel: 'developing',
        estimatedMonthsExperience: 6,
        detectedModalities: ['Person-Centered'],
        clientDemographics: ['Adults'],
        identifiedStrengths: ['Rapport Building'],
        growthAreas: ['Documentation'],
        recentThemes: ['Getting Started'],
        confidenceIndicators: 65
      };
    }

    const totalHours = logEntries.reduce((sum, entry) => sum + (entry.clientContactHours || 0), 0);
    const recentEntries = logEntries.slice(0, 10);
    
    // Extract themes from notes
    const allNotes = logEntries.map(entry => entry.notes || '').join(' ').toLowerCase();
    
    // Detect modalities from session content
    const modalityKeywords = {
      'CBT': ['cognitive', 'behavioral', 'thought', 'thinking patterns', 'cbt', 'homework'],
      'Person-Centered': ['empathy', 'unconditional positive regard', 'reflection', 'feelings'],
      'Psychodynamic': ['unconscious', 'defense mechanisms', 'transference', 'childhood'],
      'Solution-Focused': ['goals', 'solutions', 'strengths', 'exceptions', 'scaling'],
      'DBT': ['mindfulness', 'distress tolerance', 'emotional regulation', 'dbt'],
      'EMDR': ['trauma', 'bilateral stimulation', 'emdr', 'processing']
    };
    
    const detectedModalities = Object.keys(modalityKeywords).filter(modality => 
      modalityKeywords[modality].some(keyword => allNotes.includes(keyword))
    );

    // Recent themes analysis
    const recentNotes = recentEntries.map(entry => entry.notes || '').join(' ').toLowerCase();
    const themeKeywords = {
      'Therapeutic Alliance': ['rapport', 'relationship', 'trust', 'connection'],
      'Assessment Skills': ['assessment', 'diagnosis', 'evaluation', 'screening'],
      'Intervention Techniques': ['intervention', 'technique', 'strategy', 'approach'],
      'Documentation': ['notes', 'documentation', 'record', 'chart'],
      'Supervision': ['supervision', 'supervisor', 'consultation', 'feedback'],
      'Risk Assessment': ['risk', 'safety', 'suicide', 'harm', 'crisis']
    };
    
    const recentThemes = Object.keys(themeKeywords).filter(theme =>
      themeKeywords[theme].some(keyword => recentNotes.includes(keyword))
    );

    return {
      inferredExperienceLevel: totalHours > 500 ? 'proficient' : totalHours > 200 ? 'developing' : 'novice',
      estimatedMonthsExperience: Math.min(60, Math.max(3, Math.floor(totalHours / 20))),
      detectedModalities: detectedModalities.length > 0 ? detectedModalities : ['Person-Centered'],
      clientDemographics: ['Adults'], // Could be enhanced with more analysis
      identifiedStrengths: ['Active Listening', 'Empathy'],
      growthAreas: recentThemes.length > 0 ? recentThemes.slice(0, 2) : ['Documentation'],
      recentThemes: recentThemes.length > 0 ? recentThemes : ['Professional Development'],
      confidenceIndicators: Math.min(95, 50 + Math.floor(totalHours / 10))
    };
  }

  /**
   * Get recent session data and conversation history
   */
  private async getRecentSessionHistory(userId: string, limit: number): Promise<ConversationMemory[]> {
    try {
      const { db } = await import('./db');
      const { dingerConversationMemoryTable } = await import('../shared/schema');
      const { eq, desc } = await import('drizzle-orm');
      
      const conversations = await db.select()
        .from(dingerConversationMemoryTable)
        .where(eq(dingerConversationMemoryTable.userId, userId))
        .orderBy(desc(dingerConversationMemoryTable.timestamp))
        .limit(limit);
        
      return conversations.map(conv => ({
        ...conv,
        competencyAreas: JSON.parse(conv.competencyAreas || '[]'),
        tags: JSON.parse(conv.tags || '[]')
      }));
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      return [];
    }
  }
}

export const advancedDinger = new AdvancedDingerService();