import OpenAI from 'openai';

interface ConversationAnalysis {
  consultationTopics: string[];
  learningThemes: string[];
  knowledgeAreas: string[];
  professionalQuestions: string[];
  competencyFocus: string[];
  growthIndicators: string[];
  summary: string;
  type: 'ai-conversation';
}

export class ConversationAnalysisService {
  private static openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  /**
   * Analyze AI conversation content for professional development insights
   */
  static async analyzeConversation(conversationContent: string): Promise<ConversationAnalysis> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
        messages: [
          {
            role: "system",
            content: `You are an expert in analyzing professional development conversations between mental health professionals and AI assistants. 

Analyze the conversation and identify:
1. Consultation Topics - specific professional areas discussed
2. Learning Themes - competencies or skills being explored  
3. Knowledge Areas - domains of professional knowledge engaged
4. Professional Questions - types of guidance or clarification sought
5. Competency Focus - specific counseling competencies addressed
6. Growth Indicators - signs of professional development or learning

Respond with a JSON object containing these arrays plus a brief summary.
Focus on professional development, clinical knowledge, ethical considerations, and therapeutic skills.`
          },
          {
            role: "user",
            content: `Analyze this conversation for professional development insights:\n\n${conversationContent}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
        temperature: 0.3
      });

      const analysisText = completion.choices[0].message.content;
      if (!analysisText) {
        return this.createFallbackAnalysis();
      }

      const analysis = JSON.parse(analysisText);
      
      return {
        consultationTopics: this.ensureArray(analysis.consultationTopics),
        learningThemes: this.ensureArray(analysis.learningThemes),
        knowledgeAreas: this.ensureArray(analysis.knowledgeAreas),
        professionalQuestions: this.ensureArray(analysis.professionalQuestions),
        competencyFocus: this.ensureArray(analysis.competencyFocus),
        growthIndicators: this.ensureArray(analysis.growthIndicators),
        summary: analysis.summary || 'Professional consultation recorded',
        type: 'ai-conversation'
      };

    } catch (error) {
      console.error('Error analyzing conversation:', error);
      return this.createFallbackAnalysis();
    }
  }

  /**
   * Identify conversation patterns across multiple sessions
   */
  static analyzeConversationPatterns(conversations: any[]): any {
    const patterns = {
      frequentTopics: new Map(),
      learningProgression: [],
      knowledgeGaps: new Set(),
      competencyDevelopment: new Map()
    };

    conversations.forEach(conv => {
      if (conv.analysis?.type === 'ai-conversation') {
        // Track frequent consultation topics
        conv.analysis.consultationTopics?.forEach((topic: string) => {
          patterns.frequentTopics.set(topic, (patterns.frequentTopics.get(topic) || 0) + 1);
        });

        // Track competency development
        conv.analysis.competencyFocus?.forEach((comp: string) => {
          patterns.competencyDevelopment.set(comp, (patterns.competencyDevelopment.get(comp) || 0) + 1);
        });

        // Identify knowledge gaps (repeated questions)
        conv.analysis.professionalQuestions?.forEach((question: string) => {
          if (question.toLowerCase().includes('how') || question.toLowerCase().includes('what')) {
            patterns.knowledgeGaps.add(question);
          }
        });
      }
    });

    return {
      topConsultationAreas: Array.from(patterns.frequentTopics.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([topic]) => topic),
      developingCompetencies: Array.from(patterns.competencyDevelopment.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([comp]) => comp),
      identifiedGaps: Array.from(patterns.knowledgeGaps).slice(0, 5),
      totalConsultations: conversations.filter(c => c.analysis?.type === 'ai-conversation').length
    };
  }

  /**
   * Generate professional development recommendations from conversation patterns
   */
  static generateConversationRecommendations(patterns: any): string[] {
    const recommendations = [];

    if (patterns.topConsultationAreas?.length > 0) {
      recommendations.push(
        `Your frequent consultation areas include ${patterns.topConsultationAreas.slice(0, 3).join(', ')}. Consider deepening expertise in these domains.`
      );
    }

    if (patterns.developingCompetencies?.length > 0) {
      recommendations.push(
        `You're actively developing competencies in ${patterns.developingCompetencies.join(', ')}. Continue this focused growth path.`
      );
    }

    if (patterns.identifiedGaps?.length > 0) {
      recommendations.push(
        `Consider formal training or supervision in areas where you frequently seek guidance.`
      );
    }

    if (patterns.totalConsultations > 5) {
      recommendations.push(
        `You're actively engaging in professional consultation, showing strong commitment to evidence-based practice.`
      );
    }

    return recommendations;
  }

  private static ensureArray(value: any): string[] {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return [];
  }

  private static createFallbackAnalysis(): ConversationAnalysis {
    return {
      consultationTopics: ['Professional Consultation'],
      learningThemes: ['Continuous Learning'],
      knowledgeAreas: ['Clinical Practice'],
      professionalQuestions: ['Professional Development'],
      competencyFocus: ['Evidence-Based Practice'],
      growthIndicators: ['Active Learning'],
      summary: 'Professional consultation session recorded for development tracking',
      type: 'ai-conversation'
    };
  }
}