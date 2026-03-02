import { genAI } from "./ai";

export interface SupervisionIntelligence {
  weeklyFocus: string[];
  challengesIdentified: string[];
  strengthsToHighlight: string[];
  ethicalConsiderations: string[];
  competencyGaps: string[];
  caseConceptualization: string[];
  professionalGrowthGoals: string[];
  supervisionQuestions: string[];
  actionItems: string[];
}

export interface EnhancedSupervisionPrep {
  agendaSuggestions: string[];
  caseDiscussionPoints: string[];
  selfReflectionPrompts: string[];
  competencyFocusAreas: string[];
  ethicalDilemmas: string[];
  growthObjectives: string[];
  resourceRequests: string[];
  supervisionGoals: string[];
}

export const generateSupervisionIntelligence = async (
  entries: any[], 
  userProfile?: any,
  timeframe: 'weekly' | 'monthly' = 'weekly'
): Promise<SupervisionIntelligence> => {
  if (!entries.length) {
    return {
      weeklyFocus: ["Begin supervision discussion with initial practice experiences"],
      challengesIdentified: ["New practitioner adjustment period"],
      strengthsToHighlight: ["Commitment to professional development"],
      ethicalConsiderations: ["Boundary establishment in early practice"],
      competencyGaps: ["All core competencies require development"],
      caseConceptualization: ["Practice case conceptualization skills"],
      professionalGrowthGoals: ["Establish supervision routine and goals"],
      supervisionQuestions: ["What are my immediate learning priorities?"],
      actionItems: ["Schedule regular supervision meetings"]
    };
  }

  const totalSessions = entries.length;
  const canProvideAdvancedPrep = totalSessions >= 15;
  const canIdentifyPatterns = totalSessions >= 10;
  const canSuggestSpecialization = totalSessions >= 25;

  const recentEntries = entries.slice(-5);
  const timeframeDescription = timeframe === 'weekly' ? 'past week' : 'past month';
  
  const prompt = `Based on these recent counseling sessions from the ${timeframeDescription}, generate comprehensive supervision preparation insights:

${recentEntries.map((entry, index) => `
Session ${index + 1}: ${entry.notes.substring(0, 300)}...
${entry.supervisionNotes ? `Supervision Notes: ${entry.supervisionNotes.substring(0, 200)}...` : ''}
`).join('\n')}

Context:
- Total Sessions: ${totalSessions}
- Advanced Pattern Analysis: ${canProvideAdvancedPrep}
- Specialization Insights: ${canSuggestSpecialization}
- Professional Level: ${userProfile?.practiceLevel || 'Associate Counselor'}

Generate JSON response:
{
  "weeklyFocus": ["3-4 key therapeutic focus areas from recent sessions"],
  "challengesIdentified": ["Specific clinical challenges requiring supervision"],
  "strengthsToHighlight": ["Observable therapeutic strengths and improvements"],
  "ethicalConsiderations": ["Ethical issues or dilemmas encountered"],
  "competencyGaps": ["Areas needing development or additional training"],
  "caseConceptualization": ["Case formulation insights and approaches"],
  "professionalGrowthGoals": ["Development objectives for supervision planning"],
  "supervisionQuestions": ["Specific questions to ask supervisor"],
  "actionItems": ["Concrete next steps from supervision discussion"]
}`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error("No valid response received");
  } catch (error) {
    console.error("Error generating supervision intelligence:", error);
    
    // Fallback based on session data analysis
    return {
      weeklyFocus: ["Session documentation and reflection", "Therapeutic relationship development"],
      challengesIdentified: ["Continue building clinical confidence"],
      strengthsToHighlight: ["Consistent session attendance and documentation"],
      ethicalConsiderations: ["Maintain professional boundaries"],
      competencyGaps: ["Assessment and intervention skills"],
      caseConceptualization: ["Practice systematic case formulation"],
      professionalGrowthGoals: ["Develop theoretical orientation"],
      supervisionQuestions: ["How can I improve my therapeutic interventions?"],
      actionItems: ["Continue regular session documentation"]
    };
  }
};

export const generateEnhancedSupervisionPrep = async (
  supervisionIntelligence: SupervisionIntelligence,
  userTherapyProfile?: any
): Promise<EnhancedSupervisionPrep> => {
  const prompt = `Based on this supervision intelligence data, create an enhanced supervision preparation guide:

Weekly Focus: ${supervisionIntelligence.weeklyFocus.join(', ')}
Challenges: ${supervisionIntelligence.challengesIdentified.join(', ')}
Strengths: ${supervisionIntelligence.strengthsToHighlight.join(', ')}
Ethical Considerations: ${supervisionIntelligence.ethicalConsiderations.join(', ')}
Competency Gaps: ${supervisionIntelligence.competencyGaps.join(', ')}

Therapy Profile Context: ${userTherapyProfile ? JSON.stringify(userTherapyProfile) : 'Developing'}

Generate JSON response:
{
  "agendaSuggestions": ["Structured agenda items for supervision meeting"],
  "caseDiscussionPoints": ["Specific cases or situations to discuss"],
  "selfReflectionPrompts": ["Questions for personal reflection before supervision"],
  "competencyFocusAreas": ["Priority competencies to discuss"],
  "ethicalDilemmas": ["Ethical scenarios requiring supervisor input"],
  "growthObjectives": ["Specific learning goals for this supervision period"],
  "resourceRequests": ["Books, training, or materials to request"],
  "supervisionGoals": ["Outcomes to achieve from this supervision session"]
}`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error("No valid response received");
  } catch (error) {
    console.error("Error generating enhanced supervision prep:", error);
    
    return {
      agendaSuggestions: ["Review recent cases", "Discuss professional development"],
      caseDiscussionPoints: ["Complex cases requiring guidance"],
      selfReflectionPrompts: ["What challenged me this week?"],
      competencyFocusAreas: ["Assessment skills", "Intervention techniques"],
      ethicalDilemmas: ["Boundary considerations"],
      growthObjectives: ["Improve clinical documentation"],
      resourceRequests: ["Supervision resources"],
      supervisionGoals: ["Clear direction for next week"]
    };
  }
};