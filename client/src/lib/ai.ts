import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Google AI client with your API key
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_API_KEY);

export interface AiAnalysisResult {
  summary: string;
  themes: string[];
  potentialBlindSpots: string[];
  reflectivePrompts: string[];
  keyLearnings: string[];
  ccsrCategory: string;
}

export const analyzeSessionNotes = async (notes: string, userProfile?: any): Promise<AiAnalysisResult> => {
  try {
    const prompt = `As a professional development AI assistant for Licensed Associate Counselors, analyze the following session notes and provide insights for professional growth.

Session Notes:
${notes}

Please provide a JSON response with the following structure:
{
  "summary": "Brief summary of the session",
  "themes": ["theme1", "theme2", "theme3"],
  "potentialBlindSpots": ["potential area for growth 1", "potential area for growth 2"],
  "reflectivePrompts": ["reflection question 1", "reflection question 2", "reflection question 3"],
  "keyLearnings": ["learning point 1", "learning point 2"],
  "ccsrCategory": "Most relevant CCSR category for this session"
}

Focus on:
- Professional development opportunities
- Clinical skills demonstrated
- Areas for continued learning
- Supervision discussion points
- Ethical considerations if relevant

Keep responses professional, constructive, and supportive of growth.`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error("No valid response received from AI");
    
  } catch (error) {
    console.error("Error analyzing session notes:", error);
    throw new Error("Unable to analyze session notes. Please check your connection and try again.");
  }
};

export interface CrossSessionAnalysis {
  overallGrowthTrajectory: string;
  recurringThemes: string[];
  progressIndicators: string[];
  developmentAreas: string[];
  patternInsights: string[];
  personalizedRecommendations: string[];
  strengthsIdentified: string[];
  blindSpotPatterns: string[];
  sessionToSessionEvolution: string[];
  timeBasedTrends: string[];
}

export const generateCrossSessionAnalysis = async (entries: any[], userProfile?: any, insightCards?: any[]): Promise<CrossSessionAnalysis> => {
  if (!entries.length) {
    throw new Error("No entries provided for analysis");
  }

  try {
    const sessionsData = entries.map((entry, index) => `
Session ${index + 1} (${new Date(entry.dateOfContact).toLocaleDateString()}):
Type: ${entry.contactType || 'Individual'}
Hours: ${entry.clientContactHours}
Supervision: ${entry.supervisionType || 'None'}
Notes: ${entry.notes.substring(0, 500)}...
${entry.analysis ? `Key Themes from Previous Analysis: ${Object.values(entry.analysis.themes || {}).join(', ')}` : ''}
`).join('\n');

    const insightCardsData = insightCards?.length ? `
Personal Reflections & Learning Resources:
${insightCards.map((card, index) => `
Insight ${index + 1} (${new Date(card.createdAt).toLocaleDateString()}):
Title: ${card.title}
Content: ${card.content}
Type: ${card.type}
Tags: ${card.tags?.join(', ') || 'None'}
`).join('\n')}
` : '';

    const userContext = userProfile ? `
Counselor Profile:
- License Stage: ${userProfile.licenseStage || 'LAC'}
- Specialties: ${userProfile.specialties?.join(', ') || 'General Practice'}
- Experience Level: ${userProfile.yearsOfExperience || 'Early Career'}
- Professional Goals: ${userProfile.professionalGoals || 'General Development'}
` : '';

    const totalHours = entries.reduce((sum, entry) => sum + (entry.clientContactHours || 0), 0);
    const timeSpan = entries.length > 1 ? 
      Math.ceil((new Date(entries[entries.length - 1].dateOfContact).getTime() - new Date(entries[0].dateOfContact).getTime()) / (1000 * 60 * 60 * 24)) 
      : 0;

    const prompt = `As an expert clinical supervisor and professional development coach, analyze this counselor's complete professional development journey across ${entries.length} sessions spanning ${timeSpan} days with ${totalHours} total client contact hours.

${userContext}

Session Data:
${sessionsData}

${insightCardsData}

Provide a comprehensive cross-session analysis in JSON format, integrating ALL data sources (session notes, previous AI analyses, and personal reflections/resources):

{
  "overallGrowthTrajectory": "Narrative of professional growth journey and development arc",
  "recurringThemes": ["Most frequent themes across sessions"],
  "progressIndicators": ["Specific evidence of skill building and professional development"],
  "developmentAreas": ["Areas needing continued focus and growth"],
  "patternInsights": ["Deeper patterns in approach, intervention style, or client work"],
  "personalizedRecommendations": ["Specific actionable recommendations based on observed patterns"],
  "strengthsIdentified": ["Core strengths consistently demonstrated"],
  "blindSpotPatterns": ["Recurring potential blind spots or growth edges"],
  "sessionToSessionEvolution": ["How clinical approach or insights have evolved"],
  "timeBasedTrends": ["Trends visible over time in confidence, skill, or focus areas"]
}

Focus on professional development, clinical competency growth, and personalized insights that compound over time.`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error("No valid response received from AI");
    
  } catch (error) {
    console.error("Error generating cross-session analysis:", error);
    throw new Error("Unable to generate cross-session analysis. Please try again.");
  }
};

export const generateInsightSummary = async (entries: any[]): Promise<string> => {
  const analysis = await generateCrossSessionAnalysis(entries);
  return analysis.overallGrowthTrajectory;
};

export const generatePersonalizedDashboardInsights = async (entries: any[], userProfile?: any): Promise<{
  weeklyFocus: string;
  skillDevelopmentTip: string;
  supervisionTopic: string;
  professionalGrowthInsight: string;
}> => {
  if (!entries.length) {
    return {
      weeklyFocus: "Begin your professional journey by documenting your first client session.",
      skillDevelopmentTip: "Start with reflective note-taking to build self-awareness.",
      supervisionTopic: "Discuss your initial comfort level with different therapeutic approaches.",
      professionalGrowthInsight: "Every expert was once a beginner - embrace the learning process."
    };
  }

  try {
    const recentEntries = entries.slice(-5); // Last 5 sessions
    const prompt = `Based on these recent counseling sessions, provide personalized weekly insights for professional development:

${recentEntries.map((entry, index) => `
Recent Session ${index + 1}: ${entry.notes.substring(0, 200)}...
`).join('\n')}

Provide JSON response:
{
  "weeklyFocus": "One specific area to focus on this week based on recent patterns",
  "skillDevelopmentTip": "Actionable skill-building tip based on recent work",
  "supervisionTopic": "Specific topic to bring to supervision based on patterns",
  "professionalGrowthInsight": "Encouraging insight about professional development progress"
}`;

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
    console.error("Error generating personalized insights:", error);
    return {
      weeklyFocus: "Continue developing your clinical skills through consistent practice.",
      skillDevelopmentTip: "Reflect on your therapeutic presence and client engagement.",
      supervisionTopic: "Discuss your confidence levels with different intervention techniques.",
      professionalGrowthInsight: "Your dedication to growth is building strong clinical foundations."
    };
  }
};

export const summarizeWebContent = async (url: string): Promise<string> => {
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
    
    if (!apiKey) {
      throw new Error("Google AI API key not configured. Please add your API key in settings.");
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Fetch the webpage content
    const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    
    if (!data.contents) {
      throw new Error("Unable to fetch webpage content.");
    }
    
    // Clean up HTML content - extract text content
    const parser = new DOMParser();
    const doc = parser.parseFromString(data.contents, 'text/html');
    
    // Remove scripts, styles, navigation, ads, etc.
    const elementsToRemove = doc.querySelectorAll('script, style, nav, header, footer, aside, .ad, .advertisement, .sidebar');
    elementsToRemove.forEach(el => el.remove());
    
    // Get main content area if it exists
    const mainContent = doc.querySelector('main, article, .content, .post, .entry') || doc.body;
    const textContent = mainContent?.textContent || '';
    
    // Clean and limit content
    const cleanContent = textContent
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 6000); // Limit to avoid token limits
    
    if (cleanContent.length < 100) {
      throw new Error("Insufficient content found on the webpage.");
    }
    
    const prompt = `As an AI assistant for Licensed Associate Counselors, analyze this article and provide a focused summary:

Article Content: "${cleanContent}"

Please provide:
1. **Key Points** (3-4 main takeaways)
2. **Clinical Relevance** (How this applies to counseling practice)
3. **Professional Development** (Skills or knowledge areas this addresses)
4. **Action Items** (Practical steps a counselor could take)

Keep the summary concise but comprehensive, focusing on what's most valuable for a counseling professional's growth and practice.`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();
    
    return summary;
    
  } catch (error) {
    console.error("Error summarizing web content:", error);
    if (error.message?.includes("API key")) {
      throw new Error("Google AI API key is required for web content summarization. Please check your settings.");
    }
    throw new Error(`Unable to summarize this webpage: ${error.message}`);
  }
};