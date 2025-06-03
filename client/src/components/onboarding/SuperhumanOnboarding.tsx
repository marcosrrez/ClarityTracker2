import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Zap, 
  Brain, 
  Clock, 
  Target, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Timer,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getRandomQuote } from '@/lib/counseling-quotes';

interface SuperhumanOnboardingProps {
  onComplete: () => void;
  userType: 'individual' | 'supervisor' | 'enterprise';
}

export function SuperhumanOnboarding({ onComplete, userType }: SuperhumanOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const { user } = useAuth();
  const quote = getRandomQuote(['professional development'], 'intermediate');

  const steps = [
    {
      id: 'speed',
      title: 'Built for Speed',
      subtitle: 'Log sessions in under 30 seconds',
      description: 'Quick entry forms and smart defaults mean less time on paperwork, more time with clients.',
      icon: <Zap className="h-12 w-12 text-blue-500" />,
      keyboardShortcut: 'Cmd + N',
      benefit: '10x faster than spreadsheets',
      demo: (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Session logged: 2 hours, individual therapy</span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <Timer className="h-3 w-3 inline mr-1" />
              Completed in 12 seconds
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'intelligence',
      title: 'AI-Powered Insights',
      subtitle: 'Discover patterns in your practice',
      description: 'Dinger analyzes your notes to identify growth areas, suggest resources, and prepare you for supervision.',
      icon: <Brain className="h-12 w-12 text-purple-500" />,
      keyboardShortcut: 'Cmd + I',
      benefit: 'Smarter supervision prep',
      demo: (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-100 dark:border-purple-800">
          <div className="space-y-2">
            <div className="text-sm font-medium">Pattern Detected:</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              "You're developing strong rapport-building skills with anxious clients"
            </div>
            <Badge variant="secondary" className="text-xs">Therapeutic Alliance ↗</Badge>
          </div>
        </div>
      )
    },
    {
      id: 'progress',
      title: 'Visual Progress',
      subtitle: 'See your journey to licensure',
      description: 'Beautiful dashboards show exactly where you stand and what milestones are coming next.',
      icon: <TrendingUp className="h-12 w-12 text-green-500" />,
      keyboardShortcut: 'Cmd + D',
      benefit: 'Never miss requirements',
      demo: (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-100 dark:border-green-800">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Direct Hours</span>
              <span className="font-medium">1,847 / 4,000</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '46%' }}></div>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              On track for December 2025
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setIsAnimating(true);
      setCompletedSteps(prev => [...prev, currentStep]);
      
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsAnimating(false);
      }, 200);
    } else {
      setCompletedSteps(prev => [...prev, currentStep]);
      setTimeout(onComplete, 800);
    }
  };

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex items-center justify-center">
      <div className="max-w-4xl w-full mx-auto px-8">
        
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  completedSteps.includes(index) 
                    ? 'bg-green-500 text-white' 
                    : index === currentStep 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                }`}>
                  {completedSteps.includes(index) ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 transition-colors duration-300 ${
                    completedSteps.includes(index) ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-center"
          >
            {/* Main Content */}
            <div className="mb-12">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="mb-6 flex justify-center"
              >
                {currentStepData.icon}
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="space-y-4 mb-8"
              >
                <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                  {currentStepData.title}
                </h1>
                <p className="text-xl text-blue-600 dark:text-blue-400 font-medium">
                  {currentStepData.subtitle}
                </p>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                  {currentStepData.description}
                </p>
              </motion.div>

              {/* Feature Demo */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="max-w-md mx-auto mb-8"
              >
                {currentStepData.demo}
              </motion.div>

              {/* Keyboard Shortcut & Benefit */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className="flex items-center justify-center gap-6 mb-8"
              >
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
                    {currentStepData.keyboardShortcut}
                  </kbd>
                  <span>Quick access</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  <span className="text-gray-600 dark:text-gray-400">{currentStepData.benefit}</span>
                </div>
              </motion.div>
            </div>

            {/* Action Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.4 }}
            >
              <Button
                onClick={handleNext}
                size="lg"
                className="px-8 py-3 text-lg font-medium"
                disabled={isAnimating}
              >
                {isLastStep ? 'Start Using ClarityLog' : 'Next'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>

            {/* Inspiring Quote Footer */}
            {isLastStep && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.4 }}
                className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-100 dark:border-blue-800 max-w-2xl mx-auto"
              >
                <blockquote className="text-sm italic text-gray-700 dark:text-gray-300 mb-2">
                  "{quote.quote}"
                </blockquote>
                <cite className="text-xs text-gray-600 dark:text-gray-400">
                  — {quote.author}, {quote.theory}
                </cite>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}