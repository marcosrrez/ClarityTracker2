import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { 
  User, 
  Users, 
  Building2, 
  Calendar, 
  Target, 
  Heart, 
  Brain,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sprout
} from "lucide-react";

interface OnboardingData {
  preferredName: string;
  accountType: 'individual' | 'supervisor' | 'enterprise' | undefined;
  stateRegion: string;
  trackingChallenge: string;
  organizationName?: string;
  professionalGoals?: string;
}

export const OnboardingFlow = () => {
  const { updateUserProfile } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    preferredName: '',
    accountType: undefined,
    stateRegion: '',
    trackingChallenge: '',
    organizationName: '',
    professionalGoals: ''
  });

  const accountTypes = [
    {
      id: 'individual' as const,
      title: 'Individual LAC',
      description: 'Track your personal journey to LPC licensure',
      icon: User,
      features: ['Hour tracking', 'AI insights', 'Progress monitoring', 'Supervisor collaboration']
    },
    {
      id: 'supervisor' as const,
      title: 'Clinical Supervisor',
      description: 'Manage and support multiple supervisees',
      icon: Users,
      features: ['Supervisee management', 'Compliance tracking', 'Assessment tools', 'Progress reports']
    },
    {
      id: 'enterprise' as const,
      title: 'Enterprise/Training',
      description: 'Organization-wide training program management',
      icon: Building2,
      features: ['Multi-user management', 'Advanced analytics', 'Custom workflows', 'Integration support']
    }
  ];

  const commonChallenges = [
    { id: 'time-management', label: 'Time Management', icon: '⏰' },
    { id: 'documentation', label: 'Documentation & Record Keeping', icon: '📝' },
    { id: 'clinical-skills', label: 'Developing Clinical Skills', icon: '🎯' },
    { id: 'supervision-relationship', label: 'Supervision Relationship', icon: '🤝' },
    { id: 'work-life-balance', label: 'Work-Life Balance', icon: '⚖️' },
    { id: 'ethical-decisions', label: 'Ethical Decision Making', icon: '🤔' },
    { id: 'client-progress', label: 'Tracking Client Progress', icon: '📊' },
    { id: 'professional-development', label: 'Continuing Education', icon: '📚' }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await updateUserProfile({
        preferredName: data.preferredName,
        accountType: data.accountType,
        stateRegion: data.stateRegion,
        trackingChallenge: data.trackingChallenge,
        organizationName: data.organizationName,
        professionalGoals: data.professionalGoals,
        focus: 'licensure',
        hasCompletedOnboarding: true
      });

      toast({
        title: "Welcome to ClarityLog!",
        description: "Your account has been set up successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Setup Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    // Step 1: Welcome & Name
    {
      title: "Welcome to ClarityLog!",
      subtitle: "Let's get you set up in just a few steps",
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sprout className="w-10 h-10 text-white" />
            </div>
            <p className="text-gray-600 text-lg">
              First, let's get to know you better
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What's your preferred name?
            </label>
            <Input
              type="text"
              placeholder="Enter your preferred name"
              value={data.preferredName}
              onChange={(e) => setData(prev => ({ ...prev, preferredName: e.target.value }))}
              className="text-lg py-3"
            />
          </div>
        </div>
      ),
      canContinue: data.preferredName.trim().length > 0
    },

    // Step 2: Account Type Selection
    {
      title: "Choose Your Account Type",
      subtitle: "Select the option that best describes your role",
      content: (
        <div className="grid grid-cols-1 gap-4">
          {accountTypes.map((type) => (
            <Card 
              key={type.id}
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                data.accountType === type.id 
                  ? 'ring-2 ring-blue-600 bg-blue-50' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => setData(prev => ({ ...prev, accountType: type.id }))}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    data.accountType === type.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <type.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {type.title}
                    </h3>
                    <p className="text-gray-600 mb-3">
                      {type.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {type.features.map((feature) => (
                        <span 
                          key={feature}
                          className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                  {data.accountType === type.id && (
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ),
      canContinue: data.accountType !== undefined
    },

    // Step 3: Location & Goals
    {
      title: "Tell us about your location and goals",
      subtitle: "This helps us provide relevant resources and compliance information",
      content: (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State/Region
            </label>
            <Input
              type="text"
              placeholder="e.g., Texas, California, Ontario"
              value={data.stateRegion}
              onChange={(e) => setData(prev => ({ ...prev, stateRegion: e.target.value }))}
              className="text-lg py-3"
            />
            <p className="text-sm text-gray-500 mt-1">
              This helps us provide state-specific licensing requirements
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What's your biggest challenge right now?
            </label>
            <Input
              type="text"
              placeholder="e.g., Time management, documentation, clinical skills"
              value={data.trackingChallenge}
              onChange={(e) => setData(prev => ({ ...prev, trackingChallenge: e.target.value }))}
              className="text-lg py-3"
            />
          </div>

          {data.accountType === 'enterprise' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization Name
              </label>
              <Input
                type="text"
                placeholder="Your organization or training program name"
                value={data.organizationName}
                onChange={(e) => setData(prev => ({ ...prev, organizationName: e.target.value }))}
                className="text-lg py-3"
              />
            </div>
          )}

          {(data.accountType === 'supervisor' || data.accountType === 'individual') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Professional Goals (Optional)
              </label>
              <Input
                type="text"
                placeholder="What do you hope to achieve with ClarityLog?"
                value={data.professionalGoals}
                onChange={(e) => setData(prev => ({ ...prev, professionalGoals: e.target.value }))}
                className="text-lg py-3"
              />
            </div>
          )}
        </div>
      ),
      canContinue: data.stateRegion.trim().length > 0 && data.trackingChallenge.trim().length > 0
    },

    // Step 4: Completion
    {
      title: "You're all set!",
      subtitle: "Your personalized ClarityLog experience awaits",
      content: (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Welcome, {data.preferredName}!
            </h3>
            <p className="text-gray-600">
              Based on your selections, we've customized ClarityLog to help you succeed as {
                data.accountType === 'individual' ? 'an LAC pursuing LPC licensure' :
                data.accountType === 'supervisor' ? 'a clinical supervisor' :
                'an enterprise training program'
              }.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Your setup:
              </p>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Location: {data.stateRegion}</div>
                <div>Focus: {data.trackingChallenge}</div>
                {data.organizationName && <div>Organization: {data.organizationName}</div>}
              </div>
            </div>
          </div>
        </div>
      ),
      canContinue: true
    }
  ];

  const currentStepData = steps[currentStep];

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(((currentStep + 1) / steps.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200"
          >
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {currentStepData.title}
              </h1>
              <p className="text-gray-600 text-lg">
                {currentStepData.subtitle}
              </p>
            </div>

            <div className="mb-8">
              {currentStepData.content}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Button>

              {currentStep === steps.length - 1 ? (
                <Button
                  onClick={handleComplete}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <CheckCircle className="w-4 h-4" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!currentStepData.canContinue}
                  className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};