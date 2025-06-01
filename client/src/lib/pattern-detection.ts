import { genAI } from "./ai";

export interface DetectedPattern {
  id: string;
  type: 'therapeutic-breakthrough' | 'skill-development' | 'challenge-pattern' | 'client-presentation' | 'ethical-consideration' | 'supervision-need';
  pattern: string;
  description: string;
  frequency: number;
  timeline: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  trend: 'improving' | 'stable' | 'declining' | 'emerging';
  recommendations: string[];
  relatedSessions: string[];
  competencyImpact: string[];
  nextSteps: string[];
  supervisionPriority: boolean;
  alertLevel: 'info' | 'watch' | 'action' | 'urgent';
}

export interface PatternAnalysisResult {
  patterns: DetectedPattern[];
  totalPatternsFound: number;
  criticalAlerts: DetectedPattern[];
  growthIndicators: DetectedPattern[];
  supervisionFlags: DetectedPattern[];
  trendSummary: string;
  timeframeAnalyzed: string;
}

export const detectLongitudinalPatterns = async (
  sessions: any[],
  timeframeDays: number = 30,
  userProfile?: any
): Promise<PatternAnalysisResult> => {
  
  if (sessions.length < 10) {
    return {
      patterns: [],
      totalPatternsFound: 0,
      criticalAlerts: [],
      growthIndicators: [],
      supervisionFlags: [],
      trendSummary: "Insufficient session data for pattern analysis. Continue documenting sessions.",
      timeframeAnalyzed: `${sessions.length} sessions`
    };
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timeframeDays);
  
  const recentSessions = sessions.filter(session => 
    new Date(session.dateOfContact) >= cutoffDate
  );

  const allSessionsForContext = sessions.slice(-20); // Last 20 sessions for broader context

  const prompt = `Analyze these counseling sessions for longitudinal patterns, trends, and early warning indicators:

RECENT SESSIONS (${recentSessions.length} sessions in last ${timeframeDays} days):
${recentSessions.map((session, index) => `
Session ${index + 1} - ${new Date(session.dateOfContact).toLocaleDateString()}:
Notes: ${session.notes.substring(0, 400)}...
Hours: ${session.clientContactHours || 1}
${session.supervisionNotes ? `Supervision: ${session.supervisionNotes.substring(0, 200)}...` : ''}
`).join('\n')}

BROADER CONTEXT (${allSessionsForContext.length} total sessions):
${allSessionsForContext.slice(0, 5).map((session, index) => `
Earlier Session ${index + 1}: ${session.notes.substring(0, 200)}...
`).join('\n')}

ANALYSIS OBJECTIVES:
1. Identify recurring therapeutic patterns and client presentation trends
2. Detect skill development trajectories and competency growth
3. Flag potential challenges or concerning patterns
4. Recognize breakthrough moments and therapeutic successes
5. Identify supervision needs and ethical considerations
6. Provide early warning indicators for burnout, competency gaps, or client risk

Generate comprehensive pattern analysis:

{
  "patterns": [
    {
      "type": "therapeutic-breakthrough|skill-development|challenge-pattern|client-presentation|ethical-consideration|supervision-need",
      "pattern": "Clear, specific pattern description",
      "description": "Detailed explanation of what this pattern represents",
      "frequency": 3,
      "timeline": "2 weeks|1 month|ongoing",
      "confidence": 0.85,
      "severity": "low|medium|high|critical",
      "trend": "improving|stable|declining|emerging",
      "recommendations": ["Specific actionable recommendations"],
      "relatedSessions": ["session_ids_where_pattern_appears"],
      "competencyImpact": ["Which competencies this affects"],
      "nextSteps": ["Immediate actions to take"],
      "supervisionPriority": true,
      "alertLevel": "info|watch|action|urgent"
    }
  ],
  "trendSummary": "Overall professional development trajectory and key insights"
}`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      const patterns: DetectedPattern[] = parsed.patterns.map((pattern: any) => ({
        id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: pattern.type,
        pattern: pattern.pattern,
        description: pattern.description,
        frequency: pattern.frequency || 1,
        timeline: pattern.timeline || 'recent',
        confidence: pattern.confidence || 0.7,
        severity: pattern.severity || 'medium',
        trend: pattern.trend || 'stable',
        recommendations: pattern.recommendations || [],
        relatedSessions: pattern.relatedSessions || [],
        competencyImpact: pattern.competencyImpact || [],
        nextSteps: pattern.nextSteps || [],
        supervisionPriority: pattern.supervisionPriority || false,
        alertLevel: pattern.alertLevel || 'info'
      }));

      const criticalAlerts = patterns.filter(p => p.alertLevel === 'urgent' || p.severity === 'critical');
      const growthIndicators = patterns.filter(p => p.type === 'therapeutic-breakthrough' || p.type === 'skill-development');
      const supervisionFlags = patterns.filter(p => p.supervisionPriority);

      return {
        patterns,
        totalPatternsFound: patterns.length,
        criticalAlerts,
        growthIndicators,
        supervisionFlags,
        trendSummary: parsed.trendSummary || "Continuing professional development",
        timeframeAnalyzed: `${recentSessions.length} sessions (${timeframeDays} days)`
      };
    }
    
    throw new Error("No valid response received");
  } catch (error) {
    console.error("Error detecting patterns:", error);
    
    // Fallback: Basic pattern detection based on keyword analysis
    const fallbackPatterns = detectBasicPatterns(recentSessions, allSessionsForContext);
    
    return {
      patterns: fallbackPatterns,
      totalPatternsFound: fallbackPatterns.length,
      criticalAlerts: fallbackPatterns.filter(p => p.severity === 'high'),
      growthIndicators: fallbackPatterns.filter(p => p.type === 'skill-development'),
      supervisionFlags: fallbackPatterns.filter(p => p.supervisionPriority),
      trendSummary: "Basic pattern analysis completed",
      timeframeAnalyzed: `${recentSessions.length} sessions`
    };
  }
};

const detectBasicPatterns = (recentSessions: any[], allSessions: any[]): DetectedPattern[] => {
  const patterns: DetectedPattern[] = [];
  const now = Date.now();

  // Detect anxiety pattern
  const anxietyCount = recentSessions.filter(s => 
    s.notes.toLowerCase().includes('anxiety') || 
    s.notes.toLowerCase().includes('anxious')
  ).length;

  if (anxietyCount >= 3) {
    patterns.push({
      id: `anxiety_pattern_${now}`,
      type: 'client-presentation',
      pattern: 'Recurring Anxiety Presentations',
      description: 'Multiple sessions show clients presenting with anxiety-related concerns',
      frequency: anxietyCount,
      timeline: 'recent weeks',
      confidence: 0.8,
      severity: 'medium',
      trend: 'stable',
      recommendations: ['Develop anxiety-specific intervention skills', 'Consider CBT training'],
      relatedSessions: [],
      competencyImpact: ['Intervention Techniques', 'Assessment Skills'],
      nextSteps: ['Discuss anxiety treatment approaches in supervision'],
      supervisionPriority: true,
      alertLevel: 'watch'
    });
  }

  // Detect skill development pattern
  const assessmentMentions = allSessions.filter(s => 
    s.notes.toLowerCase().includes('assessment') || 
    s.notes.toLowerCase().includes('evaluate')
  ).length;

  if (assessmentMentions > 0) {
    const recentAssessmentMentions = recentSessions.filter(s => 
      s.notes.toLowerCase().includes('assessment')
    ).length;

    if (recentAssessmentMentions > 0) {
      patterns.push({
        id: `assessment_development_${now}`,
        type: 'skill-development',
        pattern: 'Assessment Skills Development',
        description: 'Consistent focus on clinical assessment and evaluation skills',
        frequency: recentAssessmentMentions,
        timeline: 'ongoing',
        confidence: 0.75,
        severity: 'low',
        trend: 'improving',
        recommendations: ['Continue developing assessment competencies'],
        relatedSessions: [],
        competencyImpact: ['Assessment & Evaluation'],
        nextSteps: ['Practice structured assessment techniques'],
        supervisionPriority: false,
        alertLevel: 'info'
      });
    }
  }

  return patterns;
};

export const getEarlyWarningIndicators = (patterns: DetectedPattern[]): {
  burnoutRisk: boolean;
  competencyGaps: string[];
  supervisionNeeds: string[];
  ethicalConcerns: string[];
} => {
  const criticalPatterns = patterns.filter(p => p.severity === 'critical' || p.alertLevel === 'urgent');
  const supervisionPatterns = patterns.filter(p => p.supervisionPriority);
  const ethicalPatterns = patterns.filter(p => p.type === 'ethical-consideration');
  
  const burnoutIndicators = patterns.filter(p => 
    p.pattern.toLowerCase().includes('burnout') || 
    p.pattern.toLowerCase().includes('stress') ||
    p.pattern.toLowerCase().includes('overwhelm')
  );

  const competencyGaps = patterns
    .filter(p => p.type === 'challenge-pattern')
    .flatMap(p => p.competencyImpact);

  return {
    burnoutRisk: burnoutIndicators.length > 0 || criticalPatterns.length > 2,
    competencyGaps: Array.from(new Set(competencyGaps)),
    supervisionNeeds: supervisionPatterns.map(p => p.pattern),
    ethicalConcerns: ethicalPatterns.map(p => p.pattern)
  };
};

export const generatePatternReport = (
  analysisResult: PatternAnalysisResult,
  includeRecommendations: boolean = true
): string => {
  let report = `Pattern Analysis Report\n`;
  report += `Timeframe: ${analysisResult.timeframeAnalyzed}\n`;
  report += `Total Patterns Found: ${analysisResult.totalPatternsFound}\n\n`;

  if (analysisResult.criticalAlerts.length > 0) {
    report += `Critical Alerts (${analysisResult.criticalAlerts.length}):\n`;
    analysisResult.criticalAlerts.forEach(alert => {
      report += `• ${alert.pattern} - ${alert.description}\n`;
    });
    report += `\n`;
  }

  if (analysisResult.growthIndicators.length > 0) {
    report += `Growth Indicators (${analysisResult.growthIndicators.length}):\n`;
    analysisResult.growthIndicators.forEach(growth => {
      report += `• ${growth.pattern} - ${growth.trend}\n`;
    });
    report += `\n`;
  }

  report += `Overall Trend: ${analysisResult.trendSummary}\n`;

  if (includeRecommendations && analysisResult.supervisionFlags.length > 0) {
    report += `\nSupervision Discussion Points:\n`;
    analysisResult.supervisionFlags.forEach(flag => {
      report += `• ${flag.pattern}\n`;
    });
  }

  return report;
};