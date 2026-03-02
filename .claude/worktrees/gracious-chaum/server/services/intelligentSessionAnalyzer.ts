import { GoogleGenerativeAI } from '@google/generative-ai';

const googleAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export interface VideoAnalysisData {
  timestamp: number;
  detectedFaces: number;
  dominantEmotion: string;
  emotionConfidence: number;
  engagementScore: number;
  behavioralMarkers: string[];
  source: 'azure-computer-vision' | 'engagement-analysis';
  visionAnalysis?: {
    peopleDetected: number;
    objects: any[];
    confidence: number;
  };
}

export interface TranscriptAnalysisData {
  text: string;
  timestamp: number;
  speaker: string;
  clinicalTags: string[];
  riskIndicators: any[];
  emotionalTone: string;
  themes: string[];
}

export interface ClinicalInsight {
  type: 'engagement' | 'emotional' | 'behavioral' | 'therapeutic' | 'risk';
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  description: string;
  evidence: string[];
  recommendations: string[];
  timestamp: number;
}

export class IntelligentSessionAnalyzer {
  private videoDataBuffer: VideoAnalysisData[] = [];
  private transcriptDataBuffer: TranscriptAnalysisData[] = [];
  
  async addVideoAnalysis(data: VideoAnalysisData): Promise<void> {
    this.videoDataBuffer.push(data);
    // Keep last 20 video analysis points for pattern detection
    if (this.videoDataBuffer.length > 20) {
      this.videoDataBuffer.shift();
    }
  }

  async addTranscriptAnalysis(data: TranscriptAnalysisData): Promise<void> {
    this.transcriptDataBuffer.push(data);
    // Keep last 10 transcript segments for context
    if (this.transcriptDataBuffer.length > 10) {
      this.transcriptDataBuffer.shift();
    }
  }

  async generateClinicalInsights(): Promise<ClinicalInsight[]> {
    if (this.videoDataBuffer.length === 0 && this.transcriptDataBuffer.length === 0) {
      return [];
    }

    const insights: ClinicalInsight[] = [];

    // Analyze engagement patterns from video data
    if (this.videoDataBuffer.length >= 3) {
      const engagementInsight = await this.analyzeEngagementPatterns();
      if (engagementInsight) insights.push(engagementInsight);
    }

    // Analyze emotional patterns from combined data
    if (this.videoDataBuffer.length > 0 || this.transcriptDataBuffer.length > 0) {
      const emotionalInsight = await this.analyzeEmotionalPatterns();
      if (emotionalInsight) insights.push(emotionalInsight);
    }

    // Analyze therapeutic progress from transcript
    if (this.transcriptDataBuffer.length >= 2) {
      const therapeuticInsight = await this.analyzeTherapeuticProgress();
      if (therapeuticInsight) insights.push(therapeuticInsight);
    }

    // Check for risk indicators
    const riskInsight = await this.analyzeRiskIndicators();
    if (riskInsight) insights.push(riskInsight);

    return insights;
  }

  private async analyzeEngagementPatterns(): Promise<ClinicalInsight | null> {
    const recentVideo = this.videoDataBuffer.slice(-5);
    const avgEngagement = recentVideo.reduce((sum, v) => sum + v.engagementScore, 0) / recentVideo.length;
    
    // Check for engagement trends
    const engagementTrend = this.calculateTrend(recentVideo.map(v => v.engagementScore));
    
    let severity: 'low' | 'medium' | 'high' = 'low';
    let description = '';
    const evidence: string[] = [];
    const recommendations: string[] = [];

    if (avgEngagement < 40) {
      severity = 'high';
      description = 'Consistently low engagement detected throughout session';
      evidence.push(`Average engagement score: ${Math.round(avgEngagement)}%`);
      recommendations.push('Consider checking in with client about session relevance');
      recommendations.push('Explore potential barriers to engagement');
    } else if (avgEngagement < 60) {
      severity = 'medium';
      description = 'Moderate engagement levels observed';
      evidence.push(`Average engagement score: ${Math.round(avgEngagement)}%`);
      recommendations.push('Look for opportunities to increase interactive elements');
    } else if (engagementTrend < -10) {
      severity = 'medium';
      description = 'Declining engagement pattern detected';
      evidence.push(`Engagement declining by ${Math.abs(Math.round(engagementTrend))}%`);
      recommendations.push('Consider adjusting session approach or taking a break');
    } else {
      description = 'Good engagement levels maintained';
      evidence.push(`Average engagement score: ${Math.round(avgEngagement)}%`);
      recommendations.push('Continue current therapeutic approach');
    }

    return {
      type: 'engagement',
      severity,
      confidence: 0.85,
      description,
      evidence,
      recommendations,
      timestamp: Date.now()
    };
  }

  private async analyzeEmotionalPatterns(): Promise<ClinicalInsight | null> {
    const emotions = this.videoDataBuffer.map(v => v.dominantEmotion);
    const transcriptEmotions = this.transcriptDataBuffer.map(t => t.emotionalTone);
    
    const combinedEmotionalData = {
      videoEmotions: emotions,
      transcriptEmotions: transcriptEmotions,
      recentTranscript: this.transcriptDataBuffer.slice(-3).map(t => t.text).join(' ')
    };

    try {
      const prompt = `Analyze the emotional patterns in this therapy session data:

Video emotions detected: ${emotions.join(', ')}
Speech emotional tones: ${transcriptEmotions.join(', ')}
Recent transcript: "${combinedEmotionalData.recentTranscript}"

Provide a clinical assessment of emotional patterns. Focus on:
1. Emotional stability or volatility
2. Congruence between verbal and non-verbal emotional expression
3. Therapeutic implications
4. Risk factors if any

Respond in JSON format: {"severity": "low|medium|high", "description": "brief description", "evidence": ["evidence1", "evidence2"], "recommendations": ["rec1", "rec2"]}`;

      const model = googleAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const analysis = JSON.parse(text.replace(/```json|```/g, '').trim());
      
      return {
        type: 'emotional',
        severity: analysis.severity || 'low',
        confidence: 0.8,
        description: analysis.description || 'Emotional patterns analyzed',
        evidence: analysis.evidence || [],
        recommendations: analysis.recommendations || [],
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error analyzing emotional patterns:', error);
      return null;
    }
  }

  private async analyzeTherapeuticProgress(): Promise<ClinicalInsight | null> {
    const recentTranscripts = this.transcriptDataBuffer.slice(-3);
    const clinicalTags = recentTranscripts.flatMap(t => t.clinicalTags);
    const themes = recentTranscripts.flatMap(t => t.themes);
    
    try {
      const prompt = `Analyze therapeutic progress based on this session data:

Clinical tags identified: ${clinicalTags.join(', ')}
Themes discussed: ${themes.join(', ')}
Recent dialogue: "${recentTranscripts.map(t => t.text).join(' ')}"

Assess therapeutic progress and provide insights on:
1. Treatment engagement and collaboration
2. Skill building and coping strategies
3. Progress toward therapeutic goals
4. Areas needing additional focus

Respond in JSON format: {"severity": "low|medium|high", "description": "brief description", "evidence": ["evidence1", "evidence2"], "recommendations": ["rec1", "rec2"]}`;

      const model = googleAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const analysis = JSON.parse(text.replace(/```json|```/g, '').trim());
      
      return {
        type: 'therapeutic',
        severity: analysis.severity || 'low',
        confidence: 0.9,
        description: analysis.description || 'Therapeutic progress assessed',
        evidence: analysis.evidence || [],
        recommendations: analysis.recommendations || [],
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error analyzing therapeutic progress:', error);
      return null;
    }
  }

  private async analyzeRiskIndicators(): Promise<ClinicalInsight | null> {
    const allRiskIndicators = this.transcriptDataBuffer.flatMap(t => t.riskIndicators);
    const recentBehavioralMarkers = this.videoDataBuffer.slice(-3).flatMap(v => v.behavioralMarkers);
    
    if (allRiskIndicators.length === 0 && !recentBehavioralMarkers.some(marker => 
      marker.includes('distress') || marker.includes('agitation'))) {
      return null;
    }

    const evidence: string[] = [];
    const recommendations: string[] = [];
    let severity: 'low' | 'medium' | 'high' = 'low';
    let description = 'Potential risk indicators detected';

    if (allRiskIndicators.length > 0) {
      severity = allRiskIndicators.some(r => r.severity === 'high') ? 'high' : 'medium';
      evidence.push(`${allRiskIndicators.length} risk indicators in speech`);
      recommendations.push('Conduct thorough risk assessment');
      recommendations.push('Consider safety planning if appropriate');
    }

    if (recentBehavioralMarkers.some(marker => marker.includes('distress'))) {
      evidence.push('Visual indicators of distress observed');
      recommendations.push('Check in with client about current emotional state');
    }

    return {
      type: 'risk',
      severity,
      confidence: 0.95,
      description,
      evidence,
      recommendations,
      timestamp: Date.now()
    };
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumXX += i * i;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope * (n - 1); // Trend over the time period
  }

  clearBuffers(): void {
    this.videoDataBuffer = [];
    this.transcriptDataBuffer = [];
  }

  getVideoDataCount(): number {
    return this.videoDataBuffer.length;
  }

  getTranscriptDataCount(): number {
    return this.transcriptDataBuffer.length;
  }
}