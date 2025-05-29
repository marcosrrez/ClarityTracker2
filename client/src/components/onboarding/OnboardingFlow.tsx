import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlanSelection } from "./PlanSelection";
import { 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  Target,
  BookOpen,
  BarChart3,
  FileText,
  Users,
  Trophy,
  Heart
} from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to ClarityLog",
    description: "Your AI-powered professional development companion",
    icon: Heart,
    color: "text-red-500"
  },
  {
    id: "account-type",
    title: "Choose Your Account Type",
    description: "Select the plan that fits your professional needs",
    icon: Users,
    color: "text-blue-500"
  },
  {
    id: "profile",
    title: "Set Up Your Profile", 
    description: "Tell us about your professional journey",
    icon: Users,
    color: "text-blue-500"
  },
  {
    id: "features",
    title: "Discover Key Features",
    description: "Learn how ClarityLog supports your growth",
    icon: Sparkles,
    color: "text-purple-500"
  },
  {
    id: "first-entry",
    title: "Log Your First Session",
    description: "Start tracking your professional development",
    icon: FileText,
    color: "text-green-500"
  },
  {
    id: "ai-insights",
    title: "AI-Powered Insights",
    description: "Discover how AI enhances your practice",
    icon: BarChart3,
    color: "text-amber-500"
  },
  {
    id: "complete",
    title: "You're All Set!",
    description: "Ready to accelerate your professional growth",
    icon: Trophy,
    color: "text-primary"
  }
];

interface OnboardingFlowProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingFlow = ({ isOpen, onClose }: OnboardingFlowProps) => {
  const { userProfile, updateUserProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [profileData, setProfileData] = useState({
    preferredName: userProfile?.preferredName || "",
    licenseStage: userProfile?.licenseStage || "",
    specialties: userProfile?.specialties || [],
    professionalGoals: userProfile?.professionalGoals || "",
    yearsOfExperience: userProfile?.yearsOfExperience || "",
    accountType: userProfile?.accountType || ""
  });

  const currentStepData = ONBOARDING_STEPS[currentStep];
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  const handleNext = async () => {
    if (currentStep === 1) {
      // Save account type selection
      await updateUserProfile({ 
        accountType: profileData.accountType as "individual" | "supervisor" | "enterprise" 
      });
    }
    if (currentStep === 2) {
      // Save profile data (excluding accountType which was already saved)
      const { accountType, ...profile } = profileData;
      await updateUserProfile(profile);
    }
    
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Mark onboarding as complete
      await updateUserProfile({ hasCompletedOnboarding: true });
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    await updateUserProfile({ hasCompletedOnboarding: true });
    onClose();
  };

  const renderStepContent = () => {
    switch (currentStepData.id) {
      case "welcome":
        return (
          <div className="text-center space-y-8 ive-fade-in">
            <div className="mx-auto w-28 h-28 bg-gradient-to-br from-primary/15 to-accent/10 rounded-3xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform duration-300">
              <Heart className="h-14 w-14 text-primary" />
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl font-bold text-foreground">Welcome to ClarityLog!</h3>
              <p className="text-muted-foreground/80 text-lg leading-relaxed max-w-2xl mx-auto">
                Your intelligent companion for professional counseling development. 
                Let's get you set up to track your progress toward licensure with AI-powered insights.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10">
              <div className="ive-fade-in text-center group">
                <div className="w-16 h-16 bg-primary/10 ive-rounded-lg mx-auto mb-3 flex items-center justify-center group-hover:bg-primary/15 transition-colors duration-300">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">Session Tracking</p>
              </div>
              <div className="ive-fade-in text-center group">
                <div className="w-16 h-16 bg-accent/10 ive-rounded-lg mx-auto mb-3 flex items-center justify-center group-hover:bg-accent/15 transition-colors duration-300">
                  <BarChart3 className="h-8 w-8 text-accent" />
                </div>
                <p className="text-sm font-medium text-foreground">AI Analysis</p>
              </div>
              <div className="ive-fade-in text-center group">
                <div className="w-16 h-16 bg-primary/8 ive-rounded-lg mx-auto mb-3 flex items-center justify-center group-hover:bg-primary/12 transition-colors duration-300">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">Competency Tracking</p>
              </div>
              <div className="ive-fade-in text-center group">
                <div className="w-16 h-16 bg-accent/8 ive-rounded-lg mx-auto mb-3 flex items-center justify-center group-hover:bg-accent/12 transition-colors duration-300">
                  <BookOpen className="h-8 w-8 text-accent" />
                </div>
                <p className="text-sm font-medium text-foreground">Professional Growth</p>
              </div>
            </div>
          </div>
        );

      case "account-type":
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold">Choose Your Account Type</h3>
              <p className="text-muted-foreground">
                Select the plan that best fits your professional needs and responsibilities.
              </p>
            </div>
            
            <PlanSelection 
              onPlanSelect={(accountType) => {
                setProfileData({...profileData, accountType});
              }}
              selectedPlan={profileData.accountType}
            />
          </div>
        );

      case "profile":
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold">Tell us about yourself</h3>
              <p className="text-muted-foreground">
                This helps us personalize your experience and provide better AI insights.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="preferredName">Preferred Name</Label>
                <Input
                  id="preferredName"
                  placeholder="What should we call you?"
                  value={profileData.preferredName}
                  onChange={(e) => setProfileData({...profileData, preferredName: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="licenseStage">License Stage</Label>
                <select
                  id="licenseStage"
                  className="w-full p-2 border rounded-md"
                  value={profileData.licenseStage}
                  onChange={(e) => setProfileData({...profileData, licenseStage: e.target.value})}
                >
                  <option value="">Select your current stage</option>
                  <option value="Student">Graduate Student</option>
                  <option value="LAC">Licensed Associate Counselor (LAC)</option>
                  <option value="LPC">Licensed Professional Counselor (LPC)</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="experience">Years of Experience</Label>
                <select
                  id="experience"
                  className="w-full p-2 border rounded-md"
                  value={profileData.yearsOfExperience}
                  onChange={(e) => setProfileData({...profileData, yearsOfExperience: e.target.value})}
                >
                  <option value="">Select experience level</option>
                  <option value="New">New to the field</option>
                  <option value="1-2 years">1-2 years</option>
                  <option value="3-5 years">3-5 years</option>
                  <option value="5+ years">5+ years</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="goals">Professional Goals (Optional)</Label>
                <Textarea
                  id="goals"
                  placeholder="What are your main professional development goals?"
                  value={profileData.professionalGoals}
                  onChange={(e) => setProfileData({...profileData, professionalGoals: e.target.value})}
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case "features":
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Sparkles className="h-12 w-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold">Powerful Features for Your Growth</h3>
              <p className="text-muted-foreground">
                Discover how ClarityLog supports your professional development journey.
              </p>
            </div>
            
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <span>Smart Session Logging</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Track client contact hours, supervision, and notes with our intuitive markdown editor. 
                    Your data automatically syncs and calculates progress toward licensure requirements.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <BarChart3 className="h-5 w-5 text-green-500" />
                    <span>AI-Powered Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Get personalized insights, identify patterns across sessions, and receive 
                    tailored recommendations for professional growth and supervision discussions.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <Target className="h-5 w-5 text-purple-500" />
                    <span>Competency Tracking</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Monitor your development across core counseling competencies with evidence-based 
                    progress tracking and personalized milestone recommendations.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case "first-entry":
        return (
          <div className="text-center space-y-6">
            <FileText className="h-12 w-12 text-green-500 mx-auto" />
            <div>
              <h3 className="text-xl font-bold mb-2">Ready to Log Your First Session?</h3>
              <p className="text-muted-foreground">
                After completing onboarding, you'll be guided to create your first session entry. 
                This is where your professional development tracking begins!
              </p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">What to Include:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 text-left">
                <li>• Session date and duration</li>
                <li>• Client contact hours</li>
                <li>• Session notes and reflections</li>
                <li>• Supervision details (if applicable)</li>
                <li>• Therapeutic approaches used</li>
              </ul>
            </div>
          </div>
        );

      case "ai-insights":
        return (
          <div className="text-center space-y-6">
            <BarChart3 className="h-12 w-12 text-amber-500 mx-auto" />
            <div>
              <h3 className="text-xl font-bold mb-2">Unlock AI-Powered Insights</h3>
              <p className="text-muted-foreground">
                Once you've logged sessions, our AI will analyze your notes to provide 
                personalized insights, identify patterns, and suggest areas for growth.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-1">Weekly Coaching</h4>
                <p className="text-xs text-blue-600 dark:text-blue-200">
                  Personalized focus areas and development tips
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg">
                <h4 className="font-semibold text-purple-700 dark:text-purple-300 mb-1">Pattern Analysis</h4>
                <p className="text-xs text-purple-600 dark:text-purple-200">
                  Cross-session insights and growth trajectories
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                <h4 className="font-semibold text-green-700 dark:text-green-300 mb-1">Competency Mapping</h4>
                <p className="text-xs text-green-600 dark:text-green-200">
                  Track progress across counseling skills
                </p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg">
                <h4 className="font-semibold text-amber-700 dark:text-amber-300 mb-1">Supervision Prep</h4>
                <p className="text-xs text-amber-600 dark:text-amber-200">
                  AI-generated discussion topics and insights
                </p>
              </div>
            </div>
          </div>
        );

      case "complete":
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto w-24 h-24 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
              <Trophy className="h-12 w-12 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">You're All Set!</h3>
              <p className="text-muted-foreground text-lg">
                Welcome to your professional development journey with ClarityLog. 
                You're ready to start tracking, analyzing, and accelerating your growth.
              </p>
            </div>
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6 rounded-lg">
              <h4 className="font-bold mb-2">🎉 Congratulations on taking this step!</h4>
              <p className="text-sm text-muted-foreground">
                Your dedication to professional growth and intentional practice will 
                serve you well on your journey to becoming an exceptional counselor.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <currentStepData.icon className={`h-5 w-5 ${currentStepData.color}`} />
              <span>Step {currentStep + 1} of {ONBOARDING_STEPS.length}</span>
            </DialogTitle>
            <Badge variant="outline">
              {Math.round(progress)}%
            </Badge>
          </div>
          <Progress value={progress} className="w-full" />
        </DialogHeader>

        <div className="py-6">
          {renderStepContent()}
        </div>

        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex space-x-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            )}
            
            {currentStep < ONBOARDING_STEPS.length - 1 && (
              <Button variant="ghost" onClick={handleSkip}>
                Skip for now
              </Button>
            )}
          </div>

          <Button onClick={handleNext}>
            {currentStep === ONBOARDING_STEPS.length - 1 ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Get Started
              </>
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};