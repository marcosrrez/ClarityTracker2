import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Users, 
  Building2, 
  ArrowLeft
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
    // Step 1: Track your hours with ease
    {
      title: "Track your hours with ease",
      canContinue: true
    },

    // Step 2: Get AI insights from your sessions
    {
      title: "Get AI insights from your sessions",
      canContinue: true
    },

    // Step 3: Stay on track for licensure
    {
      title: "Stay on track for licensure",
      canContinue: true
    },

    // Step 4: Account type selection
    {
      title: "Which path describes you?",
      showAccountSelection: true,
      canContinue: data.accountType !== undefined
    },

    // Step 5: Basic info
    {
      title: "Let's personalize your experience",
      showForm: true,
      canContinue: data.preferredName.trim().length > 0 && data.stateRegion.trim().length > 0
    }
  ];

  const currentStepData = steps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* Skip button */}
      <button
        onClick={handleComplete}
        className="absolute top-8 right-8 text-blue-500 hover:text-blue-700 transition-colors z-10"
      >
        Skip
      </button>

      {/* Back button (only show after first step) */}
      {currentStep > 0 && (
        <button
          onClick={handlePrevious}
          className="absolute top-8 left-8 text-blue-500 hover:text-blue-700 transition-colors z-10"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      )}

      <div className="flex items-center justify-center min-h-screen px-8">
        <div className="w-full max-w-md text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              {/* Benefits steps (0-2) */}
              {currentStep < 3 && (
                <div className="space-y-12">
                  <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                    {currentStepData.title}
                  </h1>
                </div>
              )}

              {/* Account selection step */}
              {currentStepData.showAccountSelection && (
                <div className="space-y-8">
                  <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-12">
                    {currentStepData.title}
                  </h1>
                  
                  <div className="space-y-4">
                    {accountTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setData(prev => ({ ...prev, accountType: type.id }))}
                        className={`w-full p-6 rounded-2xl border-2 transition-all ${
                          data.accountType === type.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            data.accountType === type.id ? 'bg-blue-500 text-white' : 'bg-gray-100'
                          }`}>
                            <type.icon className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <h3 className="font-semibold text-gray-900">{type.title}</h3>
                            <p className="text-sm text-gray-600">{type.description}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Form step */}
              {currentStepData.showForm && (
                <div className="space-y-8">
                  <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-12">
                    {currentStepData.title}
                  </h1>
                  
                  <div className="space-y-6 text-left">
                    <div>
                      <Input
                        type="text"
                        placeholder="Your preferred name"
                        value={data.preferredName}
                        onChange={(e) => setData(prev => ({ ...prev, preferredName: e.target.value }))}
                        className="w-full p-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0"
                      />
                    </div>
                    
                    <div>
                      <Input
                        type="text"
                        placeholder="State/Region (e.g., Texas, California)"
                        value={data.stateRegion}
                        onChange={(e) => setData(prev => ({ ...prev, stateRegion: e.target.value }))}
                        className="w-full p-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0"
                      />
                    </div>

                    <div>
                      <Input
                        type="text"
                        placeholder="Main challenge (e.g., Time management)"
                        value={data.trackingChallenge}
                        onChange={(e) => setData(prev => ({ ...prev, trackingChallenge: e.target.value }))}
                        className="w-full p-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0"
                      />
                    </div>

                    {data.accountType === 'enterprise' && (
                      <div>
                        <Input
                          type="text"
                          placeholder="Organization name"
                          value={data.organizationName}
                          onChange={(e) => setData(prev => ({ ...prev, organizationName: e.target.value }))}
                          className="w-full p-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Next button */}
          <div className="mt-16">
            {currentStep === steps.length - 1 ? (
              <Button
                onClick={handleComplete}
                disabled={!currentStepData.canContinue || isLoading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 text-lg rounded-xl font-medium"
              >
                {isLoading ? 'Setting up...' : 'Get Started'}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!currentStepData.canContinue}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 text-lg rounded-xl font-medium"
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};