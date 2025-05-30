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

interface OnboardingStep {
  title: string;
  subtitle?: string;
  canContinue: boolean;
  showAccountSelection?: boolean;
  showForm?: boolean;
  showDemo?: 'quick-log' | 'ai-insights' | 'progress-tracking' | 'supervisor-dashboard' | 'compliance-alerts' | 'enterprise-analytics';
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

  const getSteps = (): OnboardingStep[] => {
    const baseSteps: OnboardingStep[] = [
      // Step 1: Problem identification
      {
        title: "Tracking hours shouldn't feel like another burden",
        subtitle: "But how do you stay organized while focusing on your clients?",
        canContinue: true
      },

      // Step 2: Account type selection
      {
        title: "Which path describes you?",
        showAccountSelection: true,
        canContinue: data.accountType !== undefined
      },

      // Step 3: Personalization
      {
        title: "Let's personalize your experience",
        showForm: true,
        canContinue: data.preferredName.trim().length > 0 && data.stateRegion.trim().length > 0
      }
    ];

    // Add tailored feature demonstrations based on account type
    if (data.accountType === 'individual') {
      baseSteps.push(
        {
          title: "Just tap to log a session",
          subtitle: "Quick entry keeps you focused on what matters.",
          showDemo: 'quick-log' as const,
          canContinue: true
        } as OnboardingStep,
        {
          title: "Get insights from your notes",
          subtitle: "AI analysis helps you spot patterns and growth.",
          showDemo: 'ai-insights' as const,
          canContinue: true
        } as OnboardingStep,
        {
          title: "Stay on track for licensure",
          subtitle: "See your progress at a glance.",
          showDemo: 'progress-tracking' as const,
          canContinue: true
        } as OnboardingStep
      );
    } else if (data.accountType === 'supervisor') {
      baseSteps.push(
        {
          title: "See all supervisees at once",
          subtitle: "Monitor progress and compliance effortlessly.",
          showDemo: 'supervisor-dashboard' as const,
          canContinue: true
        } as OnboardingStep,
        {
          title: "Automated compliance alerts",
          subtitle: "Never miss important deadlines or requirements.",
          showDemo: 'compliance-alerts' as const,
          canContinue: true
        } as OnboardingStep
      );
    } else if (data.accountType === 'enterprise') {
      baseSteps.push(
        {
          title: "Manage programs at scale",
          subtitle: "Organization-wide insights and reporting.",
          showDemo: 'enterprise-analytics' as const,
          canContinue: true
        } as OnboardingStep
      );
    }

    baseSteps.push({
      title: `Welcome to ClarityLog, ${data.preferredName}!`,
      subtitle: "Your personalized experience is ready.",
      canContinue: true
    });

    return baseSteps;
  };

  const steps = getSteps();

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
              {/* Problem identification, feature demos, and completion */}
              {!currentStepData.showAccountSelection && !currentStepData.showForm && (
                <div className="space-y-12">
                  <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                      {currentStepData.title}
                    </h1>
                    {currentStepData.subtitle && (
                      <p className="text-xl text-gray-600">
                        {currentStepData.subtitle}
                      </p>
                    )}
                  </div>
                  
                  {/* Interactive demos based on step type */}
                  {currentStepData.showDemo && (
                    <div className="mt-16">
                      {currentStepData.showDemo === 'quick-log' && (
                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/40">
                          <div className="space-y-4">
                            <div className="flex items-center gap-3 text-sm text-gray-600 mb-6">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              Tap anywhere to start logging
                            </div>
                            <div className="bg-blue-500 text-white rounded-xl p-4 text-center font-medium">
                              + Log Session
                            </div>
                            <div className="text-center text-sm text-gray-500">
                              Session logged in seconds, not minutes
                            </div>
                          </div>
                        </div>
                      )}

                      {currentStepData.showDemo === 'ai-insights' && (
                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/40">
                          <div className="space-y-4">
                            <div className="text-sm text-gray-600 mb-4">Session notes:</div>
                            <div className="bg-gray-50 rounded-lg p-4 text-sm">
                              "Client showed significant progress with anxiety management techniques..."
                            </div>
                            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
                              <div className="text-sm font-medium text-blue-900">AI Insight</div>
                              <div className="text-sm text-blue-700 mt-1">Client demonstrates improved coping strategies. Consider reinforcing CBT techniques in next session.</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {currentStepData.showDemo === 'progress-tracking' && (
                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/40">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Licensure Progress</span>
                              <span className="text-sm text-blue-600">75% Complete</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div className="bg-blue-500 h-3 rounded-full" style={{ width: '75%' }}></div>
                            </div>
                            <div className="text-xs text-gray-600">
                              1,875 / 2,500 client contact hours completed
                            </div>
                          </div>
                        </div>
                      )}

                      {currentStepData.showDemo === 'supervisor-dashboard' && (
                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/40">
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-white rounded-lg p-4 border">
                                <div className="text-sm font-medium">Sarah M.</div>
                                <div className="text-xs text-green-600">On track</div>
                                <div className="text-xs text-gray-500">68% complete</div>
                              </div>
                              <div className="bg-white rounded-lg p-4 border">
                                <div className="text-sm font-medium">James K.</div>
                                <div className="text-xs text-yellow-600">Needs attention</div>
                                <div className="text-xs text-gray-500">45% complete</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {currentStepData.showDemo === 'compliance-alerts' && (
                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/40">
                          <div className="space-y-4">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                <span className="text-sm font-medium text-yellow-800">Supervision Due</span>
                              </div>
                              <div className="text-xs text-yellow-700 mt-1">Sarah M. needs supervision session within 3 days</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {currentStepData.showDemo === 'enterprise-analytics' && (
                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/40">
                          <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <div className="text-2xl font-bold text-blue-600">156</div>
                                <div className="text-xs text-gray-600">Active Trainees</div>
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-green-600">89%</div>
                                <div className="text-xs text-gray-600">On Track</div>
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-purple-600">23</div>
                                <div className="text-xs text-gray-600">Programs</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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