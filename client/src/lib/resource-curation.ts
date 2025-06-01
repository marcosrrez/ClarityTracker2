import { genAI } from "./ai";

export interface CuratedResource {
  id: string;
  title: string;
  type: 'article' | 'book' | 'technique' | 'course' | 'video' | 'worksheet' | 'assessment';
  description: string;
  relevanceScore: number;
  category: 'clinical-skills' | 'therapeutic-techniques' | 'ethics' | 'cultural-competence' | 'self-care' | 'supervision';
  tags: string[];
  priority: 'immediate' | 'development' | 'reference';
  reason: string;
  source: 'professional-database' | 'peer-reviewed' | 'clinical-guide' | 'training-material';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  timeEstimate: string;
  targetCompetencies: string[];
  practiceLevel: 'associate' | 'licensed' | 'supervisor' | 'all';
}

export interface ResourceCurationResult {
  curatedResources: CuratedResource[];
  totalRecommendations: number;
  categories: string[];
  priorityResources: CuratedResource[];
  developmentPath: string[];
}

export const generateContextualResources = async (
  sessions: any[],
  userProfile?: any,
  therapyProfile?: any,
  competencyGaps?: string[]
): Promise<ResourceCurationResult> => {
  
  if (!sessions.length) {
    return {
      curatedResources: [],
      totalRecommendations: 0,
      categories: [],
      priorityResources: [],
      developmentPath: ["Begin with foundational counseling resources", "Document initial sessions to receive personalized recommendations"]
    };
  }

  const recentSessions = sessions.slice(-10);
  const practiceLevel = userProfile?.practiceLevel || 'associate';
  const specializations = therapyProfile?.therapeuticModalities || [];
  const challenges = competencyGaps || [];

  const prompt = `Based on this counselor's recent practice and profile, curate highly relevant professional development resources:

RECENT SESSIONS (${recentSessions.length} sessions):
${recentSessions.map((session, index) => `
Session ${index + 1}: ${session.notes.substring(0, 300)}...
`).join('\n')}

COUNSELOR PROFILE:
- Practice Level: ${practiceLevel}
- Specializations: ${specializations.join(', ') || 'Developing'}
- Competency Gaps: ${challenges.join(', ') || 'General development'}
- Total Sessions: ${sessions.length}

CURATION CRITERIA:
1. Directly relevant to recent session themes and challenges
2. Appropriate for current practice level and development stage
3. Evidence-based and professionally recognized resources
4. Addresses identified competency gaps and growth areas
5. Supports emerging therapeutic specializations

Generate 8-12 highly curated resources:

{
  "curatedResources": [
    {
      "title": "Specific, actionable resource title",
      "type": "article|book|technique|course|video|worksheet|assessment",
      "description": "Clear description of what this resource provides",
      "relevanceScore": 0.95,
      "category": "clinical-skills|therapeutic-techniques|ethics|cultural-competence|self-care|supervision",
      "tags": ["specific", "relevant", "keywords"],
      "priority": "immediate|development|reference",
      "reason": "Why this resource is specifically recommended now",
      "source": "professional-database|peer-reviewed|clinical-guide|training-material",
      "difficulty": "beginner|intermediate|advanced",
      "timeEstimate": "15 minutes|2 hours|ongoing",
      "targetCompetencies": ["specific competencies this develops"],
      "practiceLevel": "associate|licensed|supervisor|all"
    }
  ],
  "developmentPath": ["Sequential learning recommendations"]
}`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      const resources: CuratedResource[] = parsed.curatedResources.map((resource: any) => ({
        id: `resource_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: resource.title,
        type: resource.type,
        description: resource.description,
        relevanceScore: resource.relevanceScore || 0.8,
        category: resource.category,
        tags: resource.tags || [],
        priority: resource.priority,
        reason: resource.reason,
        source: resource.source,
        difficulty: resource.difficulty,
        timeEstimate: resource.timeEstimate,
        targetCompetencies: resource.targetCompetencies || [],
        practiceLevel: resource.practiceLevel || practiceLevel
      }));

      const priorityResources = resources.filter(r => r.priority === 'immediate');
      const categories = Array.from(new Set(resources.map(r => r.category)));

      return {
        curatedResources: resources,
        totalRecommendations: resources.length,
        categories,
        priorityResources,
        developmentPath: parsed.developmentPath || ["Continue current development path"]
      };
    }
    
    throw new Error("No valid response received");
  } catch (error) {
    console.error("Error generating curated resources:", error);
    
    // Fallback: Generate basic resources based on session analysis
    const fallbackResources = generateFallbackResources(sessions, practiceLevel, competencyGaps);
    
    return {
      curatedResources: fallbackResources,
      totalRecommendations: fallbackResources.length,
      categories: Array.from(new Set(fallbackResources.map(r => r.category))),
      priorityResources: fallbackResources.filter(r => r.priority === 'immediate'),
      developmentPath: ["Focus on foundational skills", "Build clinical experience", "Develop specialization areas"]
    };
  }
};

const generateFallbackResources = (
  sessions: any[], 
  practiceLevel: string, 
  competencyGaps?: string[]
): CuratedResource[] => {
  const resources: CuratedResource[] = [];
  const sessionContent = sessions.map(s => s.notes.toLowerCase()).join(' ');

  // Anxiety-related resources
  if (sessionContent.includes('anxiety')) {
    resources.push({
      id: 'anxiety_cbt_guide',
      title: "CBT Techniques for Anxiety Disorders",
      type: 'technique',
      description: "Evidence-based cognitive-behavioral interventions for anxiety management",
      relevanceScore: 0.9,
      category: 'therapeutic-techniques',
      tags: ['anxiety', 'CBT', 'interventions'],
      priority: 'immediate',
      reason: "Multiple anxiety-focused sessions detected",
      source: 'clinical-guide',
      difficulty: 'intermediate',
      timeEstimate: '1 hour study',
      targetCompetencies: ['Intervention Implementation', 'Assessment Skills'],
      practiceLevel: 'associate'
    });
  }

  // Assessment skills
  if (competencyGaps?.includes('assessment') || sessionContent.includes('assessment')) {
    resources.push({
      id: 'clinical_assessment_fundamentals',
      title: "Clinical Assessment and Diagnosis Fundamentals",
      type: 'course',
      description: "Comprehensive guide to clinical interviewing and diagnostic assessment",
      relevanceScore: 0.85,
      category: 'clinical-skills',
      tags: ['assessment', 'diagnosis', 'clinical-interview'],
      priority: 'development',
      reason: "Assessment skills development needed",
      source: 'training-material',
      difficulty: 'beginner',
      timeEstimate: '4 hours',
      targetCompetencies: ['Assessment & Evaluation'],
      practiceLevel: 'associate'
    });
  }

  // Supervision resources
  if (practiceLevel === 'associate') {
    resources.push({
      id: 'supervision_preparation_guide',
      title: "Making the Most of Clinical Supervision",
      type: 'article',
      description: "Best practices for supervision preparation and professional development",
      relevanceScore: 0.8,
      category: 'supervision',
      tags: ['supervision', 'professional-development'],
      priority: 'development',
      reason: "Essential for associate-level counselors",
      source: 'professional-database',
      difficulty: 'beginner',
      timeEstimate: '30 minutes',
      targetCompetencies: ['Professional Development'],
      practiceLevel: 'associate'
    });
  }

  return resources;
};

export const filterResourcesByProfile = (
  resources: CuratedResource[],
  userProfile?: any,
  preferences?: {
    preferredTypes?: string[];
    timeConstraints?: string;
    focusAreas?: string[];
  }
): CuratedResource[] => {
  return resources.filter(resource => {
    // Filter by practice level
    if (userProfile?.practiceLevel && resource.practiceLevel !== 'all') {
      if (resource.practiceLevel !== userProfile.practiceLevel) {
        return false;
      }
    }

    // Filter by preferred types
    if (preferences?.preferredTypes?.length) {
      if (!preferences.preferredTypes.includes(resource.type)) {
        return false;
      }
    }

    // Filter by time constraints
    if (preferences?.timeConstraints === 'quick' && 
        resource.timeEstimate.includes('hour')) {
      return false;
    }

    // Filter by focus areas
    if (preferences?.focusAreas?.length) {
      const hasRelevantTag = preferences.focusAreas.some(area => 
        resource.tags.some(tag => tag.toLowerCase().includes(area.toLowerCase()))
      );
      if (!hasRelevantTag) {
        return false;
      }
    }

    return true;
  });
};