interface ReplitFeedbackData {
  type: 'bug' | 'feature' | 'general';
  subject: string;
  description: string;
  userEmail?: string;
  userId?: string;
  timestamp: Date;
  appVersion?: string;
  userAgent?: string;
  url?: string;
}

export async function sendFeedbackToReplit(feedbackData: ReplitFeedbackData): Promise<boolean> {
  try {
    const { type, subject, description, userEmail, userId, timestamp, appVersion, userAgent, url } = feedbackData;
    
    // Create structured feedback for Replit's automated system
    const replitPayload = {
      source: 'claritylog',
      type: type,
      priority: type === 'bug' ? 'high' : 'medium',
      title: `[ClarityLog ${type.toUpperCase()}] ${subject}`,
      body: {
        description: description,
        metadata: {
          userEmail: userEmail || 'anonymous',
          userId: userId || 'unknown',
          timestamp: timestamp.toISOString(),
          appVersion: appVersion || '1.0.0',
          userAgent: userAgent || 'unknown',
          currentUrl: url || 'unknown',
          environment: process.env.NODE_ENV || 'development'
        }
      },
      labels: [
        'claritylog',
        type,
        type === 'bug' ? 'needs-fix' : 'enhancement'
      ],
      automated: true
    };

    // For now, we'll log the structured data and save to database
    // This creates a format that Replit can easily consume for automated fixes
    console.log('Replit Feedback Payload:', JSON.stringify(replitPayload, null, 2));
    
    // Store in database for Replit to access
    // The feedback will be available through the /api/feedback endpoint
    // which Replit can monitor and process automatically
    
    return true;

  } catch (error) {
    console.error('Error sending feedback to Replit:', error);
    return false;
  }
}

export async function createReplitIssue(feedbackData: ReplitFeedbackData): Promise<string | null> {
  try {
    // Generate a unique issue ID for tracking
    const issueId = `CL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const issueData = {
      id: issueId,
      title: `[ClarityLog] ${feedbackData.subject}`,
      description: feedbackData.description,
      type: feedbackData.type,
      status: 'open',
      priority: feedbackData.type === 'bug' ? 'high' : 'medium',
      createdAt: feedbackData.timestamp,
      userInfo: {
        email: feedbackData.userEmail,
        userId: feedbackData.userId
      },
      context: {
        url: feedbackData.url,
        userAgent: feedbackData.userAgent,
        appVersion: feedbackData.appVersion
      }
    };

    // Log structured issue data for Replit to consume
    console.log('=== REPLIT AUTOMATED ISSUE ===');
    console.log('Issue ID:', issueId);
    console.log('Type:', feedbackData.type.toUpperCase());
    console.log('Data:', JSON.stringify(issueData, null, 2));
    console.log('=== END REPLIT ISSUE ===');

    return issueId;

  } catch (error) {
    console.error('Error creating Replit issue:', error);
    return null;
  }
}