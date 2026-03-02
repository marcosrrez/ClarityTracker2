import OpenAI from 'openai';

// PII Detection and Anonymization Engine
// Integrates seamlessly with existing Privacy-First Intelligence Architecture

interface PIIPattern {
  type: string;
  pattern: RegExp;
  replacement: string;
  preserveContext?: boolean;
}

interface AnonymizationResult {
  originalText: string;
  anonymizedText: string;
  detectedPII: Array<{
    type: string;
    original: string;
    replacement: string;
    startIndex: number;
    endIndex: number;
  }>;
  preservedContext: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

interface AnonymizationSettings {
  automaticAnonymization: boolean;
  detectionLevel: 'basic' | 'standard' | 'comprehensive';
  preserveTherapeuticContext: boolean;
  reviewRequired: boolean;
  customRules: string[];
}

export class PIIAnonymizer {
  private openai: OpenAI;
  private basicPatterns: PIIPattern[];
  private standardPatterns: PIIPattern[];
  private comprehensivePatterns: PIIPattern[];

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.initializePatterns();
  }

  private initializePatterns() {
    // Basic PII patterns - essential identifiers
    this.basicPatterns = [
      {
        type: 'name',
        pattern: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g,
        replacement: '[CLIENT NAME]',
        preserveContext: true
      },
      {
        type: 'phone',
        pattern: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
        replacement: '[PHONE NUMBER]'
      },
      {
        type: 'email',
        pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        replacement: '[EMAIL ADDRESS]'
      },
      {
        type: 'ssn',
        pattern: /\b\d{3}-?\d{2}-?\d{4}\b/g,
        replacement: '[SSN]'
      }
    ];

    // Standard patterns - common identifiers in therapy
    this.standardPatterns = [
      ...this.basicPatterns,
      {
        type: 'address',
        pattern: /\d+\s+[A-Za-z0-9\s,]+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Way|Court|Ct|Place|Pl)\b/gi,
        replacement: '[ADDRESS]'
      },
      {
        type: 'workplace',
        pattern: /\b(works at|employed by|job at|company called)\s+([A-Z][A-Za-z\s&]+)\b/gi,
        replacement: '$1 [WORKPLACE]'
      },
      {
        type: 'school',
        pattern: /\b(attends|goes to|student at|studies at)\s+([A-Z][A-Za-z\s]+(?:School|University|College|Academy))\b/gi,
        replacement: '$1 [EDUCATIONAL INSTITUTION]'
      },
      {
        type: 'family_member',
        pattern: /\b(my|her|his)\s+(mother|father|mom|dad|sister|brother|husband|wife|son|daughter|partner)\s+([A-Z][a-z]+)\b/gi,
        replacement: '$1 $2 [FAMILY MEMBER]'
      }
    ];

    // Comprehensive patterns - detailed therapeutic context
    this.comprehensivePatterns = [
      ...this.standardPatterns,
      {
        type: 'medical_record',
        pattern: /\b(MRN|medical record|patient ID|chart number)[\s:#]*([A-Z0-9]{6,})\b/gi,
        replacement: '$1 [MEDICAL ID]'
      },
      {
        type: 'insurance',
        pattern: /\b(insurance|policy number|member ID)[\s:#]*([A-Z0-9]{8,})\b/gi,
        replacement: '$1 [INSURANCE ID]'
      },
      {
        type: 'therapist_name',
        pattern: /\b(Dr\.|Doctor|therapist|counselor)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/gi,
        replacement: '$1 [PROVIDER NAME]'
      },
      {
        type: 'specific_location',
        pattern: /\b(lives in|from|moved to|visiting)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),?\s+(CA|NY|TX|FL|IL|PA|OH|GA|NC|MI|NJ|VA|WA|AZ|MA|TN|IN|MO|MD|WI|CO|MN|SC|AL|LA|KY|OR|OK|CT|IA|MS|AR|UT|KS|NV|NM|NE|WV|ID|HI|NH|ME|MT|RI|DE|SD|ND|AK|VT|WY)\b/gi,
        replacement: '$1 [LOCATION]'
      }
    ];
  }

  async anonymizeText(
    text: string, 
    settings: AnonymizationSettings,
    sessionContext?: any
  ): Promise<AnonymizationResult> {
    if (!settings?.automaticAnonymization || !text?.trim()) {
      return {
        originalText: text,
        anonymizedText: text,
        detectedPII: [],
        preservedContext: [],
        riskLevel: 'low'
      };
    }

    const patterns = this.getPatterns(settings.detectionLevel);
    let anonymizedText = text;
    const detectedPII: any[] = [];
    const preservedContext: string[] = [];

    // Apply pattern-based anonymization
    for (const pattern of patterns) {
      const matches = Array.from(text.matchAll(pattern.pattern));
      
      for (const match of matches) {
        if (match.index !== undefined) {
          const original = match[0];
          let replacement = pattern.replacement;
          
          // Apply contextual replacement logic
          if (pattern.preserveContext && settings.preserveTherapeuticContext) {
            replacement = await this.getContextualReplacement(
              original, 
              pattern.type, 
              text,
              sessionContext
            );
          }

          detectedPII.push({
            type: pattern.type,
            original,
            replacement,
            startIndex: match.index,
            endIndex: match.index + original.length
          });

          anonymizedText = anonymizedText.replace(original, replacement);
        }
      }
    }

    // AI-powered contextual anonymization for missed patterns
    if (settings.detectionLevel === 'comprehensive') {
      const aiResult = await this.aiBasedAnonymization(anonymizedText, settings);
      anonymizedText = aiResult.text;
      detectedPII.push(...aiResult.additionalPII);
    }

    // Risk assessment
    const riskLevel = this.assessRiskLevel(detectedPII);

    return {
      originalText: text,
      anonymizedText,
      detectedPII,
      preservedContext,
      riskLevel
    };
  }

  private getPatterns(level: string): PIIPattern[] {
    switch (level) {
      case 'basic':
        return this.basicPatterns;
      case 'comprehensive':
        return this.comprehensivePatterns;
      default:
        return this.standardPatterns;
    }
  }

  private async getContextualReplacement(
    original: string,
    type: string,
    fullText: string,
    sessionContext?: any
  ): Promise<string> {
    // Generate consistent pseudonyms within session context
    const sessionId = sessionContext?.sessionId || 'default';
    
    switch (type) {
      case 'name':
        return this.generateConsistentPseudonym(original, sessionId);
      case 'workplace':
        return '[WORKPLACE]';
      case 'family_member':
        return '[FAMILY MEMBER]';
      default:
        return `[${type.toUpperCase()}]`;
    }
  }

  private generateConsistentPseudonym(name: string, sessionId: string): string {
    // Simple hash-based consistent pseudonym generation
    const hash = this.simpleHash(name + sessionId);
    const pseudonyms = ['Client A', 'Client B', 'Individual C', 'Person D', 'Individual E'];
    return pseudonyms[hash % pseudonyms.length];
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  private async aiBasedAnonymization(
    text: string,
    settings: AnonymizationSettings
  ): Promise<{ text: string; additionalPII: any[] }> {
    try {
      const prompt = `
        Analyze the following therapy session text for any remaining personally identifiable information (PII) that may have been missed by pattern matching. 

        Preserve therapeutic context while removing:
        - Any remaining names, addresses, or contact information
        - Specific institutional names (schools, workplaces, medical facilities)
        - Dates that could identify individuals
        - Any other identifying details

        Replace with generic terms that maintain clinical meaning.
        
        Text: "${text}"
        
        Return only the anonymized text, maintaining the same structure and therapeutic content.
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
        temperature: 0.1
      });

      const aiAnonymizedText = response.choices[0]?.message?.content || text;
      
      return {
        text: aiAnonymizedText,
        additionalPII: [] // Could implement diff detection here
      };
    } catch (error) {
      console.error('AI anonymization error:', error);
      return { text, additionalPII: [] };
    }
  }

  private assessRiskLevel(detectedPII: any[]): 'low' | 'medium' | 'high' {
    const highRiskTypes = ['ssn', 'medical_record', 'insurance'];
    const mediumRiskTypes = ['name', 'phone', 'email', 'address'];
    
    const hasHighRisk = detectedPII.some(pii => highRiskTypes.includes(pii.type));
    const hasMediumRisk = detectedPII.some(pii => mediumRiskTypes.includes(pii.type));
    const totalPII = detectedPII.length;

    if (hasHighRisk || totalPII > 10) return 'high';
    if (hasMediumRisk || totalPII > 5) return 'medium';
    return 'low';
  }

  // Integration method for existing session processing pipeline
  async processSessionData(
    sessionData: any,
    userSettings: AnonymizationSettings
  ): Promise<any> {
    if (!userSettings?.automaticAnonymization) {
      return sessionData;
    }

    const processed = { ...sessionData };

    // Anonymize transcription data
    if (processed.transcriptionData?.text) {
      const result = await this.anonymizeText(
        processed.transcriptionData.text,
        userSettings,
        { sessionId: processed.sessionId }
      );
      
      processed.transcriptionData = {
        ...processed.transcriptionData,
        text: result.anonymizedText,
        originalText: userSettings.reviewRequired ? result.originalText : undefined,
        anonymizationMetadata: {
          detectedPII: result.detectedPII,
          riskLevel: result.riskLevel,
          processedAt: new Date()
        }
      };
    }

    // Anonymize clinical insights
    if (processed.clinicalInsights?.notes) {
      const result = await this.anonymizeText(
        processed.clinicalInsights.notes,
        userSettings,
        { sessionId: processed.sessionId }
      );
      
      processed.clinicalInsights.notes = result.anonymizedText;
    }

    return processed;
  }
}

// Export singleton instance
export const piiAnonymizer = new PIIAnonymizer();