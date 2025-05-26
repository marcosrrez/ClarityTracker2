import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Google AI client with Firebase API key
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_FIREBASE_API_KEY);

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

export const generateInsightSummary = async (entries: any[]): Promise<string> => {
  try {
    const prompt = `As a professional development advisor for Licensed Associate Counselors, analyze the following collection of session entries and provide a comprehensive professional development summary.

Number of entries: ${entries.length}
Total hours logged: ${entries.reduce((sum, entry) => sum + entry.clientContactHours, 0)}

Please provide insights on:
- Overall professional growth patterns
- Strengths demonstrated across sessions
- Areas for continued development
- Recommendations for supervision discussions
- Progress toward licensure goals

Keep the response supportive, professional, and focused on growth opportunities.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional development advisor for Licensed Associate Counselors. Provide supportive, constructive insights that promote growth."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7
    });

    return response.choices[0].message.content || "Unable to generate summary at this time.";
    
  } catch (error) {
    console.error("Error generating insight summary:", error);
    throw new Error("Unable to generate insights summary. Please try again.");
  }
};

export const summarizeWebContent = async (url: string): Promise<string> => {
  try {
    // Note: This would require a backend endpoint to fetch web content
    // For now, return a placeholder that explains the limitation
    return "Web content summarization requires additional setup. Please copy and paste the content you'd like to summarize into the notes section.";
  } catch (error) {
    console.error("Error summarizing web content:", error);
    throw new Error("Unable to summarize web content at this time.");
  }
};