import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  UserTherapyProfile, 
  InsertUserTherapyProfile,
  SupervisionIntelligence,
  InsertSupervisionIntelligence,
  CompetencyAnalysis,
  InsertCompetencyAnalysis,
  PatternAnalysis,
  InsertPatternAnalysis
} from '@shared/schema';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let googleAI: GoogleGenerativeAI | null = null;
if (process.env.GOOGLE_AI_API_KEY || process.env.VITE_GOOGLE_AI_API_KEY) {
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.VITE_GOOGLE_AI_API_KEY;
  googleAI = new GoogleGenerativeAI(apiKey!);
}

interface SessionData {
  id: string;
  notes: string;
  dateOfContact: Date;
  clientContactHours: number;
  supervisionNotes?: string;
}

interface ResourceSuggestion {
  type: 'article' | 'technique' | 'course' | 'consultation';
  title: string;
  description: string;
  relevanceScore: number;
  reason: string;
  priority: 'immediate' | 'development' | 'reference';
}

export class EnhancedAIService {
  
  /**
   * Analyze session content and update user's therapy profile progressively
   */
  async updateUserProfile(userId: string, sessionData: SessionData, currentProfile?: UserTherapyProfile): Promise<Partial<UserTherapyProfile>> {
    const analysisPrompt = `
Analyze this therapy session and extract professional insights for ongoing profile building:

SESSION CONTENT: ${sessionData.notes}
CURRENT PROFILE: ${currentProfile ? JSON.stringify(currentProfile, null, 2) : 'New profile'}

Extract and identify:
1. THERAPEUTIC MODALITIES mentioned or implied (CBT, DBT, EMDR, humanistic, psychodynamic, etc.)
2. CLIENT POPULATIONS worked with (anxiety, depression, trauma, substance abuse, couples, adolescents, etc.)
3. INTERVENTIONS/TECHNIQUES used (specific therapeutic techniques, assessments, homework assignments)
4. CHALLENGES faced by the counselor (difficulty with specific clients, ethical dilemmas, skill gaps)
5. STRENGTHS demonstrated (effective interventions, good rapport, clinical insights)
6. LEARNING PREFERENCES evident (prefers case examples, theoretical frameworks, experiential learning)

Format response as JSON:
{
  "primaryModalities": ["array of modalities"],
  "clientPopulations": ["array of populations"],
  "commonInterventions": ["array of techniques"],
  "challengePatterns": ["array of challenges"],
  "strengthPatterns": ["array of strengths"],
  "learningPreferences": ["array of preferences"],
  "confidence": 0.8
}

Only include items with high confidence. Be specific and professional.
`;

    try {
      let response;
      
      if (openai) {
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: analysisPrompt }],
            response_format: { type: "json_object" },
            temperature: 0.3
          });
          response = completion.choices[0].message.content;
        } catch (openaiError) {
          console.log('OpenAI failed, trying Google AI:', openaiError);
          if (!googleAI) throw new Error('No AI service available');
          
          const model = googleAI.getGenerativeModel({ model: "gemini-pro" });
          const result = await model.generateContent(analysisPrompt + "\n\nProvide JSON response only.");
          response = result.response.text();
        }
      } else if (googleAI) {
        const model = googleAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(analysisPrompt + "\n\nProvide JSON response only.");
        response = result.response.text();
      } else {
        throw new Error('No AI service available');
      }

      const analysis = JSON.parse(response!);
      
      // Merge with existing profile data
      const updatedProfile: Partial<UserTherapyProfile> = {
        sessionCount: (currentProfile?.sessionCount || 0) + 1,
        lastAnalyzed: new Date(),
        updatedAt: new Date()
      };

      // Smart merging - only add new items, avoid duplicates
      if (analysis.primaryModalities?.length) {
        const existing = currentProfile?.primaryModalities || [];
        const combined = [...existing, ...analysis.primaryModalities];
        updatedProfile.primaryModalities = combined.filter((item, index) => combined.indexOf(item) === index);
      }

      if (analysis.clientPopulations?.length) {
        const existing = currentProfile?.clientPopulations || [];
        const combined = [...existing, ...analysis.clientPopulations];
        updatedProfile.clientPopulations = combined.filter((item, index) => combined.indexOf(item) === index);
      }

      if (analysis.commonInterventions?.length) {
        const existing = currentProfile?.commonInterventions || [];
        const combined = [...existing, ...analysis.commonInterventions];
        updatedProfile.commonInterventions = combined.filter((item, index) => combined.indexOf(item) === index);
      }

      if (analysis.challengePatterns?.length) {
        const existing = currentProfile?.challengePatterns || [];
        const combined = [...existing, ...analysis.challengePatterns];
        updatedProfile.challengePatterns = combined.filter((item, index) => combined.indexOf(item) === index);
      }

      if (analysis.strengthPatterns?.length) {
        const existing = currentProfile?.strengthPatterns || [];
        const combined = [...existing, ...analysis.strengthPatterns];
        updatedProfile.strengthPatterns = combined.filter((item, index) => combined.indexOf(item) === index);
      }

      if (analysis.learningPreferences?.length) {
        const existing = currentProfile?.learningPreferences || [];
        const combined = [...existing, ...analysis.learningPreferences];
        updatedProfile.learningPreferences = combined.filter((item, index) => combined.indexOf(item) === index);
      }

      return updatedProfile;

    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Generate weekly supervision preparation insights
   */
  async generateSupervisionPrep(userId: string, recentSessions: SessionData[], userProfile?: UserTherapyProfile): Promise<SupervisionIntelligence> {
    const supervisionPrompt = `
Generate supervision preparation insights for a counselor based on their recent sessions and profile:

COUNSELOR PROFILE:
${userProfile ? JSON.stringify(userProfile, null, 2) : 'Profile being developed'}

RECENT SESSIONS (last 5-10):
${recentSessions.map(session => `
Date: ${session.dateOfContact.toDateString()}
Hours: ${session.clientContactHours}
Notes: ${session.notes}
---
`).join('')}

Generate a comprehensive supervision preparation analysis:

1. PATTERN ALERTS: What concerning or notable patterns emerge across sessions?
2. SKILL GROWTH OPPORTUNITIES: What areas show potential for development?
3. ETHICAL CONSIDERATIONS: Any boundary, confidentiality, or ethical issues noted?
4. INTERVENTION EFFECTIVENESS: What's working well or needs adjustment?
5. CHALLENGING CASES SUMMARY: Cases that need supervision focus

Then create a SUGGESTED SUPERVISION AGENDA:
- Discussion Topics (top 3-5 priorities)
- Specific Cases to Review (with reasons)
- Skill Development Goals (concrete next steps)
- Resource Recommendations (specific tools, training, reading)

Format as JSON:
{
  "weeklyAnalysis": {
    "patternAlerts": ["array of alerts"],
    "skillGrowthOpportunities": ["array of opportunities"],
    "ethicalConsiderations": ["array of considerations"],
    "interventionEffectiveness": ["array of effectiveness notes"],
    "challengingCasesSummary": ["array of case summaries"]
  },
  "suggestedAgenda": {
    "discussionTopics": ["array of topics"],
    "specificCasesToReview": ["array of cases"],
    "skillDevelopmentGoals": ["array of goals"],
    "resourceRecommendations": ["array of resources"]
  }
}

Be specific, professional, and actionable. Focus on growth and learning.
`;

    try {
      let response;
      
      if (openai) {
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: supervisionPrompt }],
            response_format: { type: "json_object" },
            temperature: 0.3
          });
          response = completion.choices[0].message.content;
        } catch (openaiError) {
          console.log('OpenAI failed, trying Google AI:', openaiError);
          if (!googleAI) throw new Error('No AI service available');
          
          const model = googleAI.getGenerativeModel({ model: "gemini-pro" });
          const result = await model.generateContent(supervisionPrompt + "\n\nProvide JSON response only.");
          response = result.response.text();
        }
      } else if (googleAI) {
        const model = googleAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(supervisionPrompt + "\n\nProvide JSON response only.");
        response = result.response.text();
      } else {
        throw new Error('No AI service available');
      }

      const analysis = JSON.parse(response!);
      
      return {
        id: '', // Will be set by database
        userId,
        weekStartDate: this.getStartOfWeek(new Date()),
        weeklyAnalysis: analysis.weeklyAnalysis,
        suggestedAgenda: analysis.suggestedAgenda,
        sessionDataAnalyzed: recentSessions.length,
        generatedAt: new Date(),
        createdAt: new Date()
      };

    } catch (error) {
      console.error('Error generating supervision prep:', error);
      throw error;
    }
  }

  /**
   * Analyze competencies for a specific session
   */
  async analyzeCompetencies(sessionData: SessionData, userProfile?: UserTherapyProfile): Promise<CompetencyAnalysis> {
    const competencyPrompt = `
Analyze this counseling session for evidence of core therapeutic competencies:

SESSION: ${sessionData.notes}
COUNSELOR EXPERIENCE: ${userProfile?.sessionCount ? `${userProfile.sessionCount} sessions logged` : 'Experience level unknown'}
KNOWN STRENGTHS: ${userProfile?.strengthPatterns?.join(', ') || 'None identified yet'}

Rate evidence (1-5 scale) and provide specific examples for each competency:

1. THERAPEUTIC RELATIONSHIP BUILDING
   - Rapport establishment, empathy, genuineness, positive regard
   
2. ASSESSMENT SKILLS
   - Information gathering, risk assessment, diagnostic considerations
   
3. INTERVENTION PLANNING
   - Goal setting, treatment planning, intervention selection
   
4. INTERVENTION IMPLEMENTATION
   - Technique execution, timing, adaptation to client needs
   
5. ETHICAL DECISION MAKING
   - Boundary awareness, confidentiality, informed consent, cultural sensitivity

For each competency, provide:
- Score (1-5, where 1=no evidence, 5=excellent evidence)
- Evidence (specific examples from session)
- Growth Areas (specific suggestions for improvement)

Also identify:
- Supervision Discussion Points (key topics for supervision)
- Next Development Steps (concrete actions for growth)

Format as JSON:
{
  "competencyScores": {
    "therapeuticRelationship": {
      "score": 4,
      "evidence": ["specific examples"],
      "growthAreas": ["specific suggestions"]
    },
    "assessmentSkills": {
      "score": 3,
      "evidence": ["examples"],
      "growthAreas": ["suggestions"]
    },
    "interventionPlanning": {
      "score": 3,
      "evidence": ["examples"],
      "growthAreas": ["suggestions"]
    },
    "ethicalDecisionMaking": {
      "score": 4,
      "evidence": ["examples"],
      "growthAreas": ["suggestions"]
    },
    "culturalCompetence": {
      "score": 3,
      "evidence": ["examples"],
      "growthAreas": ["suggestions"]
    }
  },
  "supervisionDiscussionPoints": ["array of topics"],
  "nextDevelopmentSteps": ["array of concrete actions"]
}

Be specific and constructive in feedback.
`;

    try {
      let response;
      
      if (openai) {
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: competencyPrompt }],
            response_format: { type: "json_object" },
            temperature: 0.3
          });
          response = completion.choices[0].message.content;
        } catch (openaiError) {
          console.log('OpenAI failed, trying Google AI:', openaiError);
          if (!googleAI) throw new Error('No AI service available');
          
          const model = googleAI.getGenerativeModel({ model: "gemini-pro" });
          const result = await model.generateContent(competencyPrompt + "\n\nProvide JSON response only.");
          response = result.response.text();
        }
      } else if (googleAI) {
        const model = googleAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(competencyPrompt + "\n\nProvide JSON response only.");
        response = result.response.text();
      } else {
        throw new Error('No AI service available');
      }

      const analysis = JSON.parse(response!);
      
      return {
        id: '', // Will be set by database
        userId: sessionData.id, // This should be userId, will fix in storage layer
        sessionId: sessionData.id,
        competencyScores: analysis.competencyScores,
        supervisionDiscussionPoints: analysis.supervisionDiscussionPoints,
        nextDevelopmentSteps: analysis.nextDevelopmentSteps,
        analyzedAt: new Date(),
        createdAt: new Date()
      };

    } catch (error) {
      console.error('Error analyzing competencies:', error);
      throw error;
    }
  }

  /**
   * Detect patterns across multiple sessions
   */
  async detectPatterns(userId: string, sessions: SessionData[], timeframe: number = 30): Promise<PatternAnalysis[]> {
    const patternPrompt = `
Analyze these counseling sessions to identify significant patterns over the last ${timeframe} days:

SESSIONS:
${sessions.map(session => `
Date: ${session.dateOfContact.toDateString()}
Hours: ${session.clientContactHours}
Notes: ${session.notes}
---
`).join('')}

Identify patterns in these categories:
1. CONCERNS: Recurring challenges, ethical issues, skill gaps, burnout signs
2. GROWTH: Improving skills, increased confidence, successful interventions
3. SUCCESS: Consistent strengths, effective techniques, client progress
4. SUPERVISION_NEEDED: Issues requiring immediate supervision attention

For each pattern found, provide:
- Type (concern/growth/success/supervision_needed)
- Description of the pattern
- Frequency (how often it appears)
- Timeline (when it's been occurring)
- Specific recommendation
- Urgency level (low/medium/high)

Format as JSON array:
[
  {
    "alertType": "concern",
    "pattern": "Counselor mentions feeling 'stuck' with multiple clients",
    "frequency": 4,
    "timeline": "Last 2 weeks",
    "recommendation": "Discuss case conceptualization approaches in supervision",
    "urgency": "medium"
  }
]

Only identify significant patterns with clear evidence. Be specific and actionable.
`;

    try {
      let response;
      
      if (openai) {
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: patternPrompt }],
            response_format: { type: "json_object" },
            temperature: 0.3
          });
          response = completion.choices[0].message.content;
        } catch (openaiError) {
          console.log('OpenAI failed, trying Google AI:', openaiError);
          if (!googleAI) throw new Error('No AI service available');
          
          const model = googleAI.getGenerativeModel({ model: "gemini-pro" });
          const result = await model.generateContent(patternPrompt + "\n\nProvide JSON response only.");
          response = result.response.text();
        }
      } else if (googleAI) {
        const model = googleAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(patternPrompt + "\n\nProvide JSON response only.");
        response = result.response.text();
      } else {
        throw new Error('No AI service available');
      }

      // Parse response - it might be wrapped in { "patterns": [...] }
      let patterns;
      const parsed = JSON.parse(response!);
      if (Array.isArray(parsed)) {
        patterns = parsed;
      } else if (parsed.patterns && Array.isArray(parsed.patterns)) {
        patterns = parsed.patterns;
      } else {
        patterns = [];
      }
      
      return patterns.map((pattern: any) => ({
        id: '', // Will be set by database
        userId,
        alertType: pattern.alertType as 'concern' | 'growth' | 'success' | 'supervision_needed',
        pattern: pattern.pattern,
        frequency: pattern.frequency,
        timeline: pattern.timeline,
        recommendation: pattern.recommendation,
        urgency: pattern.urgency as 'low' | 'medium' | 'high',
        isRead: false,
        isResolved: false,
        createdAt: new Date()
      }));

    } catch (error) {
      console.error('Error detecting patterns:', error);
      throw error;
    }
  }

  /**
   * Suggest contextual resources based on challenges and profile
   */
  async suggestResources(challenge: string, userProfile?: UserTherapyProfile): Promise<ResourceSuggestion[]> {
    const resourcePrompt = `
Based on this specific challenge and counselor profile, suggest targeted professional resources:

CHALLENGE: ${challenge}
COUNSELOR PROFILE:
- Modalities: ${userProfile?.primaryModalities?.join(', ') || 'Unknown'}
- Populations: ${userProfile?.clientPopulations?.join(', ') || 'Unknown'}
- Experience: ${userProfile?.sessionCount || 0} sessions logged
- Learning Style: ${userProfile?.learningPreferences?.join(', ') || 'Unknown'}

Suggest 3-5 highly relevant resources in these categories:
1. ARTICLES: Specific research articles, clinical guides, best practice papers
2. TECHNIQUES: Concrete therapeutic techniques or interventions
3. COURSES: Professional development courses, workshops, certifications
4. CONSULTATION: Peer consultation topics or specialist referral suggestions

For each suggestion, provide:
- Type (article/technique/course/consultation)
- Title (specific and actionable)
- Description (what it covers, how it helps)
- Relevance Score (1-10)
- Reason (why it's specifically helpful for this challenge)
- Priority (immediate/development/reference)

Format as JSON:
{
  "suggestions": [
    {
      "type": "article",
      "title": "Specific Article Title",
      "description": "What it covers",
      "relevanceScore": 9,
      "reason": "Why it's helpful",
      "priority": "immediate"
    }
  ]
}

Focus on evidence-based, practical resources. Be specific and professional.
`;

    try {
      let response;
      
      if (openai) {
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: resourcePrompt }],
            response_format: { type: "json_object" },
            temperature: 0.3
          });
          response = completion.choices[0].message.content;
        } catch (openaiError) {
          console.log('OpenAI failed, trying Google AI:', openaiError);
          if (!googleAI) throw new Error('No AI service available');
          
          const model = googleAI.getGenerativeModel({ model: "gemini-pro" });
          const result = await model.generateContent(resourcePrompt + "\n\nProvide JSON response only.");
          response = result.response.text();
        }
      } else if (googleAI) {
        const model = googleAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(resourcePrompt + "\n\nProvide JSON response only.");
        response = result.response.text();
      } else {
        throw new Error('No AI service available');
      }

      const analysis = JSON.parse(response!);
      return analysis.suggestions || [];

    } catch (error) {
      console.error('Error suggesting resources:', error);
      throw error;
    }
  }

  private getStartOfWeek(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day;
    return new Date(date.setDate(diff));
  }
}

export const enhancedAI = new EnhancedAIService();