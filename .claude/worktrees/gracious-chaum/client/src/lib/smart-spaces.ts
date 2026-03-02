import { genAI } from "./ai";

export interface SmartSpace {
  id: string;
  name: string;
  description: string;
  category: 'therapeutic-focus' | 'client-population' | 'competency-development' | 'supervision-prep' | 'growth-milestone';
  autoTags: string[];
  sessionIds: string[];
  insights: string[];
  color: string;
  icon: string;
  createdAt: Date;
  confidence: number;
}

export interface SmartSpaceGenerationResult {
  spaces: SmartSpace[];
  totalSessionsCategorized: number;
  uncategorizedSessions: string[];
  recommendations: string[];
}

export const generateSmartSpaces = async (
  sessions: any[], 
  userProfile?: any
): Promise<SmartSpaceGenerationResult> => {
  if (sessions.length < 5) {
    return {
      spaces: [],
      totalSessionsCategorized: 0,
      uncategorizedSessions: sessions.map(s => s.id),
      recommendations: ["Complete 5+ sessions to unlock Smart Spaces generation"]
    };
  }

  const prompt = `Analyze these counseling sessions and create intelligent Smart Spaces groupings:

${sessions.map((session, index) => `
Session ${index + 1} (ID: ${session.id}):
Date: ${new Date(session.dateOfContact).toLocaleDateString()}
Notes: ${session.notes.substring(0, 400)}...
${session.supervisionNotes ? `Supervision: ${session.supervisionNotes.substring(0, 200)}...` : ''}
`).join('\n')}

Create 3-6 Smart Spaces that intelligently group these sessions by:
1. Therapeutic Focus Areas (anxiety, depression, trauma, relationships, etc.)
2. Client Population Types (adolescents, adults, couples, families)
3. Competency Development (assessment skills, intervention techniques, ethical practice)
4. Supervision Preparation (complex cases, ethical dilemmas, skill building)
5. Growth Milestones (breakthroughs, challenges overcome, new techniques mastered)

Generate JSON response:
{
  "spaces": [
    {
      "name": "Descriptive space name",
      "description": "What this space represents",
      "category": "therapeutic-focus|client-population|competency-development|supervision-prep|growth-milestone",
      "autoTags": ["relevant", "keywords", "for", "this", "space"],
      "sessionIds": ["session_ids_that_belong_here"],
      "insights": ["Key insights about this grouping"],
      "color": "bg-blue-50|bg-green-50|bg-purple-50|bg-amber-50|bg-red-50",
      "icon": "Brain|Heart|Target|Users|TrendingUp",
      "confidence": 0.85
    }
  ],
  "recommendations": ["Suggestions for using these spaces"]
}`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      const smartSpaces: SmartSpace[] = parsed.spaces.map((space: any) => ({
        id: `space_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: space.name,
        description: space.description,
        category: space.category,
        autoTags: space.autoTags || [],
        sessionIds: space.sessionIds || [],
        insights: space.insights || [],
        color: space.color || 'bg-gray-50',
        icon: space.icon || 'Brain',
        createdAt: new Date(),
        confidence: space.confidence || 0.8
      }));

      const categorizedSessions = new Set();
      smartSpaces.forEach(space => {
        space.sessionIds.forEach(id => categorizedSessions.add(id));
      });

      const uncategorizedSessions = sessions
        .filter(session => !categorizedSessions.has(session.id))
        .map(session => session.id);

      return {
        spaces: smartSpaces,
        totalSessionsCategorized: categorizedSessions.size,
        uncategorizedSessions,
        recommendations: parsed.recommendations || ["Use Smart Spaces to organize your therapeutic insights"]
      };
    }
    
    throw new Error("No valid response received");
  } catch (error) {
    console.error("Error generating Smart Spaces:", error);
    
    // Fallback: Create basic spaces based on keyword analysis
    const fallbackSpaces = createFallbackSmartSpaces(sessions);
    
    return {
      spaces: fallbackSpaces,
      totalSessionsCategorized: fallbackSpaces.reduce((sum, space) => sum + space.sessionIds.length, 0),
      uncategorizedSessions: [],
      recommendations: ["Smart Spaces created from session analysis"]
    };
  }
};

const createFallbackSmartSpaces = (sessions: any[]): SmartSpace[] => {
  const spaces: SmartSpace[] = [];
  const now = new Date();

  // Anxiety-focused sessions
  const anxietySessions = sessions.filter(s => 
    s.notes.toLowerCase().includes('anxiety') || 
    s.notes.toLowerCase().includes('anxious') ||
    s.notes.toLowerCase().includes('worry')
  );

  if (anxietySessions.length >= 2) {
    spaces.push({
      id: `anxiety_space_${Date.now()}`,
      name: "Anxiety & Worry Management",
      description: "Sessions focused on anxiety disorders and worry patterns",
      category: 'therapeutic-focus',
      autoTags: ['anxiety', 'worry', 'coping', 'relaxation'],
      sessionIds: anxietySessions.map(s => s.id),
      insights: ["Focus on anxiety management techniques", "Track progress in anxiety reduction"],
      color: 'bg-blue-50',
      icon: 'Brain',
      createdAt: now,
      confidence: 0.75
    });
  }

  // Depression-focused sessions
  const depressionSessions = sessions.filter(s => 
    s.notes.toLowerCase().includes('depression') || 
    s.notes.toLowerCase().includes('depressed') ||
    s.notes.toLowerCase().includes('mood')
  );

  if (depressionSessions.length >= 2) {
    spaces.push({
      id: `depression_space_${Date.now()}`,
      name: "Mood & Depression Work",
      description: "Sessions addressing depressive symptoms and mood regulation",
      category: 'therapeutic-focus',
      autoTags: ['depression', 'mood', 'motivation', 'behavioral activation'],
      sessionIds: depressionSessions.map(s => s.id),
      insights: ["Track mood improvements over time", "Focus on behavioral activation strategies"],
      color: 'bg-green-50',
      icon: 'Heart',
      createdAt: now,
      confidence: 0.75
    });
  }

  // Assessment and evaluation sessions
  const assessmentSessions = sessions.filter(s => 
    s.notes.toLowerCase().includes('assessment') || 
    s.notes.toLowerCase().includes('evaluate') ||
    s.notes.toLowerCase().includes('diagnosis')
  );

  if (assessmentSessions.length >= 2) {
    spaces.push({
      id: `assessment_space_${Date.now()}`,
      name: "Clinical Assessment Skills",
      description: "Sessions focused on assessment and diagnostic skills development",
      category: 'competency-development',
      autoTags: ['assessment', 'diagnosis', 'evaluation', 'clinical skills'],
      sessionIds: assessmentSessions.map(s => s.id),
      insights: ["Developing systematic assessment approach", "Building diagnostic confidence"],
      color: 'bg-purple-50',
      icon: 'Target',
      createdAt: now,
      confidence: 0.70
    });
  }

  return spaces;
};

export const updateSmartSpaceWithNewSession = (
  spaces: SmartSpace[],
  newSession: any
): SmartSpace[] => {
  const sessionText = newSession.notes.toLowerCase();
  
  return spaces.map(space => {
    const matchScore = space.autoTags.reduce((score, tag) => {
      return score + (sessionText.includes(tag.toLowerCase()) ? 1 : 0);
    }, 0);
    
    // If session matches at least 2 tags, add it to the space
    if (matchScore >= 2) {
      return {
        ...space,
        sessionIds: [...space.sessionIds, newSession.id]
      };
    }
    
    return space;
  });
};