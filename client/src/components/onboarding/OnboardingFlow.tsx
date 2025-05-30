import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Shield, 
  Lock, 
  CheckCircle, 
  Calendar as CalendarIcon,
  Star,
  Users,
  Target,
  TrendingUp,
  BookOpen,
  BarChart3,
  X,
  ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => void;
}

interface OnboardingData {
  accountType: 'individual' | 'supervisor' | 'enterprise';
  licensureGoalDate?: Date;
  trackingChallenge?: string;
  displayName?: string;
}

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    accountType: 'individual'
  });
  const [showGuidedOverlay, setShowGuidedOverlay] = useState(false);
  const [licensureDate, setLicensureDate] = useState<Date>();

  // Anticipatory features
  useEffect(() => {
    if (user?.email) {
      // Auto-detect organization type from email domain
      const domain = user.email.split('@')[1];
      const isUniversity = domain?.includes('edu') || domain?.includes('university');
      const isClinic = domain?.includes('clinic') || domain?.includes('health');
      
      if (isUniversity) {
        setOnboardingData(prev => ({ ...prev, accountType: 'enterprise' }));
      } else if (isClinic) {
        setOnboardingData(prev => ({ ...prev, accountType: 'supervisor' }));
      }

      // Pre-fill display name from email
      const emailName = user.email.split('@')[0];
      const formattedName = emailName
        .split('.')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
      setOnboardingData(prev => ({ ...prev, displayName: formattedName }));
    }

    // Set default licensure date (May 2027)
    const defaultDate = new Date(2027, 4, 1); // May 1, 2027
    setLicensureDate(defaultDate);
    setOnboardingData(prev => ({ ...prev, licensureGoalDate: defaultDate }));
  }, [user]);

  const handleStepComplete = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      setShowGuidedOverlay(true);
    }
  };

  const handleCompleteOnboarding = () => {
    onComplete({
      ...onboardingData,
      licensureGoalDate: licensureDate,
      trackingChallenge: onboardingData.trackingChallenge || 'Forgetting to log'
    });
  };

  const TrustSignal = () => (
    <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
      <Lock className="w-4 h-4" />
      <span>HIPAA-compliant & Encrypted</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <AccountTypeSelection
            selectedType={onboardingData.accountType}
            onSelect={(type) => setOnboardingData(prev => ({ ...prev, accountType: type }))}
            onNext={handleStepComplete}
          />
        )}
        
        {step === 2 && (
          <PersonalizationStep
            licensureDate={licensureDate}
            onDateChange={setLicensureDate}
            challenge={onboardingData.trackingChallenge}
            onChallengeChange={(challenge) => 
              setOnboardingData(prev => ({ ...prev, trackingChallenge: challenge }))
            }
            onNext={handleStepComplete}
          />
        )}

        {step === 3 && (
          <WelcomeStep
            accountType={onboardingData.accountType}
            onComplete={handleCompleteOnboarding}
          />
        )}
      </AnimatePresence>

      {showGuidedOverlay && (
        <GuidedOverlay onComplete={handleCompleteOnboarding} />
      )}
    </div>
  );
};

const AccountTypeSelection = ({ selectedType, onSelect, onNext }: {
  selectedType: string;
  onSelect: (type: 'individual' | 'supervisor' | 'enterprise') => void;
  onNext: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="flex flex-col items-center justify-center min-h-screen p-6"
  >
    <div className="w-full max-w-4xl">
      <div className="text-center mb-8">
        <p className="text-sm text-gray-500 mb-4">Step 2 of 3: Choose Your Plan</p>
        <h1 className="text-3xl font-bold text-black mb-2">Complete Your Account Setup</h1>
        <p className="text-gray-600">What's your role? Let's find the perfect plan</p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-sm text-gray-600">Account Created! Let's set up your role</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <PlanCard
          title="Individual Counselor"
          features={["Hour Tracking", "AI Insights", "Mobile Logging"]}
          recommended={selectedType === 'individual'}
          selected={selectedType === 'individual'}
          onClick={() => onSelect('individual')}
        />
        
        <PlanCard
          title="Clinical Supervisor"
          badge="Most Popular"
          features={["Multi-Supervisee Dashboard", "Compliance Tracking", "Group Tools"]}
          selected={selectedType === 'supervisor'}
          onClick={() => onSelect('supervisor')}
        />
        
        <PlanCard
          title="Training Program"
          features={["Unlimited Supervisees", "Custom Reporting", "API Access"]}
          selected={selectedType === 'enterprise'}
          onClick={() => onSelect('enterprise')}
        />
      </div>

      <div className="text-center space-y-4">
        <Button 
          onClick={onNext}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-300"
        >
          Choose Plan
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
        
        <div className="mt-6">
          <TrustSignal />
        </div>
      </div>
    </div>
  </motion.div>
);

const PlanCard = ({ title, badge, features, recommended, selected, onClick }: {
  title: string;
  badge?: string;
  features: string[];
  recommended?: boolean;
  selected: boolean;
  onClick: () => void;
}) => (
  <motion.div
    whileHover={{ scale: 1.02, y: -4 }}
    whileTap={{ scale: 0.98 }}
    className={cn(
      "relative p-6 rounded-xl backdrop-blur-sm bg-white/70 border-2 cursor-pointer transition-all duration-300",
      selected ? "border-blue-500 shadow-lg" : "border-gray-200 hover:border-gray-300"
    )}
    onClick={onClick}
  >
    {badge && (
      <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-orange-500 to-pink-500 text-white">
        {badge}
      </Badge>
    )}
    
    {recommended && (
      <Badge variant="secondary" className="absolute -top-2 right-4">
        Recommended
      </Badge>
    )}

    <h3 className="text-lg font-semibold mb-4">{title}</h3>
    <ul className="space-y-2">
      {features.map((feature, index) => (
        <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
          <CheckCircle className="w-4 h-4 text-green-500" />
          {feature}
        </li>
      ))}
    </ul>
  </motion.div>
);

const PersonalizationStep = ({ licensureDate, onDateChange, challenge, onChallengeChange, onNext }: {
  licensureDate?: Date;
  onDateChange: (date?: Date) => void;
  challenge?: string;
  onChallengeChange: (challenge: string) => void;
  onNext: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="flex flex-col items-center justify-center min-h-screen p-6"
  >
    <div className="w-full max-w-2xl">
      <div className="text-center mb-8">
        <p className="text-sm text-gray-500 mb-4">Step 3 of 3: Personalization</p>
        <h1 className="text-3xl font-bold text-black mb-2">Let's Personalize Your Experience</h1>
        <p className="text-gray-600">Help us tailor ClarityLog to your goals</p>
      </div>

      <div className="space-y-8">
        <Card className="backdrop-blur-sm bg-white/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              When do you hope to become licensed?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {licensureDate ? format(licensureDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={licensureDate}
                  onSelect={onDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <p className="text-sm text-gray-500 mt-2">This helps us set your progress goals</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-white/70">
          <CardHeader>
            <CardTitle>What's your biggest challenge with tracking hours?</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={challenge || 'Forgetting to log'} 
              onValueChange={onChallengeChange}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Time-consuming" id="time" />
                <Label htmlFor="time">Time-consuming</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Forgetting to log" id="forgetting" />
                <Label htmlFor="forgetting">Forgetting to log</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Compliance confusion" id="compliance" />
                <Label htmlFor="compliance">Compliance confusion</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      </div>

      <div className="text-center mt-8 space-y-4">
        <Button 
          onClick={onNext}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-300"
        >
          Continue to ClarityLog
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
        
        <TrustSignal />
      </div>
    </div>
  </motion.div>
);

const WelcomeStep = ({ accountType, onComplete }: {
  accountType: string;
  onComplete: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="flex flex-col items-center justify-center min-h-screen p-6"
  >
    <Card className="w-full max-w-md backdrop-blur-sm bg-white/90 border-0 shadow-xl">
      <CardContent className="p-8 text-center space-y-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
        >
          <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
        </motion.div>

        <div>
          <h2 className="text-2xl font-bold text-black mb-2">Welcome to Early Access!</h2>
          <p className="text-gray-600 mb-4">Enjoy all features during early access.</p>
          <p className="text-lg font-semibold text-black">No payment required.</p>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={onComplete}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-300"
          >
            Continue to ClarityLog
          </Button>
          
          <Button variant="ghost" className="text-sm text-gray-500">
            Share Feedback
          </Button>
        </div>

        <TrustSignal />
      </CardContent>
    </Card>
  </motion.div>
);

const GuidedOverlay = ({ onComplete }: { onComplete: () => void }) => {
  const [overlayStep, setOverlayStep] = useState(1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Quick Tour</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onComplete}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {overlayStep === 1 && (
            <div className="text-center space-y-4">
              <Target className="w-12 h-12 text-blue-500 mx-auto" />
              <h3 className="font-semibold">Log Your First Session</h3>
              <p className="text-sm text-gray-600">Start tracking your hours to monitor progress toward licensure</p>
              <Button 
                onClick={() => setOverlayStep(2)}
                className="w-full"
              >
                Next
              </Button>
            </div>
          )}
          
          {overlayStep === 2 && (
            <div className="text-center space-y-4">
              <BarChart3 className="w-12 h-12 text-green-500 mx-auto" />
              <h3 className="font-semibold">Track Your Progress</h3>
              <p className="text-sm text-gray-600">View insights and milestones as you advance toward your LPC</p>
              <Button 
                onClick={onComplete}
                className="w-full"
              >
                Get Started
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const TrustSignal = () => (
  <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
    <Lock className="w-4 h-4" />
    <span>HIPAA-compliant & Encrypted</span>
  </div>
);