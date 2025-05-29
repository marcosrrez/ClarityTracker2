import { SMSEntryParser } from './sms-parser';
import { storage } from './storage';

interface PendingEntry {
  userId: string;
  parsedEntry: any;
  phoneNumber: string;
  timestamp: Date;
}

// Store pending entries temporarily
const pendingEntries = new Map<string, PendingEntry>();

export class SMSService {
  
  // Handle incoming SMS messages
  static async handleIncomingSMS(phoneNumber: string, messageBody: string): Promise<string> {
    try {
      // Clean up phone number format
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      
      // Check if this is a confirmation response
      if (messageBody.toUpperCase().includes('CONFIRM')) {
        return await this.handleConfirmation(cleanPhone, true);
      }
      
      if (messageBody.toUpperCase().includes('CANCEL')) {
        return await this.handleConfirmation(cleanPhone, false);
      }
      
      // Parse the entry from SMS
      const parsed = SMSEntryParser.parseEntryText(messageBody);
      
      if (!parsed.isValid) {
        return this.generateHelpMessage();
      }
      
      // Find user by phone number (you'll need to add phone to user profiles)
      const userId = await this.findUserByPhone(cleanPhone);
      
      if (!userId) {
        return `📱 Phone number not registered with ClarityLog. Please add this number in your account settings at claritylog.net, then try again.`;
      }
      
      // Store pending entry
      const entryKey = `${cleanPhone}_${Date.now()}`;
      pendingEntries.set(entryKey, {
        userId,
        parsedEntry: parsed,
        phoneNumber: cleanPhone,
        timestamp: new Date()
      });
      
      // Clean up old pending entries (older than 10 minutes)
      this.cleanupPendingEntries();
      
      return SMSEntryParser.generateConfirmation(parsed);
      
    } catch (error) {
      console.error('SMS processing error:', error);
      return '❌ Error processing your message. Please try again or log your hours at claritylog.net';
    }
  }
  
  // Handle confirmation/cancellation
  private static async handleConfirmation(phoneNumber: string, confirmed: boolean): Promise<string> {
    try {
      // Find the most recent pending entry for this phone number
      let latestEntry: PendingEntry | null = null;
      let latestKey = '';
      
      for (const [key, entry] of pendingEntries.entries()) {
        if (entry.phoneNumber === phoneNumber) {
          if (!latestEntry || entry.timestamp > latestEntry.timestamp) {
            latestEntry = entry;
            latestKey = key;
          }
        }
      }
      
      if (!latestEntry) {
        return '❓ No pending entry found. Send a new entry to log your hours.\n\nExample: "May 28, 2025, 3 hours, individual therapy CBT session"';
      }
      
      // Remove from pending
      pendingEntries.delete(latestKey);
      
      if (!confirmed) {
        return '❌ Entry cancelled. Send a new message to log your hours.';
      }
      
      // Convert to log entry and save
      const logEntry = SMSEntryParser.toLogEntry(latestEntry.parsedEntry, latestEntry.userId);
      
      if (!logEntry) {
        return '❌ Error creating entry. Please try again.';
      }
      
      // Save to database (you'll need to implement this)
      await this.saveLogEntry(latestEntry.userId, logEntry);
      
      const hours = logEntry.clientContactHours || logEntry.supervisionHours;
      const date = logEntry.dateOfContact.toLocaleDateString();
      
      return `✅ Entry saved successfully!
📅 Date: ${date}
⏰ Hours: ${hours}
📱 View all entries at claritylog.net`;
      
    } catch (error) {
      console.error('Confirmation error:', error);
      return '❌ Error saving entry. Please try logging manually at claritylog.net';
    }
  }
  
  // Find user by phone number
  private static async findUserByPhone(phoneNumber: string): Promise<string | null> {
    try {
      // This would query your user database for the phone number
      // You'll need to add a phone field to user profiles
      // For now, return null - user needs to register their phone
      return null;
    } catch (error) {
      console.error('User lookup error:', error);
      return null;
    }
  }
  
  // Save log entry to database
  private static async saveLogEntry(userId: string, entry: any): Promise<void> {
    try {
      // Use your existing createLogEntry function
      // await createLogEntry(userId, entry);
      console.log('Would save entry:', { userId, entry });
    } catch (error) {
      console.error('Save entry error:', error);
      throw error;
    }
  }
  
  // Clean up old pending entries
  private static cleanupPendingEntries(): void {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    for (const [key, entry] of pendingEntries.entries()) {
      if (entry.timestamp < tenMinutesAgo) {
        pendingEntries.delete(key);
      }
    }
  }
  
  // Generate help message
  private static generateHelpMessage(): string {
    return `📱 ClarityLog SMS Entry Help

Format: Date, Hours, Type, Notes

Examples:
• "May 28, 2025, 3 hours, individual therapy CBT session"
• "Today, 2.5 direct hours, group therapy anxiety focus"
• "Yesterday, 1.5h supervision with Dr. Smith"

Supported types:
• Individual, Group, Family therapy
• Supervision, Assessment
• Documentation

Need help? Visit claritylog.net or email support@claritylog.net`;
  }
  
  // Send SMS using Twilio
  static async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !fromNumber) {
        console.error('Missing Twilio credentials');
        return false;
      }

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: phoneNumber,
          Body: message,
        }),
      });

      if (response.ok) {
        console.log(`SMS sent successfully to ${phoneNumber}`);
        return true;
      } else {
        const error = await response.text();
        console.error('Twilio API error:', error);
        return false;
      }
    } catch (error) {
      console.error('SMS send error:', error);
      return false;
    }
  }
}

// Webhook endpoint for Twilio SMS
export const handleTwilioWebhook = async (req: any, res: any) => {
  try {
    const { From: phoneNumber, Body: messageBody } = req.body;
    
    if (!phoneNumber || !messageBody) {
      return res.status(400).send('Missing phone number or message body');
    }
    
    const response = await SMSService.handleIncomingSMS(phoneNumber, messageBody);
    
    // Respond with TwiML
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${response}</Message>
</Response>`;
    
    res.type('text/xml');
    res.send(twiml);
    
  } catch (error) {
    console.error('Twilio webhook error:', error);
    res.status(500).send('Internal server error');
  }
};