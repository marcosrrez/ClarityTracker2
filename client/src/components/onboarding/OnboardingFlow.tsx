import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { SuperhumanOnboarding } from "./SuperhumanOnboarding";
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
  const { updateUserProfile, user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuperhumanOnboarding, setShowSuperhumanOnboarding] = useState(false);
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
      title: 'Enterprise',
      description: 'Scale training programs across your organization',
      icon: Building2,
      features: ['Multi-program management', 'Advanced analytics', 'Custom workflows', 'Integration support']
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!data.preferredName || !data.accountType) return;
    
    setIsLoading(true);
    try {
      await updateUserProfile({
        preferredName: data.preferredName,
        accountType: data.accountType,
        stateRegion: data.stateRegion,
        trackingChallenge: data.trackingChallenge,
        organizationName: data.organizationName,
        professionalGoals: data.professionalGoals,
        hasCompletedOnboarding: true
      });

      // Send welcome email from CEO
      try {
        const response = await fetch('/api/welcome-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userEmail: user?.email,
            preferredName: data.preferredName,
            accountType: data.accountType
          }),
        });

        if (!response.ok) {
          console.warn('Failed to send welcome email, but continuing with onboarding');
        }
      } catch (emailError) {
        console.warn('Welcome email failed:', emailError);
        // Don't block onboarding if email fails
      }

      // Show Superhuman-inspired onboarding after successful setup
      setShowSuperhumanOnboarding(true);
    } catch (error) {
      toast({
        title: "Setup Error", 
        description: "There was a problem setting up your account.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuperhumanComplete = () => {
    setShowSuperhumanOnboarding(false);
    toast({
      title: "Welcome to ClarityLog!",
      description: "Your account has been set up successfully. Check your email for next steps.",
    });
    // Redirect to dashboard
    window.location.href = '/dashboard';
  };

  const getPainPoint = () => {
    if (data.accountType === 'individual') {
      return {
        title: "Tracking hours shouldn't feel like another burden",
        subtitle: "But how do you stay organized while focusing on your clients?"
      };
    } else if (data.accountType === 'supervisor') {
      return {
        title: "Managing multiple supervisees shouldn't be overwhelming",
        subtitle: "But how do you ensure compliance while supporting their growth?"
      };
    } else if (data.accountType === 'enterprise') {
      return {
        title: "Scaling training programs shouldn't sacrifice quality",
        subtitle: "But how do you maintain oversight across your organization?"
      };
    }
    return {
      title: "Professional development shouldn't be complicated",
      subtitle: "But how do you streamline your growth journey?"
    };
  };

  const getSteps = (): OnboardingStep[] => {
    const baseSteps: OnboardingStep[] = [
      // Step 1: Welcome
      {
        title: "Welcome to ClarityLog",
        subtitle: "Your professional development companion",
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

    // Step 4: Add tailored pain point after we know the user
    if (data.accountType && data.preferredName) {
      const painPoint = getPainPoint();
      baseSteps.push({
        title: painPoint.title,
        subtitle: painPoint.subtitle,
        canContinue: true
      } as OnboardingStep);
    }

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

  // Show Superhuman onboarding if signup flow is complete
  if (showSuperhumanOnboarding && data.accountType) {
    return (
      <SuperhumanOnboarding 
        onComplete={handleSuperhumanComplete}
        userType={data.accountType}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* Navigation */}
      <div className="flex justify-between items-center p-8">
        <Button 
          variant="ghost" 
          onClick={handleBack}
          disabled={currentStep === 0}
          className="text-gray-500 hover:text-gray-700 font-light"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <div className="text-sm font-light text-gray-400">
          {currentStep + 1} / {steps.length}
        </div>
        
        <Button 
          variant="ghost"
          className="text-gray-500 hover:text-gray-700 font-light"
        >
          Skip
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-8 pb-32">
        <div className="w-full max-w-4xl">
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
                <div className="space-y-16">
                  <div className="space-y-6 text-center max-w-2xl mx-auto">
                    <h1 className="text-5xl md:text-6xl font-light text-gray-900 leading-[1.1] tracking-tight">
                      {currentStepData.title}
                    </h1>
                    {currentStepData.subtitle && (
                      <p className="text-2xl text-gray-500 font-light leading-relaxed">
                        {currentStepData.subtitle}
                      </p>
                    )}
                  </div>
                  
                  {/* Interactive demos */}
                  {currentStepData.showDemo && (
                    <motion.div 
                      className="max-w-lg mx-auto"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                    >
                      {currentStepData.showDemo === 'quick-log' && (
                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/50">
                          <div className="space-y-8">
                            <div className="flex items-center justify-center gap-3 text-base text-gray-500 font-light">
                              <motion.div 
                                className="w-3 h-3 bg-emerald-400 rounded-full"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                              />
                              Tap anywhere to start logging
                            </div>
                            <motion.div 
                              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl p-6 text-center font-medium text-lg tracking-wide cursor-pointer hover:shadow-lg transition-all duration-200"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              + Log Session
                            </motion.div>
                            <div className="text-center text-gray-400 font-light">
                              Session logged in seconds, not minutes
                            </div>
                          </div>
                        </div>
                      )}

                      {currentStepData.showDemo === 'ai-insights' && (
                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/50">
                          <div className="space-y-8">
                            <div className="text-base text-gray-500 font-light mb-6">Session notes:</div>
                            <div className="bg-gray-50/80 rounded-2xl p-6 text-base font-light leading-relaxed">
                              "Client showed significant progress with anxiety management techniques..."
                            </div>
                            <motion.div 
                              className="bg-gradient-to-br from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-2xl p-6"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.5 }}
                            >
                              <div className="text-base font-medium text-blue-900 mb-2">AI Insight</div>
                              <div className="text-base text-blue-700 font-light leading-relaxed">Client demonstrates improved coping strategies. Consider reinforcing CBT techniques in next session.</div>
                            </motion.div>
                          </div>
                        </div>
                      )}

                      {currentStepData.showDemo === 'progress-tracking' && (
                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/50">
                          <div className="space-y-8">
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-medium text-gray-700">Licensure Progress</span>
                              <span className="text-lg text-blue-600 font-medium">75% Complete</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                              <motion.div 
                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: '75%' }}
                                transition={{ delay: 0.3, duration: 1.2, ease: "easeOut" }}
                              />
                            </div>
                            <div className="text-gray-500 font-light">
                              1,875 / 2,500 client contact hours completed
                            </div>
                          </div>
                        </div>
                      )}

                      {currentStepData.showDemo === 'supervisor-dashboard' && (
                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/50">
                          <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                              <motion.div 
                                className="bg-white/80 rounded-2xl p-6 border border-gray-100 shadow-sm"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                              >
                                <div className="text-base font-medium text-gray-800">Sarah M.</div>
                                <div className="text-sm text-emerald-600 font-medium mt-1">On track</div>
                                <div className="text-sm text-gray-500 font-light">68% complete</div>
                              </motion.div>
                              <motion.div 
                                className="bg-white/80 rounded-2xl p-6 border border-gray-100 shadow-sm"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                              >
                                <div className="text-base font-medium text-gray-800">James K.</div>
                                <div className="text-sm text-amber-600 font-medium mt-1">Needs attention</div>
                                <div className="text-sm text-gray-500 font-light">45% complete</div>
                              </motion.div>
                            </div>
                          </div>
                        </div>
                      )}

                      {currentStepData.showDemo === 'compliance-alerts' && (
                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/50">
                          <motion.div 
                            className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-6"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <motion.div 
                                className="w-3 h-3 bg-amber-400 rounded-full"
                                animate={{ scale: [1, 1.3, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                              />
                              <span className="text-base font-medium text-amber-800">Supervision Due</span>
                            </div>
                            <div className="text-base text-amber-700 font-light">Sarah M. needs supervision session within 3 days</div>
                          </motion.div>
                        </div>
                      )}

                      {currentStepData.showDemo === 'enterprise-analytics' && (
                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/50">
                          <div className="grid grid-cols-3 gap-8 text-center">
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 }}
                            >
                              <div className="text-4xl font-light text-blue-600 mb-2">156</div>
                              <div className="text-sm text-gray-500 font-light">Active Trainees</div>
                            </motion.div>
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4 }}
                            >
                              <div className="text-4xl font-light text-emerald-600 mb-2">89%</div>
                              <div className="text-sm text-gray-500 font-light">On Track</div>
                            </motion.div>
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.6 }}
                            >
                              <div className="text-4xl font-light text-purple-600 mb-2">23</div>
                              <div className="text-sm text-gray-500 font-light">Programs</div>
                            </motion.div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              )}

              {/* Account selection step */}
              {currentStepData.showAccountSelection && (
                <div className="space-y-12">
                  <div className="text-center space-y-6">
                    <h1 className="text-5xl md:text-6xl font-light text-gray-900 leading-[1.1] tracking-tight">
                      {currentStepData.title}
                    </h1>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {accountTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <motion.div
                          key={type.id}
                          className={`p-8 rounded-3xl border-2 cursor-pointer transition-all duration-300 ${
                            data.accountType === type.id
                              ? 'border-blue-500 bg-blue-50/50 shadow-lg scale-105'
                              : 'border-gray-200 bg-white/60 hover:border-gray-300 hover:shadow-md'
                          }`}
                          onClick={() => setData({ ...data, accountType: type.id })}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="space-y-6">
                            <Icon className={`w-12 h-12 ${data.accountType === type.id ? 'text-blue-600' : 'text-gray-400'}`} />
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900 mb-2">{type.title}</h3>
                              <p className="text-gray-600 font-light leading-relaxed">{type.description}</p>
                            </div>
                            <div className="space-y-2">
                              {type.features.map((feature, index) => (
                                <div key={index} className="text-sm text-gray-500 font-light">
                                  • {feature}
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Form step */}
              {currentStepData.showForm && (
                <div className="space-y-12">
                  <div className="text-center space-y-6">
                    <h1 className="text-5xl md:text-6xl font-light text-gray-900 leading-[1.1] tracking-tight">
                      {currentStepData.title}
                    </h1>
                  </div>
                  
                  <div className="max-w-md mx-auto space-y-8">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        What should we call you?
                      </label>
                      <Input
                        value={data.preferredName}
                        onChange={(e) => setData({ ...data, preferredName: e.target.value })}
                        placeholder="Your preferred name"
                        className="w-full p-4 text-lg font-light border-gray-200 rounded-2xl focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        State/Region
                      </label>
                      <Input
                        value={data.stateRegion}
                        onChange={(e) => setData({ ...data, stateRegion: e.target.value })}
                        placeholder="e.g., California, Ontario"
                        className="w-full p-4 text-lg font-light border-gray-200 rounded-2xl focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Biggest tracking challenge?
                      </label>
                      <Input
                        value={data.trackingChallenge}
                        onChange={(e) => setData({ ...data, trackingChallenge: e.target.value })}
                        placeholder="e.g., remembering to log hours"
                        className="w-full p-4 text-lg font-light border-gray-200 rounded-2xl focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-8 left-8 right-8">
        <div className="flex justify-center">
          {currentStep === steps.length - 1 ? (
            <Button
              onClick={handleComplete}
              disabled={!currentStepData.canContinue || isLoading}
              className="px-12 py-4 text-lg font-medium bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isLoading ? "Setting up..." : "Get Started"}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!currentStepData.canContinue}
              className="px-12 py-4 text-lg font-medium bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};