import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  Target, 
  BarChart3, 
  Calendar as CalendarIcon,
  X, 
  ChevronRight,
  Sparkles,
  Lock
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

interface GuidedOnboardingOverlayProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const GuidedOnboardingOverlay = ({ onComplete, onSkip }: GuidedOnboardingOverlayProps) => {
  const { userProfile, updateUserProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [licensureDate, setLicensureDate] = useState<Date>();
  const [trackingChallenge, setTrackingChallenge] = useState<string>("Forgetting to log");

  // Set default licensure date (May 2027)
  useEffect(() => {
    const defaultDate = new Date(2027, 4, 1); // May 1, 2027
    setLicensureDate(defaultDate);
  }, []);

  const handleComplete = async () => {
    try {
      await updateUserProfile({
        licensureGoalDate: licensureDate,
        trackingChallenge: trackingChallenge,
        hasCompletedOnboarding: true
      });
      onComplete();
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      onComplete(); // Continue anyway
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden"
      >
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
          >
            <X className="w-5 h-5" />
          </Button>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <StepOne key="step1" onNext={handleNext} />
            )}
            {step === 2 && (
              <StepTwo 
                key="step2" 
                licensureDate={licensureDate}
                onDateChange={setLicensureDate}
                onNext={handleNext}
              />
            )}
            {step === 3 && (
              <StepThree 
                key="step3" 
                challenge={trackingChallenge}
                onChallengeChange={setTrackingChallenge}
                onNext={handleNext}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Progress indicator */}
        <div className="px-8 pb-6">
          <div className="flex justify-center space-x-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === step ? 'bg-blue-600' : i < step ? 'bg-blue-300' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Trust signal */}
        <div className="px-8 pb-6">
          <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
            <Lock className="w-4 h-4" />
            <span>HIPAA-compliant & Encrypted</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const StepOne = ({ onNext }: { onNext: () => void }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="p-8 text-center"
  >
    <div className="mb-6">
      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <Target className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Log Your First Session</h2>
      <p className="text-gray-600">
        Start tracking your hours to monitor progress toward licensure. Each session you log 
        helps build a comprehensive record of your professional development.
      </p>
    </div>

    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-blue-600" />
        </div>
        <span className="font-medium text-blue-900">Pro Tip</span>
      </div>
      <p className="text-blue-800 text-sm">
        We've already added a sample session to get you started. You can edit or delete it anytime!
      </p>
    </div>

    <Button 
      onClick={onNext}
      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-300"
    >
      Next Step
      <ChevronRight className="w-4 h-4 ml-2" />
    </Button>
  </motion.div>
);

const StepTwo = ({ 
  licensureDate, 
  onDateChange, 
  onNext 
}: { 
  licensureDate?: Date;
  onDateChange: (date?: Date) => void;
  onNext: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="p-8"
  >
    <div className="text-center mb-6">
      <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <CalendarIcon className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">When do you hope to become licensed?</h2>
      <p className="text-gray-600">
        This helps us set your progress goals and provide personalized milestones
      </p>
    </div>

    <div className="mb-6">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-left h-12">
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
    </div>

    <Button 
      onClick={onNext}
      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-300"
    >
      Continue
      <ChevronRight className="w-4 h-4 ml-2" />
    </Button>
  </motion.div>
);

const StepThree = ({ 
  challenge, 
  onChallengeChange, 
  onNext 
}: { 
  challenge: string;
  onChallengeChange: (challenge: string) => void;
  onNext: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="p-8"
  >
    <div className="text-center mb-6">
      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <BarChart3 className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">What's your biggest challenge with tracking hours?</h2>
      <p className="text-gray-600">
        Understanding your challenges helps us provide better support and features
      </p>
    </div>

    <div className="mb-6">
      <RadioGroup 
        value={challenge} 
        onValueChange={onChallengeChange}
        className="space-y-3"
      >
        <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 transition-colors">
          <RadioGroupItem value="Time-consuming" id="time" />
          <Label htmlFor="time" className="flex-1 cursor-pointer">Time-consuming</Label>
        </div>
        <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 transition-colors">
          <RadioGroupItem value="Forgetting to log" id="forgetting" />
          <Label htmlFor="forgetting" className="flex-1 cursor-pointer">Forgetting to log</Label>
        </div>
        <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 transition-colors">
          <RadioGroupItem value="Compliance confusion" id="compliance" />
          <Label htmlFor="compliance" className="flex-1 cursor-pointer">Compliance confusion</Label>
        </div>
      </RadioGroup>
    </div>

    <Button 
      onClick={onNext}
      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-300"
    >
      Complete Setup
      <Sparkles className="w-4 h-4 ml-2" />
    </Button>
  </motion.div>
);