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
  TrendingUp,
  Heart
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getRandomQuote } from '@/lib/counseling-quotes';

interface SuperhumanOnboardingProps {
  onComplete: () => void;
  userType: 'individual' | 'supervisor' | 'enterprise' | 'client';
}

export function SuperhumanOnboarding({ onComplete, userType }: SuperhumanOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [firstSessionData, setFirstSessionData] = useState({
    date: new Date().toISOString().split('T')[0],
    hours: 1.5,
    sessionType: 'Individual Therapy',
    notes: ''
  });
  const [isCreatingEntry, setIsCreatingEntry] = useState(false);
  const { user } = useAuth();
  const quote = getRandomQuote(['professional development'], 'intermediate');

  const getStepsForUserType = () => {
    if (userType === 'client') {
      return [
        {
          id: 'insights',
          title: 'Your Growth Journey',
          subtitle: 'Track your progress with AI insights',
          description: 'See how your therapy sessions connect to create meaningful patterns and breakthroughs.',
          icon: <Brain className="h-12 w-12 text-purple-500" />,
          keyboardShortcut: 'Cmd + I',
          benefit: 'Deeper self-awareness',
          demo: (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-100 dark:border-purple-800">
              <div className="space-y-2">
                <div className="text-sm font-medium">Recent Insight:</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  "You're showing stronger emotional regulation skills in stressful situations"
                </div>
                <Badge variant="secondary" className="text-xs">Emotional Growth ↗</Badge>
              </div>
            </div>
          )
        },
        {
          id: 'connection',
          title: 'Stay Connected',
          subtitle: 'Seamless communication with your therapist',
          description: 'Share reflections, receive feedback, and maintain momentum between sessions.',
          icon: <Heart className="h-12 w-12 text-green-500" />,
          keyboardShortcut: 'Cmd + M',
          benefit: 'Stronger therapeutic alliance',
          demo: (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-100 dark:border-green-800">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Message from Dr. Sarah: "Great progress this week!"</span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  <Timer className="h-3 w-3 inline mr-1" />
                  2 minutes ago
                </div>
              </div>
            </div>
          )
        },
        {
          id: 'progress',
          title: 'Visual Progress',
          subtitle: 'See your healing journey',
          description: 'Beautiful dashboards show your growth, goal completion, and emotional patterns over time.',
          icon: <TrendingUp className="h-12 w-12 text-blue-500" />,
          keyboardShortcut: 'Cmd + D',
          benefit: 'Motivating visual feedback',
          demo: (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Anxiety Management</span>
                  <span className="font-medium">8.2 / 10</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '82%' }}></div>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  +2.1 improvement this month
                </div>
              </div>
            </div>
          )
        }
      ];
    }

    return [
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
                Only 2,153 hours to go!
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'first-session',
        title: 'Create Your First Entry',
        subtitle: 'Start your LPC journey today',
        description: 'Log your most recent session to see ClarityLog in action and begin tracking your progress.',
        icon: <Target className="h-12 w-12 text-orange-500" />,
        benefit: 'Immediate progress tracking',
        isInteractive: true
      }
    ];
  };

  const steps = getStepsForUserType();

  const handleCreateFirstEntry = async () => {
    setIsCreatingEntry(true);
    
    try {
      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateOfContact: firstSessionData.date,
          clientContactHours: firstSessionData.hours,
          sessionType: firstSessionData.sessionType,
          notes: firstSessionData.notes,
          isOnboardingEntry: true
        })
      });

      if (response.ok) {
        setCompletedSteps(prev => [...prev, currentStep]);
        setTimeout(() => {
          onComplete();
        }, 800);
      }
    } catch (error) {
      console.error('Error creating first entry:', error);
    } finally {
      setIsCreatingEntry(false);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setIsAnimating(true);
      setCompletedSteps(prev => [...prev, currentStep]);
      
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsAnimating(false);
      }, 200);
    } else if (steps[currentStep].isInteractive) {
      handleCreateFirstEntry();
    } else {
      setCompletedSteps(prev => [...prev, currentStep]);
      setTimeout(onComplete, 800);
    }
  };

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 z-50 flex items-center justify-center relative overflow-hidden">
      {/* Background effects matching landing page */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      
      <div className="max-w-4xl w-full mx-auto px-8 relative z-10">
        
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 backdrop-blur-sm border ${
                  completedSteps.includes(index) 
                    ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white border-green-300/50 shadow-lg shadow-green-500/25' 
                    : index === currentStep 
                      ? 'bg-gradient-to-r from-purple-400 to-blue-500 text-white border-purple-300/50 shadow-lg shadow-purple-500/25' 
                      : 'bg-white/10 text-purple-200 border-white/20'
                }`}>
                  {completedSteps.includes(index) ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 rounded-full transition-all duration-500 ${
                    completedSteps.includes(index) 
                      ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-sm shadow-green-500/25' 
                      : 'bg-white/20'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-purple-200 text-sm font-medium">
            {currentStep + 1} of {steps.length} — Setting up your superhuman workflow
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-center space-y-8"
          >
            {/* Step Icon */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="flex justify-center mb-6"
            >
              <div className="p-6 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl">
                {currentStepData.icon}
              </div>
            </motion.div>

            {/* Step Content */}
            <div className="space-y-6 max-w-3xl mx-auto">
              <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="text-4xl md:text-5xl font-bold text-white leading-tight"
              >
                {currentStepData.title}
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="text-xl text-purple-200 font-medium"
              >
                {currentStepData.subtitle}
              </motion.p>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="text-lg text-purple-100 leading-relaxed max-w-2xl mx-auto"
              >
                {currentStepData.description}
              </motion.p>

              {/* Demo or Interactive Content */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className="max-w-md mx-auto"
              >
                {currentStepData.isInteractive ? (
                  <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
                    <CardContent className="p-6 space-y-4">
                      <h3 className="text-lg font-semibold text-white mb-4">Your First Session Entry</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-purple-200 mb-1">Date</label>
                          <input
                            type="date"
                            value={firstSessionData.date}
                            onChange={(e) => setFirstSessionData(prev => ({ ...prev, date: e.target.value }))}
                            className="w-full px-3 py-2 border border-white/20 rounded-md bg-white/10 text-white placeholder:text-purple-200/60 backdrop-blur-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-purple-200 mb-1">Hours</label>
                          <input
                            type="number"
                            step="0.5"
                            value={firstSessionData.hours}
                            onChange={(e) => setFirstSessionData(prev => ({ ...prev, hours: parseFloat(e.target.value) }))}
                            className="w-full px-3 py-2 border border-white/20 rounded-md bg-white/10 text-white placeholder:text-purple-200/60 backdrop-blur-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-purple-200 mb-1">Session Type</label>
                          <select
                            value={firstSessionData.sessionType}
                            onChange={(e) => setFirstSessionData(prev => ({ ...prev, sessionType: e.target.value }))}
                            className="w-full px-3 py-2 border border-white/20 rounded-md bg-white/10 text-white backdrop-blur-md"
                          >
                            <option value="Individual Therapy">Individual Therapy</option>
                            <option value="Group Therapy">Group Therapy</option>
                            <option value="Family Therapy">Family Therapy</option>
                            <option value="Assessment">Assessment</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-purple-200 mb-1">Notes (Optional)</label>
                          <textarea
                            value={firstSessionData.notes}
                            onChange={(e) => setFirstSessionData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Focus areas, interventions used, client response..."
                            className="w-full px-3 py-2 border border-white/20 rounded-md bg-white/10 text-white placeholder:text-purple-200/60 backdrop-blur-md resize-none"
                            rows={3}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  currentStepData.demo
                )}
              </motion.div>

              {/* Keyboard Shortcut & Benefit - only for non-interactive steps */}
              {!currentStepData.isInteractive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                  className="flex items-center justify-center gap-6 mb-8"
                >
                  <div className="flex items-center gap-2 text-sm text-purple-200">
                    <kbd className="px-2 py-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded text-xs font-mono text-purple-100">
                      {currentStepData.keyboardShortcut}
                    </kbd>
                    <span>Quick access</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Sparkles className="h-4 w-4 text-yellow-400" />
                    <span className="text-purple-200">{currentStepData.benefit}</span>
                  </div>
                </motion.div>
              )}
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
                className="px-12 py-4 text-lg font-semibold bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white border-0 shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                disabled={isAnimating || isCreatingEntry}
              >
                {isCreatingEntry ? 'Creating Your First Entry...' : 
                 currentStepData.isInteractive ? 'Create Entry & Continue' :
                 isLastStep ? 'Start Using ClarityLog' : 'Next'}
                {!isCreatingEntry && <ArrowRight className="ml-3 h-6 w-6" />}
              </Button>
            </motion.div>

            {/* Inspiring Quote Footer */}
            {isLastStep && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.4 }}
                className="mt-16 p-8 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl max-w-2xl mx-auto"
              >
                <blockquote className="text-lg italic text-purple-100 mb-4 leading-relaxed">
                  "{quote.quote}"
                </blockquote>
                <cite className="text-sm text-purple-200/80 font-medium">
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