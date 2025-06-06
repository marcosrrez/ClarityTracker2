import { sendEmail } from './email';

interface EmailCampaignData {
  userEmail: string;
  userName: string;
  userType: 'individual' | 'supervisor' | 'enterprise';
  signupDate: Date;
  daysSinceSignup: number;
}

interface CampaignEmail {
  id: string;
  dayOffset: number;
  subject: string;
  template: (data: EmailCampaignData) => string;
  condition?: (data: EmailCampaignData) => boolean;
}

// Superhuman-style educational email campaigns addressing LPC pain points
const emailCampaigns: CampaignEmail[] = [
  {
    id: 'welcome-first-session',
    dayOffset: 0,
    subject: '🎯 Your first ClarityLog entry is ready',
    template: (data) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1e40af; margin-bottom: 24px;">Welcome to ClarityLog, ${data.userName}!</h2>
        
        <p>You just took a major step toward your LPC licensure by joining thousands of counselors who track their clinical hours with confidence.</p>
        
        <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0;">
          <h3 style="margin: 0 0 8px 0; color: #1e40af;">💡 Pro Tip: The 30-Second Log</h3>
          <p style="margin: 0; color: #64748b;">Most counselors spend 5+ minutes per entry. With ClarityLog's smart defaults and quick shortcuts, you can log sessions in under 30 seconds.</p>
        </div>
        
        <p><strong>Your next session is coming up.</strong> When it's done, try logging it immediately while the details are fresh. You'll be amazed at how quick it becomes.</p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.REPLIT_DOMAINS || 'https://your-app.replit.app'}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">Log Your First Session</a>
        </div>
        
        <p style="color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 32px;">
          Tomorrow, I'll share how to use AI insights to prepare for supervision meetings.
        </p>
      </div>
    `
  },

  {
    id: 'ai-supervision-prep',
    dayOffset: 1,
    subject: '🧠 How AI insights transform supervision meetings',
    condition: (data) => data.userType === 'individual',
    template: (data) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1e40af; margin-bottom: 24px;">Hey ${data.userName},</h2>
        
        <p>Yesterday you joined ClarityLog. Today, let me show you something that will change how you approach supervision.</p>
        
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0;">
          <h3 style="margin: 0 0 8px 0; color: #92400e;">⚡ Supervision Game-Changer</h3>
          <p style="margin: 0; color: #92400e;">Instead of scrambling to remember case details, ClarityLog's AI analyzes your patterns and generates supervision talking points automatically.</p>
        </div>
        
        <p><strong>Here's what Sarah, an LAC in Austin, told me:</strong></p>
        <blockquote style="border-left: 3px solid #e5e7eb; padding-left: 16px; margin: 16px 0; font-style: italic; color: #6b7280;">
          "My supervisor was impressed when I came prepared with specific growth areas and intervention success rates. The AI insights made me look like I had my act together."
        </blockquote>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.REPLIT_DOMAINS || 'https://your-app.replit.app'}/ai-insights" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">See Your AI Insights</a>
        </div>
        
        <p style="color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 32px;">
          Coming up: How to track progress that actually impresses state boards.
        </p>
      </div>
    `
  },

  {
    id: 'progress-tracking-mastery',
    dayOffset: 3,
    subject: '📊 The progress tracking method state boards love',
    template: (data) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1e40af; margin-bottom: 24px;">${data.userName}, this changes everything</h2>
        
        <p>I just got off a call with a licensing board member in Texas. She told me the #1 reason LPC applications get delayed:</p>
        
        <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0;">
          <h3 style="margin: 0 0 8px 0; color: #dc2626;">🚨 Application Killer</h3>
          <p style="margin: 0; color: #dc2626;">"Inconsistent documentation that doesn't show clear professional development progression."</p>
        </div>
        
        <p>ClarityLog solves this with automatic competency tracking that maps directly to state requirements.</p>
        
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <h3 style="margin: 0 0 12px 0; color: #15803d;">✅ What sets you apart:</h3>
          <ul style="margin: 0; color: #15803d; padding-left: 20px;">
            <li>Competency progression charts</li>
            <li>Intervention success tracking</li>
            <li>Supervisor feedback integration</li>
            <li>Automated compliance reports</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.REPLIT_DOMAINS || 'https://your-app.replit.app'}/reports" style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">View Your Progress Report</a>
        </div>
        
        <p style="color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 32px;">
          Next: Supervisor collaboration features that strengthen your professional relationships.
        </p>
      </div>
    `
  },

  {
    id: 'supervisor-collaboration',
    dayOffset: 5,
    subject: '🤝 Turn your supervisor into your biggest advocate',
    condition: (data) => data.userType === 'individual',
    template: (data) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1e40af; margin-bottom: 24px;">The collaboration secret, ${data.userName}</h2>
        
        <p>Here's what most LACs get wrong: They treat supervision like a check-the-box requirement instead of a career accelerator.</p>
        
        <p><strong>Smart LACs use ClarityLog's collaboration features to:</strong></p>
        
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
            <div style="background: #3b82f6; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 12px; font-weight: bold;">1</div>
            <div>
              <h4 style="margin: 0 0 4px 0; color: #1e293b;">Share progress automatically</h4>
              <p style="margin: 0; color: #64748b; font-size: 14px;">Your supervisor sees your growth in real-time, not just during meetings</p>
            </div>
          </div>
          
          <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
            <div style="background: #3b82f6; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 12px; font-weight: bold;">2</div>
            <div>
              <h4 style="margin: 0 0 4px 0; color: #1e293b;">Get targeted feedback</h4>
              <p style="margin: 0; color: #64748b; font-size: 14px;">AI identifies your growth areas so supervision focuses on what matters</p>
            </div>
          </div>
          
          <div style="display: flex; align-items: flex-start;">
            <div style="background: #3b82f6; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 12px; font-weight: bold;">3</div>
            <div>
              <h4 style="margin: 0 0 4px 0; color: #1e293b;">Build stronger references</h4>
              <p style="margin: 0; color: #64748b; font-size: 14px;">Supervisors remember LACs who make their job easier</p>
            </div>
          </div>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.REPLIT_DOMAINS || 'https://your-app.replit.app'}/supervisors" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">Set Up Collaboration</a>
        </div>
        
        <p style="color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 32px;">
          Final email: Advanced techniques that separate good LACs from great ones.
        </p>
      </div>
    `
  },

  {
    id: 'advanced-techniques',
    dayOffset: 7,
    subject: '🚀 The advanced techniques that set you apart',
    template: (data) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1e40af; margin-bottom: 24px;">You're ready for this, ${data.userName}</h2>
        
        <p>It's been a week since you joined ClarityLog. By now, you've seen how it simplifies hour tracking and supervision prep.</p>
        
        <p><strong>But here's what separates good LACs from exceptional ones:</strong></p>
        
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; padding: 24px; margin: 24px 0;">
          <h3 style="margin: 0 0 16px 0;">🎯 Advanced ClarityLog Techniques</h3>
          
          <div style="margin-bottom: 12px;">
            <strong>1. Pattern Recognition:</strong> Use AI insights to identify your most effective interventions
          </div>
          
          <div style="margin-bottom: 12px;">
            <strong>2. Competency Mapping:</strong> Track growth against specific licensing requirements
          </div>
          
          <div style="margin-bottom: 12px;">
            <strong>3. Outcome Correlation:</strong> Connect your approaches to client progress
          </div>
          
          <div>
            <strong>4. Professional Portfolio:</strong> Build a comprehensive record for job interviews
          </div>
        </div>
        
        <p>These aren't just features—they're your competitive advantage in a crowded field.</p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.REPLIT_DOMAINS || 'https://your-app.replit.app'}/intelligence-hub" style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">Explore Advanced Features</a>
        </div>
        
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <h3 style="margin: 0 0 12px 0; color: #1e293b;">Questions? I'm here to help.</h3>
          <p style="margin: 0; color: #64748b;">Reply to this email or reach out anytime. I personally read every message and respond within 24 hours.</p>
        </div>
        
        <p style="color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 32px;">
          Marcos Gutierrez<br>
          CEO, ClarityLog
        </p>
      </div>
    `
  },

  // Supervisor-specific campaign
  {
    id: 'supervisor-welcome',
    dayOffset: 0,
    subject: '🎯 Welcome to supervisor excellence, ${data.userName}',
    condition: (data) => data.userType === 'supervisor',
    template: (data) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1e40af; margin-bottom: 24px;">Welcome to ClarityLog, ${data.userName}!</h2>
        
        <p>As a clinical supervisor, you're shaping the next generation of mental health professionals. ClarityLog amplifies your impact.</p>
        
        <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 24px 0;">
          <h3 style="margin: 0 0 8px 0; color: #15803d;">🚀 Supervisor Superpowers</h3>
          <p style="margin: 0; color: #15803d;">Track multiple supervisees, identify growth patterns, and ensure compliance—all from one dashboard.</p>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.REPLIT_DOMAINS || 'https://your-app.replit.app'}/supervisees" style="background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">Set Up Your Dashboard</a>
        </div>
        
        <p style="color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 32px;">
          Tomorrow: How to invite supervisees and streamline compliance tracking.
        </p>
      </div>
    `
  },

  {
    id: 'supervisor-compliance',
    dayOffset: 2,
    subject: '📋 Compliance tracking that actually works',
    condition: (data) => data.userType === 'supervisor',
    template: (data) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1e40af; margin-bottom: 24px;">The compliance breakthrough, ${data.userName}</h2>
        
        <p>I spoke with Dr. Martinez, a supervisor in California managing 8 LACs. Her biggest pain point? Compliance audits.</p>
        
        <blockquote style="border-left: 3px solid #e5e7eb; padding-left: 16px; margin: 16px 0; font-style: italic; color: #6b7280;">
          "Before ClarityLog, preparing for audits meant weeks of scrambling through scattered documentation. Now it takes 30 minutes."
        </blockquote>
        
        <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <h3 style="margin: 0 0 12px 0; color: #92400e;">⚡ Automatic Compliance Features:</h3>
          <ul style="margin: 0; color: #92400e; padding-left: 20px;">
            <li>Real-time hour verification</li>
            <li>Competency progression tracking</li>
            <li>Automated supervision documentation</li>
            <li>State-specific requirement monitoring</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.REPLIT_DOMAINS || 'https://your-app.replit.app'}/compliance" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">View Compliance Dashboard</a>
        </div>
        
        <p style="color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 32px;">
          Next: Advanced analytics that improve your supervision effectiveness.
        </p>
      </div>
    `
  },
  
  {
    id: 'ai-supervision-prep',
    dayOffset: 1,
    subject: '🧠 Turn your notes into supervision gold',
    template: (data) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #7c3aed; margin-bottom: 24px;">Hi ${data.userName},</h2>
        
        <p><strong>Supervision meetings feeling scattered?</strong> You're not alone. Most LACs struggle to present their cases clearly and get the guidance they need.</p>
        
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 12px; margin: 24px 0;">
          <h3 style="margin: 0 0 12px 0; color: #92400e;">The Problem:</h3>
          <p style="margin: 0; color: #92400e;">"I have all these session notes, but I can't remember what patterns I'm seeing or what specific guidance I need."</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); padding: 20px; border-radius: 12px; margin: 24px 0;">
          <h3 style="margin: 0 0 12px 0; color: #3730a3;">The Solution: AI-Powered Insights</h3>
          <p style="margin: 0; color: #3730a3;">ClarityLog's AI analyzes your session patterns and generates specific talking points for supervision. No more "um, I'm not sure what to discuss."</p>
        </div>
        
        <p><strong>Try this before your next supervision:</strong></p>
        <ol style="color: #374151; line-height: 1.6;">
          <li>Log 2-3 recent sessions in ClarityLog</li>
          <li>Click "AI Insights" to see patterns and growth areas</li>
          <li>Use the generated supervision prep notes in your meeting</li>
        </ol>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.REPLIT_DOMAINS || 'https://your-app.replit.app'}/insights" style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">Try AI Insights Now</a>
        </div>
        
        <p style="color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 32px;">
          Tomorrow: How to never miss a licensure requirement again.
        </p>
      </div>
    `
  },
  
  {
    id: 'progress-tracking',
    dayOffset: 2,
    subject: '📊 Never miss a licensure requirement again',
    template: (data) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #059669; margin-bottom: 24px;">Hi ${data.userName},</h2>
        
        <p><strong>Horror story:</strong> An LAC discovers 6 months before their deadline that they miscounted their hours and are 200 hours short of the requirement.</p>
        
        <p>This happens more often than you think. Spreadsheets break. Requirements change. Calculations get messy.</p>
        
        <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); padding: 20px; border-radius: 12px; margin: 24px 0;">
          <h3 style="margin: 0 0 12px 0; color: #991b1b;">The Hidden Costs:</h3>
          <ul style="margin: 0; color: #991b1b;">
            <li>Delayed licensure = delayed income increases</li>
            <li>Stress and anxiety about meeting deadlines</li>
            <li>Last-minute scrambling for missing hours</li>
          </ul>
        </div>
        
        <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 20px; border-radius: 12px; margin: 24px 0;">
          <h3 style="margin: 0 0 12px 0; color: #065f46;">ClarityLog's Promise:</h3>
          <p style="margin: 0; color: #065f46;">Always know exactly where you stand. Real-time progress tracking with state-specific requirements means no surprises, ever.</p>
        </div>
        
        <p><strong>Check your progress right now:</strong></p>
        <ol style="color: #374151; line-height: 1.6;">
          <li>View your personalized dashboard</li>
          <li>See exactly how many hours you need in each category</li>
          <li>Get timeline projections for your licensure date</li>
        </ol>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.REPLIT_DOMAINS || 'https://your-app.replit.app'}/dashboard" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">Check Your Progress</a>
        </div>
        
        <p style="color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 32px;">
          Tomorrow: The fastest way to log sessions (hint: it's not what you think).
        </p>
      </div>
    `
  },
  
  {
    id: 'speed-logging',
    dayOffset: 3,
    subject: '⚡ Log sessions 10x faster with this trick',
    template: (data) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #dc2626; margin-bottom: 24px;">Hi ${data.userName},</h2>
        
        <p><strong>Quick question:</strong> How long does it take you to log a session right now?</p>
        
        <p>If you're like most counselors, it's probably 3-5 minutes. Some take even longer, especially when trying to remember details from sessions that happened days ago.</p>
        
        <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); padding: 20px; border-radius: 12px; margin: 24px 0;">
          <h3 style="margin: 0 0 12px 0; color: #92400e;">The 30-Second Method:</h3>
          <ol style="margin: 0; color: #92400e;">
            <li><strong>Log immediately</strong> after each session (while walking to your car)</li>
            <li><strong>Use voice notes</strong> for quick capture on mobile</li>
            <li><strong>Let AI fill in patterns</strong> you've established</li>
          </ol>
        </div>
        
        <p><strong>Real user story:</strong> "I used to spend 20 minutes every Friday trying to remember and log my week's sessions. Now I log each one in 30 seconds right after it happens. Game changer." - Sarah M., LAC</p>
        
        <div style="background: #f1f5f9; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0;">
          <h3 style="margin: 0 0 8px 0; color: #1e40af;">💡 Pro Tip: The Mobile Advantage</h3>
          <p style="margin: 0; color: #64748b;">ClarityLog works perfectly on your phone. Log sessions during the 2-minute walk between clients.</p>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.REPLIT_DOMAINS || 'https://your-app.replit.app'}/entries/new" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">Try Speed Logging Now</a>
        </div>
        
        <p style="color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 32px;">
          Tomorrow: How top LACs use ClarityLog to accelerate their professional growth.
        </p>
      </div>
    `
  },
  
  {
    id: 'professional-growth',
    dayOffset: 4,
    subject: '🌱 From LAC to LPC: The fast track',
    template: (data) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #7c3aed; margin-bottom: 24px;">Hi ${data.userName},</h2>
        
        <p><strong>The difference between LACs who get licensed quickly and those who struggle isn't talent.</strong></p>
        
        <p>It's systems. The top-performing LACs have systems for tracking progress, preparing for supervision, and identifying growth areas.</p>
        
        <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 20px; border-radius: 12px; margin: 24px 0;">
          <h3 style="margin: 0 0 12px 0; color: #0c4a6e;">What Top LACs Do Differently:</h3>
          <ul style="margin: 0; color: #0c4a6e;">
            <li><strong>Track patterns,</strong> not just hours</li>
            <li><strong>Come prepared</strong> to every supervision meeting</li>
            <li><strong>Identify blind spots</strong> before supervisors do</li>
            <li><strong>Document growth</strong> for license applications</li>
          </ul>
        </div>
        
        <p><strong>ClarityLog makes this automatic.</strong> While other LACs are scrambling with spreadsheets, you're getting AI-powered insights into your development.</p>
        
        <div style="background: #fefce8; border: 1px solid #eab308; padding: 16px; border-radius: 8px; margin: 24px 0;">
          <p style="margin: 0; color: #713f12;"><strong>💡 This week's challenge:</strong> Log 3 sessions and review your AI insights. Notice patterns you hadn't seen before?</p>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.REPLIT_DOMAINS || 'https://your-app.replit.app'}/insights" style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">View Your Growth Insights</a>
        </div>
        
        <p style="color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 32px;">
          You're building something powerful, ${data.userName}. Keep going.
        </p>
      </div>
    `
  }
];

// Function to determine which emails a user should receive
export async function scheduleEmailCampaign(userData: EmailCampaignData): Promise<void> {
  for (const campaign of emailCampaigns) {
    // Check if email should be sent based on conditions
    if (campaign.condition && !campaign.condition(userData)) {
      continue;
    }
    
    // Calculate send date
    const sendDate = new Date(userData.signupDate);
    sendDate.setDate(sendDate.getDate() + campaign.dayOffset);
    
    // If it's time to send this email
    const today = new Date();
    if (sendDate.toDateString() === today.toDateString()) {
      try {
        await sendEmail({
          to: userData.userEmail,
          subject: campaign.subject,
          html: campaign.template(userData)
        });
        
        console.log(`Sent campaign email ${campaign.id} to ${userData.userEmail}`);
      } catch (error) {
        console.error(`Failed to send campaign email ${campaign.id}:`, error);
      }
    }
  }
}

// Function to send welcome email immediately after signup
export async function sendWelcomeEmail(userEmail: string, userName: string, userType: 'individual' | 'supervisor' | 'enterprise'): Promise<boolean> {
  const welcomeTemplate = emailCampaigns.find(c => c.id === 'welcome-first-session');
  if (!welcomeTemplate) return false;
  
  try {
    const emailData: EmailCampaignData = {
      userEmail,
      userName,
      userType,
      signupDate: new Date(),
      daysSinceSignup: 0
    };
    
    await sendEmail({
      to: userEmail,
      subject: welcomeTemplate.subject,
      html: welcomeTemplate.template(emailData)
    });
    
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}

// Daily function to process email campaigns
export async function processDailyCampaigns(): Promise<void> {
  // This would typically query your database for users
  // For now, this is a placeholder for the cron job functionality
  console.log('Processing daily email campaigns...');
  
  // In a real implementation, you would:
  // 1. Query database for all users
  // 2. Calculate days since signup for each user
  // 3. Call scheduleEmailCampaign for each user
  // 4. Track which emails have been sent to avoid duplicates
}