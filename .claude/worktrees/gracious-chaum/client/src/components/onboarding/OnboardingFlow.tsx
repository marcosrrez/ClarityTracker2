import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { SuperhumanOnboarding } from "./SuperhumanOnboarding";
import { InteractiveProductTour } from "./InteractiveProductTour";
import { 
  User, 
  Users, 
  Building2, 
  Heart,
  ArrowLeft
} from "lucide-react";

interface OnboardingData {
  preferredName: string;
  accountType: 'individual' | 'supervisor' | 'enterprise' | 'client' | undefined;
  stateRegion: string;
  trackingChallenge: string;
  organizationName?: string;
  professionalGoals?: string;
  therapistInviteCode?: string;
}

interface OnboardingStep {
  title: string;
  subtitle?: string;
  canContinue: boolean;
  showAccountSelection?: boolean;
  showForm?: boolean;
  showDemo?: 'quick-log' | 'ai-insights' | 'progress-tracking' | 'supervisor-dashboard' | 'compliance-alerts' | 'enterprise-analytics' | 'quick-reflection' | 'insight-patterns' | 'therapist-connection';
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
    },
    {
      id: 'client' as const,
      title: 'Client Portal',
      description: 'Access your therapy journey and connect with your therapist',
      icon: Heart,
      features: ['Session insights', 'Progress tracking', 'Therapist connection', 'Growth resources']
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
    
    // Redirect based on account type
    if (data.accountType === 'client') {
      window.location.href = '/client-dashboard';
    } else {
      window.location.href = '/dashboard';
    }
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
    } else if (data.accountType === 'client') {
      return {
        title: "Therapy insights shouldn't fade after each session",
        subtitle: "But how do you remember and build on your breakthroughs between appointments?"
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
    if (data.accountType === 'client') {
      baseSteps.push(
        {
          title: "Capture insights right after therapy",
          subtitle: "Record breakthroughs while they're fresh in your mind.",
          showDemo: 'quick-reflection',
          canContinue: true
        },
        {
          title: "AI helps you see patterns",
          subtitle: "Discover how your growth connects across sessions.",
          showDemo: 'insight-patterns',
          canContinue: true
        },
        {
          title: "Stay connected between sessions",
          subtitle: "Share updates and get support from your therapist.",
          showDemo: 'therapist-connection',
          canContinue: true
        }
      );
    } else if (data.accountType === 'individual') {
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col relative overflow-hidden">
      {/* Background effects matching landing page */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      
      {/* Navigation */}
      <div className="flex justify-between items-center p-8 relative z-10">
        <Button 
          variant="ghost" 
          onClick={handleBack}
          disabled={currentStep === 0}
          className="text-purple-200 hover:text-white font-light hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <div className="text-sm font-light text-purple-200">
          {currentStep + 1} / {steps.length}
        </div>
        
        <Button 
          variant="ghost"
          className="text-purple-200 hover:text-white font-light hover:bg-white/10"
        >
          Skip
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-8 pb-32 relative z-10">
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
                    <h1 className="text-5xl md:text-6xl font-bold text-white leading-[1.1] tracking-tight">
                      {currentStepData.title}
                    </h1>
                    {currentStepData.subtitle && (
                      <p className="text-2xl text-purple-200 font-medium leading-relaxed">
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
                      {currentStepData.showDemo === 'quick-reflection' && (
                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/50">
                          <div className="space-y-8">
                            <div className="flex items-center justify-center gap-3 text-base text-gray-500 font-light">
                              <motion.div 
                                className="w-3 h-3 bg-green-400 rounded-full"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                              />
                              Just finished therapy? Capture your insights
                            </div>
                            <motion.div 
                              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-2xl p-6 text-center font-medium text-lg tracking-wide cursor-pointer hover:shadow-lg transition-all duration-200"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              + Record Reflection
                            </motion.div>
                            <div className="text-center text-gray-400 font-light">
                              Capture breakthroughs while they're fresh
                            </div>
                          </div>
                        </div>
                      )}

                      {currentStepData.showDemo === 'insight-patterns' && (
                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/50">
                          <div className="space-y-8">
                            <div className="text-base text-gray-500 font-light mb-6">Your reflection:</div>
                            <div className="bg-gray-50/80 rounded-2xl p-6 text-base font-light leading-relaxed">
                              "Today I used breathing techniques when I felt anxious about the presentation. It really helped me stay calm."
                            </div>
                            <motion.div 
                              className="bg-gradient-to-br from-purple-50 to-pink-50 border-l-4 border-purple-500 rounded-2xl p-6"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.5 }}
                            >
                              <div className="text-base font-medium text-purple-900 mb-2">AI Pattern Recognition</div>
                              <div className="text-base text-purple-700 font-light leading-relaxed">You've used breathing techniques 4 times this month with great success. This coping strategy is becoming stronger for you.</div>
                            </motion.div>
                          </div>
                        </div>
                      )}

                      {currentStepData.showDemo === 'therapist-connection' && (
                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/50">
                          <div className="space-y-6">
                            <div className="flex items-center gap-3 text-base text-gray-500 font-light mb-4">
                              <motion.div 
                                className="w-3 h-3 bg-blue-400 rounded-full"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                              />
                              New message from Dr. Sarah
                            </div>
                            <motion.div 
                              className="bg-blue-50/80 rounded-2xl p-6 border border-blue-100"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 }}
                            >
                              <div className="text-base font-medium text-blue-900 mb-2">Dr. Sarah Johnson</div>
                              <div className="text-base text-blue-700 font-light leading-relaxed">"I noticed your anxiety management has improved significantly. Keep practicing those breathing exercises - you're doing great work!"</div>
                            </motion.div>
                            <div className="text-center text-gray-400 font-light">
                              Stay connected between sessions
                            </div>
                          </div>
                        </div>
                      )}

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
                    <h1 className="text-5xl md:text-6xl font-bold text-white leading-[1.1] tracking-tight">
                      {currentStepData.title}
                    </h1>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {accountTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <motion.div
                          key={type.id}
                          className={`p-8 rounded-3xl border-2 cursor-pointer transition-all duration-300 backdrop-blur-md ${
                            data.accountType === type.id
                              ? 'border-purple-400 bg-white/20 shadow-2xl shadow-purple-500/25 scale-105'
                              : 'border-white/20 bg-white/10 hover:border-purple-300/50 hover:bg-white/15 hover:shadow-xl'
                          }`}
                          onClick={() => setData({ ...data, accountType: type.id })}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="space-y-6">
                            <Icon className={`w-12 h-12 ${data.accountType === type.id ? 'text-purple-300' : 'text-white/60'}`} />
                            <div>
                              <h3 className="text-xl font-semibold text-white mb-2">{type.title}</h3>
                              <p className="text-purple-200 font-medium leading-relaxed">{type.description}</p>
                            </div>
                            <div className="space-y-2">
                              {type.features.map((feature, index) => (
                                <div key={index} className="text-sm text-purple-100 font-light">
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
                    <h1 className="text-5xl md:text-6xl font-bold text-white leading-[1.1] tracking-tight">
                      {currentStepData.title}
                    </h1>
                  </div>
                  
                  <div className="max-w-md mx-auto space-y-8">
                    <div>
                      <label className="block text-sm font-medium text-purple-200 mb-3">
                        What should we call you?
                      </label>
                      <Input
                        value={data.preferredName}
                        onChange={(e) => setData({ ...data, preferredName: e.target.value })}
                        placeholder="Your preferred name"
                        className="w-full p-4 text-lg font-light bg-white/10 border-white/20 rounded-2xl focus:border-purple-400 text-white placeholder:text-purple-200/60 backdrop-blur-md"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-purple-200 mb-3">
                        State/Region
                      </label>
                      <Input
                        value={data.stateRegion}
                        onChange={(e) => setData({ ...data, stateRegion: e.target.value })}
                        placeholder="e.g., California, Ontario"
                        className="w-full p-4 text-lg font-light bg-white/10 border-white/20 rounded-2xl focus:border-purple-400 text-white placeholder:text-purple-200/60 backdrop-blur-md"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-purple-200 mb-3">
                        Biggest tracking challenge?
                      </label>
                      <Input
                        value={data.trackingChallenge}
                        onChange={(e) => setData({ ...data, trackingChallenge: e.target.value })}
                        placeholder="e.g., remembering to log hours"
                        className="w-full p-4 text-lg font-light bg-white/10 border-white/20 rounded-2xl focus:border-purple-400 text-white placeholder:text-purple-200/60 backdrop-blur-md"
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
      <div className="fixed bottom-8 left-8 right-8 relative z-10">
        <div className="flex justify-center">
          {currentStep === steps.length - 1 ? (
            <Button
              onClick={handleComplete}
              disabled={!currentStepData.canContinue || isLoading}
              className="px-12 py-4 text-lg font-medium bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 backdrop-blur-md border border-purple-400/50"
            >
              {isLoading ? "Setting up..." : "Get Started"}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!currentStepData.canContinue}
              className="px-12 py-4 text-lg font-medium bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 backdrop-blur-md border border-purple-400/50"
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};