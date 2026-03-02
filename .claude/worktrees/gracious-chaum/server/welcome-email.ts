import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface WelcomeEmailData {
  userEmail: string;
  preferredName: string;
  accountType: 'individual' | 'supervisor' | 'enterprise';
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
  try {
    const subject = getEmailSubject(data.accountType, data.preferredName);
    const htmlContent = generateWelcomeEmailHTML(data);

    await resend.emails.send({
      from: 'Marcos Gutierrez <marcos@claritylog.com>',
      to: data.userEmail,
      subject: subject,
      html: htmlContent,
    });

    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}

function getEmailSubject(accountType: string, name: string): string {
  switch (accountType) {
    case 'individual':
      return `${name}, welcome to ClarityLog 🎯`;
    case 'supervisor':
      return `${name}, ready to streamline supervision? 👥`;
    case 'enterprise':
      return `${name}, let's scale your training programs 🚀`;
    default:
      return `${name}, welcome to ClarityLog`;
  }
}

function generateWelcomeEmailHTML(data: WelcomeEmailData): string {
  const { preferredName, accountType } = data;
  
  const greeting = `Hi ${preferredName},`;
  const intro = getAccountTypeIntro(accountType);
  const features = getAccountTypeFeatures(accountType);
  const nextSteps = getAccountTypeNextSteps(accountType);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to ClarityLog</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #374151; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .logo { font-size: 28px; font-weight: 600; color: #1f2937; margin-bottom: 8px; }
        .tagline { color: #6b7280; font-size: 16px; }
        .profile { display: flex; align-items: center; margin-bottom: 32px; padding: 20px; background: #f9fafb; border-radius: 12px; }
        .avatar { width: 48px; height: 48px; border-radius: 50%; margin-right: 16px; background: #3b82f6; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 18px; }
        .profile-info h3 { margin: 0; color: #1f2937; font-size: 16px; font-weight: 600; }
        .profile-info p { margin: 4px 0 0 0; color: #6b7280; font-size: 14px; }
        .content { margin-bottom: 32px; }
        .content h2 { color: #1f2937; font-size: 20px; font-weight: 600; margin-bottom: 16px; }
        .content p { margin-bottom: 16px; }
        .features { background: #f0f9ff; padding: 24px; border-radius: 12px; margin: 24px 0; }
        .features h3 { color: #0369a1; font-size: 18px; font-weight: 600; margin-bottom: 16px; }
        .feature-list { list-style: none; padding: 0; margin: 0; }
        .feature-list li { margin-bottom: 12px; padding-left: 24px; position: relative; }
        .feature-list li::before { content: '✓'; position: absolute; left: 0; color: #059669; font-weight: 600; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; margin: 24px 0; text-align: center; }
        .calendly-section { background: #fef3c7; padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center; }
        .calendly-section h3 { color: #92400e; font-size: 18px; font-weight: 600; margin-bottom: 12px; }
        .calendly-link { display: inline-block; background: #f59e0b; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin-top: 12px; }
        .footer { border-top: 1px solid #e5e7eb; padding-top: 24px; text-align: center; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">ClarityLog</div>
          <div class="tagline">Professional Development Made Simple</div>
        </div>

        <div class="profile">
          <div class="avatar">AC</div>
          <div class="profile-info">
            <h3>Alex Chen • Founder & CEO of ClarityLog</h3>
            <p>Licensed Professional Counselor, Tech Entrepreneur</p>
          </div>
        </div>

        <div class="content">
          <p>${greeting}</p>
          <p>${intro}</p>

          <div class="features">
            <h3>Here's what you can do right now:</h3>
            <ul class="feature-list">
              ${features}
            </ul>
          </div>

          <h2>Quick Start Guide 📚</h2>
          ${nextSteps}

          <div class="calendly-section">
            <h3>🗓️ Want a personal walkthrough?</h3>
            <p>I'm offering free 30-minute onboarding calls to help you get the most out of ClarityLog. We'll set up your workflow and answer any questions you have.</p>
            <a href="https://calendly.com/claritylog/onboarding" class="calendly-link">Book Your Free Onboarding Call</a>
          </div>

          <p>I'll be sending you helpful tips over the next few days to help you master ClarityLog. If you can't wait, check out our <a href="https://claritylog.com/guide">Getting Started Guide</a> or reach out anytime.</p>

          <p>Here to support your professional journey,<br>
          <strong>Marcos Gutierrez</strong><br>
          CEO, ClarityLog</p>
        </div>

        <div class="footer">
          <p>ClarityLog • Professional Development Platform for Counselors</p>
          <p>Questions? Just reply to this email - I read every message!</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getAccountTypeIntro(accountType: string): string {
  switch (accountType) {
    case 'individual':
      return "Welcome to ClarityLog — the platform that will transform how you track your journey to LPC licensure! I built this specifically for LACs who want to focus on their clients, not paperwork.";
    case 'supervisor':
      return "Welcome to ClarityLog — the supervision platform that will revolutionize how you support your supervisees! As a supervisor myself, I understand the challenge of managing multiple supervisees while maintaining quality oversight.";
    case 'enterprise':
      return "Welcome to ClarityLog — the enterprise solution that scales professional development across your entire organization! We've helped training programs improve compliance and outcomes while reducing administrative burden.";
    default:
      return "Welcome to ClarityLog — your professional development companion!";
  }
}

function getAccountTypeFeatures(accountType: string): string {
  switch (accountType) {
    case 'individual':
      return `
        <li>Log your client sessions in seconds, not minutes</li>
        <li>Get AI-powered insights from your session notes</li>
        <li>Track your progress toward licensure automatically</li>
        <li>Collaborate seamlessly with your supervisor</li>
        <li>Generate reports for state licensing boards</li>
      `;
    case 'supervisor':
      return `
        <li>Monitor all supervisees from one dashboard</li>
        <li>Get automated compliance alerts and reminders</li>
        <li>Use built-in assessment and evaluation tools</li>
        <li>Generate comprehensive supervision reports</li>
        <li>Track competency development over time</li>
      `;
    case 'enterprise':
      return `
        <li>Manage multiple training programs at scale</li>
        <li>Access advanced analytics and reporting</li>
        <li>Create custom workflows for your organization</li>
        <li>Integrate with existing HR and training systems</li>
        <li>Ensure compliance across all programs</li>
      `;
    default:
      return `
        <li>Track your professional development journey</li>
        <li>Get insights and analytics on your progress</li>
        <li>Collaborate with supervisors and colleagues</li>
      `;
  }
}

function getAccountTypeNextSteps(accountType: string): string {
  switch (accountType) {
    case 'individual':
      return `
        <p><strong>Step 1:</strong> Log in and complete your profile setup<br>
        <strong>Step 2:</strong> Log your first client session (it takes less than 30 seconds!)<br>
        <strong>Step 3:</strong> Add your supervisor to start collaborating<br>
        <strong>Step 4:</strong> Explore AI insights on your session notes</p>
      `;
    case 'supervisor':
      return `
        <p><strong>Step 1:</strong> Set up your supervisor dashboard<br>
        <strong>Step 2:</strong> Invite your supervisees to join ClarityLog<br>
        <strong>Step 3:</strong> Configure compliance alerts for your requirements<br>
        <strong>Step 4:</strong> Try the assessment tools for your next supervision session</p>
      `;
    case 'enterprise':
      return `
        <p><strong>Step 1:</strong> Schedule a demo call to discuss your specific needs<br>
        <strong>Step 2:</strong> Set up your organization's custom workflows<br>
        <strong>Step 3:</strong> Onboard your first training program<br>
        <strong>Step 4:</strong> Configure integrations with your existing systems</p>
      `;
    default:
      return `
        <p><strong>Step 1:</strong> Complete your profile setup<br>
        <strong>Step 2:</strong> Explore the main features<br>
        <strong>Step 3:</strong> Start tracking your development</p>
      `;
  }
}