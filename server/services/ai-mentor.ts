import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface InsightInput {
  sessionLog?: {
    notes: string;
    clientContactHours: number;
    dateOfContact: Date;
    supervisionType?: string;
  };
  reflection?: {
    content: string;
    tags?: string[];
  };
  assessmentData?: Record<string, any>;
  feedback?: {
    supervisorComments: string;
    competencyRatings: Record<string, number>;
  };
  learningGoal?: string;
  userId: string;
}

interface AIMentorInsight {
  id: string;
  type: 'growth_observation' | 'skill_development' | 'ethical_guidance' | 'encouragement' | 'reflection_prompt';
  title: string;
  content: string;
  competencyArea?: string;
  actionableSteps: string[];
  tone: 'supportive' | 'affirming' | 'challenging' | 'celebrating';
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
}

export class AIMentorService {
  private static instance: AIMentorService;

  static getInstance(): AIMentorService {
    if (!AIMentorService.instance) {
      AIMentorService.instance = new AIMentorService();
    }
    return AIMentorService.instance;
  }

  async generateInsight(input: InsightInput): Promise<AIMentorInsight> {
    try {
      const prompt = this.buildPrompt(input);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an AI mentor for Licensed Associate Counselors (LACs) working toward their LPC licensure. Your role is to provide supportive, affirming, and growth-oriented insights that help counselors develop professionally and personally.

            Always respond in JSON format with this structure:
            {
              "type": "growth_observation|skill_development|ethical_guidance|encouragement|reflection_prompt",
              "title": "Brief, encouraging title",
              "content": "2-3 sentences of supportive insight",
              "competencyArea": "relevant competency if applicable",
              "actionableSteps": ["1-3 specific, achievable steps"],
              "tone": "supportive|affirming|challenging|celebrating",
              "priority": "high|medium|low"
            }

            Focus on:
            - Celebrating growth and progress
            - Identifying emerging strengths
            - Gentle guidance for areas needing development
            - Connecting experiences to broader professional development
            - Encouraging reflection and self-awareness`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" }
      });

      const aiResponse = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: aiResponse.type || 'encouragement',
        title: aiResponse.title || 'Keep Growing',
        content: aiResponse.content || 'Your dedication to growth is evident in your work.',
        competencyArea: aiResponse.competencyArea,
        actionableSteps: aiResponse.actionableSteps || ['Continue your excellent work'],
        tone: aiResponse.tone || 'supportive',
        priority: aiResponse.priority || 'medium',
        createdAt: new Date()
      };
    } catch (error) {
      console.error('AI Mentor Service Error:', error);
      // Fallback insight
      return {
        id: `insight_${Date.now()}_fallback`,
        type: 'encouragement',
        title: 'Your Growth Journey Continues',
        content: 'Every session you complete is a step forward in your professional development. Your commitment to growth is commendable.',
        actionableSteps: ['Reflect on what you learned today', 'Consider how this experience connects to your goals'],
        tone: 'supportive',
        priority: 'medium',
        createdAt: new Date()
      };
    }
  }

  private buildPrompt(input: InsightInput): string {
    let prompt = "Please provide an encouraging insight for this counselor:\n\n";

    if (input.sessionLog) {
      prompt += `Session Notes: ${input.sessionLog.notes}\n`;
      prompt += `Hours: ${input.sessionLog.clientContactHours}\n`;
      prompt += `Date: ${input.sessionLog.dateOfContact.toDateString()}\n\n`;
    }

    if (input.reflection) {
      prompt += `Reflection: ${input.reflection.content}\n`;
      if (input.reflection.tags) {
        prompt += `Tags: ${input.reflection.tags.join(', ')}\n`;
      }
      prompt += '\n';
    }

    if (input.feedback) {
      prompt += `Supervisor Feedback: ${input.feedback.supervisorComments}\n`;
      prompt += `Competency Ratings: ${JSON.stringify(input.feedback.competencyRatings)}\n\n`;
    }

    if (input.learningGoal) {
      prompt += `Current Learning Goal: ${input.learningGoal}\n\n`;
    }

    prompt += "Generate an insight that celebrates their progress and provides gentle guidance for continued growth.";

    return prompt;
  }

  async generateWeeklyRhythm(userId: string, weeklyData: any): Promise<{
    growthArea: string;
    reflectionNudge: string;
    encouragement: string;
  }> {
    try {
      const prompt = `Based on this week's activity for counselor ${userId}:
      
      Sessions logged: ${weeklyData.sessionCount || 0}
      Total hours: ${weeklyData.totalHours || 0}
      Reflections written: ${weeklyData.reflectionCount || 0}
      Primary themes: ${weeklyData.themes?.join(', ') || 'None'}
      
      Please provide a weekly rhythm response in JSON format:
      {
        "growthArea": "One specific area where they're showing growth",
        "reflectionNudge": "A gentle prompt to encourage deeper reflection",
        "encouragement": "An affirming message about their progress"
      }`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a supportive AI mentor helping counselors recognize their growth patterns and stay motivated in their professional development journey."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message.content || '{"growthArea":"Consistent practice","reflectionNudge":"What challenged you most this week?","encouragement":"You\'re building great habits!"}');
    } catch (error) {
      console.error('Weekly Rhythm Generation Error:', error);
      return {
        growthArea: "Consistent practice and dedication",
        reflectionNudge: "What was your biggest learning moment this week?",
        encouragement: "You're showing up consistently. Your growth is visible — keep going."
      };
    }
  }
}

export const aiMentor = AIMentorService.getInstance();