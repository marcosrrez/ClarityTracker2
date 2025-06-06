import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Heart, 
  Target, 
  Brain, 
  MessageSquare, 
  Users, 
  BookOpen, 
  Shield, 
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  User,
  Calendar,
  Lightbulb,
  TrendingUp,
  Award
} from 'lucide-react';

interface OnboardingData {
  preferredName: string;
  primaryGoals: string[];
  reflectionFrequency: 'daily' | 'weekly' | 'as-needed';
  preferredTime: string;
  currentChallenges: string[];
  previousTherapyExperience: boolean;
  privacyPreference: 'private' | 'shareable';
  notificationPreferences: string[];
  interests: string[];
}

interface OnboardingStep {
  id: string;
  title: string;
  subtitle?: string;
  component: React.ComponentType<any>;
  canContinue: (data: OnboardingData) => boolean;
}

export default function ClientOnboardingFlow() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    preferredName: '',
    primaryGoals: [],
    reflectionFrequency: 'weekly',
    preferredTime: '',
    currentChallenges: [],
    previousTherapyExperience: false,
    privacyPreference: 'private',
    notificationPreferences: [],
    interests: [],
  });

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const goalOptions = [
    { id: 'anxiety', label: 'Manage Anxiety', icon: Brain, color: 'bg-blue-100 text-blue-800' },
    { id: 'stress', label: 'Reduce Stress', icon: Target, color: 'bg-green-100 text-green-800' },
    { id: 'depression', label: 'Improve Mood', icon: Heart, color: 'bg-pink-100 text-pink-800' },
    { id: 'relationships', label: 'Better Relationships', icon: Users, color: 'bg-purple-100 text-purple-800' },
    { id: 'self-awareness', label: 'Build Self-Awareness', icon: Lightbulb, color: 'bg-yellow-100 text-yellow-800' },
    { id: 'confidence', label: 'Boost Confidence', icon: Award, color: 'bg-orange-100 text-orange-800' },
    { id: 'communication', label: 'Improve Communication', icon: MessageSquare, color: 'bg-indigo-100 text-indigo-800' },
    { id: 'growth', label: 'Personal Growth', icon: TrendingUp, color: 'bg-emerald-100 text-emerald-800' },
  ];

  const challengeOptions = [
    'Work-related stress',
    'Social anxiety',
    'Sleep issues',
    'Relationship conflicts',
    'Low self-esteem',
    'Time management',
    'Decision making',
    'Emotional regulation',
    'Life transitions',
    'Academic pressure',
  ];

  const interestOptions = [
    'Mindfulness & Meditation',
    'Cognitive Behavioral Therapy (CBT)',
    'Journaling & Reflection',
    'Goal Setting & Achievement',
    'Stress Management',
    'Emotional Intelligence',
    'Communication Skills',
    'Self-Compassion',
    'Habit Formation',
    'Creative Expression',
  ];

  // Step Components
  const WelcomeStep = () => (
    <div className="text-center space-y-8">
      <div className="space-y-4">
        <Heart className="h-16 w-16 text-blue-600 mx-auto" />
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Welcome to Your Growth Journey
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Let's personalize ClarityLog to match your unique needs and goals. This will take about 3 minutes.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
        <Card className="p-6 text-center">
          <Brain className="h-8 w-8 text-blue-600 mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Smart Insights</h3>
          <p className="text-sm text-gray-600">AI-powered analysis of your reflections</p>
        </Card>
        <Card className="p-6 text-center">
          <Target className="h-8 w-8 text-green-600 mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Goal Tracking</h3>
          <p className="text-sm text-gray-600">Visual progress on what matters most</p>
        </Card>
        <Card className="p-6 text-center">
          <Users className="h-8 w-8 text-purple-600 mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Professional Support</h3>
          <p className="text-sm text-gray-600">Connect with therapists when ready</p>
        </Card>
      </div>
    </div>
  );

  const PersonalInfoStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          What should we call you?
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          This helps us create a more personal experience
        </p>
      </div>
      <div className="max-w-md mx-auto">
        <Input
          placeholder="Your preferred name"
          value={data.preferredName}
          onChange={(e) => updateData({ preferredName: e.target.value })}
          className="text-lg h-12 text-center"
        />
      </div>
    </div>
  );

  const GoalsStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          What would you like to work on?
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Select all that apply - we'll tailor your experience
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {goalOptions.map((goal) => {
          const Icon = goal.icon;
          const isSelected = data.primaryGoals.includes(goal.id);
          return (
            <motion.div
              key={goal.id}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }`}
              onClick={() => {
                const newGoals = isSelected
                  ? data.primaryGoals.filter(g => g !== goal.id)
                  : [...data.primaryGoals, goal.id];
                updateData({ primaryGoals: newGoals });
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className={`h-8 w-8 mx-auto mb-2 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
              <p className={`text-sm font-medium text-center ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                {goal.label}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  const ChallengesStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          What challenges are you facing?
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          This helps us provide more relevant insights and resources
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-4xl mx-auto">
        {challengeOptions.map((challenge) => {
          const isSelected = data.currentChallenges.includes(challenge);
          return (
            <div
              key={challenge}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => {
                const newChallenges = isSelected
                  ? data.currentChallenges.filter(c => c !== challenge)
                  : [...data.currentChallenges, challenge];
                updateData({ currentChallenges: newChallenges });
              }}
            >
              <p className="text-sm font-medium text-center">{challenge}</p>
            </div>
          );
        })}
      </div>
    </div>
  );

  const PreferencesStep = () => (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          How do you like to reflect?
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          We'll customize your experience based on these preferences
        </p>
      </div>
      
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">How often would you like to reflect?</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'daily', label: 'Daily', desc: 'Short daily check-ins' },
              { id: 'weekly', label: 'Weekly', desc: 'Deeper weekly sessions' },
              { id: 'as-needed', label: 'As Needed', desc: 'When I feel like it' },
            ].map((freq) => (
              <div
                key={freq.id}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  data.reflectionFrequency === freq.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => updateData({ reflectionFrequency: freq.id as any })}
              >
                <h4 className="font-medium">{freq.label}</h4>
                <p className="text-sm text-gray-600">{freq.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Privacy preference</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'private', label: 'Keep Private', desc: 'Only I can see my reflections' },
              { id: 'shareable', label: 'Shareable', desc: 'I might share with a therapist later' },
            ].map((pref) => (
              <div
                key={pref.id}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  data.privacyPreference === pref.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => updateData({ privacyPreference: pref.id as any })}
              >
                <h4 className="font-medium">{pref.label}</h4>
                <p className="text-sm text-gray-600">{pref.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const InterestsStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          What interests you most?
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          We'll recommend resources and insights based on your interests
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-4xl mx-auto">
        {interestOptions.map((interest) => {
          const isSelected = data.interests.includes(interest);
          return (
            <div
              key={interest}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => {
                const newInterests = isSelected
                  ? data.interests.filter(i => i !== interest)
                  : [...data.interests, interest];
                updateData({ interests: newInterests });
              }}
            >
              <p className="text-sm font-medium text-center">{interest}</p>
            </div>
          );
        })}
      </div>
    </div>
  );

  const FinalStep = () => (
    <div className="text-center space-y-8">
      <div className="space-y-4">
        <Sparkles className="h-16 w-16 text-blue-600 mx-auto" />
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          You're all set, {data.preferredName}!
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Your personalized ClarityLog experience is ready. Let's start your growth journey.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
        <Card className="p-6">
          <Target className="h-8 w-8 text-blue-600 mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Your Goals</h3>
          <div className="space-y-1">
            {data.primaryGoals.slice(0, 3).map(goalId => {
              const goal = goalOptions.find(g => g.id === goalId);
              return goal ? (
                <Badge key={goalId} variant="secondary" className="text-xs">
                  {goal.label}
                </Badge>
              ) : null;
            })}
          </div>
        </Card>
        
        <Card className="p-6">
          <Calendar className="h-8 w-8 text-green-600 mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Reflection Schedule</h3>
          <p className="text-sm text-gray-600 capitalize">
            {data.reflectionFrequency.replace('-', ' ')} reflections
          </p>
        </Card>
        
        <Card className="p-6">
          <Shield className="h-8 w-8 text-purple-600 mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Privacy Setting</h3>
          <p className="text-sm text-gray-600 capitalize">
            {data.privacyPreference} by default
          </p>
        </Card>
      </div>
    </div>
  );

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome',
      component: WelcomeStep,
      canContinue: () => true,
    },
    {
      id: 'personal',
      title: 'Personal Info',
      component: PersonalInfoStep,
      canContinue: (data) => data.preferredName.trim().length > 0,
    },
    {
      id: 'goals',
      title: 'Goals',
      component: GoalsStep,
      canContinue: (data) => data.primaryGoals.length > 0,
    },
    {
      id: 'challenges',
      title: 'Challenges',
      component: ChallengesStep,
      canContinue: (data) => data.currentChallenges.length > 0,
    },
    {
      id: 'preferences',
      title: 'Preferences',
      component: PreferencesStep,
      canContinue: () => true,
    },
    {
      id: 'interests',
      title: 'Interests',
      component: InterestsStep,
      canContinue: (data) => data.interests.length > 0,
    },
    {
      id: 'complete',
      title: 'Complete',
      component: FinalStep,
      canContinue: () => true,
    },
  ];

  const currentStepData = steps[currentStep];
  const canContinue = currentStepData.canContinue(data);
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = async () => {
    if (isLastStep) {
      setIsSubmitting(true);
      try {
        await apiRequest('/api/client/onboarding', {
          method: 'POST',
          body: JSON.stringify(data),
        });

        toast({
          title: "Welcome to ClarityLog!",
          description: "Your personalized experience is ready.",
        });

        setLocation('/client-dashboard');
      } catch (error) {
        console.error('Onboarding error:', error);
        toast({
          title: "Setup Failed",
          description: "Please try again or contact support.",
          variant: "destructive"
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50/30 to-pink-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-5xl">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600">
                Step {currentStep + 1} of {steps.length}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(((currentStep + 1) / steps.length) * 100)}% complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              <currentStepData.component />
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canContinue || isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white flex items-center space-x-2"
            >
              <span>
                {isSubmitting
                  ? 'Setting up...'
                  : isLastStep
                  ? 'Enter ClarityLog'
                  : 'Continue'
                }
              </span>
              {!isLastStep && <ArrowRight className="h-4 w-4" />}
              {isLastStep && <Check className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}