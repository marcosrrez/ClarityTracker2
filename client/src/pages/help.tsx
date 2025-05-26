import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  HelpCircle, 
  Clock, 
  Users, 
  FileText, 
  Sparkles, 
  Settings, 
  Shield,
  ExternalLink,
  Mail,
  Bot
} from "lucide-react";

export default function HelpPage() {
  const faqItems = [
    {
      question: "How do I log my client contact hours?",
      answer: "Navigate to the 'Add Entry' page and fill out the form with your session details. Enter the date, hours, and any relevant notes. Remember to anonymize all client information to protect confidentiality."
    },
    {
      question: "What's the difference between direct and indirect hours?",
      answer: "Direct hours are face-to-face counseling sessions with clients. Indirect hours include activities like documentation, treatment planning, case consultation, and administrative tasks related to client care."
    },
    {
      question: "How does the AI analysis feature work?",
      answer: "The AI analysis tool uses Google's advanced language models to analyze your anonymized session notes and provide insights about themes, potential blind spots, and reflective prompts to enhance your clinical practice."
    },
    {
      question: "Is my data secure and HIPAA compliant?",
      answer: "Yes, your data is encrypted and stored securely using Firebase. However, you are responsible for ensuring all client information is properly anonymized before entering it into the system."
    },
    {
      question: "Can I import existing hours from before using ClarityLog?",
      answer: "Yes! Go to Settings > Import Existing Hours and enter your previous hours. These will be added to your progress tracking to give you accurate totals."
    },
    {
      question: "How do I set up supervision reminders?",
      answer: "In Settings > License Information, set your LAC license date and supervision check-in interval. The dashboard will show alerts when your next supervision session is due."
    },
    {
      question: "Can I export my data?",
      answer: "Yes, you can download your log entries as a CSV file using the Download Data feature in the sidebar. You can also export insights and notes from the Insights & Resources section."
    },
    {
      question: "What if I make a mistake in an entry?",
      answer: "Currently, you can view all your entries in the detailed log table. To edit or delete entries, please contact support. We're working on adding direct editing capabilities."
    }
  ];

  const features = [
    {
      icon: Clock,
      title: "Hour Tracking",
      description: "Log client contact hours, supervision sessions, and track progress toward licensure goals.",
      color: "text-blue-500"
    },
    {
      icon: Bot,
      title: "AI Insights",
      description: "Get intelligent analysis of your session notes with themes, reflective prompts, and learning opportunities.",
      color: "text-purple-500"
    },
    {
      icon: FileText,
      title: "Note Management",
      description: "Create personal reflections, summarize web content, and build your professional knowledge base.",
      color: "text-green-500"
    },
    {
      icon: Users,
      title: "Supervision Tracking",
      description: "Monitor supervision requirements and get reminders for upcoming check-ins.",
      color: "text-orange-500"
    },
    {
      icon: Settings,
      title: "Customizable Goals",
      description: "Set personalized goals based on your state requirements and professional focus.",
      color: "text-red-500"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data is encrypted and protected with industry-standard security measures.",
      color: "text-indigo-500"
    }
  ];

  const quickStart = [
    {
      step: 1,
      title: "Complete Your Profile",
      description: "Set your licensure goals, state/region, and import any existing hours in Settings."
    },
    {
      step: 2,
      title: "Log Your First Entry",
      description: "Use the Add Entry form to record your client contact hours and session notes."
    },
    {
      step: 3,
      title: "Explore AI Insights",
      description: "Try the AI Analysis tool with anonymized session notes to get professional insights."
    },
    {
      step: 4,
      title: "Track Your Progress",
      description: "Monitor your progress on the Dashboard and check requirements in the Requirements section."
    }
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Help & Support</h1>
        <p className="text-muted-foreground">
          Everything you need to know about using ClarityLog effectively for your professional development.
        </p>
      </div>

      {/* Quick Start Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Start Guide</CardTitle>
          <CardDescription>
            New to ClarityLog? Follow these steps to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {quickStart.map((item) => (
              <div key={item.step} className="flex items-start space-x-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold text-sm">
                  {item.step}
                </div>
                <div>
                  <h4 className="font-medium text-foreground">{item.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Features Overview</CardTitle>
          <CardDescription>
            Learn about ClarityLog's key features and capabilities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3 mb-2">
                    <Icon className={`h-5 w-5 ${feature.color}`} />
                    <h4 className="font-medium text-foreground">{feature.title}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>
            Common questions and answers about using ClarityLog.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-green-500" />
            <span>Privacy & Security</span>
          </CardTitle>
          <CardDescription>
            Important information about data protection and HIPAA compliance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <div>
              <strong>Data Encryption:</strong> All data is encrypted in transit and at rest using industry-standard encryption protocols.
            </div>
            <div>
              <strong>HIPAA Responsibility:</strong> You are responsible for ensuring all client information is properly anonymized before entering it into the system.
            </div>
            <div>
              <strong>Data Ownership:</strong> You own all your data. ClarityLog provides secure storage and access but does not claim ownership of your professional information.
            </div>
            <div>
              <strong>Backup & Sync:</strong> Your data is automatically backed up and synchronized across devices when you're logged in.
            </div>
            <div>
              <strong>Account Security:</strong> Use a strong, unique password and consider enabling two-factor authentication in your browser.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact & Support */}
      <Card>
        <CardHeader>
          <CardTitle>Contact & Support</CardTitle>
          <CardDescription>
            Need additional help? Here's how to get in touch.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-blue-500" />
                <div>
                  <h4 className="font-medium text-foreground">Email Support</h4>
                  <p className="text-sm text-muted-foreground">Get help with technical issues or questions</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <HelpCircle className="h-5 w-5 text-green-500" />
                <div>
                  <h4 className="font-medium text-foreground">Documentation</h4>
                  <p className="text-sm text-muted-foreground">Detailed guides and documentation</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Docs
              </Button>
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Response Time:</strong> We typically respond to support requests within 24-48 hours during business days.
              For urgent issues, please mark your message as high priority.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
