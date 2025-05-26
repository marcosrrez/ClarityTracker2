export const siteConfig = {
  name: "ClarityLog",
  description: "Professional development tracking for Licensed Associate Counselors",
  version: "1.0.0",
  author: "ClarityLog Team",
  url: "https://claritylog.com",
  links: {
    github: "https://github.com/claritylog/claritylog",
    documentation: "https://docs.claritylog.com",
    support: "mailto:support@claritylog.com",
  },
};

export const navigationItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Overview of your progress and recent activity",
  },
  {
    href: "/add-entry",
    label: "Add Entry",
    description: "Log new client contact hours and supervision",
  },
  {
    href: "/insights",
    label: "Insights & Resources",
    description: "Personal notes and web content summaries",
  },
  {
    href: "/summary",
    label: "Summary",
    description: "Comprehensive progress analysis",
  },
  {
    href: "/gallery",
    label: "Gallery",
    description: "AI-analyzed session insights",
  },
  {
    href: "/ai-analysis",
    label: "AI Analysis",
    description: "Get insights from session notes",
  },
  {
    href: "/requirements",
    label: "Requirements",
    description: "Licensing requirements and guidelines",
  },
  {
    href: "/settings",
    label: "Settings",
    description: "Manage goals and preferences",
  },
  {
    href: "/help",
    label: "Help",
    description: "Support and documentation",
  },
];

export const features = [
  {
    title: "Hour Tracking",
    description: "Track client contact hours, supervision, and progress toward licensure",
    icon: "clock",
  },
  {
    title: "AI Insights",
    description: "Get intelligent analysis of session notes and professional development",
    icon: "bot",
  },
  {
    title: "Progress Monitoring",
    description: "Visual progress tracking with customizable goals and milestones",
    icon: "target",
  },
  {
    title: "Secure & Private",
    description: "HIPAA-compliant data handling with encryption and secure storage",
    icon: "shield",
  },
];

export const licensureStages = {
  licensure: {
    label: "Initial Licensure (LAC to LPC)",
    description: "Working toward first professional counselor license",
    defaultGoals: {
      totalCCH: 2000,
      directCCH: 1500,
      supervisionHours: 200,
      ethicsHours: 20,
    },
  },
  renewal: {
    label: "Maintaining License (Renewal)",
    description: "Already licensed, tracking renewal requirements",
    defaultGoals: {
      totalCCH: 0,
      directCCH: 0,
      supervisionHours: 0,
      ethicsHours: 24,
    },
  },
};
