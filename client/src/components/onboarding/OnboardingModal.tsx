import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PlanSelection } from "./PlanSelection";
import { 
  ChartLine, 
  Plus, 
  Lightbulb, 
  Bot, 
  Download, 
  ArrowRight, 
  ArrowLeft, 
  X,
  Target,
  FileText,
  Sparkles
} from "lucide-react";

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

const onboardingSteps = [
  {
    title: "Welcome to ClarityLog",
    subtitle: "Your journey to LPC licensure starts here",
    description: "ClarityLog helps Licensed Associate Counselors track their progress, gain AI-powered insights, and maintain organized records for professional development.",
    icon: <Sparkles className="h-8 w-8 text-blue-500" />,
    features: [
      "Track client contact hours and supervision",
      "AI-powered session note analysis", 
      "Professional development insights",
      "Licensure requirement tracking"
    ]
  },
  {
    title: "Track Your Progress",
    subtitle: "Stay on top of your licensure requirements",
    description: "Easily log client contact hours, supervision sessions, and track your progress toward LPC licensure requirements.",
    icon: <ChartLine className="h-8 w-8 text-green-500" />,
    features: [
      "Visual progress tracking dashboard",
      "Direct and indirect hour categorization",
      "Supervision hour tracking",
      "Goal setting and milestone alerts"
    ]
  },
  {
    title: "Add Entries Effortlessly", 
    subtitle: "Simple logging for busy professionals",
    description: "Quick and intuitive entry forms let you log sessions efficiently, with smart imports for existing data.",
    icon: <Plus className="h-8 w-8 text-purple-500" />,
    features: [
      "Quick session entry forms",
      "Rich text notes with formatting",
      "CSV data import capability",
      "Bulk entry management"
    ]
  },
  {
    title: "AI-Powered Insights",
    subtitle: "Discover patterns in your practice",
    description: "Get intelligent analysis of your session notes to identify themes, growth opportunities, and professional development areas.",
    icon: <Bot className="h-8 w-8 text-orange-500" />,
    features: [
      "Session note theme analysis",
      "Growth pattern identification", 
      "Professional development suggestions",
      "Blind spot awareness"
    ]
  },
  {
    title: "Browser Extension",
    subtitle: "Capture insights from anywhere",
    description: "Use our browser extension to save and summarize professional articles, research, and resources directly to your knowledge base.",
    icon: <Download className="h-8 w-8 text-teal-500" />,
    features: [
      "One-click article summarization",
      "Professional resource collection",
      "Research note organization",
      "Knowledge base building"
    ]
  }
];

export const OnboardingModal = ({ open, onClose }: OnboardingModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setCurrentStep(0);
    }, 300);
  };

  const currentStepData = onboardingSteps[currentStep];
  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={`max-w-2xl p-0 overflow-hidden transition-all duration-300 ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
        <div className="relative">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 h-8 w-8 p-0 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Progress Bar */}
          <div className="px-8 pt-6 pb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Step {currentStep + 1} of {onboardingSteps.length}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progress)}% complete
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Content */}
          <div className="px-8 py-6">
            <Card className="border-0 shadow-none">
              <CardContent className="p-0 space-y-6">
                {/* Header */}
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl">
                      {currentStepData.icon}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-foreground">
                      {currentStepData.title}
                    </h2>
                    <p className="text-lg text-blue-600 font-medium">
                      {currentStepData.subtitle}
                    </p>
                    <p className="text-muted-foreground leading-relaxed max-w-lg mx-auto">
                      {currentStepData.description}
                    </p>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-3">
                  {currentStepData.features.map((feature, index) => (
                    <div 
                      key={index} 
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      </div>
                      <span className="text-foreground font-medium">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Special CTA for last step */}
                {currentStep === onboardingSteps.length - 1 && (
                  <div className="text-center space-y-4 pt-4">
                    <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
                      🎉 Ready to transform your practice?
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Start logging your first session or explore the dashboard to see ClarityLog in action!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Navigation */}
          <div className="px-8 pb-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Previous</span>
              </Button>

              <div className="flex space-x-2">
                {onboardingSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index <= currentStep ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>

              <Button
                onClick={handleNext}
                className="flex items-center space-x-2"
              >
                <span>{currentStep === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};