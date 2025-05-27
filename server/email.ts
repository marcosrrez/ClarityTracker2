import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface FeedbackEmailData {
  type: 'bug' | 'feature' | 'general';
  subject: string;
  description: string;
  userEmail?: string;
  userId?: string;
  timestamp: Date;
}

export async function sendFeedbackNotification(feedbackData: FeedbackEmailData): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return false;
    }

    const { type, subject, description, userEmail, userId, timestamp } = feedbackData;
    
    // Determine the feedback type emoji and color
    const typeInfo = {
      bug: { emoji: '🐛', label: 'Bug Report', color: '#ef4444' },
      feature: { emoji: '💡', label: 'Feature Request', color: '#3b82f6' },
      general: { emoji: '💬', label: 'General Feedback', color: '#6b7280' }
    };

    const info = typeInfo[type];
    
    // Create a professional email template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${info.color}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .footer { background: #6b7280; color: white; padding: 15px; border-radius: 0 0 8px 8px; font-size: 14px; }
            .badge { background: ${info.color}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: 600; color: #374151; }
            .value { background: white; padding: 10px; border: 1px solid #d1d5db; border-radius: 4px; margin-top: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>${info.emoji} New ${info.label} - ClarityLog</h2>
              <p style="margin: 0; opacity: 0.9;">Submitted ${timestamp.toLocaleString()}</p>
            </div>
            
            <div class="content">
              <div class="field">
                <div class="label">Type:</div>
                <div><span class="badge">${info.label}</span></div>
              </div>
              
              <div class="field">
                <div class="label">Subject:</div>
                <div class="value">${subject}</div>
              </div>
              
              <div class="field">
                <div class="label">Description:</div>
                <div class="value" style="white-space: pre-wrap;">${description}</div>
              </div>
              
              ${userEmail ? `
                <div class="field">
                  <div class="label">User Email:</div>
                  <div class="value"><a href="mailto:${userEmail}">${userEmail}</a></div>
                </div>
              ` : ''}
              
              ${userId ? `
                <div class="field">
                  <div class="label">User ID:</div>
                  <div class="value">${userId}</div>
                </div>
              ` : ''}
            </div>
            
            <div class="footer">
              <p style="margin: 0;">
                This feedback was submitted through ClarityLog. 
                ${userEmail ? 'You can reply directly to the user\'s email above.' : 'No contact email was provided.'}
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: 'ClarityLog <feedback@claritylog.net>',
      to: ['leadershipcoachmarcos@gmail.com'],
      subject: `${info.emoji} ${info.label}: ${subject}`,
      html: htmlContent,
      text: `
        New ${info.label} from ClarityLog
        
        Type: ${info.label}
        Subject: ${subject}
        
        Description:
        ${description}
        
        ${userEmail ? `User Email: ${userEmail}` : 'No contact email provided'}
        ${userId ? `User ID: ${userId}` : ''}
        
        Submitted: ${timestamp.toLocaleString()}
      `
    });

    console.log('Feedback email sent successfully:', result);
    return true;

  } catch (error) {
    console.error('Error sending feedback email:', error);
    return false;
  }
}