import { InsertLogEntry } from "@shared/schema";

interface ParsedEntry {
  date?: Date;
  hours?: number;
  type?: string;
  notes?: string;
  isValid: boolean;
  confidence: number;
}

export class SMSEntryParser {
  
  // Main parsing function for SMS text
  static parseEntryText(message: string): ParsedEntry {
    const result: ParsedEntry = {
      isValid: false,
      confidence: 0
    };

    try {
      // Clean and normalize the message
      const cleanMessage = message.toLowerCase().trim();
      
      // Parse date
      result.date = this.extractDate(message);
      
      // Parse hours
      result.hours = this.extractHours(cleanMessage);
      
      // Parse session type
      result.type = this.extractSessionType(cleanMessage);
      
      // Extract notes (everything else)
      result.notes = this.extractNotes(message, result.date, result.hours, result.type);
      
      // Calculate confidence score
      result.confidence = this.calculateConfidence(result);
      result.isValid = result.confidence > 0.7; // 70% confidence threshold
      
      return result;
    } catch (error) {
      console.error('SMS parsing error:', error);
      return result;
    }
  }

  // Extract date from various formats
  private static extractDate(message: string): Date | undefined {
    const datePatterns = [
      // MM/DD/YYYY
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
      // MM-DD-YYYY
      /(\d{1,2})-(\d{1,2})-(\d{4})/,
      // Month DD, YYYY
      /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s+(\d{4})/i,
      // Mon DD YYYY
      /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2}),?\s+(\d{4})/i,
      // Today, yesterday
      /(today|yesterday)/i,
      // May 28, 2025 format
      /(may|april|march|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s+(\d{4})/i
    ];

    for (const pattern of datePatterns) {
      const match = message.match(pattern);
      if (match) {
        if (match[1] === 'today') {
          return new Date();
        } else if (match[1] === 'yesterday') {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          return yesterday;
        } else if (isNaN(Number(match[1]))) {
          // Month name format
          const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                             'july', 'august', 'september', 'october', 'november', 'december'];
          const shortMonths = ['jan', 'feb', 'mar', 'apr', 'may', 'jun',
                              'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
          
          const monthIndex = monthNames.indexOf(match[1].toLowerCase()) !== -1 
            ? monthNames.indexOf(match[1].toLowerCase())
            : shortMonths.indexOf(match[1].toLowerCase());
            
          if (monthIndex !== -1) {
            return new Date(Number(match[3]), monthIndex, Number(match[2]));
          }
        } else {
          // Numeric format
          return new Date(Number(match[3]), Number(match[1]) - 1, Number(match[2]));
        }
      }
    }
    
    return new Date(); // Default to today if no date found
  }

  // Extract hours with various formats
  private static extractHours(message: string): number | undefined {
    const hourPatterns = [
      // "3 hours", "2.5 hours", "1.25 direct hours"
      /(\d+\.?\d*)\s*(direct\s+)?hours?/,
      // "3h", "2.5h"
      /(\d+\.?\d*)h\b/,
      // "3 direct", "2.5 supervision"
      /(\d+\.?\d*)\s+(direct|supervision|individual|group)/,
      // Just numbers followed by relevant keywords
      /(\d+\.?\d*)\s*(cch|contact|client)/
    ];

    for (const pattern of hourPatterns) {
      const match = message.match(pattern);
      if (match) {
        const hours = parseFloat(match[1]);
        if (hours > 0 && hours <= 24) { // Reasonable hour range
          return hours;
        }
      }
    }
    
    return undefined;
  }

  // Extract session type
  private static extractSessionType(message: string): string | undefined {
    const typeKeywords = {
      'individual': ['individual', 'one-on-one', 'single', 'client session'],
      'group': ['group', 'group therapy', 'group session'],
      'family': ['family', 'family therapy', 'couples', 'marriage'],
      'supervision': ['supervision', 'supervisory', 'super'],
      'assessment': ['assessment', 'eval', 'evaluation', 'testing'],
      'documentation': ['documentation', 'notes', 'paperwork', 'charting']
    };

    for (const [type, keywords] of Object.entries(typeKeywords)) {
      for (const keyword of keywords) {
        if (message.includes(keyword)) {
          return type;
        }
      }
    }

    // Default to individual if therapy-related terms found
    const therapyTerms = ['therapy', 'session', 'client', 'counseling'];
    if (therapyTerms.some(term => message.includes(term))) {
      return 'individual';
    }
    
    return undefined;
  }

  // Extract notes by removing parsed elements
  private static extractNotes(originalMessage: string, date?: Date, hours?: number, type?: string): string {
    let notes = originalMessage;
    
    // Remove date references
    notes = notes.replace(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/g, '');
    notes = notes.replace(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}/gi, '');
    notes = notes.replace(/(today|yesterday)/gi, '');
    
    // Remove hour references
    notes = notes.replace(/\d+\.?\d*\s*(direct\s+)?hours?/gi, '');
    notes = notes.replace(/\d+\.?\d*h\b/gi, '');
    
    // Remove common session type words if they were parsed
    if (type) {
      notes = notes.replace(new RegExp(`\\b${type}\\b`, 'gi'), '');
    }
    
    // Clean up extra spaces and punctuation
    notes = notes.replace(/\s+/g, ' ').trim();
    notes = notes.replace(/^[,\.\-\s]+|[,\.\-\s]+$/g, '');
    
    return notes || 'Session logged via SMS';
  }

  // Calculate confidence score based on what was successfully parsed
  private static calculateConfidence(result: ParsedEntry): number {
    let score = 0;
    
    // Date parsing (30% weight)
    if (result.date) score += 0.3;
    
    // Hours parsing (40% weight)
    if (result.hours && result.hours > 0) score += 0.4;
    
    // Type parsing (20% weight)
    if (result.type) score += 0.2;
    
    // Notes parsing (10% weight)
    if (result.notes && result.notes.length > 5) score += 0.1;
    
    return score;
  }

  // Convert parsed result to log entry format
  static toLogEntry(parsed: ParsedEntry, userId: string): InsertLogEntry | null {
    if (!parsed.isValid || !parsed.hours) {
      return null;
    }

    const entry: InsertLogEntry = {
      dateOfContact: parsed.date || new Date(),
      clientContactHours: parsed.hours,
      supervisionHours: 0,
      supervisionType: "none",
      techAssistedSupervision: false,
      notes: parsed.notes || 'Session logged via SMS',
      createdAt: new Date(),
    };

    // Adjust based on session type
    if (parsed.type === 'supervision') {
      entry.supervisionHours = parsed.hours;
      entry.clientContactHours = 0;
      entry.supervisionType = "individual";
    }

    return entry;
  }

  // Generate confirmation message for user
  static generateConfirmation(parsed: ParsedEntry): string {
    if (!parsed.isValid) {
      return "❌ Could not parse your entry. Please try format: 'Date, Hours, Type, Notes'\nExample: 'May 28, 2025, 3 hours, individual therapy session with CBT techniques'";
    }

    const date = parsed.date?.toLocaleDateString() || 'Today';
    const hours = parsed.hours || 0;
    const type = parsed.type || 'session';
    const confidence = Math.round(parsed.confidence * 100);

    return `✅ Entry parsed (${confidence}% confidence):
📅 Date: ${date}
⏰ Hours: ${hours}
📝 Type: ${type}
💭 Notes: ${parsed.notes}

Reply "CONFIRM" to save or "CANCEL" to discard.`;
  }
}